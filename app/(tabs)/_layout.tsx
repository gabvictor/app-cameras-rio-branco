import React from 'react';
import { Tabs, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useColorScheme, TouchableOpacity, Text, StyleSheet } from 'react-native';

export default function TabsLayout() {
  const colorScheme = useColorScheme();
  const isDarkTheme = colorScheme === 'dark';
  const router = useRouter();

  const colors = {
    background: isDarkTheme ? '#1f2937' : '#ffffff',
    text: isDarkTheme ? '#f9fafb' : '#111827',
    primary: isDarkTheme ? '#a78bfa' : '#4f46e5',
    inactive: isDarkTheme ? '#9ca3af' : '#6b7280',
    border: isDarkTheme ? '#374151' : '#e5e7eb'
  };

  const styles = StyleSheet.create({
    headerLeftContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingLeft: 10,
    },
    headerLeftText: {
      color: colors.primary,
      fontSize: 16,
      marginLeft: 6,
    }
  });

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.inactive,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Início',
          tabBarIcon: ({ color, size }) => (
            <Feather name="home" size={size} color={color} />
          ),
        }}
      />

      {/* ✅ NOVO SEPARADOR ADICIONADO */}
      <Tabs.Screen
        name="favoritos"
        options={{
          title: 'Favoritos',
          tabBarIcon: ({ color, size }) => (
            <Feather name="star" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="mapa"
        options={{
          title: 'Mapa',
          tabBarIcon: ({ color, size }) => <Feather name="map-pin" size={size} color={color} />,
        }}
      />

      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => (
            <Feather name="user" size={size} color={color} />
          ),
        }}
      />
      
      <Tabs.Screen
        name="configuracao"
        options={{
          title: 'Ajustes',
          tabBarIcon: ({ color }) => <Feather name="settings" size={24} color={color} />,
        }}
      />

      {/* Ecrã de detalhes da câmara (fica escondido da barra de separadores) */}
      <Tabs.Screen
        name="[code]"
        options={{
          href: null, // Esconde o ecrã da barra de separadores
          headerShown: true,
          headerTitleAlign: 'center',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerTitleStyle: { color: colors.text },
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.headerLeftContainer}>
              <Feather name="chevron-left" size={24} color={colors.primary} />
              <Text style={styles.headerLeftText}>Voltar</Text>
            </TouchableOpacity>
          ),
          tabBarStyle: { display: 'none' }, // Esconde a barra de separadores neste ecrã
        }}
      />
    </Tabs>
  );
}

