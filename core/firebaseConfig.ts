import { initializeApp, getApp, getApps } from "firebase/app";
// @ts-ignore - Ignorando o erro de tipo para permitir a compilação.
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
    apiKey: "AIzaSyCQgDMwDnVbjhWdw6MYP1K754TAAsdhsy0",
    authDomain: "camerasriobranco.firebaseapp.com",
    projectId: "camerasriobranco",
    storageBucket: "camerasriobranco.appspot.com",
    messagingSenderId: "84020805734",
    appId: "1:84020805734:web:9904063112bd0b649f2da7",
};

let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

export { auth };