import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
  Platform,
  StatusBar,
  TextInput,
  LayoutAnimation,
  UIManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { signOut } from 'firebase/auth';
import { Ionicons, Feather } from '@expo/vector-icons';
import { auth } from '../../core/firebaseConfig';
import { useSettings } from '../../core/SettingsContext';

const API_URL = 'https://camerasriobranco.site/status-cameras';
const FULL_REFRESH_INTERVAL_MS = 15 * 1000;
const TABLET_BREAKPOINT = 568; //arrumar para 768 dps
const INITIAL_CATEGORIES_TO_SHOW = 5;
const ITEMS_PER_PAGE = 16;
const SEARCH_DEBOUNCE_MS = 250;

type Camera = {
  codigo: string;
  nome: string;
  status: 'online' | 'offline';
  categoria: string;
  coords: [number, number] | null;
  descricao: string;
  level?: number;
};

type ListItem = Camera | { type: 'header'; title: string };

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
  ({
    item,
    onPress,
    styles,
    updateTimestamp,
  }: {
    item: Camera;
    onPress: () => void;
    styles: any;
    updateTimestamp: number;
  }) => {
    const isOnline = item.status === 'online';

    const buildUrl = (timestamp: number) =>
      isOnline
        ? `https://cameras.riobranco.ac.gov.br/api/camera?code=${item.codigo}&t=${timestamp}`
        : `https://placehold.co/800x450/e0e0e0/757575?text=Offline`;

    const [currentUrl, setCurrentUrl] = useState<string>(() => buildUrl(updateTimestamp));
    const [imageLoading, setImageLoading] = useState(false);
    const [imageError, setImageError] = useState(false);
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      setImageError(false);
      const newUrl = buildUrl(updateTimestamp);
      setImageLoading(true);
      setCurrentUrl(newUrl);
    }, [updateTimestamp, item.codigo, isOnline]);

    useEffect(() => {
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    }, [currentUrl]);

    return (
      <Animated.View style={[{ opacity: fadeAnim }, styles.cardContainer]}>
        <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85} disabled={!isOnline}>
          <View style={styles.imageWrapper}>
            {!isOnline || imageError ? (
              <View style={styles.offlineOverlay}>
                <Feather name={imageError ? 'alert-triangle' : 'video-off'} size={32} color="#9ca3af" />
                <Text style={styles.offlineText}>{imageError ? 'Erro na Imagem' : 'Offline'}</Text>
              </View>
            ) : (
              <Image
                key={`${item.codigo}-${currentUrl}-${updateTimestamp}`}
                source={{ uri: currentUrl }}
                style={styles.cameraImage}
                resizeMode="cover"
                onLoadStart={() => setImageLoading(true)}
                onLoad={() => setImageLoading(false)}
                onError={() => {
                  setImageLoading(false);
                  setImageError(true);
                }}
              />
            )}

            <View style={[styles.statusBadge]}>
              <View style={[styles.statusDot, isOnline ? styles.statusDotOnline : styles.statusDotOffline]} />
              <Text style={[styles.statusText]}>{isOnline ? 'Online' : 'Offline'}</Text>
            </View>
          </View>

          <View style={styles.infoContainer}>
            <Text style={styles.cameraName} numberOfLines={2}>
              {item.nome}
            </Text>
            <Text style={styles.cameraCategory} numberOfLines={1}>
              {item.categoria}
            </Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  }
);

