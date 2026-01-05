import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  useColorScheme,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { auth } from '../firebaseConfig';
import { getUserProfile, updateUserProfile } from '../services/userService';
import { useLanguage } from '../contexts/LanguageContext';

export default function EditProfileScreen({ navigation }) {
  const { t, language } = useLanguage();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Form fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        Alert.alert(t.error || 'Error', t.userNotConnected || 'User not connected');
        navigation.goBack();
        return;
      }

      const profile = await getUserProfile(userId);
      if (profile) {
        setFirstName(profile.firstName || '');
        setLastName(profile.lastName || '');
        if (profile.dateOfBirth) {
          setDateOfBirth(new Date(profile.dateOfBirth));
        }
      }
    } catch (error) {
      console.error('Erreur chargement profil:', error);
      Alert.alert(t.error || 'Error', t.loadProfileError || 'Unable to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDateOfBirth(selectedDate);
    }
  };

  const validateForm = () => {
    if (!firstName.trim()) {
      Alert.alert(t.error || 'Error', t.firstNameRequired || 'First name is required');
      return false;
    }
    if (!lastName.trim()) {
      Alert.alert(t.error || 'Error', t.lastNameRequired || 'Last name is required');
      return false;
    }

    const age = Math.floor((new Date() - dateOfBirth) / (365.25 * 24 * 60 * 60 * 1000));
    if (age < 13) {
      Alert.alert(t.error || 'Error', t.minimumAge || 'You must be at least 13 years old');
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    try {
      const userId = auth.currentUser?.uid;
      
      await updateUserProfile(userId, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        dateOfBirth: dateOfBirth.toISOString()
      });

      Alert.alert(
        t.success || 'Success',
        t.profileUpdated || 'Profile updated successfully',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      Alert.alert(t.error || 'Error', t.profileUpdateError || 'Unable to save changes');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: isDark ? '#000' : '#fff' }]}>
        <ActivityIndicator size="large" color={isDark ? '#fff' : '#000'} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#000' : '#f5f5f5' }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: isDark ? '#1a1a1a' : '#fff' }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={isDark ? '#fff' : '#000'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: isDark ? '#fff' : '#000' }]}>
          {t.editProfile || 'Modifier le profil'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Avatar avec initiales */}
        <View style={styles.avatarSection}>
          <View style={[styles.avatar, { backgroundColor: isDark ? '#333' : '#007AFF' }]}>
            <Text style={styles.avatarText}>
              {firstName[0] || 'U'}{lastName[0] || 'U'}
            </Text>
          </View>
          <Text style={[styles.avatarHint, { color: isDark ? '#999' : '#666' }]}>
            Avatar généré automatiquement
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Prénom */}
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Ionicons name="person-outline" size={20} color={isDark ? '#fff' : '#000'} />
              <Text style={[styles.label, { color: isDark ? '#fff' : '#000' }]}>
                {t.firstName || 'Prénom'}
              </Text>
            </View>
            <TextInput
              style={[styles.input, { 
                backgroundColor: isDark ? '#1a1a1a' : '#fff',
                color: isDark ? '#fff' : '#000',
                borderColor: isDark ? '#333' : '#e0e0e0'
              }]}
              value={firstName}
              onChangeText={setFirstName}
              placeholder={t.enterFirstName || 'Enter your first name'}
              placeholderTextColor={isDark ? '#666' : '#999'}
              autoCapitalize="words"
            />
          </View>

          {/* Nom */}
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Ionicons name="person-outline" size={20} color={isDark ? '#fff' : '#000'} />
              <Text style={[styles.label, { color: isDark ? '#fff' : '#000' }]}>
                {t.lastName || 'Nom'}
              </Text>
            </View>
            <TextInput
              style={[styles.input, { 
                backgroundColor: isDark ? '#1a1a1a' : '#fff',
                color: isDark ? '#fff' : '#000',
                borderColor: isDark ? '#333' : '#e0e0e0'
              }]}
              value={lastName}
              onChangeText={setLastName}
              placeholder={t.enterLastName || 'Enter your last name'}
              placeholderTextColor={isDark ? '#666' : '#999'}
              autoCapitalize="words"
            />
          </View>

          {/* Email (read-only) */}
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Ionicons name="mail-outline" size={20} color={isDark ? '#fff' : '#000'} />
              <Text style={[styles.label, { color: isDark ? '#fff' : '#000' }]}>
                {t.email || 'Email'}
              </Text>
            </View>
            <View style={[styles.input, styles.readOnlyInput, { 
              backgroundColor: isDark ? '#0a0a0a' : '#f5f5f5',
              borderColor: isDark ? '#333' : '#e0e0e0'
            }]}>
              <Text style={[styles.readOnlyText, { color: isDark ? '#999' : '#666' }]}>
                {auth.currentUser?.email}
              </Text>
              <Ionicons name="lock-closed" size={16} color={isDark ? '#666' : '#999'} />
            </View>
            <Text style={[styles.hint, { color: isDark ? '#666' : '#999' }]}>
              {t.emailCannotBeChanged || 'Email cannot be changed'}
            </Text>
          </View>

          {/* Date de naissance */}
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Ionicons name="calendar-outline" size={20} color={isDark ? '#fff' : '#000'} />
              <Text style={[styles.label, { color: isDark ? '#fff' : '#000' }]}>
                {t.dateOfBirth || 'Date de naissance'}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.dateButton, { 
                backgroundColor: isDark ? '#1a1a1a' : '#fff',
                borderColor: isDark ? '#333' : '#e0e0e0'
              }]}
              onPress={() => setShowDatePicker(true)}
            >
              <View style={styles.dateContent}>
                <View style={styles.dateLeft}>
                  <Ionicons name="gift-outline" size={24} color="#4caf50" />
                  <View style={styles.dateTextContainer}>
                    <Text style={[styles.dateValue, { color: isDark ? '#fff' : '#000' }]}>
                      {dateOfBirth.toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </Text>
                    <Text style={[styles.ageText, { color: isDark ? '#999' : '#666' }]}>
                      {Math.floor((new Date() - dateOfBirth) / (365.25 * 24 * 60 * 60 * 1000))} {t.yearsOld || 'years old'}
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={isDark ? '#666' : '#999'} />
              </View>
            </TouchableOpacity>
          </View>

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
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, { 
            backgroundColor: isDark ? '#fff' : '#000',
            opacity: saving ? 0.6 : 1
          }]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color={isDark ? '#000' : '#fff'} />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={24} color={isDark ? '#000' : '#fff'} />
              <Text style={[styles.saveButtonText, { color: isDark ? '#000' : '#fff' }]}>
                {t.save || 'Enregistrer'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
  },
  avatarHint: {
    fontSize: 12,
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
  input: {
    paddingHorizontal: 15,
    paddingVertical: 15,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
  },
  readOnlyInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  readOnlyText: {
    fontSize: 16,
  },
  hint: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  dateButton: {
    paddingHorizontal: 15,
    paddingVertical: 15,
    borderRadius: 12,
    borderWidth: 1,
  },
  dateContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  dateTextContainer: {
    flex: 1,
  },
  dateValue: {
    fontSize: 16,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  ageText: {
    fontSize: 13,
    marginTop: 2,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 30,
    gap: 10,
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});
