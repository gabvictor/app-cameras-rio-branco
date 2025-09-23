import React, { useState, useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { onAuthStateChanged, User } from 'firebase/auth';
import { ActivityIndicator, View, StyleSheet, AppState } from 'react-native';
import { auth } from '../core/firebaseConfig';
import { SettingsProvider } from '../core/SettingsContext';

export default function RootLayout() {
  const [user, setUser] = useState<User | null>(null);
  const [isReady, setIsReady] = useState(false);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsReady(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      if (nextAppState === 'active' && auth.currentUser) {
        await auth.currentUser.reload();
        setUser(auth.currentUser);
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (!isReady) return;

    const inAuthGroup = segments[0] === '(auth)';
    
    if (auth.currentUser && auth.currentUser.uid !== user?.uid) {
        setUser(auth.currentUser);
    }
    
    if (user) {
      if (!user.emailVerified) {
        if (!inAuthGroup) router.replace('/login');
      } else {
        if (inAuthGroup) router.replace('/');
      }
    } else {
      if (!inAuthGroup) router.replace('/login');
    }
  }, [user, isReady, segments, router]);

  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  return (
    <SettingsProvider>
      {/* ✅ CORREÇÃO APLICADA AQUI */}
      <Stack screenOptions={{ headerShown: false }}>
        {/* Apenas os grupos precisam ser declarados */}
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        
        {/* As rotas "[code]" e "terms" são encontradas automaticamente
          e não precisam ser listadas aqui, eliminando os avisos.
          Elas receberão o `headerShown: false` do `screenOptions` acima.
        */}
      </Stack>
    </SettingsProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});