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
  ScrollView,
  useColorScheme
} from 'react-native';
import { createUserWithEmailAndPassword, signInAnonymously } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { useLanguage } from '../contexts/LanguageContext';
import { createUserProfile } from '../services/userService';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function SignUpScreen({ navigation }) {
  const { t } = useLanguage();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // Loading states
  const [loading, setLoading] = useState(false);
  const [anonymousLoading, setAnonymousLoading] = useState(false);

  /**
   * Handle date selection
   */
  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDateOfBirth(selectedDate);
    }
  };

  /**
   * Validate form inputs
   */
  const validateForm = () => {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert(t.error || 'Erreur', 'Veuillez entrer votre prénom et nom');
      return false;
    }

    if (!email || !password || !confirmPassword) {
      Alert.alert(t.error || 'Erreur', t.fillAllFields || 'Veuillez remplir tous les champs');
      return false;
    }

    if (password !== confirmPassword) {
      Alert.alert(t.error || 'Erreur', t.passwordsDontMatch || 'Les mots de passe ne correspondent pas');
      return false;
    }

    if (password.length < 6) {
      Alert.alert(t.error || 'Erreur', t.passwordTooShort || 'Le mot de passe doit contenir au moins 6 caractères');
      return false;
    }

    // Check age (must be at least 13 years old)
    const age = Math.floor((new Date() - dateOfBirth) / (365.25 * 24 * 60 * 60 * 1000));
    if (age < 13) {
      Alert.alert(t.error || 'Erreur', 'Vous devez avoir au moins 13 ans pour vous inscrire');
      return false;
    }

    return true;
  };

  const handleSignUp = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      // Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const userId = userCredential.user.uid;

      // Create user profile in Firestore (sans photo)
      await createUserProfile(userId, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        dateOfBirth: dateOfBirth.toISOString(),
        email: email.toLowerCase()
      });

      Alert.alert(
        t.success || 'Succès', 
        t.accountCreatedSuccess || 'Votre compte a été créé avec succès !'
      );
      // Navigation will be handled automatically by auth state
    } catch (error) {
      let errorMessage = t.errorOccurred || 'An error occurred';
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = t.emailAlreadyInUse || 'This email is already in use';
          break;
        case 'auth/invalid-email':
          errorMessage = t.invalidEmail || 'Invalid email address';
          break;
        case 'auth/weak-password':
          errorMessage = t.weakPassword || 'Password is too weak';
          break;
        default:
          console.error('Registration error:', error);
      }
      
      Alert.alert(t.signupError || 'Sign Up Error', errorMessage);
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
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text style={[styles.title, { color: isDark ? '#fff' : '#000' }]}>GoalFlow</Text>
          <Text style={[styles.subtitle, { color: isDark ? '#fff' : '#000' }]}>{t.createAccountTitle || 'Créer un compte'}</Text>

          <View style={styles.inputContainer}>
            {/* First Name */}
            <TextInput
              style={[styles.input, { backgroundColor: isDark ? '#1a1a1a' : '#fff', color: isDark ? '#fff' : '#000', borderColor: isDark ? '#333' : '#ddd' }]}
              placeholder={t.firstName || 'First Name'}
              value={firstName}
              onChangeText={setFirstName}
              autoCapitalize="words"
              placeholderTextColor={isDark ? '#666' : '#999'}
            />

            {/* Last Name */}
            <TextInput
              style={[styles.input, { backgroundColor: isDark ? '#1a1a1a' : '#fff', color: isDark ? '#fff' : '#000', borderColor: isDark ? '#333' : '#ddd' }]}
              placeholder={t.lastName || 'Last Name'}
              value={lastName}
              onChangeText={setLastName}
              autoCapitalize="words"
              placeholderTextColor={isDark ? '#666' : '#999'}
            />

            {/* Date of Birth */}
            <TouchableOpacity
              style={[styles.input, styles.dateInput, { backgroundColor: isDark ? '#1a1a1a' : '#fff', borderColor: isDark ? '#333' : '#ddd' }]}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={{ color: isDark ? '#fff' : '#000' }}>
                {t.dateOfBirth || 'Date of Birth'}: {dateOfBirth.toLocaleDateString()}
              </Text>
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={dateOfBirth}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleDateChange}
                maximumDate={new Date()}
                minimumDate={new Date(1900, 0, 1)}
              />
            )}

            {/* Email */}
            <TextInput
              style={[styles.input, { backgroundColor: isDark ? '#1a1a1a' : '#fff', color: isDark ? '#fff' : '#000', borderColor: isDark ? '#333' : '#ddd' }]}
              placeholder={t.email || 'Email'}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholderTextColor={isDark ? '#666' : '#999'}
            />

            {/* Password */}
            <TextInput
              style={[styles.input, { backgroundColor: isDark ? '#1a1a1a' : '#fff', color: isDark ? '#fff' : '#000', borderColor: isDark ? '#333' : '#ddd' }]}
              placeholder={t.password || 'Password'}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholderTextColor={isDark ? '#666' : '#999'}
            />

            {/* Confirm Password */}
            <TextInput
              style={[styles.input, { backgroundColor: isDark ? '#1a1a1a' : '#fff', color: isDark ? '#fff' : '#000', borderColor: isDark ? '#333' : '#ddd' }]}
              placeholder={t.confirmPassword || 'Confirm Password'}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              placeholderTextColor={isDark ? '#666' : '#999'}
            />
          </View>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: isDark ? '#fff' : '#000' }, loading && styles.buttonDisabled]}
            onPress={handleSignUp}
            disabled={loading}
          >
            <Text style={[styles.buttonText, { color: isDark ? '#000' : '#fff' }]}>
              {loading ? (t.creating || 'Creating...') : (t.signup || 'Sign Up')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.anonymousButton, { backgroundColor: isDark ? '#000' : '#fff', borderColor: isDark ? '#fff' : '#000' }, anonymousLoading && styles.buttonDisabled]}
            onPress={handleAnonymousLogin}
            disabled={anonymousLoading}
          >
            <Text style={[styles.anonymousButtonText, { color: isDark ? '#fff' : '#000' }]}>
              {anonymousLoading ? (t.connecting || 'Connecting...') : (t.continueAsGuest || 'Continue as Guest')}
            </Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: isDark ? '#999' : '#666' }]}>{t.alreadyHaveAccount || 'Already have an account?'} </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={[styles.link, { color: isDark ? '#fff' : '#000' }]}>{t.signIn || 'Sign In'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
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
    marginBottom: 20,
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
  dateInput: {
    justifyContent: 'center',
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
