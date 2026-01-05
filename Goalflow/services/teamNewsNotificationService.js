/**
 * Service de notifications pour les actualités de l'équipe favorite
 */

import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFavoriteTeam, getNotificationPreferences } from './userService';
import { auth } from '../firebaseConfig';

const NEWS_API_KEY = '2794762a5e684f6189fff0bb89827a57';
const EVERYTHING_URL = 'https://newsapi.org/v2/everything';
const CHECK_INTERVAL = 3 * 60 * 60 * 1000; // 3 heures
const STORAGE_KEY = '@last_news_check';

/**
 * Récupérer les dernières actualités d'une équipe
 */
const getTeamNews = async (teamName) => {
  try {
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
    
    const params = new URLSearchParams({
      q: `"${teamName}" football`,
      language: 'fr',
      sortBy: 'publishedAt',
      from: sixHoursAgo.toISOString(),
      pageSize: 5,
      apiKey: NEWS_API_KEY
    });

    const response = await fetch(`${EVERYTHING_URL}?${params}`);
    const data = await response.json();
    
    if (!response.ok || !data.articles) {
      return [];
    }

    return data.articles.filter(article => 
      article.title && 
      article.title !== '[Removed]' &&
      article.description
    );
  } catch (error) {
    console.error('[TeamNewsNotification] Erreur récupération news:', error);
    return [];
  }
};

/**
 * Vérifier s'il y a de nouvelles actualités
 */
const checkForNewTeamNews = async () => {
  try {
    // Vérifier si l'utilisateur est connecté et non anonyme
    const user = auth.currentUser;
    if (!user || user.isAnonymous) {
      return;
    }

    // Vérifier si les notifications sont activées
    const notificationsEnabled = await getNotificationPreferences();
    if (!notificationsEnabled) {
      return;
    }

    // Récupérer l'équipe favorite
    const favoriteTeam = await getFavoriteTeam();
    if (!favoriteTeam || !favoriteTeam.name) {
      return;
    }

    // Récupérer le dernier timestamp de vérification
    const lastCheck = await AsyncStorage.getItem(STORAGE_KEY);
    const lastCheckTime = lastCheck ? parseInt(lastCheck) : 0;
    const now = Date.now();

    // Ne vérifier que toutes les 3 heures minimum
    if (now - lastCheckTime < CHECK_INTERVAL) {
      console.log('[TeamNewsNotification] Trop tôt pour vérifier');
      return;
    }

    // Mettre à jour le timestamp
    await AsyncStorage.setItem(STORAGE_KEY, now.toString());

    // Récupérer les news
    const articles = await getTeamNews(favoriteTeam.name);
    
    if (articles.length > 0) {
      // Notifier pour la première actualité seulement
      const article = articles[0];
      
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `📰 ${favoriteTeam.name}`,
          body: article.title,
          data: { 
            type: 'team_news',
            url: article.url,
            teamId: favoriteTeam.id 
          },
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: null, // Notification immédiate
      });

      console.log('[TeamNewsNotification] Notification envoyée:', article.title);
    }
  } catch (error) {
    console.error('[TeamNewsNotification] Erreur vérification news:', error);
  }
};

/**
 * Démarrer la vérification périodique des actualités
 */
export const startTeamNewsMonitoring = () => {
  // Vérification immédiate
  checkForNewTeamNews();
  
  // Vérification périodique toutes les 3 heures
  const intervalId = setInterval(() => {
    checkForNewTeamNews();
  }, CHECK_INTERVAL);

  return intervalId;
};

/**
 * Arrêter la vérification périodique
 */
export const stopTeamNewsMonitoring = (intervalId) => {
  if (intervalId) {
    clearInterval(intervalId);
  }
};

/**
 * Forcer une vérification immédiate (quand l'utilisateur change d'équipe)
 */
export const checkTeamNewsNow = async () => {
  // Réinitialiser le timestamp pour forcer la vérification
  await AsyncStorage.removeItem(STORAGE_KEY);
  await checkForNewTeamNews();
};

/**
 * Configurer le handler de notification pour les news d'équipe
 */
export const setupTeamNewsNotificationHandler = (navigation) => {
  const subscription = Notifications.addNotificationResponseReceivedListener(response => {
    const data = response.notification.request.content.data;
    
    if (data.type === 'team_news' && data.url) {
      // Ouvrir la page News ou le navigateur
      navigation.navigate('News');
    }
  });

  return subscription;
};
