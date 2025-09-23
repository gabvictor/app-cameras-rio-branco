import React from 'react';
import { Stack } from 'expo-router';

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
