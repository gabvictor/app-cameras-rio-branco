import { useLocalSearchParams, Stack } from 'expo-router';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  Image, 
  ActivityIndicator, 
  TouchableOpacity,
  ScrollView,
  Share,
  Linking,
  useColorScheme,
  Platform,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { Feather } from '@expo/vector-icons';

// --- CONFIGURAÇÕES ---
const API_URL = 'https://camerasriobranco.site/status-cameras'; 
const STATUS_UPDATE_INTERVAL_MS = 20 * 1000; // 20 segundos

// --- TIPO DE DADO ---
type Camera = {
  codigo: string;
  nome: string;
  status: 'online' | 'offline';
  categoria: string;
  coords: [number, number] | null;
  descricao: string;
};

// --- COMPONENTE PRINCIPAL DO ECRÃ ---
export default function CameraDetailScreen() {
  const systemColorScheme = useColorScheme();
  const isDarkTheme = systemColorScheme === 'dark';
  const styles = getDynamicStyles(isDarkTheme);

  const params = useLocalSearchParams();
  const { camera: cameraString } = params;

  // --- LÓGICA (ESTADOS) ---
  const initialCamera = useMemo<Camera | null>(() => {
    if (typeof cameraString === 'string') {
      try { return JSON.parse(cameraString); } catch (e) { return null; }
    }
    return null;
  }, [cameraString]);

  const [liveCameraData, setLiveCameraData] = useState<Camera | null>(initialCamera);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [imageSource, setImageSource] = useState<string | null>(null);
  const [stableImageSource, setStableImageSource] = useState<string | null>(null);

  // --- LÓGICA (EFEITOS E FUNÇÕES) ---
  const fetchCameraStatus = useCallback(async () => {
    if (!liveCameraData) return;
    try {
      const response = await fetch(API_URL);
      const allCameras: Camera[] = await response.json();
      const currentCamera = allCameras.find(c => c.codigo === liveCameraData.codigo);
      if (currentCamera) {
        setLiveCameraData(currentCamera);
      }
    } catch (error) {
      console.error("Erro ao procurar o estado da câmara:", error);
    }
  }, [liveCameraData]);

  useEffect(() => {
    fetchCameraStatus(); 
    const interval = setInterval(fetchCameraStatus, STATUS_UPDATE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchCameraStatus]);

  useEffect(() => {
    if (liveCameraData && liveCameraData.status === 'online') {
      const getNextUrl = () => `https://cameras.riobranco.ac.gov.br/api/camera?code=${liveCameraData.codigo}&t=${Date.now()}`;
      
      const initialUrl = getNextUrl();
      if (!stableImageSource) {
        setStableImageSource(initialUrl);
      }
      setImageSource(initialUrl);
      
      const interval = setInterval(() => {
        setImageSource(getNextUrl());
      }, 1000); 
      
      return () => clearInterval(interval);
    } else {
        const offlineUrl = `https://placehold.co/800x600/333333/ffffff?text=Offline`;
        setImageSource(offlineUrl);
        setStableImageSource(offlineUrl);
        if (isFirstLoad) setIsFirstLoad(false);
    }
  }, [liveCameraData]);

  const handleShare = async () => {
    if (!liveCameraData) return;
    try {
      await Share.share({
        message: `Veja a transmissão ao vivo da câmara "${liveCameraData.nome}" em Rio Branco!`,
      });
    } catch (error) {
      alert('Ocorreu um erro ao tentar partilhar.');
    }
  };

  const handleOpenMap = () => {
    if (liveCameraData?.coords) {
      const [lat, lon] = liveCameraData.coords;
      const url = Platform.select({
        ios: `maps:0,0?q=${lat},${lon}`,
        android: `geo:0,0?q=${lat},${lon}`
      }) || `https://maps.google.com/?q=${lat},${lon}`;
      
      Linking.openURL(url).catch(() => alert('Não foi possível abrir o mapa.'));
    }
  };

  // --- LÓGICA DE RENDERIZAÇÃO E PARTE VISUAL (JSX) ---
  if (!liveCameraData) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: "Erro" }} />
        <Text style={styles.errorText}>Erro: Câmara não encontrada.</Text>
      </SafeAreaView>
    );
  }

  const isOnline = liveCameraData.status === 'online';

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle={isDarkTheme ? 'light-content' : 'dark-content'} />
      
      <Stack.Screen 
        options={{ 
          title: liveCameraData.nome, 
        }} 
      />
      
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.imageContainer}>
            {stableImageSource && <Image key="stable-image" source={{ uri: stableImageSource }} style={styles.cameraFeed} />}
            {imageSource && isOnline && (
                <Image
                    key="loading-image"
                    source={{ uri: imageSource }}
                    style={StyleSheet.absoluteFill}
                    onLoad={() => {
                        setStableImageSource(imageSource);
                        if (isFirstLoad) setIsFirstLoad(false);
                    }}
                    onError={() => { if (isFirstLoad) setIsFirstLoad(false); }}
                />
            )}
            {isFirstLoad && isOnline && (
                <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color="#ffffff" />
                </View>
            )}
        </View>

        <View style={styles.detailsContainer}>
          <Text style={styles.cameraTitle}>{liveCameraData.nome}</Text>
          
          <View style={[styles.statusBadge, isOnline ? styles.statusBadgeOnline : styles.statusBadgeOffline]}>
            <View style={[styles.statusDot, isOnline ? styles.statusDotOnline : styles.statusDotOffline]} />
            <Text style={[styles.statusText, isOnline ? styles.statusTextOnline : styles.statusTextOffline]}>
                {isOnline ? 'Online' : 'Offline'}
            </Text>
          </View>
          
          <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Categoria</Text>
              <Text style={styles.infoValue}>{liveCameraData.categoria || 'Não informado'}</Text>
          </View>
          <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Descrição</Text>
              <Text style={styles.infoValue}>{liveCameraData.descricao || 'Nenhuma descrição disponível.'}</Text>
          </View>

          <View style={styles.buttonGroup}>
              <TouchableOpacity style={[styles.button, styles.secondaryButton, !liveCameraData.coords && styles.buttonDisabled]} onPress={handleOpenMap} disabled={!liveCameraData.coords}>
                  <Feather name="map-pin" size={20} color={styles.secondaryButtonText.color} />
                  <Text style={styles.secondaryButtonText}>Ver no Mapa</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={handleShare}>
                  <Feather name="share-2" size={20} color={styles.primaryButtonText.color} />
                  <Text style={styles.primaryButtonText}>Partilhar</Text>
              </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// --- ESTILOS ---
