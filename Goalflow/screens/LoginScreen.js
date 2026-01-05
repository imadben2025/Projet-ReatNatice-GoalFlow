import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  useColorScheme
} from 'react-native';
import { signInWithEmailAndPassword, signInAnonymously } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { useLanguage } from '../contexts/LanguageContext';

export default function LoginScreen({ navigation }) {
  const { t } = useLanguage();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [anonymousLoading, setAnonymousLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert(t.error, t.fillAllFields);
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // La navigation sera gérée automatiquement par l'état d'authentification
    } catch (error) {
      let errorMessage = t.errorOccurred;
      
      switch (error.code) {
        case 'auth/invalid-email':
          errorMessage = t.invalidEmail;
          break;
        case 'auth/user-not-found':
          errorMessage = t.userNotFound;
          break;
        case 'auth/wrong-password':
          errorMessage = t.wrongPassword;
          break;
        case 'auth/invalid-credential':
          errorMessage = t.invalidCredentials;
          break;
      }
      
      Alert.alert(t.loginError, errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleAnonymousLogin = async () => {
    setAnonymousLoading(true);
    try {
      await signInAnonymously(auth);
      // La navigation sera gérée automatiquement par l'état d'authentification
    } catch (error) {
      Alert.alert(t.error, t.anonymousLoginError);
    } finally {
      setAnonymousLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: isDark ? '#000' : '#f5f5f5' }]}
    >
      <View style={styles.content}>
        <Text style={[styles.title, { color: isDark ? '#fff' : '#000' }]}>GoalFlow</Text>
        <Text style={[styles.subtitle, { color: isDark ? '#fff' : '#000' }]}>{t.loginTitle}</Text>

        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, { backgroundColor: isDark ? '#1a1a1a' : '#fff', color: isDark ? '#fff' : '#000', borderColor: isDark ? '#333' : '#ddd' }]}
            placeholder={t.email}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholderTextColor={isDark ? '#666' : '#999'}
          />

          <TextInput
            style={[styles.input, { backgroundColor: isDark ? '#1a1a1a' : '#fff', color: isDark ? '#fff' : '#000', borderColor: isDark ? '#333' : '#ddd' }]}
            placeholder={t.password}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholderTextColor={isDark ? '#666' : '#999'}
          />
        </View>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: isDark ? '#fff' : '#000' }, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={[styles.buttonText, { color: isDark ? '#000' : '#fff' }]}>
            {loading ? t.connecting : t.signIn}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.anonymousButton, { backgroundColor: isDark ? '#000' : '#fff', borderColor: isDark ? '#fff' : '#000' }, anonymousLoading && styles.buttonDisabled]}
          onPress={handleAnonymousLogin}
          disabled={anonymousLoading}
        >
          <Text style={[styles.anonymousButtonText, { color: isDark ? '#fff' : '#000' }]}>
            {anonymousLoading ? t.connecting : t.continueAsGuest}
          </Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: isDark ? '#999' : '#666' }]}>{t.noAccount} </Text>
          <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
            <Text style={[styles.link, { color: isDark ? '#fff' : '#000' }]}>{t.signup}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 40,
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    paddingHorizontal: 15,
    paddingVertical: 15,
    borderRadius: 10,
    fontSize: 16,
    marginBottom: 15,
    borderWidth: 1,
  },
  button: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  anonymousButton: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 15,
    borderWidth: 2,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  anonymousButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  footerText: {
    fontSize: 16,
  },
  link: {
    fontSize: 16,
    fontWeight: '600',
  },
});
