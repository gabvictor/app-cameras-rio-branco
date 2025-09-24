CamRB - Câmaras de Rio Branco 📸
Um aplicativo móvel de código aberto para visualização das câmaras públicas de Rio Branco, Acre. O projeto agrega os feeds de vídeo em tempo real e os enriquece com funcionalidades interativas, como um mapa e sistema de comentários.

<!-- Opcional: Adicione um GIF ou uma imagem do seu aplicativo aqui para um maior impacto visual. -->

<!-- <p align="center">
<img src="URL_DO_SEU_GIF_OU_IMAGEM_AQUI" alt="Demonstração do App" width="300"/>
</p> -->

✨ Funcionalidades
Visualização em Tempo Real: Acompanhe o feed das câmaras, com atualização automática das imagens.

Mapa Interativo: Navegue por um mapa da cidade com a localização de todas as câmaras online, agrupadas para uma melhor performance.

Sistema de Comentários: Converse com outros utilizadores em tempo real sobre os eventos de cada câmara (requer login).

Autenticação Segura: Crie uma conta ou faça login utilizando o Firebase Authentication, com verificação de e-mail e recuperação de senha.

Busca e Filtragem: Encontre câmaras específicas por nome ou filtre por categorias.

Modo de Lista Configurável: Escolha entre rolagem infinita ou paginação para carregar a lista de câmaras.

Aviso de Dados Móveis: Um pop-up alerta o utilizador sobre o alto consumo de internet ao usar dados móveis.

Design Moderno: Interface limpa, com suporte a tema claro/escuro e layout adaptável para telemóveis e tablets.

🛠️ Tecnologias Utilizadas
Este projeto foi construído utilizando as seguintes tecnologias:

Expo (React Native): Framework para o desenvolvimento de aplicativos móveis universais.

TypeScript: Superset do JavaScript que adiciona tipagem estática para um código mais robusto.

Firebase: Utilizado para Authentication (autenticação de utilizadores) e Firestore (banco de dados em tempo real para os comentários).

Expo Router: Sistema de navegação baseado em ficheiros.

React Native WebView: Para renderizar o mapa interativo.

Leaflet.js: Biblioteca de mapas utilizada dentro da WebView para exibir os marcadores.

🚀 Como Executar o Projeto
Para rodar este projeto localmente, siga os passos abaixo.

Pré-requisitos
Node.js (versão LTS recomendada)

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

Adicione um aplicativo da web (</>) ao seu projeto.

Copie as credenciais do Firebase (firebaseConfig).

Crie um ficheiro na pasta core chamado firebaseConfig.ts e cole as suas credenciais nele, como no exemplo abaixo:

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

Inicie o aplicativo:

npx expo start

Abra o aplicativo no seu emulador ou no seu telemóvel usando o Expo Go.

🤝 Como Contribuir
Contribuições são muito bem-vindas! Se tiver ideias para novas funcionalidades ou encontrar algum bug, sinta-se à vontade para abrir uma issue ou enviar um pull request.

Faça um fork do projeto.

Crie uma nova branch (git checkout -b feature/sua-feature).

Faça o commit das suas alterações (git commit -m 'Adiciona nova feature').

Faça o push para a sua branch (git push origin feature/sua-feature).

Abra um Pull Request.
