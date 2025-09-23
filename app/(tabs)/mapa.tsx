import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  useColorScheme,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  Animated,
  Easing,
} from "react-native";
import { WebView } from "react-native-webview";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

type Camera = {
  codigo: string;
  nome: string;
  status: "online" | "offline";
  categoria: string;
  coords: [number, number] | null;
  descricao: string;
};

export default function Mapa() {
  const router = useRouter();
  const isDarkTheme = useColorScheme() === "dark";
  const insets = useSafeAreaInsets();
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCamera, setSelectedCamera] = useState<Camera | null>(null);
  const [imgLoading, setImgLoading] = useState(true);
  const slideAnim = useRef(new Animated.Value(-350)).current;
  const webviewRef = useRef<WebView>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchCameras = async () => {
      try {
        const res = await fetch("https://camerasriobranco.site/status-cameras");
        const data: Camera[] = await res.json();

        if (!isMounted) return;

        const onlineCams = data.filter((cam) => cam.status === "online" && cam.coords);
        setCameras(onlineCams);

        if (selectedCamera && !onlineCams.find((c) => c.codigo === selectedCamera.codigo)) {
          closeCard();
        }

        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };

    fetchCameras();
    const interval = setInterval(fetchCameras, 20000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [selectedCamera]);

  const handleMarkerPress = (cam: Camera) => {
    setSelectedCamera(cam);
    setImgLoading(true);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  };

  const closeCard = () => {
    Animated.timing(slideAnim, {
      toValue: -350,
      duration: 200,
      easing: Easing.in(Easing.ease),
      useNativeDriver: true,
    }).start(() => setSelectedCamera(null));
  };

  const goToCameraDetail = (cam: Camera) => {
    router.push({ pathname: "/[code]", params: { code: cam.codigo } });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text style={{ marginTop: 10, color: isDarkTheme ? "#fff" : "#000" }}>
          Carregando câmeras...
        </Text>
      </SafeAreaView>
    );
  }

  const tileUrl = isDarkTheme
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

  const mapHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link rel="stylesheet" href="https://unpkg.com/leaflet/dist/leaflet.css"/>
      <link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster/dist/MarkerCluster.css"/>
      <link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster/dist/MarkerCluster.Default.css"/>
      <style>
        html, body, #map { height: 100%; margin: 0; padding: 0; }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script src="https://unpkg.com/leaflet/dist/leaflet.js"></script>
      <script src="https://unpkg.com/leaflet.markercluster/dist/leaflet.markercluster.js"></script>
      <script>
        const map = L.map('map').setView([-9.9745, -67.81], 13);
        L.tileLayer('${tileUrl}', { maxZoom: 19 }).addTo(map);

        const cameras = ${JSON.stringify(cameras)};
        const markers = L.markerClusterGroup();

        cameras.forEach(cam => {
          const marker = L.marker(cam.coords);
          marker.on('click', () => {
            window.ReactNativeWebView.postMessage(JSON.stringify(cam));
          });
          markers.addLayer(marker);
        });

        map.addLayer(markers);
      </script>
    </body>
    </html>
  `;

  return (
    <SafeAreaView style={styles.container}>
      <WebView
        ref={webviewRef}
        originWhitelist={["*"]}
        source={{ html: mapHTML }}
        style={{ flex: 1 }}
        onMessage={(event) => {
          const cam: Camera = JSON.parse(event.nativeEvent.data);
          handleMarkerPress(cam);
        }}
      />

      {selectedCamera && (
        <Animated.View
          style={[
            styles.topContainer,
            {
              backgroundColor: isDarkTheme ? "#1f2937" : "#fff",
              transform: [{ translateY: slideAnim }],
              top: insets.top,
            },
          ]}
        >
          <ScrollView>
            <Text style={[styles.cameraTitle, { color: isDarkTheme ? "#fff" : "#000" }]}>
              {selectedCamera.nome}
            </Text>

            {imgLoading && (
              <ActivityIndicator size="large" color="#4f46e5" style={{ marginVertical: 20 }} />
            )}

            <Image
              key={`camera-${selectedCamera.codigo}-${Date.now()}`}
              source={{
                uri: `https://cameras.riobranco.ac.gov.br/api/camera?code=${selectedCamera.codigo}&t=${Date.now()}`,
              }}
              style={styles.cameraImage}
              resizeMode="cover"
              onLoadEnd={() => setImgLoading(false)}
            />

            {selectedCamera.descricao && (
              <Text
                style={[
                  styles.cameraDescription,
                  { color: isDarkTheme ? "#d1d5db" : "#374151" },
                ]}
              >
                {selectedCamera.descricao}
              </Text>
            )}

            <TouchableOpacity
              onPress={() => goToCameraDetail(selectedCamera)}
              style={styles.detailButton}
            >
              <Text style={styles.detailButtonText}>Ver detalhes</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={closeCard} style={styles.closeButton}>
              <Text style={{ color: "#fff", fontWeight: "bold" }}>Fechar</Text>
            </TouchableOpacity>
          </ScrollView>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  topContainer: {
    position: "absolute",
    width: "100%",
    paddingVertical: 10,
    paddingHorizontal: 10,
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    zIndex: 10,
    maxHeight: "80%",
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },

  cameraTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
    textAlign: "center",
  },

  cameraImage: {
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: 10,
    marginBottom: 5,
  },

  cameraDescription: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 5,
    paddingHorizontal: 10,
  },

  detailButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginVertical: 5,
    backgroundColor: "#10b981",
    alignItems: "center",
    marginHorizontal: 10,
  },

  detailButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },

  closeButton: {
    backgroundColor: "#4f46e5",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: "center",
    marginHorizontal: 10,
  },
});