const ListHeader = React.memo(
  ({
    searchText,
    setSearchText,
    categories,
    selectedCategory,
    setSelectedCategory,
    lastUpdated,
    styles,
    isDarkTheme,
    showAllCategories,
    toggleShowAllCategories,
  }: any) => {
    const categoriesToShow = showAllCategories ? categories : categories.slice(0, INITIAL_CATEGORIES_TO_SHOW);

    return (
      <View style={styles.listHeader}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por nome..."
          value={searchText}
          onChangeText={setSearchText}
          placeholderTextColor={isDarkTheme ? '#9ca3af' : '#6b7280'}
        />
        <View style={styles.categoriesContainer}>
          {categoriesToShow.map((category: string) => (
            <TouchableOpacity
              key={category}
              style={[styles.categoryButton, selectedCategory === category && styles.categoryButtonSelected]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text style={[styles.categoryText, selectedCategory === category && styles.categoryTextSelected]}>
                {category === 'all' ? 'Todas' : category}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {categories.length > INITIAL_CATEGORIES_TO_SHOW && (
          <TouchableOpacity onPress={toggleShowAllCategories} style={styles.showMoreButton}>
            <Text style={styles.showMoreText}>{showAllCategories ? 'Ver menos ▲' : 'Ver mais ▼'}</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.title}>Câmeras de Rio Branco</Text>
        {lastUpdated && <Text style={styles.lastUpdatedText}>Atualizado às {lastUpdated}</Text>}
      </View>
    );
  }
);

export default function HomeScreen() {
  const systemColorScheme = useColorScheme();
  const isDarkTheme = systemColorScheme === 'dark';
  const { width, height } = useWindowDimensions();
  const isTablet = width >= TABLET_BREAKPOINT;
  const { styles, colors } = getDynamicStyles(isDarkTheme, isTablet);

  const progressAnim = useRef(new Animated.Value(0)).current;
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState('');
  const [updateTimestamp, setUpdateTimestamp] = useState(Date.now());
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [showScrollToTopButton, setShowScrollToTopButton] = useState(false);
  const [allFetchedCameras, setAllFetchedCameras] = useState<Camera[]>([]);
  const [page, setPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const { listMode } = useSettings();
  const flatListRef = useRef<FlatList<any>>(null);
  const router = useRouter();
  const user = auth.currentUser;
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(searchText), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [searchText]);

  const fetchAllCameras = useCallback(async (isRefreshing = false) => {
    if (!isRefreshing) setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}?t=${Date.now()}`);
      const data: Camera[] = await response.json();

      setAllFetchedCameras(data);
      setLastUpdated(new Date().toLocaleTimeString('pt-BR'));
      setUpdateTimestamp(Date.now());
    } catch (e) {
      console.error(e);
    } finally {
      if (!isRefreshing) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllCameras();
    const interval = setInterval(() => {
      fetchAllCameras(true);
    }, FULL_REFRESH_INTERVAL_MS);
    return () => {
      clearInterval(interval);
      abortControllerRef.current?.abort();
    };
  }, [fetchAllCameras]);

  useEffect(() => {
    if (isLoading) return;

    const startProgress = () => {
      progressAnim.setValue(0);
      const animation = Animated.timing(progressAnim, {
        toValue: 100,
        duration: FULL_REFRESH_INTERVAL_MS,
        useNativeDriver: false,
      });
      animation.start();
    };

    startProgress();
  }, [isLoading, updateTimestamp]);

  useEffect(() => {
    setPage(1);
    if (flatListRef.current) {
      flatListRef.current.scrollToOffset({ offset: 0, animated: true });
    }
  }, [selectedCategory, debouncedSearch]);

  const categories = useMemo(() => {
    const onlineCams = allFetchedCameras.filter((cam) => cam.status === 'online');
    const uniqueCategories = [...new Set(onlineCams.map((cam) => cam.categoria).filter(Boolean))].sort();
    return ['all', ...uniqueCategories];
  }, [allFetchedCameras]);

  const filteredCameras = useMemo(() => {
    let camerasToFilter = allFetchedCameras.filter((cam) => cam.status === 'online');
    if (selectedCategory !== 'all') {
      camerasToFilter = camerasToFilter.filter((camera) => camera.categoria === selectedCategory);
    }
    if (debouncedSearch.trim() !== '') {
      const lowercasedSearchText = debouncedSearch.toLowerCase();
      camerasToFilter = camerasToFilter.filter((camera) => camera.nome.toLowerCase().includes(lowercasedSearchText));
    }
    camerasToFilter.sort((a, b) => {
        const levelA = a.level || 1;
        const levelB = b.level || 1;
        if (levelA !== levelB) {
            return levelA - levelB; 
        }
        return a.nome.localeCompare(b.nome);
    });
    return camerasToFilter;
  }, [debouncedSearch, selectedCategory, allFetchedCameras]);

  const visibleCameras = useMemo(() => {
    if (listMode === 'pagination') {
      const startIndex = (page - 1) * ITEMS_PER_PAGE;
      const endIndex = startIndex + ITEMS_PER_PAGE;
      return filteredCameras.slice(startIndex, endIndex);
    }
    return filteredCameras.slice(0, page * ITEMS_PER_PAGE);
  }, [filteredCameras, page, listMode]);

  const dataForList: ListItem[] = useMemo(() => {
    if (!visibleCameras.length) {
        return [];
    }
    const list: ListItem[] = [...visibleCameras];
    const hasAdminCamerasInTotal = filteredCameras.some(cam => cam.level === 3);
    const hasPublicCamerasInTotal = filteredCameras.some(cam => cam.level !== 3);
    
    const firstAdminIndexOnPage = list.findIndex(item => (item as Camera).level === 3);
    if (firstAdminIndexOnPage !== -1) {
        const firstAdminInTotal = filteredCameras.find(cam => cam.level === 3);
        if ((list[firstAdminIndexOnPage] as Camera).codigo === firstAdminInTotal?.codigo) {
            list.splice(firstAdminIndexOnPage, 0, { type: 'header', title: 'Acesso Restrito' });
        }
    }
    const firstCameraOnPage = list.find(item => !('type' in item)) as Camera | undefined;
    if (hasAdminCamerasInTotal && hasPublicCamerasInTotal && firstCameraOnPage?.codigo === filteredCameras[0]?.codigo) {
        if (!('type' in list[0] && list[0].type === 'header')) {
            list.unshift({ type: 'header', title: 'Câmeras Públicas' });
        }
    }
    
    return list;
  }, [visibleCameras, filteredCameras]);


  const handleLoadMore = useCallback(() => {
    if (isLoadingMore || page * ITEMS_PER_PAGE >= filteredCameras.length) return;
    setIsLoadingMore(true);
    setTimeout(() => {
      setPage((prev) => prev + 1);
      setIsLoadingMore(false);
    }, 500);
  }, [isLoadingMore, page, filteredCameras.length]);

  const handleScrollToTop = useCallback(() => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, []);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    handleScrollToTop();
  };

  const handleLogout = () => signOut(auth);

  const handleCardPress = (camera: Camera) => {
    if (camera.status !== 'online') return;
    router.push({ pathname: `/[code]`, params: { code: camera.codigo } });
  };

  const toggleShowAllCategories = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowAllCategories((prev) => !prev);
  };

  const handleScroll = useCallback(
    (event: any) => {
      const offsetY = event.nativeEvent.contentOffset.y;
      setShowScrollToTopButton(offsetY > height);
    },
    [height]
  );

  const renderFooter = () => {
    const PaginationControls = () => {
      const totalPages = Math.ceil(filteredCameras.length / ITEMS_PER_PAGE);
      if (totalPages <= 1) return null;

      const range = (from: number, to: number) => {
        let i = from;
        const result = [];
        while (i <= to) {
          result.push(i);
          i++;
        }
        return result;
      };

      const getPageNumbers = () => {
        if (isTablet) {
          if (totalPages <= 7) return range(1, totalPages);
          const startPage = Math.max(2, page - 2);
          const endPage = Math.min(totalPages - 1, page + 2);
          let pages: (string | number)[] = range(startPage, endPage);
          if (startPage > 2) pages.unshift('...');
          if (endPage < totalPages - 1) pages.push('...');
          return [1, ...pages, totalPages];
        }
        if (totalPages <= 5) return range(1, totalPages);
        if (page <= 3) return [...range(1, 4), '...', totalPages];
        if (page >= totalPages - 2) return [1, '...', ...range(totalPages - 3, totalPages)];
        return [1, '...', page - 1, page, page + 1, '...', totalPages];
      };

      const pages = getPageNumbers();

      return (
        <View style={styles.paginationContainer}>
          <TouchableOpacity
            style={[styles.paginationNavButton, page === 1 && styles.paginationButtonDisabled]}
            disabled={page === 1}
            onPress={() => handlePageChange(page - 1)}
          >
            <Feather name="chevron-left" size={20} color={page === 1 ? colors.subtleText : colors.text} />
          </TouchableOpacity>

          <View style={styles.paginationPagesContainer}>
            {pages.map((pageNum, index) => {
              if (typeof pageNum === 'string') {
                return (
                  <View key={`ellipsis-${index}`} style={styles.paginationEllipsisContainer}>
                    <Text style={styles.paginationEllipsisText}>{pageNum}</Text>
                  </View>
                );
              }
              return (
                <TouchableOpacity
                  key={pageNum}
                  style={[styles.paginationButton, page === pageNum && styles.paginationButtonActive]}
                  onPress={() => handlePageChange(pageNum as number)}
                >
                  <Text style={[styles.paginationText, page === pageNum && styles.paginationTextActive]}>{pageNum}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            style={[styles.paginationNavButton, page === Math.ceil(filteredCameras.length / ITEMS_PER_PAGE) && styles.paginationButtonDisabled]}
            disabled={page === Math.ceil(filteredCameras.length / ITEMS_PER_PAGE)}
            onPress={() => handlePageChange(page + 1)}
          >
            <Feather
              name="chevron-right"
              size={20}
              color={page === Math.ceil(filteredCameras.length / ITEMS_PER_PAGE) ? colors.subtleText : colors.text}
            />
          </TouchableOpacity>
        </View>
      );
    };

    if (listMode === 'pagination') {
      return <PaginationControls />;
    }
    if (listMode === 'infinite' && isLoadingMore) {
      return <ActivityIndicator style={{ marginVertical: 20 }} size="large" color={colors.primary} />;
    }
    return null;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle={isDarkTheme ? 'light-content' : 'dark-content'} />
      <Stack.Screen options={{ headerShown: false }} />

      {!isLoading && <UpdateProgressBar progressAnim={progressAnim} styles={styles} />}

      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greetingText}>Bem-vindo,</Text>
            <Text style={styles.userName}>{user?.displayName || 'Utilizador'}</Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Ionicons name="log-out-outline" size={26} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Carregar câmeras...</Text>
          </View>
        ) : error ? (
          <View style={styles.center}>
            <Feather name="alert-circle" size={48} color={styles.errorText.color} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => fetchAllCameras()}>
              <Text style={styles.retryButtonText}>Tentar Novamente</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <FlatList
              ref={flatListRef}
              onScroll={handleScroll}
              scrollEventThrottle={16}
              data={dataForList}
              numColumns={isTablet ? 2 : 1}
              key={isTablet ? 'tablet' : 'phone'}
              keyExtractor={(item) => ('type' in item ? item.title : item.codigo)}
              renderItem={({ item }) => {
                if ('type' in item && item.type === 'header') {
                  return (
                    <View style={styles.sectionHeaderContainer}>
                      <Text style={styles.sectionHeaderText}>{item.title}</Text>
                    </View>
                  );
                }
                return (
                  <CameraCard
                    item={item as Camera}
                    onPress={() => handleCardPress(item as Camera)}
                    styles={styles}
                    updateTimestamp={updateTimestamp}
                  />
                );
              }}
              contentContainerStyle={styles.listContentContainer}
              ListHeaderComponent={
                <ListHeader
                  searchText={searchText}
                  setSearchText={setSearchText}
                  categories={categories}
                  selectedCategory={selectedCategory}
                  setSelectedCategory={setSelectedCategory}
                  lastUpdated={lastUpdated}
                  styles={styles}
                  isDarkTheme={isDarkTheme}
                  showAllCategories={showAllCategories}
                  toggleShowAllCategories={toggleShowAllCategories}
                />
              }
              ListEmptyComponent={() => (
                <View style={styles.emptyContainer}>
                  <Feather name="camera-off" size={48} color="#9ca3af" />
                  <Text style={styles.emptyText}>Nenhuma câmara encontrada.</Text>
                </View>
              )}
              keyboardShouldPersistTaps="handled"
              onEndReached={listMode === 'infinite' ? handleLoadMore : undefined}
              onEndReachedThreshold={0.5}
              ListFooterComponent={renderFooter()}
              initialNumToRender={10}
              windowSize={11}
            />

            {showScrollToTopButton && listMode === 'infinite' && (
              <TouchableOpacity style={styles.scrollToTopButton} onPress={handleScrollToTop} activeOpacity={0.7}>
                <Feather name="arrow-up" size={24} color={isDarkTheme ? colors.text : '#FFF'} />
              </TouchableOpacity>
            )}
          </>
        )}
      </View>
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
      progressBarContainer: {
        height: 3,
        width: '100%',
        backgroundColor: colors.border,
      },
      progressBar: {
        height: '100%',
        backgroundColor: colors.primary,
      },
      safeArea: { flex: 1, backgroundColor: colors.background },
      container: { flex: 1 },
      center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
      header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 20 },
      greetingText: { fontSize: 16, color: colors.subtleText },
      userName: { fontSize: 20, fontWeight: 'bold', color: colors.text },
      logoutButton: { padding: 8, borderRadius: 99, backgroundColor: isDarkTheme ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' },
      listHeader: { marginBottom: 16 },
      title: { fontSize: 32, fontWeight: 'bold', color: colors.text, marginTop: 16, paddingHorizontal: 20, letterSpacing: -0.5 },
      lastUpdatedText: { fontSize: 12, color: colors.subtleText, marginTop: 4, paddingHorizontal: 20 },
      listContentContainer: { paddingBottom: 12 },
      cardContainer: { flex: 1, paddingHorizontal: isTablet ? 8 : 16 },
      card: {
        backgroundColor: colors.card,
        borderRadius: 16,
        marginBottom: 24,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: isDarkTheme ? 0.3 : 0.08,
        shadowRadius: 12,
        elevation: 8,
        borderWidth: isDarkTheme ? 1 : 0,
        borderColor: colors.border,
      },
      imageWrapper: {
        width: '100%',
        aspectRatio: 16 / 9,
        backgroundColor: colors.border,
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: isTablet ? undefined : 160,
      },
      cameraImage: { width: '100%', height: '100%' },
      offlineOverlay: { justifyContent: 'center', alignItems: 'center' },
      offlineText: { marginTop: 8, color: colors.subtleText, fontWeight: '500' },
      infoContainer: { paddingHorizontal: 16, paddingVertical: 12 },
      cameraName: { fontSize: 17, fontWeight: '600', color: colors.text, marginBottom: 4 },
      cameraCategory: { fontSize: 13, color: colors.subtleText },
      statusBadge: {
        position: 'absolute',
        top: 12,
        right: 12,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 99,
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
      },
      statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
      statusDotOnline: { backgroundColor: colors.online },
      statusDotOffline: { backgroundColor: colors.offline },
      statusText: { fontSize: 12, fontWeight: 'bold', color: '#FFFFFF' },
      loadingText: { marginTop: 16, fontSize: 16, color: colors.subtleText },
      errorText: { textAlign: 'center', fontSize: 16, color: '#f87171', marginTop: 16, marginBottom: 24 },
      retryButton: { backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
      retryButtonText: { color: isDarkTheme ? '#111827' : '#f9fafb', fontWeight: '600' },
      emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50, paddingTop: 50 },
      emptyText: { fontSize: 16, color: colors.subtleText, marginTop: 16 },
      searchInput: {
        backgroundColor: colors.card,
        color: colors.text,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        marginHorizontal: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: colors.border,
      },
      categoriesContainer: { paddingHorizontal: 16, marginBottom: 4, flexDirection: 'row', flexWrap: 'wrap' },
      categoryButton: {
        backgroundColor: 'transparent',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 10,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: colors.border,
      },
      categoryButtonSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
      categoryText: { color: colors.subtleText, fontWeight: '500' },
      categoryTextSelected: { color: isDarkTheme ? colors.background : '#fff', fontWeight: 'bold' },
      showMoreButton: { paddingHorizontal: 16, paddingVertical: 4, alignSelf: 'flex-start', marginBottom: 8 },
      showMoreText: { color: colors.primary, fontWeight: 'bold' },
      sectionHeaderContainer: {
        paddingHorizontal: isTablet ? 24 : 20,
        paddingTop: 24,
        paddingBottom: 8,
        width: isTablet ? '100%' : undefined,
      },
      sectionHeaderText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.text,
        letterSpacing: -0.2,
      },
      scrollToTopButton: {
        position: 'absolute',
        bottom: 30,
        right: 20,
        backgroundColor: colors.primary,
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        zIndex: 10,
      },
      paginationContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: isTablet ? 24 : 16,
      },
      paginationPagesContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
      },
      paginationNavButton: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 22,
        backgroundColor: colors.card,
      },
      paginationButton: {
        minWidth: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 22,
        marginHorizontal: isTablet ? 4 : 2,
        paddingHorizontal: 8,
      },
      paginationButtonActive: {
        backgroundColor: colors.primary,
      },
      paginationButtonDisabled: {
        opacity: 0.5,
      },
      paginationText: {
        color: colors.subtleText,
        fontWeight: '700',
        fontSize: 16,
      },
      paginationTextActive: {
        color: isDarkTheme ? colors.background : '#FFF',
      },
      paginationEllipsisContainer: {
        minWidth: isTablet ? 44 : 24,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: isTablet ? 4 : 2,
      },
      paginationEllipsisText: {
        color: colors.subtleText,
        fontSize: 16,
        fontWeight: 'bold',
      },
    }),
  };
};
