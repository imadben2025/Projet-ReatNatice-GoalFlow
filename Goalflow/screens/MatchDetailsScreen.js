import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import {
  getMatchDetails,
  formatMatchStatus,
} from '../services/footballDataService';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';

export default function MatchDetailsScreen({ route, navigation }) {
  const { matchId } = route.params;
  const { t, language } = useLanguage();
  const { isDark } = useTheme();

  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Fonction pour récupérer les détails du match
  const fetchMatchDetails = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      setError(null);

      const matchData = await getMatchDetails(matchId);
      setMatch(matchData);
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
    fetchMatchDetails();
  }, [matchId]);

  // Auto-refresh si match LIVE (60 secondes)
  useEffect(() => {
    if (match && (match.status === 'IN_PLAY' || match.status === 'PAUSED')) {
      const interval = setInterval(() => {
        fetchMatchDetails(true);
      }, 60000);

      return () => clearInterval(interval);
    }
  }, [match]);

  // Pull to refresh
  const onRefresh = () => {
    setRefreshing(true);
    fetchMatchDetails(true);
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#000000' : '#FFFFFF' }]}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={isDark ? '#FFFFFF' : '#000000'} />
          <Text style={[styles.loadingText, { color: isDark ? '#999999' : '#666666' }]}>
            {t.loadingMatch}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#000000' : '#FFFFFF' }]}>
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={60} color={isDark ? '#666666' : '#999999'} />
          <Text style={[styles.errorText, { color: isDark ? '#FFFFFF' : '#000000' }]}>{t.error}</Text>
          <Text style={[styles.errorMessage, { color: isDark ? '#999999' : '#666666' }]}>{error}</Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: isDark ? '#00FF87' : '#000000' }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              fetchMatchDetails();
            }}
          >
            <Text style={[styles.retryText, { color: isDark ? '#000000' : '#FFFFFF' }]}>{t.retry}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!match) return null;

  // Football-Data.org: logique correcte pour le score selon le statut
  let homeScore, awayScore;
  
  if (match.status === 'FINISHED') {
    homeScore = match.score?.fullTime?.home ?? '-';
    awayScore = match.score?.fullTime?.away ?? '-';
  } else if (match.status === 'IN_PLAY' || match.status === 'PAUSED' || match.status === 'LIVE') {
    // Match en cours: essayer tous les champs possibles
    homeScore = match.score?.regularTime?.home ?? 
                match.score?.fullTime?.home ?? 
                match.score?.home ??
                0;
    awayScore = match.score?.regularTime?.away ?? 
                match.score?.fullTime?.away ?? 
                match.score?.away ??
                0;
    
    // Log pour déboggage
    console.log(`Match LIVE Details: ${match.homeTeam?.name} ${homeScore}-${awayScore} ${match.awayTeam?.name}`);
    console.log('Score data:', JSON.stringify(match.score, null, 2));
  } else {
    homeScore = match.score?.fullTime?.home ?? '-';
    awayScore = match.score?.fullTime?.away ?? '-';
  }
  
  const halfTimeHome = match.score?.halfTime?.home;
  const halfTimeAway = match.score?.halfTime?.away;
  const status = formatMatchStatus(match.status);
  const isLive = match.status === 'IN_PLAY' || match.status === 'PAUSED';

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
        {/* Header avec bouton retour */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigation.goBack();
            }} 
            style={[styles.backButton, { backgroundColor: isDark ? '#1A1A1A' : '#F5F5F5' }]}
          >
            <Ionicons name="arrow-back" size={24} color={isDark ? '#FFFFFF' : '#000000'} />
          </TouchableOpacity>
          <Text style={[styles.competition, { color: isDark ? '#FFFFFF' : '#000000' }]} numberOfLines={1}>
            {match.competition?.name || t.match}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Badge statut */}
        <View style={styles.statusContainer}>
          {isLive ? (
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>{t.liveStatus}</Text>
            </View>
          ) : match.status === 'FINISHED' ? (
            <View style={[styles.finishedBadge, { backgroundColor: isDark ? '#1A1A1A' : '#E0E0E0' }]}>
              <Text style={[styles.finishedBadgeText, { color: isDark ? '#666666' : '#999999' }]}>{t.finishedStatus}</Text>
            </View>
          ) : (
            <View style={[styles.scheduledBadge, { backgroundColor: isDark ? '#333333' : '#E3F2FD' }]}>
              <Text style={[styles.scheduledBadgeText, { color: isDark ? '#FFFFFF' : '#1976D2' }]}>{t.scheduledStatus}</Text>
            </View>
          )}
        </View>

        {/* Score principal */}
        <View style={styles.scoreSection}>
          {/* Équipe domicile */}
          <View style={styles.team}>
            {match.homeTeam?.crest && (
              <Image
                source={{ uri: match.homeTeam.crest }}
                style={styles.teamLogo}
                resizeMode="contain"
              />
            )}
            <Text style={[styles.teamName, { color: isDark ? '#FFFFFF' : '#000000' }]} numberOfLines={2}>
              {match.homeTeam?.name || t.homeTeam}
            </Text>
          </View>

          {/* Score */}
          <View style={styles.scoreBox}>
            <Text style={[styles.score, { color: isDark ? '#FFFFFF' : '#000000' }]}>
              {homeScore} - {awayScore}
            </Text>
            {halfTimeHome !== null && halfTimeHome !== undefined && halfTimeAway !== null && halfTimeAway !== undefined && (
              <Text style={[styles.halfTime, { color: isDark ? '#666666' : '#999999' }]}>
                {t.halfTime}: {halfTimeHome} - {halfTimeAway}
              </Text>
            )}
          </View>

          {/* Équipe extérieure */}
          <View style={styles.team}>
            {match.awayTeam?.crest && (
              <Image
                source={{ uri: match.awayTeam.crest }}
                style={styles.teamLogo}
                resizeMode="contain"
              />
            )}
            <Text style={[styles.teamName, { color: isDark ? '#FFFFFF' : '#000000' }]} numberOfLines={2}>
              {match.awayTeam?.name || t.awayTeam}
            </Text>
          </View>
        </View>

        {/* Informations du match */}
        <View style={styles.infoSection}>
          <View style={[styles.infoCard, { backgroundColor: isDark ? '#121212' : '#F5F5F5' }]}>
            {/* Date */}
            {match.utcDate && (
              <View style={styles.infoRow}>
                <View style={[styles.iconContainer, { backgroundColor: isDark ? '#1A1A1A' : '#E0E0E0' }]}>
                  <Ionicons name="calendar-outline" size={20} color={isDark ? '#00FF87' : '#1976D2'} />
                </View>
                <Text style={[styles.infoLabel, { color: isDark ? '#999999' : '#666666' }]}>{t.date}</Text>
                <Text style={[styles.infoValue, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                  {new Date(match.utcDate).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </Text>
              </View>
            )}

            {/* Heure */}
            {match.utcDate && (
              <View style={styles.infoRow}>
                <View style={[styles.iconContainer, { backgroundColor: isDark ? '#1A1A1A' : '#E0E0E0' }]}>
                  <Ionicons name="time-outline" size={20} color={isDark ? '#00FF87' : '#1976D2'} />
                </View>
                <Text style={[styles.infoLabel, { color: isDark ? '#999999' : '#666666' }]}>{t.time}</Text>
                <Text style={[styles.infoValue, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                  {new Date(match.utcDate).toLocaleTimeString(language === 'fr' ? 'fr-FR' : 'en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
            )}

            {/* Stade */}
            {match.venue && (
              <View style={styles.infoRow}>
                <View style={[styles.iconContainer, { backgroundColor: isDark ? '#1A1A1A' : '#E0E0E0' }]}>
                  <Ionicons name="location-outline" size={20} color={isDark ? '#00FF87' : '#1976D2'} />
                </View>
                <Text style={[styles.infoLabel, { color: isDark ? '#999999' : '#666666' }]}>{t.venue}</Text>
                <Text style={[styles.infoValue, { color: isDark ? '#FFFFFF' : '#000000' }]} numberOfLines={2}>
                  {match.venue}
                </Text>
              </View>
            )}

            {/* Journée */}
            {match.matchday && (
              <View style={styles.infoRow}>
                <View style={[styles.iconContainer, { backgroundColor: isDark ? '#1A1A1A' : '#E0E0E0' }]}>
                  <Ionicons name="flag-outline" size={20} color={isDark ? '#00FF87' : '#1976D2'} />
                </View>
                <Text style={[styles.infoLabel, { color: isDark ? '#999999' : '#666666' }]}>{t.matchday}</Text>
                <Text style={[styles.infoValue, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                  {language === 'fr' ? 'J' : 'MD'}{match.matchday}
                </Text>
              </View>
            )}
          </View>
        </View>

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
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  competition: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 10,
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00FF87',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 8,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#000000',
  },
  liveText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#000000',
  },
  finishedBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  finishedBadgeText: {
    fontSize: 14,
    fontWeight: '700',
  },
  scheduledBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  scheduledBadgeText: {
    fontSize: 14,
    fontWeight: '700',
  },
  scoreSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  team: {
    flex: 1,
    alignItems: 'center',
    gap: 12,
  },
  teamLogo: {
    width: 80,
    height: 80,
  },
  teamName: {
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  scoreBox: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  score: {
    fontSize: 52,
    fontWeight: '800',
    letterSpacing: 2,
  },
  halfTime: {
    fontSize: 14,
    marginTop: 8,
    fontWeight: '600',
  },
  infoSection: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  infoCard: {
    borderRadius: 18,
    padding: 20,
    gap: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 5,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
    flex: 1,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'right',
    flex: 2,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  errorText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
  },
  errorMessage: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    marginHorizontal: 40,
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 25,
  },
  retryText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
