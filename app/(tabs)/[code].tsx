import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Alert,
  useColorScheme,
  Platform,
  StatusBar,
  Share,
  Linking,
  KeyboardAvoidingView,
  FlatList,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, deleteDoc, doc, Timestamp } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const API_URL = 'https://camerasriobranco.site/status-cameras';
const IMAGE_REFRESH_INTERVAL_MS = 1000;

type Camera = {
  codigo: string;
  nome: string;
  status: 'online' | 'offline';
  categoria: string;
  coords: [number, number] | null;
  descricao: string;
};

type Comment = {
  id: string;
  userId: string;
  userDisplayName: string;
  text: string;
  timestamp: Timestamp;
};

const formatCommentTimestamp = (firestoreTimestamp: Timestamp | null) => {
  if (!firestoreTimestamp) return "";
  const date = firestoreTimestamp.toDate();
  const now = new Date();

  if (now.getTime() - date.getTime() < 24 * 60 * 60 * 1000) {
    return formatDistanceToNow(date, { addSuffix: true, locale: ptBR });
  }
  return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
};

const CommentItem = React.memo(({ item, user, onDelete }: { item: Comment; user: any; onDelete: (id: string, userId: string) => void; }) => {
  const styles = getDynamicStyles(useColorScheme() === 'dark');
  const formattedDate = formatCommentTimestamp(item.timestamp);

  return (
    <View style={styles.commentItem}>
      <View style={{ flex: 1 }}>
        <View style={styles.commentHeader}>
          <Text style={styles.commentAuthor}>{item.userDisplayName}</Text>
          <Text style={styles.commentTimestamp}>{formattedDate}</Text>
        </View>
        <Text style={styles.commentText}>{item.text}</Text>
      </View>
      {user?.uid === item.userId && (
        <TouchableOpacity onPress={() => onDelete(item.id, item.userId)} style={{ paddingLeft: 10 }}>
          <Feather name="trash-2" size={18} color="#ef4444" />
        </TouchableOpacity>
      )}
    </View>
  );
});

