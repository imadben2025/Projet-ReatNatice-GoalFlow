import { auth, firestore } from '../firebaseConfig';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs,
  deleteDoc, 
  query, 
  where,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { scheduleMatchNotification, cancelMatchNotification } from './notificationService';

const MAX_FAVORITES = 10;

/**
 * Vérifie si un match est en favori
 */
export const isMatchFavorite = async (matchId) => {
  try {
    const user = auth.currentUser;
    if (!user || user.isAnonymous) {
      return false;
    }

    const favoriteRef = doc(firestore, 'favorite_matches', `${user.uid}_${matchId}`);
    const favoriteDoc = await getDoc(favoriteRef);
    
    return favoriteDoc.exists();
  } catch (error) {
    console.error('Erreur lors de la vérification du favori:', error);
    return false;
  }
};

/**
 * Récupère le nombre de favoris de l'utilisateur
 */
export const getFavoritesCount = async () => {
  try {
    const user = auth.currentUser;
    if (!user || user.isAnonymous) {
      return 0;
    }

    const q = query(
      collection(firestore, 'favorite_matches'),
      where('userId', '==', user.uid),
      where('status', '==', 'SCHEDULED')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch (error) {
    console.error('Erreur lors du comptage des favoris:', error);
    return 0;
  }
};

/**
 * Ajoute un match aux favoris
 */
export const addMatchToFavorites = async (match, reminderMinutes = 15) => {
  try {
    const user = auth.currentUser;
    if (!user || user.isAnonymous) {
      throw new Error('Vous devez être connecté pour ajouter des favoris');
    }

    // Vérifie la limite
    const count = await getFavoritesCount();
    if (count >= MAX_FAVORITES) {
      throw new Error(`Limite de ${MAX_FAVORITES} favoris atteinte`);
    }

    // Vérifie que le match n'a pas déjà commencé
    const matchTime = new Date(match.utcDate);
    if (matchTime <= new Date()) {
      throw new Error('Ce match a déjà commencé');
    }

    // Programme la notification
    const notificationData = await scheduleMatchNotification(match, reminderMinutes);

    // Sauvegarde le favori
    const favoriteRef = doc(firestore, 'favorite_matches', `${user.uid}_${match.id}`);
    await setDoc(favoriteRef, {
      userId: user.uid,
      matchId: match.id,
      competitionName: match.competition?.name || 'Football',
      competitionEmblem: match.competition?.emblem || null,
      homeTeam: {
        id: match.homeTeam?.id,
        name: match.homeTeam?.name,
        shortName: match.homeTeam?.shortName,
        crest: match.homeTeam?.crest,
      },
      awayTeam: {
        id: match.awayTeam?.id,
        name: match.awayTeam?.name,
        shortName: match.awayTeam?.shortName,
        crest: match.awayTeam?.crest,
      },
      matchTime: Timestamp.fromDate(matchTime),
      venue: match.venue || null,
      matchStatus: match.status || 'TIMED', // Statut du match de l'API
      status: 'SCHEDULED', // Statut du favori (toujours SCHEDULED au départ)
      notificationScheduled: !!notificationData,
      notificationData: notificationData,
      reminderMinutes: reminderMinutes,
      addedAt: Timestamp.now(),
      expiresAt: Timestamp.fromDate(new Date(matchTime.getTime() + 24 * 60 * 60 * 1000)), // +24h
    });

    return true;
  } catch (error) {
    console.error('Erreur lors de l\'ajout aux favoris:', error);
    throw error;
  }
};

/**
 * Retire un match des favoris
 */
export const removeMatchFromFavorites = async (matchId) => {
  try {
    const user = auth.currentUser;
    if (!user || user.isAnonymous) {
      throw new Error('Utilisateur non authentifié');
    }

    const favoriteRef = doc(firestore, 'favorite_matches', `${user.uid}_${matchId}`);
    const favoriteDoc = await getDoc(favoriteRef);

    if (favoriteDoc.exists()) {
      const data = favoriteDoc.data();
      
      // Annule la notification si programmée
      if (data.notificationData) {
        await cancelMatchNotification(data.notificationData);
      }

      // Supprime le favori
      await deleteDoc(favoriteRef);
    }

    return true;
  } catch (error) {
    console.error('Erreur lors de la suppression du favori:', error);
    throw error;
  }
};

/**
 * Récupère tous les favoris de l'utilisateur
 */
export const getUserFavorites = async () => {
  try {
    const user = auth.currentUser;
    if (!user || user.isAnonymous) {
      return [];
    }

    // Requête simplifiée sans index composite
    const q = query(
      collection(firestore, 'favorite_matches'),
      where('userId', '==', user.uid)
    );

    const snapshot = await getDocs(q);
    
    // Filtrer et trier côté client
    const favorites = snapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data(),
        matchTime: doc.data().matchTime?.toDate(),
        addedAt: doc.data().addedAt?.toDate(),
        expiresAt: doc.data().expiresAt?.toDate(),
      }))
      .filter(fav => fav.status === 'SCHEDULED') // Filtre côté client
      .sort((a, b) => a.matchTime - b.matchTime); // Tri côté client
    
    return favorites;
  } catch (error) {
    console.error('Erreur lors de la récupération des favoris:', error);
    return [];
  }
};

/**
 * Toggle favori (ajoute ou retire)
 */
export const toggleMatchFavorite = async (match, reminderMinutes = 15) => {
  const isFavorite = await isMatchFavorite(match.id);
  
  if (isFavorite) {
    await removeMatchFromFavorites(match.id);
    return false;
  } else {
    await addMatchToFavorites(match, reminderMinutes);
    return true;
  }
};

export { MAX_FAVORITES };
