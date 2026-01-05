import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { firestore, auth, storage } from '../firebaseConfig';

/**
 * Récupérer les données utilisateur depuis Firestore
 * 
 * @param {string} userId - UID de l'utilisateur
 * @returns {Promise<Object>} Données utilisateur
 */
export const getUserData = async (userId) => {
  try {
    const userDoc = await getDoc(doc(firestore, 'users', userId));
    
    if (userDoc.exists()) {
      return userDoc.data();
    } else {
      return null;
    }
  } catch (error) {
    console.error('[UserService] Erreur lors de la récupération des données:', error);
    throw error;
  }
};

/**
 * Créer ou mettre à jour les données utilisateur
 * 
 * @param {string} userId - UID de l'utilisateur
 * @param {Object} data - Données à sauvegarder
 * @returns {Promise<void>}
 */
export const setUserData = async (userId, data) => {
  try {
    await setDoc(doc(firestore, 'users', userId), {
      ...data,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    console.error('[UserService] Erreur lors de la sauvegarde des données:', error);
    throw error;
  }
};

/**
 * Sauvegarder l'équipe préférée de l'utilisateur
 * 
 * @param {Object} team - Équipe préférée
 * @returns {Promise<void>}
 */
export const saveFavoriteTeam = async (team) => {
  const userId = auth.currentUser?.uid;
  
  if (!userId) {
    throw new Error('Utilisateur non connecté');
  }
  // Bloquer la sauvegarde pour les utilisateurs invités (anonymes)
  if (auth.currentUser?.isAnonymous) {
    console.log('[UserService] Les utilisateurs invités ne peuvent pas sauvegarder d\'equipe préférée');
    return;
  }
  try {
    await setUserData(userId, {
      favoriteTeam: team
    });
  } catch (error) {
    console.error('[UserService] Erreur lors de la sauvegarde de l\'équipe:', error);
    throw error;
  }
};

/**
 * Récupérer l'équipe préférée de l'utilisateur
 * 
 * @returns {Promise<Object|null>} Équipe préférée ou null
 */
export const getFavoriteTeam = async () => {
  const userId = auth.currentUser?.uid;
  
  if (!userId) {
    return null;
  }
  // Les utilisateurs invités n'ont pas d'équipe préférée
  if (auth.currentUser?.isAnonymous) {
    return null;
  }
  try {
    const userData = await getUserData(userId);
    return userData?.favoriteTeam || null;
  } catch (error) {
    console.error('[UserService] Erreur lors de la récupération de l\'équipe:', error);
    return null;
  }
};

/**
 * Mettre à jour les préférences de notifications
 * 
 * @param {boolean} enabled - Activer/désactiver les notifications
 * @returns {Promise<void>}
 */
export const updateNotificationPreferences = async (enabled) => {
  const userId = auth.currentUser?.uid;
  
  if (!userId) {
    throw new Error('Utilisateur non connecté');
  }

  // Bloquer pour les utilisateurs invités
  if (auth.currentUser?.isAnonymous) {
    console.log('[UserService] Les utilisateurs invités ne peuvent pas modifier les notifications');
    return;
  }

  try {
    await setUserData(userId, {
      notificationsEnabled: enabled
    });
  } catch (error) {
    console.error('[UserService] Erreur lors de la mise à jour des notifications:', error);
    throw error;
  }
};

/**
 * Récupérer les préférences de notifications
 * 
 * @returns {Promise<boolean>} État des notifications
 */
export const getNotificationPreferences = async () => {
  const userId = auth.currentUser?.uid;
  
  if (!userId) {
    return false;
  }

  // Les utilisateurs invités n'ont pas de préférences
  if (auth.currentUser?.isAnonymous) {
    return false;
  }

  try {
    const userData = await getUserData(userId);
    return userData?.notificationsEnabled || false;
  } catch (error) {
    console.error('[UserService] Erreur lors de la récupération des notifications:', error);
    return false;
  }
};

/**
 * Upload profile picture to Firebase Storage
 * 
 * @param {string} userId - User ID
 * @param {string} imageUri - Local image URI
 * @returns {Promise<string>} Download URL of uploaded image
 */
export const uploadProfilePicture = async (userId, imageUri) => {
  try {
    console.log('[UserService] Starting profile picture upload for user:', userId);
    console.log('[UserService] Image URI:', imageUri);
    
    // Ensure user is authenticated
    if (!auth.currentUser) {
      throw new Error('User must be authenticated to upload profile picture');
    }
    
    // Verify Storage is initialized
    if (!storage) {
      throw new Error('Firebase Storage is not initialized. Please check firebaseConfig.js');
    }

    // Create reference to storage location
    const storageRef = ref(storage, `profilePictures/${userId}/profile.jpg`);
    console.log('[UserService] Storage reference created:', storageRef.fullPath);
    
    // Convert image URI to blob for React Native
    const response = await fetch(imageUri);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    
    const blob = await response.blob();
    console.log('[UserService] Blob created, size:', blob.size, 'type:', blob.type);
    
    // Validate blob
    if (!blob || blob.size === 0) {
      throw new Error('Invalid image data');
    }
    
    // Upload with metadata
    const metadata = {
      contentType: blob.type || 'image/jpeg',
      customMetadata: {
        uploadedBy: userId,
        uploadedAt: new Date().toISOString()
      }
    };
    
    console.log('[UserService] Starting upload...');
    const uploadTask = uploadBytesResumable(storageRef, blob, metadata);
    
    // Wait for upload to complete
    await new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log('[UserService] Upload progress:', progress.toFixed(2) + '%');
        },
        (error) => {
          console.error('[UserService] Upload error:', error);
          reject(error);
        },
        () => {
          console.log('[UserService] Upload completed successfully');
          resolve();
        }
      );
    });
    
    // Get download URL
    console.log('[UserService] Getting download URL...');
    const downloadURL = await getDownloadURL(storageRef);
    console.log('[UserService] Download URL obtained:', downloadURL);
    
    return downloadURL;
  } catch (error) {
    console.error('[UserService] Error uploading profile picture:', error);
    console.error('[UserService] Error code:', error.code);
    console.error('[UserService] Error message:', error.message);
    console.error('[UserService] Full error:', JSON.stringify(error, null, 2));
    
    // Provide more specific error messages
    if (error.code === 'storage/unauthorized') {
      throw new Error('❌ Permission refusée. Vérifiez les règles de sécurité Storage.');
    } else if (error.code === 'storage/canceled') {
      throw new Error('❌ Upload annulé.');
    } else if (error.code === 'storage/unknown' || error.message?.includes('Storage is not initialized')) {
      throw new Error('❌ Firebase Storage n\'est pas activé.\n\n1. Allez sur console.firebase.google.com\n2. Sélectionnez votre projet\n3. Cliquez sur "Storage" dans le menu\n4. Cliquez sur "Commencer" pour activer Storage');
    } else if (error.message?.includes('Network')) {
      throw new Error('❌ Problème de connexion. Vérifiez votre internet.');
    }
    
    throw error;
  }
};

