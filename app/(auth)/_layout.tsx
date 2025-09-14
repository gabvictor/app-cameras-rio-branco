import React from 'react';
import { Stack } from 'expo-router';

// Este layout gere a pilha de navegação para os ecrãs de autenticação.
export default function AuthLayout() {
  return (
    <Stack>
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="terms" options={{ 
        headerShown: true, 
        title: 'Termos de Responsabilidade' 
      }} />
    </Stack>
  );
}

