import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  ScrollView,
  RefreshControl,
  Image,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { getUserFavorites, removeMatchFromFavorites } from '../services/favoritesService';
import { useLanguage } from '../contexts/LanguageContext';

export default function FavoritesScreen({ navigation }) {
  const { t, language } = useLanguage();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      setLoading(true);
      const data = await getUserFavorites();
      setFavorites(data);
    } catch (error) {
      console.error('Erreur chargement favoris:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadFavorites();
  };

  const handleRemoveFavorite = (matchId, homeTeam, awayTeam) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    Alert.alert(
      t.removeFromFavorites,
      `${homeTeam} vs ${awayTeam}\n\n${t.notificationWillBeCancelled}`,
      [
        { text: t.cancel, style: 'cancel' },
        {
          text: t.remove,
          style: 'destructive',
          onPress: async () => {
            try {
              await removeMatchFromFavorites(matchId);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              loadFavorites();
            } catch (error) {
              Alert.alert(t.error, error.message);
            }
          },
        },
      ]
    );
  };

  const handleMatchPress = (matchId) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('MatchDetails', { matchId });
  };

  const formatMatchTime = (date) => {
    if (!date) return '';
    
    const now = new Date();
    const diffDays = Math.floor((date - now) / (1000 * 60 * 60 * 24));
    
    const timeStr = date.toLocaleTimeString(language === 'fr' ? 'fr-FR' : 'en-US', { hour: '2-digit', minute: '2-digit' });
    
    if (diffDays === 0) {
      return `${t.todayAt} ${timeStr}`;
    } else if (diffDays === 1) {
      return `${t.tomorrowAt} ${timeStr}`;
    } else {
      return date.toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', { 
        weekday: 'short', 
        day: 'numeric', 
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const getTimeUntilMatch = (date) => {
    if (!date) return '';
    
    const now = new Date();
    const diff = date - now;
    
    if (diff < 0) return t.inProgress;
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours < 1) {
      return t.inXMin.replace('{{minutes}}', minutes);
    } else if (hours < 24) {
      return t.inXHours.replace('{{hours}}', hours).replace('{{minutes}}', minutes);
    } else {
      const days = Math.floor(hours / 24);
      return t.inXDaysShort.replace('{{days}}', days);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#000000' : '#FFFFFF' }]}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={[styles.backButton, { backgroundColor: isDark ? '#1A1A1A' : '#F5F5F5' }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigation.goBack();
            }}
          >
            <Ionicons name="arrow-back" size={24} color={isDark ? '#FFFFFF' : '#000000'} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: isDark ? '#FFFFFF' : '#000000' }]}>
            {t.myMatches}
          </Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.centerContainer}>
          <Text style={[styles.loadingText, { color: '#999999' }]}>{t.loading}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#000000' : '#FFFFFF' }]}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={[styles.backButton, { backgroundColor: isDark ? '#1A1A1A' : '#F5F5F5' }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            navigation.goBack();
          }}
        >
          <Ionicons name="arrow-back" size={24} color={isDark ? '#FFFFFF' : '#000000'} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: isDark ? '#FFFFFF' : '#000000' }]}>
          {t.myMatches}
        </Text>
        <View style={{ width: 40 }} />
      </View>

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
        {favorites.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="star-outline" size={80} color={isDark ? '#333' : '#E0E0E0'} />
            <Text style={[styles.emptyText, { color: isDark ? '#FFFFFF' : '#000000' }]}>
              {t.noFavoriteMatches}
            </Text>
            <Text style={[styles.emptySubtext, { color: '#999999' }]}>
              {t.addMatchesText}
            </Text>
          </View>
        ) : (
          <View style={styles.favoritesContainer}>
            <View style={[styles.infoCard, { 
              backgroundColor: isDark ? '#1A1A1A' : '#F0F8FF',
              borderColor: isDark ? '#333' : '#00FF87'
            }]}>
              <Ionicons name="notifications" size={20} color={isDark ? '#00FF87' : '#1976D2'} />
              <Text style={[styles.infoText, { color: isDark ? '#999' : '#666' }]}>
                {t.notificationBefore15Min}
              </Text>
            </View>

            {favorites.map((favorite) => (
              <View 
                key={favorite.id}
                style={[styles.matchCard, { 
                  backgroundColor: isDark ? '#121212' : '#F5F5F5',
                }]}
              >
                <TouchableOpacity
                  style={styles.matchContent}
                  onPress={() => handleMatchPress(favorite.matchId)}
                  activeOpacity={0.7}
                >
                  {/* Competition */}
                  <View style={styles.matchHeader}>
                    {favorite.competitionEmblem && (
                      <Image 
                        source={{ uri: favorite.competitionEmblem }}
                        style={styles.competitionLogo}
                        resizeMode="contain"
                      />
                    )}
                    <Text style={[styles.competition, { color: '#999999' }]}>
                      {favorite.competitionName}
                    </Text>
                  </View>

                  {/* Teams */}
                  <View style={styles.teamsContainer}>
                    <View style={styles.team}>
                      {favorite.homeTeam?.crest && (
                        <Image 
                          source={{ uri: favorite.homeTeam.crest }}
                          style={styles.teamLogo}
                          resizeMode="contain"
                        />
                      )}
                      <Text style={[styles.teamName, { color: isDark ? '#FFFFFF' : '#000000' }]} numberOfLines={2}>
                        {favorite.homeTeam?.shortName || favorite.homeTeam?.name}
                      </Text>
                    </View>

                    <Text style={[styles.vs, { color: '#999999' }]}>vs</Text>

                    <View style={styles.team}>
                      {favorite.awayTeam?.crest && (
                        <Image 
                          source={{ uri: favorite.awayTeam.crest }}
                          style={styles.teamLogo}
                          resizeMode="contain"
                        />
                      )}
                      <Text style={[styles.teamName, { color: isDark ? '#FFFFFF' : '#000000' }]} numberOfLines={2}>
                        {favorite.awayTeam?.shortName || favorite.awayTeam?.name}
                      </Text>
                    </View>
                  </View>

                  {/* Time Info */}
                  <View style={styles.timeInfo}>
                    <View style={[styles.timeBadge, { backgroundColor: isDark ? '#1A1A1A' : '#E3F2FD' }]}>
                      <Ionicons name="time-outline" size={16} color={isDark ? '#00FF87' : '#1976D2'} />
                      <Text style={[styles.timeText, { color: isDark ? '#00FF87' : '#1976D2' }]}>
                        {formatMatchTime(favorite.matchTime)}
                      </Text>
                    </View>
                    <Text style={[styles.countdown, { color: '#999999' }]}>
                      {getTimeUntilMatch(favorite.matchTime)}
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Remove Button */}
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemoveFavorite(
                    favorite.matchId,
                    favorite.homeTeam?.name,
                    favorite.awayTeam?.name
                  )}
                  activeOpacity={0.7}
                >
                  <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            ))}

            <View style={{ height: 40 }} />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 20,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  favoritesContainer: {
    padding: 16,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    marginLeft: 12,
    lineHeight: 18,
  },
  matchCard: {
    borderRadius: 18,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  matchContent: {
    padding: 16,
  },
  matchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  competitionLogo: {
    width: 16,
    height: 16,
    marginRight: 6,
  },
  competition: {
    fontSize: 12,
    fontWeight: '600',
  },
  teamsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  team: {
    flex: 1,
    alignItems: 'center',
  },
  teamLogo: {
    width: 40,
    height: 40,
    marginBottom: 8,
  },
  teamName: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  vs: {
    fontSize: 12,
    fontWeight: '600',
    marginHorizontal: 8,
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  timeText: {
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 6,
  },
  countdown: {
    fontSize: 12,
    fontWeight: '600',
  },
  removeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
