<div align="center">

CamRB - Câmaras de Rio Branco 📸
Um visualizador de código aberto para as câmaras públicas de Rio Branco, Acre.

</div>

<p align="center">
<img alt="Versão" src="https://www.google.com/search?q=https://img.shields.io/badge/version-1.0.0-blue%3Fstyle%3Dfor-the-badge%26logo%3Dnone">
<img alt="Licença" src="https://www.google.com/search?q=https://img.shields.io/badge/license-MIT-green%3Fstyle%3Dfor-the-badge%26logo%3Dnone">
<img alt="Expo" src="https://www.google.com/search?q=https://img.shields.io/badge/Expo-51-black%3Fstyle%3Dfor-the-badge%26logo%3Dexpo">
<img alt="Firebase" src="https://www.google.com/search?q=https://img.shields.io/badge/Firebase-FFCA28%3Fstyle%3Dfor-the-badge%26logo%3Dfirebase%26logoColor%3Dblack">
</p>

<!-- Opcional: Adicione um GIF ou uma imagem do seu aplicativo aqui para um maior impacto visual. -->

<!--
<p align="center">
<img src="URL_DO_SEU_GIF_OU_IMAGEM_AQUI" alt="Demonstração do App" width="300"/>
</p>
-->

<p align="center">
<a href="#-funcionalidades">Funcionalidades</a> •
<a href="#-tecnologias-utilizadas">Tecnologias</a> •
<a href="#-como-executar-o-projeto">Como Executar</a> •
<a href="#-como-contribuir">Contribuir</a>
</p>

✨ Funcionalidades
📺 Visualização em Tempo Real: Acompanhe o feed das câmaras, com atualização automática das imagens.

🗺️ Mapa Interativo: Navegue por um mapa da cidade com a localização de todas as câmaras online, agrupadas para uma melhor performance.

💬 Sistema de Comentários: Converse com outros utilizadores em tempo real sobre os eventos de cada câmara (requer login).

🔐 Autenticação Segura: Crie uma conta ou faça login utilizando o Firebase Authentication, com verificação de e-mail e recuperação de senha.

🔍 Busca e Filtragem: Encontre câmaras específicas por nome ou filtre por categorias.

⚙️ Modo de Lista Configurável: Escolha entre rolagem infinita ou paginação para carregar a lista de câmaras.

📱 Aviso de Dados Móveis: Um pop-up alerta o utilizador sobre o alto consumo de internet ao usar dados móveis.

🎨 Design Moderno: Interface limpa, com suporte a tema claro/escuro e layout adaptável para telemóveis e tablets.

🛠️ Tecnologias Utilizadas
Este projeto foi construído utilizando as seguintes tecnologias:

Tecnologia

Descrição

Expo (SDK 51)

Framework para o desenvolvimento de aplicações móveis universais com React Native.

React Native

Biblioteca para criar interfaces de utilizador nativas.

TypeScript

Superset do JavaScript que adiciona tipagem estática para um código mais robusto.

Firebase

Utilizado para Authentication (autenticação) e Firestore (base de dados).

Expo Router

Sistema de navegação baseado em ficheiros.

React Native WebView

Componente para renderizar o mapa interativo.

Leaflet.js

Biblioteca de mapas utilizada dentro da WebView para exibir os marcadores.

🚀 Como Executar o Projeto
Para rodar este projeto localmente, siga os passos abaixo.

Pré-requisitos
Node.js (versão LTS)

Git

Conta no Firebase

Passos
Clone o repositório:

git clone [https://github.com/gabvictor/app-cameras-rio-branco.git](https://github.com/gabvictor/app-cameras-rio-branco.git)
cd app-cameras-rio-branco

Instale as dependências:

npm install

Configure o Firebase:

Crie um projeto no console do Firebase.

Adicione uma aplicação da web (</>) ao seu projeto.

Ative os serviços de Authentication (com o provedor de E-mail/Senha) e Firestore.

Crie um ficheiro na pasta core chamado firebaseConfig.ts e cole as suas credenciais nele.

<details>
<summary>Clique para ver o exemplo do ficheiro <code>core/firebaseConfig.ts</code></summary>

// core/firebaseConfig.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Cole as suas credenciais do Firebase aqui
const firebaseConfig = {
  apiKey: "SUA_API_KEY",
  authDomain: "SEU_AUTH_DOMAIN",
  projectId: "SEU_PROJECT_ID",
  storageBucket: "SEU_STORAGE_BUCKET",
  messagingSenderId: "SEU_MESSAGING_SENDER_ID",
  appId: "SEU_APP_ID"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

</details>

Inicie a aplicação:

npx expo start
