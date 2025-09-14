import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  FlatList, 
  Image, 
  SafeAreaView, 
  ActivityIndicator,
  TouchableOpacity,
  useColorScheme,
  Animated,
  useWindowDimensions,
  Platform, // Importar Platform
  StatusBar // Importar StatusBar
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { signOut } from 'firebase/auth';
import { Ionicons, Feather } from '@expo/vector-icons';
import { auth } from '../../core/firebaseConfig';

// --- CONFIGURAÇÕES ---
const API_URL = 'https://camerasriobranco.site/status-cameras';
const UPDATE_INTERVAL_MS = 1 * 15 * 1000; // 15 segundos
const TABLET_BREAKPOINT = 768;

// --- TIPO DE DADO ---
type Camera = {
  codigo: string;
  nome: string;
  status: 'online' | 'offline';
  categoria: string;
  coords: [number, number] | null;
  descricao: string;
};

// --- COMPONENTES VISUAIS AUXILIARES ---
const UpdateProgressBar = ({ progress, styles }: { progress: number, styles: any }) => (
  <View style={styles.progressBarContainer}>
    <Animated.View style={[styles.progressBar, { width: `${progress}%` }]} />
  </View>
);

const CameraCard = ({ item, onPress, styles, updateTimestamp }: { item: Camera, onPress: () => void, styles: any, updateTimestamp: number }) => {
  const isOnline = item.status === 'online';
  
  const getImageUrl = (timestamp: number) => isOnline
    ? `https://cameras.riobranco.ac.gov.br/api/camera?code=${item.codigo}&t=${timestamp}`
    : `https://placehold.co/400x300/e0e0e0/757575?text=Offline`;

  const [visibleImageUrl, setVisibleImageUrl] = useState(() => getImageUrl(updateTimestamp));
  const [loadingImageUrl, setLoadingImageUrl] = useState(visibleImageUrl);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
    if (isOnline) {
      setLoadingImageUrl(getImageUrl(updateTimestamp));
    } else {
      setVisibleImageUrl(getImageUrl(updateTimestamp));
    }
  }, [updateTimestamp, isOnline, item.codigo]);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  return (
    <Animated.View style={[{ opacity: fadeAnim }, styles.cardContainer]}>
      <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8} disabled={!isOnline}>
        <View style={styles.imageWrapper}>
          {isOnline && !imageError ? (
            <>
              <Image 
                key="visible" 
                source={{ uri: visibleImageUrl }} 
                style={styles.cameraImage} 
                onError={() => setImageError(true)}
              />
              {visibleImageUrl !== loadingImageUrl && (
                <Image
                  key="loading"
                  source={{ uri: loadingImageUrl }}
                  style={StyleSheet.absoluteFill}
                  onLoad={() => setVisibleImageUrl(loadingImageUrl)}
                  onError={() => setImageError(true)}
                />
              )}
            </>
          ) : (
            <View style={styles.offlineOverlay}>
              <Feather name={imageError ? "alert-triangle" : "video-off"} size={32} color="#9ca3af" />
              <Text style={styles.offlineText}>{imageError ? "Erro na Imagem" : "Offline"}</Text>
            </View>
          )}
        </View>
        <View style={styles.infoContainer}>
          <Text style={styles.cameraName} numberOfLines={1}>{item.nome}</Text>
          <View style={styles.badgeContainer}>
            <Text style={styles.cameraCategory} numberOfLines={1}>{item.categoria}</Text>
            <View style={[styles.statusBadge, isOnline ? styles.statusBadgeOnline : styles.statusBadgeOffline]}>
              <View style={[styles.statusDot, isOnline ? styles.statusDotOnline : styles.statusDotOffline]} />
              <Text style={[styles.statusText, isOnline ? styles.statusTextOnline : styles.statusTextOffline]}>
                {isOnline ? 'Online' : 'Offline'}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// --- COMPONENTE PRINCIPAL DO ECRÃ ---