const getDynamicStyles = (isDarkTheme?: boolean) => {
    const colors = {
        background: isDarkTheme ? '#111827' : '#f3f4f6',
        text: isDarkTheme ? '#f9fafb' : '#111827',
        subtleText: isDarkTheme ? '#9ca3af' : '#6b7280',
        primary: isDarkTheme ? '#a78bfa' : '#4f46e5',
        border: isDarkTheme ? '#374151' : '#e5e7eb',
    };

    return StyleSheet.create({
        safeArea: { 
          flex: 1, 
          backgroundColor: colors.background,
        },
        container: {
          flex: 1,
          backgroundColor: colors.background,
          justifyContent: 'center',
          alignItems: 'center'
        },
        scrollContainer: {
          flexGrow: 1,
        },
        imageContainer: {
            backgroundColor: '#000',
            width: '100%',
            aspectRatio: 16 / 9,
            justifyContent: 'center',
            alignItems: 'center',
        },
        cameraFeed: {
            width: '100%',
            height: '100%',
        },
        loaderContainer: {
            ...StyleSheet.absoluteFillObject,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(0,0,0,0.5)'
        },
        detailsContainer: {
            padding: 20,
        },
        cameraTitle: {
            fontSize: 28,
            fontWeight: 'bold',
            color: colors.text,
            marginBottom: 12,
        },
        statusBadge: { 
            flexDirection: 'row',
            alignItems: 'center',
            alignSelf: 'flex-start',
            paddingHorizontal: 10, 
            paddingVertical: 5, 
            borderRadius: 99,
            marginBottom: 24,
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
        infoBox: { 
          marginBottom: 16,
          paddingBottom: 16,
          borderBottomWidth: 1,
          borderBottomColor: colors.border
        },
        infoLabel: { fontSize: 14, color: colors.subtleText, marginBottom: 4 },
        infoValue: { fontSize: 16, color: colors.text, lineHeight: 24 },
        buttonGroup: { marginTop: 24, flexDirection: 'row', gap: 12 },
        button: {
            flex: 1,
            flexDirection: 'row',
            gap: 8,
            paddingVertical: 14,
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
        },
        primaryButton: {
          backgroundColor: colors.primary,
        },
        primaryButtonText: {
          color: isDarkTheme ? '#111827' : '#f9fafb',
          fontSize: 16,
          fontWeight: '600',
        },
        secondaryButton: {
          backgroundColor: isDarkTheme ? '#374151' : '#e5e7eb',
        },
        secondaryButtonText: {
          color: colors.text,
          fontSize: 16,
          fontWeight: '600',
        },
        buttonDisabled: { opacity: 0.5 },
        errorText: { textAlign: 'center', fontSize: 16, color: '#ef4444', padding: 20 },
    });
};

