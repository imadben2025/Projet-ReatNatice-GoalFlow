/**
 * Football-Data.org API Service (v4)
 * 
 * Endpoint officiel: https://api.football-data.org/v4/matches?status=LIVE
 * Documentation: https://www.football-data.org/documentation/quickstart
 * 
 * Plan gratuit:
 * - 10 requêtes/minute
 * - Pas de données en temps réel (délai ~1 minute)
 * - Compétitions limitées
 */

const API_BASE_URL = 'https://api.football-data.org/v4';

// ⚠️ IMPORTANT: Remplacez par votre clé API de football-data.org
// Obtenir une clé gratuite: https://www.football-data.org/client/register
const API_KEY = '6b8642cc53cf4da993a5cdbb3a9c57e8';

/**
 * Configuration des headers pour l'API
 */
const getHeaders = () => ({
  'X-Auth-Token': API_KEY,
  'Content-Type': 'application/json',
});

/**
 * Récupère les matchs en direct
 * 
 * @returns {Promise<Array>} Liste des matchs en direct
 */
export const getLiveMatches = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/matches?status=LIVE`, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('Limite de requêtes API atteinte. Attendez 1 minute.');
      }
      if (response.status === 403) {
        throw new Error('Clé API invalide ou accès refusé.');
      }
      throw new Error(`Erreur API: ${response.status}`);
    }

    const data = await response.json();
    return data.matches || [];
  } catch (error) {
    console.error('Erreur lors de la récupération des matchs live:', error);
    throw error;
  }
};

/**
 * Récupère les matchs du jour
 * 
 * @returns {Promise<Array>} Liste des matchs du jour
 */
export const getTodayMatches = async () => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const response = await fetch(`${API_BASE_URL}/matches?date=${today}`, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Erreur API: ${response.status}`);
    }

    const data = await response.json();
    return data.matches || [];
  } catch (error) {
    console.error('Erreur lors de la récupération des matchs du jour:', error);
    throw error;
  }
};

/**
 * Récupère les matchs pour une date spécifique
 * 
 * @param {Date|string} date - Date pour laquelle récupérer les matchs (objet Date ou string YYYY-MM-DD)
 * @returns {Promise<Array>} Liste des matchs pour cette date
 */
export const getMatchesByDate = async (date) => {
  try {
    let dateString;
    
    if (date instanceof Date) {
      // Utiliser la date locale au lieu de UTC pour éviter les décalages
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      dateString = `${year}-${month}-${day}`;
    } else {
      dateString = date;
    }
    
    const response = await fetch(`${API_BASE_URL}/matches?date=${dateString}`, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('Limite de requêtes API atteinte. Attendez 1 minute.');
      }
      if (response.status === 403) {
        throw new Error('Clé API invalide ou accès refusé.');
      }
      throw new Error(`Erreur API: ${response.status}`);
    }

    const data = await response.json();
    return data.matches || [];
  } catch (error) {
    console.error('Erreur lors de la récupération des matchs pour la date:', dateString, error);
    throw error;
  }
};

/**
 * Récupère les détails d'un match par son ID
 * 
 * Endpoint: GET https://api.football-data.org/v4/matches/{matchId}
 * 
 * @param {number} matchId - ID du match
 * @returns {Promise<Object>} Détails du match
 */
export const getMatchDetails = async (matchId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/matches/${matchId}`, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('Limite de requêtes API atteinte. Attendez 1 minute.');
      }
      if (response.status === 403) {
        throw new Error('Clé API invalide ou accès refusé.');
      }
      if (response.status === 404) {
        throw new Error('Match non trouvé.');
      }
      throw new Error(`Erreur API: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erreur lors de la récupération des détails du match:', error);
    throw error;
  }
};

/**
 * Récupère les matchs par compétition
 * 
 * @param {string} competitionCode - Code de la compétition (ex: 'PL', 'CL', 'WC')
 * @returns {Promise<Array>} Liste des matchs
 */
