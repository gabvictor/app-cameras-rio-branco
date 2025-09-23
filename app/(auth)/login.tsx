import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StyleSheet,
  useColorScheme,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  sendEmailVerification,
} from 'firebase/auth';
import { auth } from '../../core/firebaseConfig';
import { getFirebaseErrorMessage } from '../../core/firebaseErrors';

interface AuthInputProps {
  iconName: React.ComponentProps<typeof Feather>['name'];
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  isDarkTheme: boolean;
  keyboardType?: 'default' | 'email-address';
}

const AuthInput = ({
  iconName,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  isDarkTheme,
  keyboardType = 'default',
}: AuthInputProps) => {
  const styles = getDynamicStyles(isDarkTheme);
  return (
    <View style={styles.inputContainer}>
      <Feather name={iconName} size={20} style={styles.inputIcon} />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#94a3b8"
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        autoCapitalize="none"
        keyboardType={keyboardType}
      />
    </View>
  );
};

export default function LoginScreen() {
  const [form, setForm] = useState<'login' | 'register' | 'reset' | 'verification'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDarkTheme = colorScheme === 'dark';
  const styles = getDynamicStyles(isDarkTheme);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);


  const validateEmail = (emailToValidate: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailToValidate);

  const handleLogin = () => {
    if (!email || !password) {
      setError('Por favor, preencha e-mail e senha.');
      return;
    }
    if (!validateEmail(email)) {
      setError('Por favor, insira um formato de e-mail válido.');
      return;
    }

    setLoading(true);
    setError('');

    signInWithEmailAndPassword(auth, email, password)
      .then(userCredential => {
        const user = userCredential.user;

        if (!user.emailVerified) {
          setForm('verification');
          return;
        }
        
        router.replace('/');
      })
      .catch(err => setError(getFirebaseErrorMessage(err.code)))
      .finally(() => setLoading(false));
  };

  const handleRegister = () => {
    if (!nickname || !termsAccepted || password !== passwordConfirm || password.length < 6 || !validateEmail(email)) {
        if (!nickname) setError('Por favor, insira um nickname.');
        else if (!termsAccepted) setError('Você precisa aceitar os Termos de Responsabilidade.');
        else if (password !== passwordConfirm) setError('As senhas não coincidem.');
        else if (password.length < 6) setError('A senha deve ter no mínimo 6 caracteres.');
        else if (!validateEmail(email)) setError('Por favor, insira um formato de e-mail válido.');
        return;
    }

    setLoading(true);
    setError('');

    createUserWithEmailAndPassword(auth, email, password)
      .then(userCredential => {
        updateProfile(userCredential.user, { displayName: nickname });
        sendEmailVerification(userCredential.user);
        
        clearForm();
        setForm('verification');
      })
      .catch(err => setError(getFirebaseErrorMessage(err.code)))
      .finally(() => setLoading(false));
  };

  const handlePasswordReset = () => {
    if (!email) {
      setError('Por favor, informe seu e-mail.');
      return;
    }
    if (!validateEmail(email)) {
      setError('Por favor, insira um formato de e-mail válido.');
      return;
    }
    setLoading(true);
    setError('');
    sendPasswordResetEmail(auth, email)
      .then(() => {
        Alert.alert('Link Enviado', 'Verifique sua caixa de entrada para redefinir sua senha.');
        setForm('login');
      })
      .catch(() => setError('Não foi possível encontrar um usuário com este e-mail.'))
      .finally(() => setLoading(false));
  };

  const handleCheckVerification = async () => {
    const currentUser = auth.currentUser;
    if (currentUser) {
        setLoading(true);
        setError('');
        await currentUser.reload();
        if (auth.currentUser?.emailVerified) {
            router.replace('/');
        } else {
            setError('E-mail ainda não verificado. Por favor, verifique sua caixa de entrada (e spam).');
            setLoading(false);
        }
    }
  };

  const handleResendEmail = async () => {
    const currentUser = auth.currentUser;
    if(currentUser){
        setLoading(true);
        setError('');
        try {
            await sendEmailVerification(currentUser);
            setResendCooldown(60); 
            Alert.alert("Enviado!", "Um novo link de verificação foi enviado para o seu e-mail.");
        } catch (err: any) {
            setError(getFirebaseErrorMessage(err.code));
        } finally {
            setLoading(false);
        }
    }
  }

  const clearForm = () => {
    setPassword('');
    setPasswordConfirm('');
    setNickname('');
    setError('');
    setTermsAccepted(false);
  };

  const switchForm = (newForm: 'login' | 'register' | 'reset' | 'verification') => {
    clearForm();
    setForm(newForm);
  };

  const handleTermsPress = () => router.push('/terms');

  const renderForm = () => {
    const titles = {
      login: { title: 'Bem-vindo(a)', subtitle: 'Faça login para acessar o sistema.' },
      register: { title: 'Crie sua Conta', subtitle: 'É rápido, preencha os campos abaixo.' },
      reset: { title: 'Redefinir Senha', subtitle: 'Digite seu e-mail para receber o link.' },
      verification: {
        title: 'Verifique seu E-mail',
        subtitle: `Enviamos um link para ${email}. Clique nele para ativar sua conta.`,
      },
    };

    const { title, subtitle } = titles[form];

    if (form === 'verification') {
        return (
            <View style={styles.formContainer}>
                <View style={styles.header}>
                    <View style={styles.iconBackground}>
                        <Feather name="mail" size={32} style={styles.headerIcon} />
                    </View>
                    <Text style={styles.title}>{title}</Text>
                    <Text style={styles.subtitle}>{subtitle}</Text>
                </View>

                {error ? <Text style={styles.errorText}>{error}</Text> : <View style={{ minHeight: 20, marginTop: 16 }} />}

                <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleCheckVerification} disabled={loading}>
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Já verifiquei, quero entrar</Text>}
                </TouchableOpacity>

                <View style={styles.footer}>
                    <TouchableOpacity 
                        onPress={handleResendEmail} 
                        style={styles.footerLinkContainer} 
                        disabled={loading || resendCooldown > 0}
                    >
                        <Text style={[styles.footerText, resendCooldown > 0 && styles.disabledText]}>Não recebeu? </Text>
                        <Text style={[styles.linkText, resendCooldown > 0 && styles.disabledText]}>
                            {resendCooldown > 0 ? `Aguarde ${resendCooldown}s` : 'Reenviar e-mail'}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => switchForm('login')} style={[styles.footerLinkContainer, { marginTop: 12 }]} disabled={loading}>
                         <Text style={styles.linkText}>Voltar para o Login</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }
    
    return (
      <View style={styles.formContainer}>
        <View style={styles.header}>
          <View style={styles.iconBackground}>
            <Feather name="camera" size={32} style={styles.headerIcon} />
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>

        {form === 'login' && (
          <>
            <AuthInput isDarkTheme={isDarkTheme} iconName="mail" placeholder="Seu e-mail" value={email} onChangeText={setEmail} keyboardType="email-address" />
            <View style={{ height: 16 }} />
            <AuthInput isDarkTheme={isDarkTheme} iconName="lock" placeholder="Sua senha" value={password} onChangeText={setPassword} secureTextEntry />
            <View style={styles.forgotPasswordContainer}>
              <TouchableOpacity onPress={() => switchForm('reset')}>
                <Text style={styles.linkText}>Esqueceu a senha?</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {form === 'register' && (
          <>
            <AuthInput isDarkTheme={isDarkTheme} iconName="user" placeholder="Escolha um nickname" value={nickname} onChangeText={setNickname} />
            <View style={{ height: 16 }} />
            <AuthInput isDarkTheme={isDarkTheme} iconName="mail" placeholder="Seu melhor e-mail" value={email} onChangeText={setEmail} keyboardType="email-address" />
            <View style={{ height: 16 }} />
            <AuthInput isDarkTheme={isDarkTheme} iconName="lock" placeholder="Crie uma senha" value={password} onChangeText={setPassword} secureTextEntry />
            <View style={{ height: 16 }} />
            <AuthInput isDarkTheme={isDarkTheme} iconName="lock" placeholder="Confirme a senha" value={passwordConfirm} onChangeText={setPasswordConfirm} secureTextEntry />

            <TouchableOpacity style={styles.checkboxContainer} onPress={() => setTermsAccepted(!termsAccepted)} activeOpacity={0.7}>
              <View style={[styles.checkbox, termsAccepted && styles.checkboxChecked]}>
                {termsAccepted && <Feather name="check" size={14} color="#fff" />}
              </View>
              <Text style={styles.checkboxLabel}>
                Eu li e aceito os{' '}
                <Text style={styles.linkText} onPress={handleTermsPress}>
                  Termos de Responsabilidade
                </Text>
              </Text>
            </TouchableOpacity>
          </>
        )}

        {form === 'reset' && (
          <AuthInput isDarkTheme={isDarkTheme} iconName="mail" placeholder="Seu e-mail de cadastro" value={email} onChangeText={setEmail} keyboardType="email-address" />
        )}

        {error ? <Text style={styles.errorText}>{error}</Text> : <View style={{ minHeight: 20, marginTop: 16 }} />}

        <TouchableOpacity
          style={[styles.button, (form === 'register' ? (loading || !termsAccepted) : loading) && styles.buttonDisabled]}
          onPress={form === 'login' ? handleLogin : form === 'register' ? handleRegister : handlePasswordReset}
          disabled={form === 'register' ? (loading || !termsAccepted) : loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{form === 'login' ? 'Entrar' : form === 'register' ? 'Criar Conta' : 'Enviar Link'}</Text>}
        </TouchableOpacity>

        <View style={styles.footer}>
          {form === 'login' && (
            <TouchableOpacity onPress={() => switchForm('register')} style={styles.footerLinkContainer}>
              <Text style={styles.footerText}>Ainda não tem uma conta? </Text>
              <Text style={styles.linkText}>Crie uma agora</Text>
            </TouchableOpacity>
          )}
          {form === 'register' && (
            <TouchableOpacity onPress={() => switchForm('login')} style={styles.footerLinkContainer}>
              <Text style={styles.footerText}>Já tem uma conta? </Text>
              <Text style={styles.linkText}>Faça login</Text>
            </TouchableOpacity>
          )}
          {form === 'reset' && (
            <TouchableOpacity onPress={() => switchForm('login')} style={styles.footerLinkContainer}>
              <Text style={styles.footerText}>Lembrou da senha? </Text>
              <Text style={styles.linkText}>Voltar para o login</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <StatusBar barStyle={isDarkTheme ? 'light-content' : 'dark-content'} />
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          {renderForm()}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const getDynamicStyles = (isDarkTheme: boolean) =>
  StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: isDarkTheme ? '#111827' : '#f1f5f9' },
    container: {
      flexGrow: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
    },
    formContainer: {
      width: '100%',
      maxWidth: 448,
      backgroundColor: isDarkTheme ? '#1e2b3b' : '#ffffff',
      borderRadius: 12,
      padding: 32,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    header: { alignItems: 'center', marginBottom: 32 },
    iconBackground: {
      backgroundColor: isDarkTheme ? '#475569' : '#e0e7ff',
      padding: 12,
      borderRadius: 999,
      marginBottom: 16,
    },
    headerIcon: { color: isDarkTheme ? '#94a3b8' : '#4f46e5' },
    title: { fontSize: 30, fontWeight: 'bold', color: isDarkTheme ? '#f8fafc' : '#1e293b' },
    subtitle: { color: isDarkTheme ? '#94a3b8' : '#64748b', marginTop: 8, textAlign: 'center', lineHeight: 22, },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDarkTheme ? '#475569' : '#f8fafc',
      borderWidth: 1,
      borderColor: isDarkTheme ? '#64748b' : '#e2e8f0',
      borderRadius: 8,
      width: '100%',
    },
    inputIcon: { color: '#94a3b8', paddingLeft: 14 },
    input: {
      flex: 1,
      paddingLeft: 12,
      paddingRight: 16,
      paddingVertical: 14,
      fontSize: 16,
      color: isDarkTheme ? '#f8fafc' : '#1e293b',
    },
    forgotPasswordContainer: { alignItems: 'flex-end', marginTop: 8 },
    linkText: {
      fontSize: 14,
      fontWeight: '600',
      color: isDarkTheme ? '#7dd3fc' : '#2563eb',
      textDecorationLine: 'underline',
    },
    errorText: {
      color: '#ef4444',
      fontSize: 14,
      textAlign: 'center',
      minHeight: 20,
      marginTop: 16,
    },
    button: {
      width: '100%',
      marginTop: 24,
      backgroundColor: '#4f46e5',
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    buttonDisabled: { opacity: 0.5 },
    buttonText: { color: '#ffffff', fontWeight: '600', fontSize: 16 },
    footer: {
      textAlign: 'center',
      marginTop: 24,
      paddingTop: 24,
      borderTopWidth: 1,
      borderTopColor: isDarkTheme ? '#475569' : '#e2e8f0',
    },
    footerLinkContainer: { flexDirection: 'row', justifyContent: 'center' },
    footerText: { fontSize: 14, color: isDarkTheme ? '#94a3b8' : '#64748b' },
    checkboxContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 20 },
    checkbox: {
      width: 20,
      height: 20,
      borderRadius: 4,
      borderWidth: 2,
      borderColor: isDarkTheme ? '#64748b' : '#e2e8f0',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    checkboxChecked: { backgroundColor: '#4f46e5', borderColor: '#4f46e5' },
    checkboxLabel: { flex: 1, fontSize: 14, color: isDarkTheme ? '#cbd5e1' : '#475569' },
    disabledText: {
        color: isDarkTheme ? '#6b7280' : '#9ca3af',
        textDecorationLine: 'none',
    },
  });