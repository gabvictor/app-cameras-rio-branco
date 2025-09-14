import { initializeApp, getApp, getApps } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

// As suas credenciais do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyCQgDMwDnVbjhWdw6MYP1K754TAAsdhsy0",
    authDomain: "camerasriobranco.firebaseapp.com",
    projectId: "camerasriobranco",
    storageBucket: "camerasriobranco.appspot.com",
    messagingSenderId: "84020805734",
    appId: "1:84020805734:web:9904063112bd0b649f2da7",
};

// Inicializa o Firebase de forma segura
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

// Inicializa a autenticação com persistência, usando o AsyncStorage
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});