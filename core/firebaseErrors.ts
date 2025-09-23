export const getFirebaseErrorMessage = (errorCode: string) => {
  switch (errorCode) {
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'E-mail ou senha inválidos.';
    case 'auth/email-already-in-use':
      return 'Este e-mail já está em uso por outra conta.';
    case 'auth/weak-password':
      return 'A senha é muito fraca. Tente uma mais forte.';
    case 'auth/invalid-email':
      return 'O formato do e-mail é inválido.';
    case 'auth/too-many-requests':
      return 'Muitas tentativas de reenvio. Por favor, aguarde um pouco antes de tentar novamente.';
    default:
      return 'Ocorreu um erro inesperado. Tente novamente.';
  }
};