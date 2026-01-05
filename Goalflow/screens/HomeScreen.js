import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useColorScheme } from 'react-native';
import { signOut } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { useLanguage } from '../contexts/LanguageContext';

export default function HomeScreen() {
  const { t } = useLanguage();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#000' : '#f5f5f5' }]}>
      <Text style={[styles.title, { color: isDark ? '#fff' : '#000' }]}>{t.welcome}</Text>
      {auth.currentUser?.isAnonymous ? (
        <Text style={[styles.email, { color: isDark ? '#999' : '#666' }]}>{t.connectedAsGuest}</Text>
      ) : (
        <Text style={[styles.email, { color: isDark ? '#999' : '#666' }]}>{auth.currentUser?.email}</Text>
      )}
      
      <TouchableOpacity style={[styles.button, { backgroundColor: isDark ? '#fff' : '#000' }]} onPress={handleSignOut}>
        <Text style={[styles.buttonText, { color: isDark ? '#000' : '#fff' }]}>{t.disconnect}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  email: {
    fontSize: 16,
    marginBottom: 40,
  },
  button: {
    padding: 15,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});