export default function CameraDetailScreen() {
  const systemColorScheme = useColorScheme();
  const isDarkTheme = systemColorScheme === 'dark';
  const styles = getDynamicStyles(isDarkTheme);

  const router = useRouter();
  const { code } = useLocalSearchParams<{ code: string }>();

  const db = getFirestore();
  const auth = getAuth();
  const user = auth.currentUser;

  const [liveCameraData, setLiveCameraData] = useState<Camera | null>(null);
  const [imageSource, setImageSource] = useState<string | null>(null);
  const [stableImageSource, setStableImageSource] = useState<string | null>(null);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [isSending, setIsSending] = useState(false);

  const flatListRef = useRef<FlatList<Comment>>(null);

  const fetchCameraData = useCallback(async () => {
    if (!code) return;
    try {
      const response = await fetch(API_URL);
      const allCameras: Camera[] = await response.json();
      const cameraFound = allCameras.find((c) => c.codigo === code);
      setLiveCameraData(cameraFound || null);
    } catch (error) {
      console.error('Erro ao buscar a câmera:', error);
      setLiveCameraData(null);
    }
  }, [code]);

  useEffect(() => {
    fetchCameraData();
  }, [fetchCameraData]);

  useEffect(() => {
    if (!liveCameraData) return;
    setIsFirstLoad(true);

    const getNextUrl = () => `https://cameras.riobranco.ac.gov.br/api/camera?code=${liveCameraData.codigo}&t=${Date.now()}`;
    if (liveCameraData.status === 'online') {
      setStableImageSource(getNextUrl());
      setImageSource(getNextUrl());
      const interval = setInterval(() => setImageSource(getNextUrl()), IMAGE_REFRESH_INTERVAL_MS);
      return () => clearInterval(interval);
    } else {
      const offlineUrl = 'https://placehold.co/800x600/333333/ffffff?text=Offline';
      setStableImageSource(offlineUrl);
      setImageSource(offlineUrl);
      if (isFirstLoad) setIsFirstLoad(false);
    }
  }, [liveCameraData]);

  useEffect(() => {
    if (!code) return;
    const q = query(collection(db, "cameras", code, "comments"), orderBy("timestamp", "asc"));
    const unsubscribe = onSnapshot(q, snapshot => {
      setComments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Comment)));
    });
    return unsubscribe;
  }, [code]);

  const handleGoBack = () => router.canGoBack() && router.back();

  const handleShare = async () => {
    if (!liveCameraData) return;
    try {
      await Share.share({
        message: `Veja a transmissão da câmera "${liveCameraData.nome}" em Rio Branco!`,
      });
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível compartilhar.');
    }
  };

  const handleOpenMap = () => {
    if (!liveCameraData?.coords) return;
    const [lat, lon] = liveCameraData.coords;
    const url = Platform.select({
      ios: `maps:0,0?q=${lat},${lon}`,
      android: `geo:0,0?q=${lat},${lon}(${liveCameraData.nome})`
    }) || `https://maps.google.com/?q=${lat},${lon}`;
    Linking.openURL(url).catch(() => Alert.alert('Erro', 'Não foi possível abrir o mapa.'));
  };

  const handleSendComment = async () => {
    if (!user || !commentText.trim() || !code || isSending) return;

    const textToSend = commentText.trim();
    setCommentText("");
    setIsSending(true);

    try {
      await addDoc(collection(db, "cameras", code, "comments"), {
        userId: user.uid,
        userDisplayName: user.displayName || "Anônimo",
        text: textToSend,
        timestamp: serverTimestamp()
      });
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 200);
    } catch (error) {
      Alert.alert("Erro", "Não foi possível enviar o comentário.");
      setCommentText(textToSend);
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteComment = async (commentId: string, commentUserId: string) => {
    if (!code || user?.uid !== commentUserId) return;
    Alert.alert("Excluir comentário", "Deseja realmente excluir seu comentário?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir", style: "destructive", onPress: async () => {
          try { await deleteDoc(doc(db, "cameras", code, "comments", commentId)); }
          catch { Alert.alert("Erro", "Não foi possível excluir o comentário."); }
        }
      }
    ]);
  };

  if (!liveCameraData) return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ title: 'Carregando...' }} />
      <View style={styles.container}><ActivityIndicator size="large" color={isDarkTheme ? '#fff' : '#000'} /></View>
    </SafeAreaView>
  );

  const isOnline = liveCameraData.status === 'online';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
      <StatusBar barStyle={isDarkTheme ? 'light-content' : 'dark-content'} />
      <Stack.Screen options={{ headerShown: false }} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={handleGoBack} style={styles.headerButton}><Feather name="chevron-left" size={26} color={styles.headerButtonText.color} /></TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>{liveCameraData.nome}</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.imageContainer}>
          {stableImageSource && <Image key="stable" source={{ uri: stableImageSource }} style={styles.cameraFeed} />}
          {imageSource && isOnline && <Image key="live" source={{ uri: imageSource }} style={StyleSheet.absoluteFill} onLoad={() => { setStableImageSource(imageSource); if (isFirstLoad) setIsFirstLoad(false); }} />}
          {isFirstLoad && isOnline && <View style={styles.loaderContainer}><ActivityIndicator size="large" color="#fff" /></View>}
          
          {user && (
            <View style={styles.watermarkContainer}>
              <Text style={styles.watermarkText}>
                UID: {user.uid}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.contentContainer}>
          <FlatList
            ref={flatListRef}
            data={comments}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            ListHeaderComponent={
              <View style={styles.buttonGroup}>
                <TouchableOpacity style={[styles.button, styles.secondaryButton, !liveCameraData.coords && styles.buttonDisabled]} onPress={handleOpenMap} disabled={!liveCameraData.coords}>
                  <Feather name="map-pin" size={20} color={styles.secondaryButtonText.color} />
                  <Text style={styles.secondaryButtonText}>Ver no Mapa</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={handleShare}>
                  <Feather name="share-2" size={20} color={styles.primaryButtonText.color} />
                  <Text style={styles.primaryButtonText}>Compartilhar</Text>
                </TouchableOpacity>
              </View>
            }
            renderItem={({ item }) => <CommentItem item={item} user={user} onDelete={handleDeleteComment} />}
            ListFooterComponent={<View style={{ height: 20 }} />}
          />

          <View style={styles.commentInputContainer}>
            <TextInput
              placeholder="Escreva um comentário..."
              placeholderTextColor="#9ca3af"
              value={commentText}
              onChangeText={setCommentText}
              style={styles.commentInput}
              multiline={false}
              blurOnSubmit={true}
              returnKeyType="send"
              onSubmitEditing={handleSendComment}
            />
            <TouchableOpacity
              style={styles.commentButton}
              onPress={handleSendComment}
              disabled={isSending || !commentText.trim()}
            >
              <Feather name="send" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const getDynamicStyles = (isDarkTheme?: boolean) => {
  const colors = {
    background: isDarkTheme ? '#111827' : '#f3f4f6',
    text: isDarkTheme ? '#f9fafb' : '#111827',
    subtleText: isDarkTheme ? '#9ca3af' : '#6b7280',
    primary: isDarkTheme ? '#a78bfa' : '#4f46e5',
    border: isDarkTheme ? '#374151' : '#e5e7eb',
    card: isDarkTheme ? '#1f2937' : '#ffffff',
  };

  return StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background },
    container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 10, paddingVertical: 12 },
    headerButton: { padding: 5 },
    headerButtonText: { color: colors.primary, fontSize: 16 },
    headerTitle: { color: colors.text, fontSize: 18, fontWeight: '600', flex: 1, textAlign: 'center', marginHorizontal: 10 },
    imageContainer: { backgroundColor: '#000', width: '100%', aspectRatio: 16 / 9, justifyContent: 'center', alignItems: 'center' },
    cameraFeed: { width: '100%', height: '100%' },
    loaderContainer: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },

    watermarkContainer: {
      position: 'absolute',
      bottom: 8,
      right: 8,
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
      paddingHorizontal: 6,
      paddingVertical: 3,
      borderRadius: 4,
    },
    watermarkText: {
      color: 'rgba(255, 255, 255, 0.6)',
      fontSize: 10,
      fontWeight: '600',
    },

    contentContainer: {
      flex: 1,
      paddingHorizontal: 15,
    },
    buttonGroup: { paddingTop: 20, flexDirection: 'row', gap: 12, paddingBottom: 20 },
    button: { flex: 1, flexDirection: 'row', gap: 8, paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    primaryButton: { backgroundColor: colors.primary },
    primaryButtonText: { color: isDarkTheme ? '#111827' : '#f9fafb', fontSize: 16, fontWeight: '600' },
    secondaryButton: { backgroundColor: isDarkTheme ? '#374151' : '#e5e7eb' },
    secondaryButtonText: { color: colors.text, fontSize: 16, fontWeight: '600' },
    buttonDisabled: { opacity: 0.5 },

    commentItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    commentHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4,
    },
    commentAuthor: { fontWeight: 'bold', color: colors.text },
    commentTimestamp: {
      fontSize: 12,
      color: colors.subtleText,
    },
    commentText: { color: colors.text, flexWrap: 'wrap' },

    commentInputContainer: { flexDirection: 'row', paddingVertical: 10, alignItems: 'flex-end', borderTopWidth: 1, borderColor: colors.border },
    commentInput: { flex: 1, padding: 12, borderRadius: 12, backgroundColor: colors.card, color: colors.text, minHeight: 48, maxHeight: 120 },
    commentButton: { backgroundColor: colors.primary, padding: 12, borderRadius: 12, marginLeft: 8 },
  });
};