export default function HomeScreen() {
  const systemColorScheme = useColorScheme();
  const isDarkTheme = systemColorScheme === 'dark';

  const { width } = useWindowDimensions();
  const isTablet = width >= TABLET_BREAKPOINT;
  const numColumns = isTablet ? 2 : 1;
  const styles = getDynamicStyles(isDarkTheme, isTablet);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [lastUpdated, setLastUpdated] = useState('');
  const [updateTimestamp, setUpdateTimestamp] = useState(Date.now());
  const [progress, setProgress] = useState(0);
  
  const router = useRouter();
  const user = auth.currentUser;

  const fetchCameras = useCallback(async () => {
    setProgress(0);
    try {
      setError(null);
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error('A resposta do servidor não foi OK.');
      const data = await response.json();
      setCameras(data);
      setLastUpdated(new Date().toLocaleTimeString('pt-BR'));
      setUpdateTimestamp(Date.now());
    } catch (e: any) {
      setError(e.message || "Não foi possível carregar as câmaras.");
    }
  }, []);
  
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      await fetchCameras();
      setIsLoading(false);
    };
    loadInitialData();
  }, [fetchCameras]);

  useEffect(() => {
    if (isLoading) return;

    const intervalId = setInterval(() => {
      setProgress(currentProgress => {
        const progressIncrement = (1000 / UPDATE_INTERVAL_MS) * 100;
        const newProgress = currentProgress + progressIncrement;
        if (newProgress >= 100) {
          fetchCameras();
          return 0;
        }
        return newProgress;
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [isLoading, fetchCameras]);

  const handleLogout = () => {
    signOut(auth);
  };

  const handleCardPress = (camera: Camera) => {
    if (camera.status !== 'online') return;
    router.push({
      pathname: `/[code]`, 
      params: { 
        code: camera.codigo,
        camera: JSON.stringify(camera)
      }
    });
  };

  return (
    // CORREÇÃO: SafeAreaView agora envolve todo o conteúdo
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle={isDarkTheme ? 'light-content' : 'dark-content'} />
      <Stack.Screen options={{ headerShown: false }} />
      <UpdateProgressBar progress={progress} styles={styles} />
      
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greetingText}>Bem-vindo,</Text>
            <Text style={styles.userName}>{user?.displayName || 'Utilizador'}</Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
              <Ionicons name="log-out-outline" size={26} color={styles.logoutButtonText.color} />
          </TouchableOpacity>
        </View>
        
        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={styles.title.color} />
            <Text style={styles.loadingText}>A carregar câmaras...</Text>
          </View>
        ) : error ? (
          <View style={styles.center}>
            <Feather name="alert-circle" size={48} color={styles.errorText.color} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchCameras}>
              <Text style={styles.retryButtonText}>Tentar Novamente</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={cameras}
            numColumns={numColumns}
            key={numColumns}
            keyExtractor={(item) => item.codigo}
            renderItem={({ item }) => <CameraCard item={item} onPress={() => handleCardPress(item)} styles={styles} updateTimestamp={updateTimestamp} />}
            contentContainerStyle={styles.listContentContainer}
            ListHeaderComponent={() => (
              <View style={styles.listHeader}>
                <Text style={styles.title}>Câmaras em Rio Branco</Text>
                {lastUpdated && <Text style={styles.lastUpdatedText}>Atualizado às {lastUpdated}</Text>}
              </View>
            )}
            ListEmptyComponent={() => (
              <View style={styles.emptyContainer}>
                <Feather name="camera-off" size={48} color="#9ca3af" />
                <Text style={styles.emptyText}>Nenhuma câmara encontrada.</Text>
              </View>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

// --- ESTILOS ---
const getDynamicStyles = (isDarkTheme?: boolean, isTablet?: boolean) => {
  const colors = {
    background: isDarkTheme ? '#111827' : '#f3f4f6',
    text: isDarkTheme ? '#f9fafb' : '#111827',
    subtleText: isDarkTheme ? '#9ca3af' : '#6b7280',
    card: isDarkTheme ? '#1f2937' : '#ffffff',
    primary: isDarkTheme ? '#a78bfa' : '#4f46e5',
    border: isDarkTheme ? '#374151' : '#e5e7eb'
  };

  return StyleSheet.create({
    // CORREÇÃO: Estilo para SafeAreaView e um container geral
    safeArea: { 
      flex: 1, 
      backgroundColor: colors.background,
      // Garante o espaçamento no topo em dispositivos Android
      paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 
    },
    container: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 20,
    },
    greetingText: {
      fontSize: 16,
      color: colors.subtleText,
    },
    userName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.text,
    },
    logoutButton: {
      padding: 8,
      borderRadius: 99,
      backgroundColor: isDarkTheme ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
    },
    logoutButtonText: {
      color: colors.primary,
    },
    listHeader: {
        paddingHorizontal: isTablet ? 8 : 4,
        marginBottom: 16,
    },
    title: { fontSize: 28, fontWeight: 'bold', color: colors.text },
    lastUpdatedText: { fontSize: 12, color: colors.subtleText, marginTop: 4 },
    listContentContainer: {
        paddingHorizontal: isTablet ? 12 : 16,
        paddingBottom: 16,
    },
    cardContainer: {
        flex: 1,
        padding: isTablet ? 4 : 0,
    },
    card: { 
      backgroundColor: colors.card, 
      borderRadius: 16, 
      marginBottom: isTablet ? 8 : 16,
      overflow: 'hidden',
      shadowColor: '#000', 
      shadowOffset: { width: 0, height: 4 }, 
      shadowOpacity: isDarkTheme ? 0.3 : 0.08, 
      shadowRadius: 8, 
      elevation: 5,
    },
    imageWrapper: {
      width: '100%', 
      aspectRatio: 16 / 9, 
      backgroundColor: isDarkTheme ? '#374151' : '#e5e7eb',
      justifyContent: 'center',
      alignItems: 'center',
    },
    cameraImage: { 
      width: '100%', 
      height: '100%',
    },
    offlineOverlay: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    offlineText: {
      marginTop: 8,
      color: colors.subtleText,
      fontWeight: '500',
    },
    infoContainer: { padding: 16 },
    cameraName: { fontSize: 18, fontWeight: '600', color: colors.text, marginBottom: 8 },
    badgeContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    cameraCategory: { fontSize: 14, color: colors.subtleText, flex: 1, marginRight: 8 },
    statusBadge: { 
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 10, 
      paddingVertical: 5, 
      borderRadius: 99,
    },
    statusBadgeOnline: { backgroundColor: isDarkTheme ? 'rgba(34, 197, 94, 0.2)' : '#dcfce7' },
    statusBadgeOffline: { backgroundColor: isDarkTheme ? 'rgba(239, 68, 68, 0.2)' : '#fee2e2' },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginRight: 6,
    },
    statusDotOnline: { backgroundColor: '#22c55e' },
    statusDotOffline: { backgroundColor: '#ef4444' },
    statusText: { fontSize: 12, fontWeight: 'bold' },
    statusTextOnline: { color: isDarkTheme ? '#86efac' : '#166534' },
    statusTextOffline: { color: isDarkTheme ? '#fca5a5' : '#991b1b' },
    loadingText: { marginTop: 16, fontSize: 16, color: colors.subtleText },
    errorText: { textAlign: 'center', fontSize: 16, color: '#f87171', marginTop: 16, marginBottom: 24 },
    retryButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
    },
    retryButtonText: {
      color: isDarkTheme ? '#111827' : '#f9fafb',
      fontWeight: '600',
    },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50, paddingTop: 50 },
    emptyText: { fontSize: 16, color: colors.subtleText, marginTop: 16 },
    progressBarContainer: { height: 3, width: '100%', backgroundColor: colors.border },
    progressBar: { height: '100%', backgroundColor: colors.primary },
  });
};

