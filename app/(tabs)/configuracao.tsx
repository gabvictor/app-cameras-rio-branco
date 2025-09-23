import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useColorScheme } from 'react-native';
import { useSettings } from '../../core/SettingsContext';
import { Feather } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SettingsScreen() {
  const { listMode, setListMode, isLoading } = useSettings();
  const isDarkTheme = useColorScheme() === 'dark';

  const colors = {
    background: isDarkTheme ? '#111827' : '#f3f4f6',
    text: isDarkTheme ? '#f9fafb' : '#111827',
    card: isDarkTheme ? '#1f2937' : '#fff',
    primary: isDarkTheme ? '#a78bfa' : '#4f46e5',
    border: isDarkTheme ? '#374151' : '#e5e7eb',
  };

  const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background },
    container: { flex: 1, padding: 20 },
    title: { fontSize: 28, fontWeight: 'bold', color: colors.text, marginBottom: 24 },
    sectionTitle: { fontSize: 18, fontWeight: '600', color: colors.text, marginBottom: 16 },
    optionButton: {
      backgroundColor: colors.card,
      paddingVertical: 16,
      paddingHorizontal: 20,
      borderRadius: 12,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    optionButtonActive: {
      borderColor: colors.primary,
    },
    optionText: {
      fontSize: 16,
      color: colors.text,
      fontWeight: '500',
    },
  });

  if (isLoading) {
    return <View style={styles.container}><Text style={{ color: colors.text }}>Carregando...</Text></View>;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <Text style={styles.title}>Configurações</Text>
        <Text style={styles.sectionTitle}>Modo de Carregamento da Lista</Text>

        <TouchableOpacity
          style={[styles.optionButton, listMode === 'infinite' && styles.optionButtonActive]}
          onPress={() => setListMode('infinite')}
        >
          <Text style={styles.optionText}>Scroll Infinito</Text>
          {listMode === 'infinite' && <Feather name="check-circle" size={24} color={colors.primary} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.optionButton, listMode === 'pagination' && styles.optionButtonActive]}
          onPress={() => setListMode('pagination')}
        >
          <Text style={styles.optionText}>Paginação (Ex: 1, 2, 3...)</Text>
          {listMode === 'pagination' && <Feather name="check-circle" size={24} color={colors.primary} />}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}