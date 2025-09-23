import React from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity, useColorScheme } from 'react-native';
import { auth } from '../../core/firebaseConfig';
import { signOut, deleteUser } from 'firebase/auth';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function PerfilScreen() {
  const user = auth.currentUser;
  const router = useRouter();
  const isDarkTheme = useColorScheme() === 'dark'; 
  const styles = getDynamicStyles(isDarkTheme);

  const ProfileActionButton = ({ icon, text, onPress, color }: any) => (
    <TouchableOpacity style={styles.actionButton} onPress={onPress}>
      <Feather name={icon} size={22} color={color || styles.actionButtonText.color} />
      <Text style={[styles.actionButtonText, { color: color || styles.actionButtonText.color }]}>{text}</Text>
      <Feather name="chevron-right" size={22} color="#9ca3af" />
    </TouchableOpacity>
  );

  const handleLogout = () => {
    signOut(auth).catch((error) => {
      Alert.alert("Erro", "Não foi possível sair. Tente novamente.");
      console.error(error);
    });
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Confirmar Exclusão",
      "Esta ação é irreversível. Tem certeza de que deseja excluir sua conta?",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Excluir", 
          style: "destructive", 
          onPress: () => {
            if (user) {
              deleteUser(user).catch((error) => {
                if (error.code === 'auth/requires-recent-login') {
                  Alert.alert("Segurança", "Para excluir sua conta, por favor, faça login novamente.");
                  handleLogout();
                } else {
                  Alert.alert("Erro", "Não foi possível excluir a conta.");
                }
              });
            }
          } 
        }
      ]
    );
  };
  
  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.infoText}>Nenhum usuário conectado</Text>
        <TouchableOpacity style={styles.loginButton} onPress={() => router.replace('/login')}>
           <Text style={styles.loginButtonText}>Fazer Login</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.profileContainer}>
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarText}>
            {user.displayName ? user.displayName.charAt(0).toUpperCase() : '?'}
          </Text>
        </View>
        <Text style={styles.userName}>{user.displayName || 'Usuário'}</Text>
        <Text style={styles.userEmail}>{user.email}</Text>
      </View>
      
      <View style={styles.actionsContainer}>
        <Text style={styles.sectionTitle}>Minha Conta</Text>
        <ProfileActionButton icon="edit-3" text="Alterar Nickname" onPress={() => Alert.alert("Em breve", "Funcionalidade para alterar o nickname.")} />
        <ProfileActionButton icon="lock" text="Alterar Senha" onPress={() => Alert.alert("Em breve", "Funcionalidade para alterar a senha.")} />
        
        <Text style={styles.sectionTitle}>Sair</Text>
        <ProfileActionButton icon="log-out" text="Sair do aplicativo" onPress={handleLogout} color="#ef4444"/>
        <ProfileActionButton icon="trash-2" text="Excluir minha conta" onPress={handleDeleteAccount} color="#ef4444"/>
      </View>
    </SafeAreaView>
  );
}

const getDynamicStyles = (isDarkTheme: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: isDarkTheme ? '#111827' : '#f3f4f6',
  },
  profileContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: isDarkTheme ? '#4f46e5' : '#a78bfa',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: isDarkTheme ? '#374151' : '#fff'
  },
  avatarText: {
    color: '#fff',
    fontSize: 40,
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: isDarkTheme ? '#f9fafb' : '#1f2937',
  },
  userEmail: {
    fontSize: 16,
    color: '#9ca3af',
    marginTop: 4,
  },
  actionsContainer: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 24,
    marginBottom: 8,
  },
  actionButton: {
    backgroundColor: isDarkTheme ? '#1f2937' : '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  actionButtonText: {
    flex: 1,
    fontSize: 16,
    marginLeft: 16,
    fontWeight: '500',
    color: isDarkTheme ? '#f9fafb' : '#1f2937'
  },
  infoText: {
    fontSize: 18,
    color: isDarkTheme ? '#d1d5db' : '#374151',
    textAlign: 'center',
  },
  loginButton: {
      marginTop: 20,
      backgroundColor: '#4f46e5',
      paddingVertical: 12,
      paddingHorizontal: 30,
      borderRadius: 8,
  },
  loginButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: 'bold',
  },
});

