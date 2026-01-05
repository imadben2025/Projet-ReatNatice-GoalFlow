import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  RefreshControl,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { 
  getLiveMatches, 
  formatMatchStatus 
} from '../services/footballDataService';

export default function LiveScreen({ navigation }) {
  const { isDark } = useTheme();
  const { t, language } = useLanguage();
  
  const [matches, setMatches] = useState([]);
  const [matchesByCompetition, setMatchesByCompetition] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Fonction pour regrouper les matchs par compétition
  const groupMatchesByCompetition = (matchesArray) => {
    const grouped = {};
    
    matchesArray.forEach((match) => {
      const compName = match.competition?.name || 'Autre';
      const compId = match.competition?.id || 'other';
      
      if (!grouped[compId]) {
        grouped[compId] = {
          name: compName,
          emblem: match.competition?.emblem,
          matches: [],
        };
      }
      
      grouped[compId].matches.push(match);
    });
    
    return grouped;
  };

  // Fonction pour récupérer les matchs en direct
  const fetchLiveMatches = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      setError(null);
      
      const liveMatches = await getLiveMatches();
      setMatches(liveMatches);
      setLastUpdate(new Date());
      
      // Regrouper par compétition
      const grouped = groupMatchesByCompetition(liveMatches);
      setMatchesByCompetition(grouped);
    } catch (err) {
      setError(err.message || 'Une erreur est survenue');
      console.error('Erreur:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Chargement initial
  useEffect(() => {
    fetchLiveMatches();
  }, []);

  // Auto-refresh toutes les 60 secondes
  useEffect(() => {
    const interval = setInterval(() => {
      if (matches.length > 0) {
        fetchLiveMatches(true);
      }
    }, 60000); // 60 secondes

    return () => clearInterval(interval);
  }, [matches]);

  // Minuteur dynamique - mise à jour chaque minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Met à jour toutes les 60 secondes

    return () => clearInterval(interval);
  }, []);

  // Fonction pour calculer le minuteur dynamique
  const calculateLiveMinute = (matchStartTime) => {
    if (!matchStartTime) return null;
    
    try {
      const startTime = new Date(matchStartTime);
      const diffMinutes = Math.floor((currentTime - startTime) / 60000);
      
      if (diffMinutes < 0) return null;
      
      // 1ère mi-temps (0-45 min)
      if (diffMinutes <= 45) {
        return diffMinutes;
      }
      // Mi-temps (45-60 min)
      else if (diffMinutes > 45 && diffMinutes <= 60) {
        return '45+';
      }
      // 2ème mi-temps (60-105 min) → affiche 46-90
      else if (diffMinutes > 60 && diffMinutes <= 105) {
        return diffMinutes - 15; // Soustrait les 15 min de pause
      }
      // Prolongations (105+ min)
      else {
        return '90+';
      }
    } catch (e) {
      return null;
    }
  };

  // Pull to refresh
  const onRefresh = () => {
    setRefreshing(true);
    fetchLiveMatches(true);
  };

  // Naviguer vers les détails du match
  const handleMatchPress = (match) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('MatchDetails', { matchId: match.id });
  };

  // Rendu d'un match
  const renderMatch = (match) => {
    // Logique correcte pour le score selon le statut
    let homeScore, awayScore;
    
    if (match.status === 'FINISHED') {
      homeScore = match.score?.fullTime?.home ?? match.score?.fullTime?.homeTeam ?? '-';
      awayScore = match.score?.fullTime?.away ?? match.score?.fullTime?.awayTeam ?? '-';
    } else if (match.status === 'IN_PLAY' || match.status === 'PAUSED' || match.status === 'LIVE') {
      // Match en cours: essayer tous les champs possibles
      homeScore = match.score?.regularTime?.home ?? 
                  match.score?.regularTime?.homeTeam ?? 
                  match.score?.fullTime?.home ?? 
                  match.score?.fullTime?.homeTeam ??
                  match.score?.home ??
                  0;
      awayScore = match.score?.regularTime?.away ?? 
                  match.score?.regularTime?.awayTeam ?? 
                  match.score?.fullTime?.away ?? 
                  match.score?.fullTime?.awayTeam ??
                  match.score?.away ??
                  0;
    } else {
      homeScore = match.score?.fullTime?.home ?? match.score?.fullTime?.homeTeam ?? '-';
      awayScore = match.score?.fullTime?.away ?? match.score?.fullTime?.awayTeam ?? '-';
    }
    
    const status = formatMatchStatus(match.status);
    const isLive = match.status === 'IN_PLAY' || match.status === 'PAUSED' || match.status === 'LIVE';
    
    // Calcul du minuteur dynamique
    let minute = null;
    
    if (isLive) {
      // Essayer d'abord les données de l'API
      minute = match.minute || match.currentMinute;
      
      // Si l'API ne fournit pas la minute, calculer dynamiquement
      if (!minute && match.utcDate) {
        minute = calculateLiveMinute(match.utcDate);
      }
    }

    return (
      <TouchableOpacity
        key={match.id}
        style={[styles.matchCard, { 
          backgroundColor: isDark ? '#121212' : '#F5F5F5',
        }]}
        onPress={() => handleMatchPress(match)}
        activeOpacity={0.7}
      >
        {/* Header avec compétition et statut */}
        <View style={styles.matchHeader}>
          <Text style={[styles.competition, { color: '#999999' }]}>
            {match.competition?.name || t.competition}
          </Text>
          {isLive ? (
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>{t.live}</Text>
            </View>
          ) : (
            <View style={[styles.finishedBadge, { backgroundColor: isDark ? '#1A1A1A' : '#E0E0E0' }]}>
              <Text style={[styles.finishedBadgeText, { color: isDark ? '#666666' : '#999999' }]}>{status}</Text>
            </View>
          )}
        </View>

        {/* Corps du match */}
        <View style={styles.matchBody}>
          {/* Équipe domicile */}
          <View style={styles.teamContainer}>
            {match.homeTeam?.crest && (
              <Image 
                source={{ uri: match.homeTeam.crest }}
                style={styles.teamLogo}
                resizeMode="contain"
              />
            )}
            <Text style={[styles.teamName, { color: isDark ? '#fff' : '#000' }]} numberOfLines={2}>
              {match.homeTeam?.shortName || match.homeTeam?.name || t.homeTeam}
            </Text>
          </View>

          {/* Score */}
          <View style={styles.scoreContainer}>
            <Text style={[styles.score, { color: isDark ? '#fff' : '#000' }]}>
              {homeScore} - {awayScore}
            </Text>
            {isLive && minute && (
              <Text style={[styles.minuteText, { color: '#ff3b30' }]}>
                {minute}'
              </Text>
            )}
          </View>

          {/* Équipe extérieure */}
          <View style={styles.teamContainer}>
            {match.awayTeam?.crest && (
              <Image 
                source={{ uri: match.awayTeam.crest }}
                style={styles.teamLogo}
                resizeMode="contain"
              />
            )}
            <Text style={[styles.teamName, { color: isDark ? '#fff' : '#000' }]} numberOfLines={2}>
              {match.awayTeam?.shortName || match.awayTeam?.name || t.awayTeam}
            </Text>
          </View>
        </View>

        {/* Footer avec stade */}
        {match.venue && (
          <View style={styles.matchFooter}>
            <Ionicons name="location-outline" size={14} color={isDark ? '#666' : '#999'} />
            <Text style={[styles.venue, { color: isDark ? '#666' : '#999' }]}>
              {match.venue}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#000000' : '#FFFFFF' }]}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={isDark ? '#FFFFFF' : '#000000'} />
          <Text style={[styles.loadingText, { color: '#999999' }]}>
            {t.loadingLiveMatches}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#000000' : '#FFFFFF' }]}>
        <ScrollView 
          style={{ flex: 1 }}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              tintColor={isDark ? '#FFFFFF' : '#000000'}
            />
          }
        >
          <View style={styles.centerContainer}>
            <Ionicons name="alert-circle-outline" size={60} color="#666666" />
            <Text style={[styles.errorText, { color: isDark ? '#FFFFFF' : '#000000' }]}>
              {error}
            </Text>
            <TouchableOpacity 
              style={[styles.retryButton, { backgroundColor: isDark ? '#00FF87' : '#000000' }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                fetchLiveMatches();
              }}
            >
              <Text style={[styles.retryButtonText, { color: isDark ? '#000000' : '#FFFFFF' }]}>
                {t.retry}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#000000' : '#FFFFFF' }]}>
      <ScrollView
        style={{ flex: 1 }}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor={isDark ? '#FFFFFF' : '#000000'}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <View style={[styles.liveIconContainer, { backgroundColor: '#00FF87' }]}>
              <Ionicons name="radio" size={20} color="#000000" />
            </View>
            <Text style={[styles.title, { color: isDark ? '#FFFFFF' : '#000000' }]}>
              {t.liveMatches}
            </Text>
          </View>
          {lastUpdate && (
            <Text style={[styles.lastUpdate, { color: '#999999' }]}>
              {t.updated}: {lastUpdate.toLocaleTimeString(language === 'fr' ? 'fr-FR' : 'en-US', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </Text>
          )}
        </View>

      {/* Liste des matchs */}
      {matches.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="football-outline" size={60} color={isDark ? '#333' : '#e0e0e0'} />
          <Text style={[styles.emptyText, { color: isDark ? '#999' : '#666' }]}>
            {t.noLiveMatches}
          </Text>
          <Text style={[styles.emptySubtext, { color: isDark ? '#666' : '#999' }]}>
            {language === 'fr' ? 'Tirez vers le bas pour actualiser' : 'Pull down to refresh'}
          </Text>
        </View>
      ) : (
        <View style={styles.matchesContainer}>
          {Object.entries(matchesByCompetition).map(([competitionId, data]) => (
            <View key={competitionId} style={styles.competitionSection}>
              {/* En-tête de compétition */}
              <View style={[styles.competitionHeader, { 
                backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5',
                borderBottomColor: isDark ? '#333' : '#e0e0e0'
              }]}>
                <View style={styles.competitionTitleContainer}>
                  {data.emblem && (
                    <Image 
                      source={{ uri: data.emblem }} 
                      style={styles.competitionEmblem}
                      resizeMode="contain"
                    />
                  )}
                  <Text style={[styles.competitionName, { color: isDark ? '#fff' : '#000' }]}>
                    {data.name}
                  </Text>
                </View>
                <View style={[styles.matchCountBadge, { backgroundColor: isDark ? '#2a2a2a' : '#e8e8e8' }]}>
                  <Text style={[styles.matchCountText, { color: isDark ? '#999' : '#666' }]}>
                    {data.matches.length}
                  </Text>
                </View>
              </View>
              
              {/* Matchs de la compétition */}
              <View style={styles.competitionMatches}>
                {data.matches.map((match) => renderMatch(match))}
              </View>
            </View>
          ))}
        </View>
      )}

      <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  liveIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
  },
  lastUpdate: {
    fontSize: 12,
    marginTop: 4,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  infoText: {
    fontSize: 12,
    flex: 1,
  },
  matchesContainer: {
    paddingHorizontal: 20,
    gap: 15,
  },
  matchCard: {
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 5,
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  competition: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00FF87',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#000000',
  },
  liveText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#000000',
  },
  finishedBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  finishedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  matchBody: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  teamContainer: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  teamLogo: {
    width: 50,
    height: 50,
  },
  teamName: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  scoreContainer: {
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  score: {
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: 1,
  },
  minuteText: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 4,
    color: '#FF3B30',
  },
  matchFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(128, 128, 128, 0.2)',
  },
  venue: {
    fontSize: 12,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    marginHorizontal: 40,
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 25,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  competitionSection: {
    marginBottom: 20,
  },
  competitionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  competitionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  competitionEmblem: {
    width: 24,
    height: 24,
  },
  competitionName: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  matchCountBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  matchCountText: {
    fontSize: 12,
    fontWeight: '600',
  },
  competitionMatches: {
    gap: 12,
  },
});
