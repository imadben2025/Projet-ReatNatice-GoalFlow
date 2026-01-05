/**
 * ⚽ SportDB.dev / TheSportsDB API Service
 * 
 * Documentation: https://www.thesportsdb.com/api.php
 * 
 * 🔑 ENDPOINTS PRINCIPAUX:
 * 
 * 1. Live Scores (Soccer):
 *    GET https://www.thesportsdb.com/api/v1/json/3/livescore.php?l=4328
 *    - l=4328 → Soccer/Football
 *    - Retourne uniquement les matchs EN COURS
 * 
 * 2. Match Details:
 *    GET https://www.thesportsdb.com/api/v1/json/3/lookupevent.php?id={eventId}
 * 
 * 3. Team Logo:
 *    GET https://www.thesportsdb.com/api/v1/json/3/lookupteam.php?id={teamId}
 * 
 * ⚠️ IMPORTANT - Plan Premium:
 * - Clé API: DQVC6u1NYOFlCsv9ZASOReW4N5PSB2suamKr9TfL
 * - Livescores: Délai de 2 minutes (au lieu de 15 min)
 * - Accès aux vidéos et highlights
 * - Compositions et événements détaillés disponibles
 * 
 * 📊 STRUCTURE JSON SIMPLIFIÉE:
 * 
 * {
 *   "events": [
 *     {
 *       "idEvent": "602906",
 *       "strEvent": "Arsenal vs Manchester City",
 *       "strHomeTeam": "Arsenal",
 *       "strAwayTeam": "Manchester City",
 *       "intHomeScore": "2",
 *       "intAwayScore": "1",
 *       "strStatus": "Match Finished",  // "Not Started", "Half Time", "Match Finished"
 *       "strProgress": "90'",
 *       "strTimestamp": "2026-01-03 15:00:00",
 *       "dateEvent": "2026-01-03",
 *       "strTime": "15:00:00",
 *       "strLeague": "Premier League",
 *       "idHomeTeam": "133604",
 *       "idAwayTeam": "133613",
 *       "strHomeTeamBadge": "https://www.thesportsdb.com/images/media/team/badge/...",
 *       "strAwayTeamBadge": "https://www.thesportsdb.com/images/media/team/badge/...",
 *       "strVenue": "Emirates Stadium"
 *     }
 *   ]
 * }
 * 
 * 🎯 FILTRAGE DES MATCHS LIVE:
 * 
 * Statuts possibles:
 * - "Not Started" → À venir
 * - "First Half" → 1ère mi-temps
 * - "Half Time" → Mi-temps
 * - "Second Half" → 2ème mi-temps
 * - "Match Finished" → Terminé
 * 
 * ✅ Considérer comme LIVE:
 * - strProgress !== null && strProgress !== ""
 * - strStatus !== "Not Started"
 * - strStatus !== "Match Finished"
 * - OU: strStatus.includes("Half") || strProgress
 * 
 * 💡 BONNES PRATIQUES:
 * 
 * - Cache: Stocker les résultats pendant 30-60s
 * - Rafraîchissement: setInterval(60000) pour plan gratuit
 * - Erreurs: Gérer quota dépassé, timeout réseau
 * - UX: Pull-to-refresh manuel + auto-refresh
 */

const BASE_URL = 'https://www.thesportsdb.com/api/v1/json';

// Clé API personnelle (plan premium avec livescore 2min)
const API_KEY = 'DQVC6u1NYOFlCsv9ZASOReW4N5PSB2suamKr9TfL';

/**
 * 🔴 RÉCUPÉRER LES MATCHS LIVE (SOCCER)
 * 
 * @returns {Promise<Array>} Liste des matchs en cours
 */
export const getLiveMatches = async () => {
  try {
    // TheSportsDB n'a pas d'endpoint livescore public
    // Alternative: récupérer les matchs d'aujourd'hui et filtrer par statut
    
    // Pour le moment, retourner un tableau vide
    // L'API TheSportsDB gratuite ne fournit pas de livescores en temps réel
    console.log('⚠️ TheSportsDB ne fournit pas d\'endpoint livescore public');
    console.log('💡 Alternative: utiliser l\'endpoint eventsnextleague.php pour une ligue spécifique');
    
    return [];
    
    /* ALTERNATIVE SI BESOIN D'UNE LIGUE SPÉCIFIQUE:
    // Exemple: Premier League (id: 4328)
    const response = await fetch(`https://www.thesportsdb.com/api/v1/json/${API_KEY}/eventsnextleague.php?id=4328`);
    const data = await response.json();
    
    // Filtrer les matchs en cours
    const now = new Date();
    const liveMatches = data.events?.filter(match => {
      const matchDate = new Date(match.strTimestamp);
      const diff = now - matchDate;
      // Match en cours si commencé il y a moins de 2h et pas terminé
      return diff > 0 && diff < 7200000 && match.strStatus !== 'Match Finished';
    }) || [];
    
    return liveMatches;
    */
  } catch (error) {
    console.error('Erreur lors de la récupération des matchs live:', error);
    throw error;
  }
};

