import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
  useColorScheme
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '../firebaseConfig';
import { useLanguage } from '../contexts/LanguageContext';
import { useFocusEffect } from '@react-navigation/native';
import {
  getUserProfile,
  uploadProfilePicture,
  updateUserProfile
} from '../services/userService';
import * as ImagePicker from 'expo-image-picker';

/**
 * ProfileScreen - Page de profil utilisateur complète
 * 
 * Fonctionnalités :
 * - Affichage de la photo de profil (récupérée depuis Firebase Storage)
 * - Affichage du nom et prénom (récupérés depuis Firestore)
 * - Modification de la photo en cliquant dessus
 * - Mise à jour automatique de la photo dans Storage et Firestore
 * - Rafraîchissement des données
 * - Support mode sombre/clair
 */
export default function ProfileScreen({ navigation }) {
  const { t } = useLanguage();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // États
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Charger le profil au montage et lors du focus
  useFocusEffect(
    React.useCallback(() => {
      loadUserProfile();
    }, [])
  );

  /**
   * Charger les données du profil utilisateur
   */
  const loadUserProfile = async () => {
    try {
      const userId = auth.currentUser?.uid;
      
      if (!userId) {
        Alert.alert(t.error || 'Erreur', 'Utilisateur non connecté');
        navigation.navigate('Login');
        return;
      }

      // Récupérer le profil depuis Firestore
      const userData = await getUserProfile(userId);
      
      if (userData) {
        setProfile(userData);
      } else {
        Alert.alert(
          t.error || 'Erreur',
          'Profil non trouvé. Veuillez vous reconnecter.'
        );
      }
    } catch (error) {
      console.error('[ProfileScreen] Erreur lors du chargement du profil:', error);
      Alert.alert(
        t.error || 'Erreur',
        'Impossible de charger votre profil'
      );
    } finally {
      setLoading(false);
    }
  };

  /**
   * Rafraîchir les données du profil (pull to refresh)
   */
  const onRefresh = async () => {
    setRefreshing(true);
    await loadUserProfile();
    setRefreshing(false);
  };

  /**
   * Sélectionner et uploader une nouvelle photo de profil
   */
  const handleChangeProfilePhoto = async () => {
    try {
      // Demander la permission d'accès à la galerie
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          t.error || 'Permission requise',
          'L\'accès à la galerie est nécessaire pour changer votre photo de profil.'
        );
        return;
      }

      // Ouvrir le sélecteur d'images
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      // Si l'utilisateur a sélectionné une image
      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        
        // Afficher un indicateur de chargement
        setUploadingPhoto(true);

        try {
          const userId = auth.currentUser.uid;

          // 1. Uploader la nouvelle photo vers Firebase Storage
          console.log('[ProfileScreen] Upload de la nouvelle photo...');
          const newPhotoURL = await uploadProfilePicture(userId, imageUri);
          console.log('[ProfileScreen] Photo uploadée avec succès:', newPhotoURL);

          // 2. Mettre à jour l'URL dans Firestore
          await updateUserProfile(userId, {
            photoURL: newPhotoURL
          });

          // 3. Mettre à jour l'état local pour affichage immédiat
          setProfile(prevProfile => ({
            ...prevProfile,
            photoURL: newPhotoURL
          }));

          Alert.alert(
            t.success || 'Succès',
            'Votre photo de profil a été mise à jour !'
          );
        } catch (error) {
          console.error('[ProfileScreen] Erreur lors de la mise à jour de la photo:', error);
          Alert.alert(
            t.error || 'Erreur',
            'Impossible de mettre à jour votre photo. Veuillez réessayer.'
          );
        } finally {
          setUploadingPhoto(false);
        }
      }
    } catch (error) {
      console.error('[ProfileScreen] Erreur lors de la sélection de l\'image:', error);
      Alert.alert(
        t.error || 'Erreur',
        'Une erreur est survenue lors de la sélection de l\'image'
      );
    }
  };

  /**
   * Affichage du loader pendant le chargement
   */
  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: isDark ? '#000' : '#f5f5f5' }]}>
        <ActivityIndicator size="large" color={isDark ? '#fff' : '#000'} />
        <Text style={[styles.loadingText, { color: isDark ? '#fff' : '#000' }]}>
          Chargement du profil...
        </Text>
      </View>
    );
  }

  /**
   * Affichage principal
   */
  return (
    <ScrollView
      style={[styles.container, { backgroundColor: isDark ? '#000' : '#f5f5f5' }]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={isDark ? '#fff' : '#000'}
        />
      }
    >
      {/* En-tête du profil */}
      <View style={[styles.header, { backgroundColor: isDark ? '#1a1a1a' : '#fff' }]}>
        
        {/* Photo de profil cliquable */}
        <TouchableOpacity
          style={styles.photoContainer}
          onPress={handleChangeProfilePhoto}
          disabled={uploadingPhoto}
        >
          {profile?.photoURL ? (
            <Image
              source={{ uri: profile.photoURL }}
              style={styles.profilePhoto}
            />
          ) : (
            <View style={[styles.photoPlaceholder, { backgroundColor: isDark ? '#2a2a2a' : '#e0e0e0' }]}>
              <Ionicons name="person" size={60} color={isDark ? '#666' : '#999'} />
            </View>
          )}

          {/* Indicateur de chargement pendant l'upload */}
          {uploadingPhoto && (
            <View style={styles.uploadingOverlay}>
              <ActivityIndicator size="large" color="#fff" />
            </View>
          )}

          {/* Icône de caméra pour indiquer que c'est cliquable */}
          {!uploadingPhoto && (
            <View style={styles.cameraIconContainer}>
              <Ionicons name="camera" size={20} color="#fff" />
            </View>
          )}
        </TouchableOpacity>

        {/* Nom et Prénom */}
        <Text style={[styles.userName, { color: isDark ? '#fff' : '#000' }]}>
          {profile?.firstName} {profile?.lastName}
        </Text>

        {/* Email */}
        <Text style={[styles.userEmail, { color: isDark ? '#999' : '#666' }]}>
          {profile?.email}
        </Text>

        {/* Date de naissance */}
        {profile?.dateOfBirth && (
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={16} color={isDark ? '#999' : '#666'} />
            <Text style={[styles.infoText, { color: isDark ? '#999' : '#666' }]}>
              {new Date(profile.dateOfBirth).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </Text>
          </View>
        )}

        {/* Date de création du compte */}
        {profile?.createdAt && (
          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={16} color={isDark ? '#999' : '#666'} />
            <Text style={[styles.infoText, { color: isDark ? '#999' : '#666' }]}>
              Membre depuis {new Date(profile.createdAt).toLocaleDateString('fr-FR', {
                month: 'long',
                year: 'numeric'
              })}
            </Text>
          </View>
        )}
      </View>

      {/* Bouton d'édition du profil */}
      <View style={styles.section}>
        <TouchableOpacity
          style={[styles.editButton, { backgroundColor: isDark ? '#1a1a1a' : '#fff' }]}
          onPress={() => navigation.navigate('ProfileEdit')}
        >
          <Ionicons name="create-outline" size={24} color={isDark ? '#fff' : '#000'} />
          <Text style={[styles.editButtonText, { color: isDark ? '#fff' : '#000' }]}>
            Modifier le profil
          </Text>
          <Ionicons name="chevron-forward" size={24} color={isDark ? '#666' : '#ccc'} />
        </TouchableOpacity>
      </View>

      {/* Statistiques (optionnel - pour extension future) */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>
          Statistiques
        </Text>
        
        <View style={[styles.statsContainer, { backgroundColor: isDark ? '#1a1a1a' : '#fff' }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: isDark ? '#fff' : '#000' }]}>
              {profile?.favoriteTeam ? '1' : '0'}
            </Text>
            <Text style={[styles.statLabel, { color: isDark ? '#999' : '#666' }]}>
              Équipe favorite
            </Text>
          </View>

          <View style={[styles.statDivider, { backgroundColor: isDark ? '#333' : '#e0e0e0' }]} />

          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: isDark ? '#fff' : '#000' }]}>
              {profile?.notificationsEnabled ? 'Activées' : 'Désactivées'}
            </Text>
            <Text style={[styles.statLabel, { color: isDark ? '#999' : '#666' }]}>
              Notifications
            </Text>
          </View>
        </View>
      </View>

      {/* Équipe favorite */}
      {profile?.favoriteTeam && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>
            Équipe favorite
          </Text>
          
          <View style={[styles.teamContainer, { backgroundColor: isDark ? '#1a1a1a' : '#fff' }]}>
            {profile.favoriteTeam.logo && (
              <Image
                source={{ uri: profile.favoriteTeam.logo }}
                style={styles.teamLogo}
              />
            )}
            <View style={styles.teamInfo}>
              <Text style={[styles.teamName, { color: isDark ? '#fff' : '#000' }]}>
                {profile.favoriteTeam.name}
              </Text>
              {profile.favoriteTeam.league && (
                <Text style={[styles.teamLeague, { color: isDark ? '#999' : '#666' }]}>
                  {profile.favoriteTeam.league}
                </Text>
              )}
            </View>
          </View>
        </View>
      )}

      {/* Bouton de déconnexion */}
      <View style={styles.section}>
        <TouchableOpacity
          style={[styles.logoutButton]}
          onPress={() => {
            Alert.alert(
              'Déconnexion',
              'Êtes-vous sûr de vouloir vous déconnecter ?',
              [
                { text: 'Annuler', style: 'cancel' },
                {
                  text: 'Déconnexion',
                  style: 'destructive',
                  onPress: async () => {
                    await signOut(auth);
                  }
                }
              ]
            );
          }}
        >
          <Ionicons name="log-out-outline" size={24} color="#ff3b30" />
          <Text style={styles.logoutButtonText}>
            Se déconnecter
          </Text>
        </TouchableOpacity>
      </View>

      {/* Espace en bas */}
      <View style={{ height: 40 }} />
    </ScrollView>
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
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  header: {
    padding: 20,
    alignItems: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  photoContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  profilePhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#fff',
  },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#fff',
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#007AFF',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 14,
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
    gap: 8,
  },
  infoText: {
    fontSize: 13,
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  editButtonText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    marginHorizontal: 10,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  teamContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  teamLogo: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  teamInfo: {
    flex: 1,
  },
  teamName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 3,
  },
  teamLeague: {
    fontSize: 13,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ff3b30',
  },
  logoutButtonText: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: '600',
    color: '#ff3b30',
  },
});
