import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  useColorScheme,
  Animated,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack, Link } from 'expo-router';
import { doc, onSnapshot, setDoc, arrayUnion, arrayRemove, getFirestore } from 'firebase/firestore';
import { Ionicons, Feather } from '@expo/vector-icons';
import { getAuth } from 'firebase/auth';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { firebaseConfig } from '../../core/firebaseConfig';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);


const API_URL = 'https://camerasriobranco.site/status-cameras';
const REFRESH_INTERVAL_MS = 15 * 1000;
const TABLET_BREAKPOINT = 768;

type Camera = {
  codigo: string;
  nome: string;
  status: 'online' | 'offline';
  categoria: string;
};

const UpdateProgressBar = ({ progressAnim, styles }: { progressAnim: Animated.Value; styles: any }) => {
  const width = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });
  return (
    <View style={styles.progressBarContainer}>
      <Animated.View style={[styles.progressBar, { width }]} />
    </View>
  );
};

const CameraCard = React.memo(
  ({ item, onPress, styles, updateTimestamp, isFavorite, onToggleFavorite }: {
    item: Camera;
    onPress: () => void;
    styles: any;
    updateTimestamp: number;
    isFavorite: boolean;
    onToggleFavorite: (code: string) => void;
  }) => {
    const isOnline = item.status === 'online';
    const imageUrl = isOnline
      ? `https://cameras.riobranco.ac.gov.br/api/camera?code=${item.codigo}&t=${updateTimestamp}`
      : `https://placehold.co/800x450/e0e0e0/757575?text=Offline`;

    return (
      <View style={styles.cardContainer}>
        <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85} disabled={!isOnline}>
          <View style={styles.imageWrapper}>
            <Image source={{ uri: imageUrl }} style={styles.cameraImage} resizeMode="cover" />
            <TouchableOpacity style={styles.favoriteButton} onPress={() => onToggleFavorite(item.codigo)}>
              <Ionicons name={isFavorite ? "star" : "star-outline"} size={28} color={isFavorite ? "#FFD700" : "#FFFFFF"} />
            </TouchableOpacity>
            <View style={styles.statusBadge}>
              <View style={[styles.statusDot, isOnline ? styles.statusDotOnline : styles.statusDotOffline]} />
              <Text style={styles.statusText}>{isOnline ? 'Online' : 'Offline'}</Text>
            </View>
          </View>
          <View style={styles.infoContainer}>
            <Text style={styles.cameraName} numberOfLines={2}>{item.nome}</Text>
            <Text style={styles.cameraCategory} numberOfLines={1}>{item.categoria}</Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  }
);

export default function FavoritesScreen() {
  const isDarkTheme = useColorScheme() === 'dark';
  const isTablet = useWindowDimensions().width >= TABLET_BREAKPOINT;
  const { styles, colors } = getDynamicStyles(isDarkTheme, isTablet);

  const [isLoading, setIsLoading] = useState(true);
  const [favoriteCameras, setFavoriteCameras] = useState<Camera[]>([]);
  const [favoriteCodes, setFavoriteCodes] = useState<string[]>([]);
  const [updateTimestamp, setUpdateTimestamp] = useState(Date.now());
  
  const progressAnim = useRef(new Animated.Value(0)).current;
  const router = useRouter();
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      setFavoriteCodes([]);
      setFavoriteCameras([]);
      return;
    }
    const userDocRef = doc(db, 'userData', user.uid);
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      setFavoriteCodes(docSnap.exists() ? docSnap.data().favoriteCameras || [] : []);
    });
    return unsubscribe;
  }, [user]);

  const fetchFavoriteCameras = useCallback(async () => {
    if (favoriteCodes.length === 0) {
      setFavoriteCameras([]);
      setIsLoading(false);
      return;
    }
    try {
      const response = await fetch(`${API_URL}?t=${Date.now()}`);
      const allCameras: Camera[] = await response.json();
      const filtered = allCameras.filter(cam => favoriteCodes.includes(cam.codigo));
      setFavoriteCameras(filtered);
      setUpdateTimestamp(Date.now());
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [favoriteCodes]);

  useEffect(() => {
    setIsLoading(true);
    fetchFavoriteCameras();
  }, [fetchFavoriteCameras]);

  useEffect(() => {
    const interval = setInterval(fetchFavoriteCameras, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchFavoriteCameras]);
  
  useEffect(() => {
    progressAnim.setValue(0);
    Animated.timing(progressAnim, { toValue: 100, duration: REFRESH_INTERVAL_MS, useNativeDriver: false }).start();
  }, [updateTimestamp]);

  const handleToggleFavorite = async (cameraCode: string) => {
    if (!user) return;
    const userDocRef = doc(db, 'userData', user.uid);
    const isCurrentlyFavorite = favoriteCodes.includes(cameraCode);
    await setDoc(userDocRef, { 
      favoriteCameras: isCurrentlyFavorite ? arrayRemove(cameraCode) : arrayUnion(cameraCode) 
    }, { merge: true });
  };
  
  const handleCardPress = (camera: Camera) => {
    if (camera.status !== 'online') return;
    router.push({ pathname: `/[code]`, params: { code: camera.codigo } });
  };
  
  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />
      <UpdateProgressBar progressAnim={progressAnim} styles={styles} />
      <FlatList
        data={favoriteCameras.sort((a,b) => a.nome.localeCompare(b.nome))}
        numColumns={isTablet ? 2 : 1}
        key={isTablet ? 'tablet' : 'phone'}
        keyExtractor={(item) => item.codigo}
        renderItem={({ item }) => (
          <CameraCard
            item={item}
            onPress={() => handleCardPress(item)}
            styles={styles}
            updateTimestamp={updateTimestamp}
            isFavorite={favoriteCodes.includes(item.codigo)}
            onToggleFavorite={handleToggleFavorite}
          />
        )}
        ListHeaderComponent={<Text style={styles.title}>Minhas Câmeras Favoritas</Text>}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Feather name="star" size={48} color={colors.subtleText} />
            <Text style={styles.emptyText}>{user ? "Nenhuma câmera favorita." : "Faça login para ver os seus favoritos."}</Text>
            <Text style={styles.emptySubText}>{user ? "Adicione câmeras aos seus favoritos para vê-las aqui." : "As suas câmeras favoritas aparecerão aqui depois de iniciar sessão."}</Text>
            <Link href={user ? "/(tabs)" : "/login"} asChild>
                <TouchableOpacity style={styles.browseButton}>
                    <Text style={styles.browseButtonText}>{user ? "Procurar Câmeras" : "Ir para o Login"}</Text>
                </TouchableOpacity>
            </Link>
          </View>
        }
        contentContainerStyle={styles.listContentContainer}
      />
    </SafeAreaView>
  );
}

