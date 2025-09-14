import React, { useState, useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { onAuthStateChanged, User } from 'firebase/auth';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { auth } from '../core/firebaseConfig';

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
    if (!isReady) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (user) {
      if (user.emailVerified) {
        if (inAuthGroup) router.replace('/'); // usuário verificado vai para home
      } else {
        if (!inAuthGroup) router.replace('/login'); // usuário não verificado volta para login
      }
    } else {
      if (!inAuthGroup) router.replace('/login'); // usuário não logado
    }
  }, [user, isReady, segments, router]);

  if (!isReady) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Stack>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
