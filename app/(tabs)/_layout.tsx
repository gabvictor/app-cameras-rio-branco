import React from 'react';
import { Tabs, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useColorScheme, TouchableOpacity, Text, StyleSheet, View } from 'react-native';

// Este layout gere a barra de abas principal da aplicação.
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
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Início',
          tabBarIcon: ({ color, size }) => (
            <Feather name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="[code]"
        options={{
          href: null,
          headerShown: true,
          headerTitleAlign: 'center',
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.text,
          headerTitleStyle: {
            color: colors.text,
          },
          // Adiciona o botão "Voltar" personalizado
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.headerLeftContainer}>
              <Feather name="chevron-left" size={24} color={colors.primary} />
              <Text style={styles.headerLeftText}>Voltar</Text>
            </TouchableOpacity>
          ),
          tabBarStyle: { display: 'none' } 
        }}
      />
    </Tabs>
  );
}