/**
 * 📋 RÉCUPÉRER LES DÉTAILS D'UN MATCH
 * 
 * @param {string} eventId - ID de l'événement
 * @returns {Promise<Object>} Détails du match
 */
export const getMatchDetails = async (eventId) => {
  try {
    let response;
    let url;
    
    // Format premium avec clé API
    url = `${BASE_URL}/${API_KEY}/lookupevent.php?id=${eventId}`;
    response = await fetch(url);
    
    // Si 404, essayer le format v2
    if (response.status === 404) {
      url = `https://www.thesportsdb.com/api/v2/json/${API_KEY}/lookupevent.php?id=${eventId}`;
      response = await fetch(url);
    }
    
    // Si encore 404, essayer v1 avec paramètre
    if (response.status === 404) {
      url = `${BASE_URL}/1/lookupevent.php?id=${eventId}&apikey=${API_KEY}`;
      response = await fetch(url);
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (!data.events || data.events.length === 0) {
      throw new Error('Match non trouvé');
    }

    return data.events[0];
  } catch (error) {
    console.error('Erreur lors de la récupération des détails du match:', error);
    throw error;
  }
};

/**
 * 🎽 RÉCUPÉRER LES DÉTAILS D'UNE ÉQUIPE
 * 
 * @param {string} teamId - ID de l'équipe
 * @returns {Promise<Object>} Détails de l'équipe
 */
export const getTeamDetails = async (teamId) => {
  try {
    let response;
    let url;
    
    // Format premium avec clé API
    url = `${BASE_URL}/${API_KEY}/lookupteam.php?id=${teamId}`;
    response = await fetch(url);
    
    // Si 404, essayer le format v2
    if (response.status === 404) {
      url = `https://www.thesportsdb.com/api/v2/json/${API_KEY}/lookupteam.php?id=${teamId}`;
      response = await fetch(url);
    }
    
    // Si encore 404, essayer v1 avec paramètre
    if (response.status === 404) {
      url = `${BASE_URL}/1/lookupteam.php?id=${teamId}&apikey=${API_KEY}`;
      response = await fetch(url);
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (!data.teams || data.teams.length === 0) {
      throw new Error('Équipe non trouvée');
    }

    return data.teams[0];
  } catch (error) {
    console.error('Erreur lors de la récupération des détails de l\'équipe:', error);
    throw error;
  }
};

/**
 * 📅 HELPERS - Formatage des données
 */

export const formatMatchStatus = (status, progress) => {
  if (progress && progress !== '') {
    return `${progress}'`;
  }

  switch (status) {
    case 'Not Started':
      return 'À venir';
    case 'First Half':
      return '1ère MT';
    case 'Half Time':
      return 'MI-TEMPS';
    case 'Second Half':
      return '2ème MT';
    case 'Match Finished':
      return 'TERMINÉ';
    default:
      return status;
  }
};

export const formatMatchDate = (dateString) => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  const options = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  };
  
  return date.toLocaleDateString('fr-FR', options);
};

export const formatMatchTime = (timeString) => {
  if (!timeString) return '';
  
  // Format: "15:00:00" → "15:00"
  return timeString.substring(0, 5);
};

export const isMatchLive = (match) => {
  return (
    match.strProgress !== null &&
    match.strProgress !== '' &&
    match.strStatus !== 'Not Started' &&
    match.strStatus !== 'Match Finished'
  );
};

/**
 * ⚠️ GESTION DES ERREURS COURANTES
 * 
 * - 429 Too Many Requests → Quota dépassé
 * - 404 Not Found → Match/équipe introuvable
 * - Network Error → Connexion perdue
 * - Empty Response → Aucun match live
 */

export const handleApiError = (error) => {
  if (error.message.includes('429')) {
    return 'Quota API dépassé. Veuillez réessayer dans quelques minutes.';
  }
  
  if (error.message.includes('404')) {
    return 'Données non trouvées.';
  }
  
  if (error.message.includes('Network')) {
    return 'Erreur réseau. Vérifiez votre connexion.';
  }
  
  return 'Une erreur est survenue. Veuillez réessayer.';
};
