import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  useColorScheme
} from 'react-native';
import { auth } from '../firebaseConfig';
import {
  getUserProfile,
  updateUserProfile,
  uploadProfilePicture,
  deleteProfilePicture
} from '../services/userService';
import * as ImagePicker from 'expo-image-picker';
import { useLanguage } from '../contexts/LanguageContext';

/**
 * ProfileEditScreen - Screen for viewing and editing user profile
 * 
 * Features:
 * - Display current profile information
 * - Edit first name and last name
 * - Change profile picture
 * - Remove profile picture
 * - Save changes to Firestore
 */
export default function ProfileEditScreen({ navigation }) {
  const { t } = useLanguage();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // State management
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const [imageChanged, setImageChanged] = useState(false);

  /**
   * Load user profile on component mount
   */
  useEffect(() => {
    loadProfile();
  }, []);

  /**
   * Fetch user profile from Firestore
   */
  const loadProfile = async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        Alert.alert(t.error || 'Error', 'Not authenticated');
        navigation.goBack();
        return;
      }

      const userData = await getUserProfile(userId);
      if (userData) {
        setProfile(userData);
        setFirstName(userData.firstName || '');
        setLastName(userData.lastName || '');
        setProfileImage(userData.photoURL || null);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert(t.error || 'Error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Pick a new profile image from gallery
   */
  const handleImagePick = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(t.error || 'Error', 'Permission to access gallery is required');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]) {
        setProfileImage(result.assets[0].uri);
        setImageChanged(true);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert(t.error || 'Error', 'Failed to pick image');
    }
  };

  /**
   * Remove profile picture
   */
  const handleRemoveImage = () => {
    Alert.alert(
      t.confirm || 'Confirm',
      'Are you sure you want to remove your profile picture?',
      [
        { text: t.cancel || 'Cancel', style: 'cancel' },
        {
          text: t.remove || 'Remove',
          style: 'destructive',
          onPress: () => {
            setProfileImage(null);
            setImageChanged(true);
          }
        }
      ]
    );
  };

  /**
   * Save profile changes
   */
  const handleSave = async () => {
    // Validation
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert(t.error || 'Error', 'First name and last name are required');
      return;
    }

    setSaving(true);
    try {
      const userId = auth.currentUser.uid;
      let photoURL = profile?.photoURL;

      // Handle profile picture changes
      if (imageChanged) {
        if (profileImage && !profileImage.startsWith('http')) {
          // New image selected - upload it
          photoURL = await uploadProfilePicture(userId, profileImage);
        } else if (!profileImage && profile?.photoURL) {
          // Image removed - delete from storage
          await deleteProfilePicture(userId);
          photoURL = null;
        }
      }

      // Update profile in Firestore
      await updateUserProfile(userId, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        photoURL
      });

      Alert.alert(
        t.success || 'Success',
        'Profile updated successfully',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      );
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert(t.error || 'Error', 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  /**
   * Check if changes were made
   */
  const hasChanges = () => {
    return (
      firstName !== profile?.firstName ||
      lastName !== profile?.lastName ||
      imageChanged
    );
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: isDark ? '#000' : '#f5f5f5' }]}>
        <ActivityIndicator size="large" color={isDark ? '#fff' : '#000'} />
        <Text style={[styles.loadingText, { color: isDark ? '#fff' : '#000' }]}>
          Loading profile...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: isDark ? '#000' : '#f5f5f5' }]}
      contentContainerStyle={styles.content}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: isDark ? '#fff' : '#000' }]}>
          {t.editProfile || 'Edit Profile'}
        </Text>
      </View>

      {/* Profile Picture Section */}
      <View style={styles.imageSection}>
        <TouchableOpacity onPress={handleImagePick}>
          {profileImage ? (
            <Image source={{ uri: profileImage }} style={styles.profileImage} />
          ) : (
            <View style={[styles.imagePlaceholder, { backgroundColor: isDark ? '#1a1a1a' : '#e0e0e0' }]}>
              <Text style={[styles.imagePlaceholderText, { color: isDark ? '#666' : '#999' }]}>
                📷
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.imageButtons}>
          <TouchableOpacity
            style={[styles.imageButton, { backgroundColor: isDark ? '#1a1a1a' : '#fff', borderColor: isDark ? '#333' : '#ddd' }]}
            onPress={handleImagePick}
          >
            <Text style={[styles.imageButtonText, { color: isDark ? '#fff' : '#000' }]}>
              {t.changePhoto || 'Change Photo'}
            </Text>
          </TouchableOpacity>

          {profileImage && (
            <TouchableOpacity
              style={[styles.imageButton, styles.removeButton]}
              onPress={handleRemoveImage}
            >
              <Text style={styles.removeButtonText}>
                {t.removePhoto || 'Remove Photo'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Profile Information Section */}
      <View style={styles.formSection}>
        <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>
          {t.personalInfo || 'Personal Information'}
        </Text>

        {/* First Name */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: isDark ? '#ccc' : '#666' }]}>
            {t.firstName || 'First Name'}
          </Text>
          <TextInput
            style={[styles.input, { 
              backgroundColor: isDark ? '#1a1a1a' : '#fff',
              color: isDark ? '#fff' : '#000',
              borderColor: isDark ? '#333' : '#ddd'
            }]}
            value={firstName}
            onChangeText={setFirstName}
            placeholder={t.firstName || 'First Name'}
            placeholderTextColor={isDark ? '#666' : '#999'}
          />
        </View>

        {/* Last Name */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: isDark ? '#ccc' : '#666' }]}>
            {t.lastName || 'Last Name'}
          </Text>
          <TextInput
            style={[styles.input, { 
              backgroundColor: isDark ? '#1a1a1a' : '#fff',
              color: isDark ? '#fff' : '#000',
              borderColor: isDark ? '#333' : '#ddd'
            }]}
            value={lastName}
            onChangeText={setLastName}
            placeholder={t.lastName || 'Last Name'}
            placeholderTextColor={isDark ? '#666' : '#999'}
          />
        </View>

        {/* Email (Read-only) */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: isDark ? '#ccc' : '#666' }]}>
            {t.email || 'Email'}
          </Text>
          <TextInput
            style={[styles.input, styles.inputDisabled, { 
              backgroundColor: isDark ? '#0a0a0a' : '#f0f0f0',
              color: isDark ? '#666' : '#999',
              borderColor: isDark ? '#333' : '#ddd'
            }]}
            value={profile?.email || ''}
            editable={false}
          />
          <Text style={[styles.helperText, { color: isDark ? '#666' : '#999' }]}>
            Email cannot be changed
          </Text>
        </View>

        {/* Date of Birth (Read-only) */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: isDark ? '#ccc' : '#666' }]}>
            {t.dateOfBirth || 'Date of Birth'}
          </Text>
          <TextInput
            style={[styles.input, styles.inputDisabled, { 
              backgroundColor: isDark ? '#0a0a0a' : '#f0f0f0',
              color: isDark ? '#666' : '#999',
              borderColor: isDark ? '#333' : '#ddd'
            }]}
            value={profile?.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString() : ''}
            editable={false}
          />
          <Text style={[styles.helperText, { color: isDark ? '#666' : '#999' }]}>
            Date of birth cannot be changed
          </Text>
        </View>
      </View>

      {/* Save Button */}
      <TouchableOpacity
        style={[
          styles.saveButton,
          { backgroundColor: isDark ? '#fff' : '#000' },
          (!hasChanges() || saving) && styles.saveButtonDisabled
        ]}
        onPress={handleSave}
        disabled={!hasChanges() || saving}
      >
        <Text style={[styles.saveButtonText, { color: isDark ? '#000' : '#fff' }]}>
          {saving ? (t.saving || 'Saving...') : (t.saveChanges || 'Save Changes')}
        </Text>
      </TouchableOpacity>

      {/* Cancel Button */}
      <TouchableOpacity
        style={[styles.cancelButton, { borderColor: isDark ? '#333' : '#ddd' }]}
        onPress={() => navigation.goBack()}
        disabled={saving}
      >
        <Text style={[styles.cancelButtonText, { color: isDark ? '#fff' : '#000' }]}>
          {t.cancel || 'Cancel'}
        </Text>
      </TouchableOpacity>

      {/* Account Info */}
      <View style={styles.accountInfo}>
        <Text style={[styles.accountInfoText, { color: isDark ? '#666' : '#999' }]}>
          Account created: {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'N/A'}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  header: {
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  imageSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  imagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    fontSize: 40,
  },
  imageButtons: {
    flexDirection: 'row',
    marginTop: 15,
    gap: 10,
  },
  imageButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  imageButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  removeButton: {
    backgroundColor: '#ff3b30',
    borderColor: '#ff3b30',
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  formSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
  },
  inputDisabled: {
    opacity: 0.6,
  },
  helperText: {
    fontSize: 12,
    marginTop: 5,
  },
  saveButton: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  cancelButton: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 2,
    marginBottom: 20,
  },
  cancelButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  accountInfo: {
    alignItems: 'center',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  accountInfoText: {
    fontSize: 12,
  },
});
