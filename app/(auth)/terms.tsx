import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';

export default function TermsScreen() {
  const router = useRouter();
  const styles = getDynamicStyles();

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Cabeçalho Customizado */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Feather name="chevron-left" size={26} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Termos e Política de Privacidade</Text>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.updateDate}>
          Última atualização: Setembro de 2025
        </Text>

        <Text style={styles.paragraph}>
          Este aplicativo é um projeto independente. Ao criar uma conta e utilizar este serviço, você ("Usuário") concorda com os seguintes Termos e a nossa Política de Privacidade.
        </Text>

        <Text style={styles.sectionTitle}>1. Natureza do Serviço</Text>
        <Text style={styles.paragraph}>
          Este aplicativo funciona como um agregador, utilizando URLs de acesso público para exibir um fluxo de imagens atualizadas de câmaras de monitorização, simulando uma transmissão em direto. O desenvolvedor não possui, não opera, e não tem qualquer afiliação com as câmaras ou com as entidades responsáveis pela sua operação.
        </Text>

        <Text style={styles.sectionTitle}>2. Isenção de Responsabilidade</Text>
        <Text style={styles.paragraph}>
          O desenvolvedor não tem controlo sobre o conteúdo ou disponibilidade das transmissões. Portanto, não se responsabiliza por qualquer imagem ou evento visualizado. Este aplicativo não possui qualquer vínculo governamental ou com a Prefeitura de Rio Branco.
        </Text>

        <Text style={styles.sectionTitle}>3. Responsabilidade e Conduta do Usuário</Text>
        <Text style={styles.paragraph}>
          O Usuário assume total responsabilidade pelo uso das imagens e por todo o conteúdo que publicar na plataforma, como comentários. É estritamente proibido o uso das imagens para fins ilícitos, difamatórios, comerciais ou que violem a privacidade de terceiros.
        </Text>
        <Text style={styles.paragraph}>
          Ao utilizar a funcionalidade de comentários, o Usuário concorda em não publicar conteúdo que seja:
        </Text>
        <Text style={styles.listItem}>
          • Abusivo, odioso, assediante, ou que promova discurso de ódio;
        </Text>
        <Text style={styles.listItem}>
          • Spam, publicidade não solicitada ou correntes;
        </Text>
        <Text style={styles.listItem}>
          • Que contenha informações pessoais de terceiros sem consentimento;
        </Text>
        <Text style={styles.listItem}>
          • Ilegal, que promova atividades ilegais ou que infrinja direitos de autor.
        </Text>
        {/* SUGESTÃO 2 IMPLEMENTADA ABAIXO */}
        <Text style={styles.paragraph}>
          Para promover a responsabilidade e a segurança na plataforma, a visualização do conteúdo pode incluir uma marca d'água discreta com um identificador de sua conta. O Usuário concorda em não tentar remover, ocultar ou alterar esta marca d'água.
        </Text>

        <Text style={styles.sectionTitle}>4. Direito de Remoção de Conteúdo</Text>
        <Text style={styles.paragraph}>
          O desenvolvedor reserva-se o direito de remover qualquer comentário ou conteúdo gerado pelo usuário, sem aviso prévio, por qualquer motivo, incluindo, mas não se limitando a, violações destes termos.
        </Text>
        
        <Text style={styles.sectionTitle}>5. Restrição de Idade</Text>
        <Text style={styles.paragraph}>
          Para criar uma conta e utilizar este serviço, o Usuário deve ter pelo menos 18 anos de idade ou a idade de maioridade legal na sua jurisdição.
        </Text>

        <Text style={styles.sectionTitle}>6. Política de Privacidade</Text>
        <Text style={styles.paragraph}>
          Nós levamos a sua privacidade a sério. As informações que recolhemos são:
        </Text>
        <Text style={styles.listItem}>
          • <Text style={styles.boldText}>Nickname:</Text> Utilizado para personalizar a sua experiência no aplicativo.
        </Text>
        <Text style={styles.listItem}>
          • <Text style={styles.boldText}>E-mail e Palavra-passe:</Text> Utilizados exclusivamente para a criação e autenticação da sua conta. A sua palavra-passe é armazenada de forma encriptada.
        </Text>
        <Text style={styles.paragraph}>
          Todos os dados de autenticação são geridos de forma segura através do serviço Firebase Authentication da Google. Não partilhamos as suas informações pessoais com terceiros.
        </Text>
        <Text style={[styles.boldText, {fontSize: 16, marginBottom: 4}]}>Exclusão de Dados:</Text>
        <Text style={styles.paragraph}>
          O Usuário pode solicitar a exclusão de sua conta e dados associados a qualquer momento através da tela de perfil no aplicativo. A exclusão da conta removerá permanentemente os dados de autenticação (e-mail, nickname).
          {/* SUGESTÃO 3 IMPLEMENTADA ABAIXO */}
          Comentários feitos pelo usuário serão anonimizados ou excluídos.
        </Text>

        <Text style={styles.sectionTitle}>7. Segurança da Conta</Text>
        <Text style={styles.paragraph}>
          O Usuário é responsável por manter a confidencialidade da sua palavra-passe e por todas as atividades que ocorram na sua conta. O desenvolvedor não será responsável por qualquer perda ou dano resultante do incumprimento desta obrigação de segurança.
        </Text>

        <Text style={styles.sectionTitle}>8. Disponibilidade do Serviço</Text>
        <Text style={styles.paragraph}>
          O serviço é fornecido "como está". Não há garantias de que os URLs de acesso às câmaras estarão sempre funcionais.
        </Text>

        <Text style={styles.sectionTitle}>9. Propriedade Intelectual</Text>
        <Text style={styles.paragraph}>
          O software e o design deste aplicativo são propriedade do desenvolvedor. As imagens exibidas são propriedade dos seus respetivos operadores.
        </Text>

        <Text style={styles.sectionTitle}>10. Modificações nos Termos</Text>
        <Text style={styles.paragraph}>
          O desenvolvedor reserva-se o direito de modificar estes termos a qualquer momento. A continuação do uso do aplicativo após qualquer alteração constitui a sua aceitação dos novos termos.
        </Text>

        <Text style={styles.sectionTitle}>11. Rescisão de Acesso</Text>
        <Text style={styles.paragraph}>
          O acesso de qualquer Usuário poderá ser bloqueado ou rescindido, sem aviso prévio, em caso de violação destes termos.
        </Text>

        <Text style={styles.sectionTitle}>12. Lei Aplicável</Text>
        <Text style={styles.paragraph}>
          Estes termos serão regidos pelas leis da República Federativa do Brasil.
        </Text>

        <Text style={styles.sectionTitle}>13. Contato</Text>
        <Text style={styles.paragraph}>
          {/* TODO: Substituir pelo seu e-mail de contato real */}
          Dúvidas sobre estes Termos? Entre em contato: [seu-email-de-contato@exemplo.com].
        </Text>

        <TouchableOpacity style={styles.button} onPress={() => router.back()}>
          <Text style={styles.buttonText}>Entendi e Aceito</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// --- ESTILOS ---
const getDynamicStyles = () => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 16,
  },
  container: {
    padding: 24,
    paddingBottom: 48,
  },
  updateDate: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 20,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingBottom: 4,
  },
  paragraph: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
    marginBottom: 8,
  },
  listItem: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
    marginBottom: 4,
    marginLeft: 16,
  },
  boldText: {
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#1D4ED8',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
});