/**
 * Delete profile picture from Firebase Storage
 * 
 * @param {string} userId - User ID
 * @returns {Promise<void>}
 */
export const deleteProfilePicture = async (userId) => {
  try {
    const storageRef = ref(storage, `profilePictures/${userId}/profile.jpg`);
    await deleteObject(storageRef);
  } catch (error) {
    // If file doesn't exist, ignore error
    if (error.code !== 'storage/object-not-found') {
      console.error('[UserService] Error deleting profile picture:', error);
      throw error;
    }
  }
};

/**
 * Create complete user profile during registration
 * 
 * @param {string} userId - Firebase Auth UID
 * @param {Object} profileData - User profile information
 * @param {string} profileData.firstName - User's first name
 * @param {string} profileData.lastName - User's last name
 * @param {string} profileData.dateOfBirth - User's date of birth (ISO string)
 * @param {string} profileData.email - User's email
 * @param {string|null} profileData.photoURL - Optional profile picture URL
 * @returns {Promise<void>}
 */
export const createUserProfile = async (userId, profileData) => {
  try {
    const userProfile = {
      firstName: profileData.firstName,
      lastName: profileData.lastName,
      dateOfBirth: profileData.dateOfBirth,
      email: profileData.email,
      photoURL: profileData.photoURL || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notificationsEnabled: true,
      favoriteTeam: null
    };

    await setDoc(doc(firestore, 'users', userId), userProfile);
    console.log('[UserService] User profile created successfully');
  } catch (error) {
    console.error('[UserService] Error creating user profile:', error);
    throw error;
  }
};

/**
 * Update user profile information
 * 
 * @param {string} userId - User ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<void>}
 */
export const updateUserProfile = async (userId, updates) => {
  try {
    await updateDoc(doc(firestore, 'users', userId), {
      ...updates,
      updatedAt: new Date().toISOString()
    });
    console.log('[UserService] User profile updated successfully');
  } catch (error) {
    console.error('[UserService] Error updating user profile:', error);
    throw error;
  }
};

/**
 * Get complete user profile
 * 
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} User profile or null
 */
export const getUserProfile = async (userId) => {
  try {
    return await getUserData(userId);
  } catch (error) {
    console.error('[UserService] Error getting user profile:', error);
    throw error;
  }
};