export const getMatchesByCompetition = async (competitionCode) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/competitions/${competitionCode}/matches`,
      {
        method: 'GET',
        headers: getHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(`Erreur API: ${response.status}`);
    }

    const data = await response.json();
    return data.matches || [];
  } catch (error) {
    console.error('Erreur lors de la récupération des matchs:', error);
    throw error;
  }
};

/**
 * Formatte le statut du match en français
 * 
 * @param {string} status - Statut du match
 * @returns {string} Statut formaté
 */
export const formatMatchStatus = (status) => {
  const statusMap = {
    LIVE: 'EN DIRECT',
    IN_PLAY: 'EN COURS',
    PAUSED: 'MI-TEMPS',
    FINISHED: 'TERMINÉ',
    SCHEDULED: 'À VENIR',
    POSTPONED: 'REPORTÉ',
    CANCELLED: 'ANNULÉ',
    SUSPENDED: 'SUSPENDU',
  };
  return statusMap[status] || status;
};

/**
 * Récupère la minute du match
 * 
 * @param {object} match - Objet match de l'API
 * @returns {string|null} Minute du match ou null
 */
export const getMatchMinute = (match) => {
  // L'API ne fournit pas toujours la minute exacte dans le plan gratuit
  // On retourne null pour le plan gratuit
  return null;
};

/**
 * Formatte une date en format lisible
 * 
 * @param {string} dateString - Date ISO string
 * @returns {string} Date formatée
 */
export const formatMatchDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

/**
 * Formatte une heure
 * 
 * @param {string} dateString - Date ISO string
 * @returns {string} Heure formatée
 */
export const formatMatchTime = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Exemple de structure JSON de la réponse API pour un match:
 * 
 * IMPORTANT - Logique d'affichage du score:
 * 
 * 1. Match FINISHED (terminé):
 *    - Utiliser: match.score.fullTime.home / away
 *    - C'est le score final officiel
 * 
 * 2. Match IN_PLAY ou PAUSED (en cours):
 *    - Utiliser: match.score.regularTime.home / away
 *    - C'est le score actuel en temps réel
 * 
 * 3. Match SCHEDULED (à venir):
 *    - Ne pas afficher de score (afficher l'heure)
 * 
 * ⚠️ ERREURS FRÉQUENTES À ÉVITER:
 * - NE PAS utiliser regularTime pour un match FINISHED (peut être null ou 0-0)
 * - NE PAS utiliser halfTime pour le score final
 * - Toujours vérifier le statut avant de choisir le champ
 * 
 * Structure complète:
 * {
 *   "id": 436109,
 *   "utcDate": "2026-01-03T15:00:00Z",
 *   "status": "FINISHED",  // "SCHEDULED", "IN_PLAY", "PAUSED", "FINISHED"
 *   "matchday": 20,
 *   "stage": "REGULAR_SEASON",
 *   "homeTeam": {
 *     "id": 57,
 *     "name": "Arsenal FC",
 *     "shortName": "Arsenal",
 *     "tla": "ARS",
 *     "crest": "https://crests.football-data.org/57.png"
 *   },
 *   "awayTeam": {
 *     "id": 65,
 *     "name": "Manchester City FC",
 *     "shortName": "Man City",
 *     "tla": "MCI",
 *     "crest": "https://crests.football-data.org/65.png"
 *   },
 *   "score": {
 *     "fullTime": { "home": 2, "away": 1 },    // ✅ Score final (FINISHED)
 *     "halfTime": { "home": 1, "away": 0 },    // Score à la mi-temps
 *     "regularTime": { "home": 2, "away": 1 }  // ✅ Score en cours (IN_PLAY)
 *   },
 *   "competition": {
 *     "id": 2021,
 *     "name": "Premier League",
 *     "code": "PL",
 *     "emblem": "https://crests.football-data.org/PL.png"
 *   },
 *   "venue": "Emirates Stadium",
 *   "referees": [],
 *   "lineups": [
 *     {
 *       "team": { "id": 57, "name": "Arsenal FC" },
 *       "formation": "4-3-3",
 *       "startXI": [
 *         { "player": { "id": 1, "name": "Player Name", "position": "Goalkeeper" } }
 *       ],
 *       "bench": [
 *         { "player": { "id": 12, "name": "Substitute Player" } }
 *       ]
 *     }
 *   ]
 * }
 * 
 * ⚠️ LIMITATIONS DU PLAN GRATUIT Football-Data.org:
 * 
 * - Lineups: Pas toujours disponibles pour toutes les compétitions
 * - Events (cartons, buts, changements): Nécessite un plan premium
 * - Données en temps réel: Délai d'environ 1 minute
 * - Certaines ligues envoient les lineups quelques minutes après le coup d'envoi
 * 
 * 📱 Bonnes pratiques UX:
 * 
 * - Toujours afficher "Données non disponibles" si lineups est vide
 * - Prévoir des messages d'attente pour les matchs en direct
 * - Utiliser des onglets pour organiser: Résumé | Compositions | Événements
 * - Rafraîchir automatiquement si le match est LIVE (toutes les 60 secondes)
 * 
 * Exemple de code correct:
 * 
 * let homeScore, awayScore;
 * 
 * if (match.status === 'FINISHED') {
 *   // Match terminé: score final
 *   homeScore = match.score?.fullTime?.home ?? '-';
 *   awayScore = match.score?.fullTime?.away ?? '-';
 * } else if (match.status === 'IN_PLAY' || match.status === 'PAUSED') {
 *   // Match en cours: score actuel
 *   homeScore = match.score?.regularTime?.home ?? '-';
 *   awayScore = match.score?.regularTime?.away ?? '-';
 * } else {
 *   // Match à venir: pas de score
 *   homeScore = '-';
 *   awayScore = '-';
 * }
 */