const getDynamicStyles = (isDarkTheme?: boolean, isTablet?: boolean) => {
    const colors = {
        background: isDarkTheme ? '#111827' : '#f4f5f7',
        text: isDarkTheme ? '#f9fafb' : '#111827',
        subtleText: isDarkTheme ? '#9ca3af' : '#6b7280',
        card: isDarkTheme ? '#1f2937' : '#ffffff',
        primary: isDarkTheme ? '#a78bfa' : '#4f46e5',
        border: isDarkTheme ? '#374151' : '#e5e7eb',
        online: isDarkTheme ? '#22c55e' : '#16a34a',
        offline: isDarkTheme ? '#ef4444' : '#dc2626',
    };
  
    return {
      colors,
      styles: StyleSheet.create({
        progressBarContainer: { height: 3, width: '100%', backgroundColor: colors.border },
        progressBar: { height: '100%', backgroundColor: colors.primary },
        safeArea: { flex: 1, backgroundColor: colors.background },
        center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
        title: { fontSize: 32, fontWeight: 'bold', color: colors.text, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10 },
        listContentContainer: { paddingBottom: 12, flexGrow: 1 },
        cardContainer: { flex: 1, paddingHorizontal: isTablet ? 8 : 16, marginTop: 16 },
        card: { backgroundColor: colors.card, borderRadius: 16, overflow: 'hidden', elevation: 8, borderWidth: isDarkTheme ? 1 : 0, borderColor: colors.border },
        imageWrapper: { width: '100%', aspectRatio: 16 / 9, backgroundColor: colors.border },
        cameraImage: { width: '100%', height: '100%' },
        favoriteButton: { position: 'absolute', top: 12, left: 12, zIndex: 1 },
        statusBadge: { position: 'absolute', top: 12, right: 12, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 99, backgroundColor: 'rgba(0, 0, 0, 0.45)' },
        statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
        statusDotOnline: { backgroundColor: colors.online },
        statusDotOffline: { backgroundColor: colors.offline },
        statusText: { fontSize: 12, fontWeight: 'bold', color: '#FFFFFF' },
        infoContainer: { paddingHorizontal: 16, paddingVertical: 12 },
        cameraName: { fontSize: 17, fontWeight: '600', color: colors.text, marginBottom: 4 },
        cameraCategory: { fontSize: 13, color: colors.subtleText },
        emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
        emptyText: { fontSize: 20, fontWeight: 'bold', color: colors.text, marginTop: 16, textAlign: 'center' },
        emptySubText: { fontSize: 16, color: colors.subtleText, marginTop: 8, textAlign: 'center', maxWidth: '80%' },
        browseButton: { marginTop: 24, backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
        browseButtonText: { color: isDarkTheme ? '#111827' : '#f9fafb', fontWeight: '600', fontSize: 16 },
      }),
    };
};

