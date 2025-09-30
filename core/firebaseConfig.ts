import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// @ts-ignore - Usando a sua inicialização de autenticação que é mais robusta para React Native
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from "@react-native-async-storage/async-storage";

// Usando a sua configuração que já contém as chaves corretas
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

// A sua inicialização de autenticação com persistência
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// Adicionando a inicialização do Firestore
const db = getFirestore(app);

// Exportando 'auth' e 'db' para serem usados em toda a aplicação
// Exportando 'auth' e 'db' para serem usados em toda a aplicação
export { auth, db, firebaseConfig };

