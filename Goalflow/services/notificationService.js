import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { auth, firestore } from '../firebaseConfig';
import { collection, doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';

// Configuration des notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Demande les permissions pour les notifications
 */
export const registerForPushNotifications = async () => {
  try {
    if (!Device.isDevice) {
      console.log('Les notifications ne fonctionnent que sur un appareil physique');
      return null;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Permission de notification refusée');
      return null;
    }

    // Configure le canal Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('match_reminders', {
        name: 'Rappels de matchs',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#00FF87',
        sound: 'default',
      });
    }

    // Pour l'instant, on utilise uniquement les notifications locales
    // Si vous voulez utiliser FCM/Expo Push, vous devez configurer un projectId
    console.log('✅ Notifications locales activées');
    
    return 'local-notifications-enabled';
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement des notifications:', error);
    return null;
  }
};

/**
 * Programme une notification locale pour un match
 */
export const scheduleMatchNotification = async (match, reminderMinutes = 15) => {
  try {
    const matchTime = new Date(match.utcDate);
    const notificationTime = new Date(matchTime.getTime() - reminderMinutes * 60 * 1000);
    const now = new Date();

    // Vérifie si la notification est dans le futur
    if (notificationTime <= now) {
      console.log('La notification serait dans le passé, annulation');
      return null;
    }

    // Ajuste pour les heures de silence (23h-7h)
    const hour = notificationTime.getHours();
    if (hour >= 23 || hour < 7) {
      notificationTime.setHours(8, 0, 0, 0);
    }

    // Programmation de la notification locale
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: '⚽ Match dans 15 minutes !',
        body: `${match.homeTeam?.name || 'Équipe domicile'} vs ${match.awayTeam?.name || 'Équipe extérieure'}`,
        data: { 
          matchId: match.id,
          type: 'match_start',
          screen: 'MatchDetails'
        },
        sound: 'default',
        badge: 1,
        categoryIdentifier: 'MATCH_REMINDER',
      },
      trigger: {
        date: notificationTime,
        channelId: 'match_reminders',
      },
    });

    console.log(`✅ Notification programmée pour ${notificationTime.toLocaleString('fr-FR')}`);
    return { type: 'local', id: notificationId };
  } catch (error) {
    console.error('Erreur lors de la programmation de la notification:', error);
    throw error;
  }
};

/**
 * Annule une notification programmée
 */
export const cancelMatchNotification = async (notificationData) => {
  try {
    if (!notificationData) return;

    if (notificationData.type === 'local') {
      await Notifications.cancelScheduledNotificationAsync(notificationData.id);
    } else if (notificationData.type === 'cloud') {
      await deleteDoc(doc(firestore, 'scheduled_notifications', notificationData.id));
    }
  } catch (error) {
    console.error('Erreur lors de l\'annulation de la notification:', error);
  }
};

/**
 * Récupère les préférences de notification de l'utilisateur
 */
export const getNotificationPreferences = async () => {
  try {
    const user = auth.currentUser;
    if (!user || user.isAnonymous) {
      return {
        enabled: false,
        reminderMinutes: 15,
      };
    }

    const userDoc = await getDoc(doc(firestore, 'users', user.uid));
    const data = userDoc.data();

    return {
      enabled: data?.notificationsEnabled ?? true,
      reminderMinutes: data?.reminderMinutes ?? 15,
    };
  } catch (error) {
    console.error('Erreur lors de la récupération des préférences:', error);
    return {
      enabled: false,
      reminderMinutes: 15,
    };
  }
};

/**
 * Met à jour les préférences de notification
 */
export const updateNotificationPreferences = async (preferences) => {
  try {
    const user = auth.currentUser;
    if (!user || user.isAnonymous) {
      throw new Error('Utilisateur non authentifié');
    }

    const userRef = doc(firestore, 'users', user.uid);
    await setDoc(userRef, {
      notificationsEnabled: preferences.enabled,
      reminderMinutes: preferences.reminderMinutes,
      updatedAt: new Date(),
    }, { merge: true });

    return true;
  } catch (error) {
    console.error('Erreur lors de la mise à jour des préférences:', error);
    throw error;
  }
};

/**
 * Configure le listener pour les notifications reçues
 */
export const setupNotificationListener = (navigation) => {
  // Notification reçue quand l'app est en foreground
  const foregroundSubscription = Notifications.addNotificationReceivedListener(notification => {
    console.log('Notification reçue:', notification);
  });

  // Notification cliquée
  const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
    const { matchId, screen } = response.notification.request.content.data;
    
    if (matchId && screen === 'MatchDetails') {
      navigation.navigate('MatchDetails', { matchId });
    }
  });

  return () => {
    foregroundSubscription.remove();
    responseSubscription.remove();
  };
};
