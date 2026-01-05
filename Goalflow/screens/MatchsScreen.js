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
  SafeAreaView,
  Modal,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { getTodayMatches, getMatchesByDate, formatMatchStatus, formatMatchTime } from '../services/footballDataService';
import { isMatchFavorite, toggleMatchFavorite } from '../services/favoritesService';
import DateCalendar from '../components/DateCalendar';

export default function MatchsScreen({ navigation }) {
  const { isDark } = useTheme();
  const { t, language } = useLanguage();

  const [matches, setMatches] = useState([]);
  const [matchesByCompetition, setMatchesByCompetition] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [favorites, setFavorites] = useState({});

  // Fonction pour regrouper les matchs par compétition
  const groupMatchesByCompetition = (matchesArray) => {
    const grouped = {};
    
    matchesArray.forEach((match) => {
      const compName = match.competition?.name || t.other;
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

  // Fonction pour récupérer les matchs du jour ou d'une date spécifique
  const fetchTodayMatches = async (isRefresh = false, date = null) => {
    try {
      if (!isRefresh) setLoading(true);
      setError(null);

      let matchesData;
      if (date) {
        matchesData = await getMatchesByDate(date);
      } else {
        matchesData = await getTodayMatches();
      }
      
      setMatches(matchesData);
      
      // Regrouper par compétition
      const grouped = groupMatchesByCompetition(matchesData);
      setMatchesByCompetition(grouped);
    } catch (err) {
      setError(err.message);
      console.error('Erreur:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Chargement initial
  useEffect(() => {
    fetchTodayMatches();
    loadFavorites();
  }, []);

  // Charge l'état des favoris
  const loadFavorites = async () => {
    try {
      const favMap = {};
      for (const match of matches) {
        favMap[match.id] = await isMatchFavorite(match.id);
      }
      setFavorites(favMap);
    } catch (error) {
      console.error('Erreur chargement favoris:', error);
    }
  };

  // Recharge favoris quand les matchs changent
  useEffect(() => {
    if (matches.length > 0) {
      loadFavorites();
    }
  }, [matches]);

  // Auto-refresh pour les matchs en direct (30 secondes)
  useEffect(() => {
    const hasLiveMatches = matches.some(match => 
      match.status === 'IN_PLAY' || match.status === 'PAUSED' || match.status === 'LIVE'
    );

    if (hasLiveMatches) {
      const interval = setInterval(() => {
        console.log('Auto-refresh des matchs en direct...');
        fetchTodayMatches(true, selectedDate);
      }, 30000); // 30 secondes

      return () => clearInterval(interval);
    }
  }, [matches, selectedDate]);

  // Pull to refresh
  const onRefresh = () => {
    setRefreshing(true);
    fetchTodayMatches(true, selectedDate);
  };

  // Gestion de la sélection de date
  const handleDateSelect = (date) => {
    setSelectedDate(date);
    fetchTodayMatches(false, date);
  };

  // Formater la date pour l'affichage
  const formatSelectedDate = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selected = new Date(selectedDate);
    selected.setHours(0, 0, 0, 0);
    
    if (selected.getTime() === today.getTime()) {
      return t.matchesOfDay;
    } else {
      const options = { day: 'numeric', month: 'long' };
      const dateStr = selectedDate.toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', options);
      return `${t.matchesOf} ${dateStr}`;
    }
  };

  // Navigation vers les détails
  const handleMatchPress = (matchId) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('MatchDetails', { matchId });
  };

  // Toggle favori
  const handleToggleFavorite = async (match) => {
    try {
      // Vérifie si le match est à venir
      const matchTime = new Date(match.utcDate);
      if (matchTime <= new Date()) {
        Alert.alert(
          language === 'fr' ? 'Match déjà commencé' : 'Match already started',
          t.matchAlreadyStarted
        );
        return;
      }

      const newFavoriteState = await toggleMatchFavorite(match);
      setFavorites(prev => ({ ...prev, [match.id]: newFavoriteState }));
      
      Haptics.notificationAsync(
        newFavoriteState 
          ? Haptics.NotificationFeedbackType.Success 
          : Haptics.NotificationFeedbackType.Warning
      );

      if (newFavoriteState) {
        Alert.alert(
          t.addedToFavorites,
          t.notificationInfo,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert(t.error, error.message);
    }
  };

  // Ouvrir la recherche
  const handleOpenSearch = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowSearchModal(true);
  };

  // Ouvrir le calendrier
  const handleOpenCalendar = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowDatePicker(true);
  };

  // Filtrer les matchs selon la recherche
  const getFilteredMatches = () => {
    if (!searchQuery.trim()) return matches;
    
    const query = searchQuery.toLowerCase();
    return matches.filter(match => 
      match.homeTeam?.name?.toLowerCase().includes(query) ||
      match.awayTeam?.name?.toLowerCase().includes(query) ||
      match.competition?.name?.toLowerCase().includes(query)
    );
  };

  // Générer les dates pour le date picker
  const generatePickerDates = () => {
    const dates = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // 4 jours avant
    for (let i = 4; i > 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      dates.push(date);
    }
    
    // Aujourd'hui
    dates.push(new Date(today));
    
    // 15 jours après
    for (let i = 1; i <= 15; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      dates.push(date);
    }
    
    return dates;
  };

  const handlePickerDateSelect = (date) => {
    setSelectedDate(date);
    fetchTodayMatches(false, date);
    setShowDatePicker(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // Rendu d'un match
  const renderMatch = (match) => {
    // Déterminer le type de match (passé, aujourd'hui, futur)
    const matchDate = new Date(match.utcDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDay = new Date(selectedDate);
    selectedDay.setHours(0, 0, 0, 0);
    
    const isPastMatch = matchDate < today;
    const isTodayMatch = matchDate.toDateString() === today.toDateString();
    const isFutureMatch = matchDate > today;
    
    // Logique correcte pour le score selon le statut
    let homeScore, awayScore;
    
    if (match.status === 'FINISHED') {
      // Match terminé: utiliser fullTime (score final)
      homeScore = match.score?.fullTime?.home ?? match.score?.fullTime?.homeTeam ?? '-';
      awayScore = match.score?.fullTime?.away ?? match.score?.fullTime?.awayTeam ?? '-';
    } else if (match.status === 'IN_PLAY' || match.status === 'PAUSED' || match.status === 'LIVE') {
      // Match en cours: essayer tous les champs possibles
      // L'API peut retourner le score dans différents champs
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
      
      // Log pour déboggage
      if (match.status === 'IN_PLAY' || match.status === 'LIVE') {
        console.log(`Match LIVE: ${match.homeTeam?.name} ${homeScore}-${awayScore} ${match.awayTeam?.name}`);
        console.log('Score data:', JSON.stringify(match.score, null, 2));
      }
    } else {
      // Autres statuts (SCHEDULED, TIMED, etc.)
      homeScore = match.score?.fullTime?.home ?? match.score?.fullTime?.homeTeam ?? '-';
      awayScore = match.score?.fullTime?.away ?? match.score?.fullTime?.awayTeam ?? '-';
    }
    
    const status = formatMatchStatus(match.status);
    const isLive = match.status === 'IN_PLAY' || match.status === 'LIVE';
    const isScheduled = match.status === 'SCHEDULED' || match.status === 'TIMED';
    const minute = match.minute || match.currentMinute || null;

    return (
      <TouchableOpacity
        key={match.id}
        style={[styles.matchCard, { backgroundColor: isDark ? '#121212' : '#F5F5F5' }]}
        onPress={() => handleMatchPress(match.id)}
        activeOpacity={0.7}
      >
        {/* Header */}
        <View style={styles.matchHeader}>
          <View style={styles.matchHeaderLeft}>
            <Text style={[styles.competition, { color: '#999999' }]}>
              {match.competition?.name || t.competition}
            </Text>
            {isLive && (
              <View style={styles.liveBadge}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>{t.live}</Text>
              </View>
            )}
            {isScheduled && isFutureMatch && (
              <View style={[styles.futureBadge, { backgroundColor: isDark ? '#333333' : '#E3F2FD' }]}>
                <Text style={[styles.futureBadgeText, { color: isDark ? '#999999' : '#1976D2' }]}>{t.upcoming}</Text>
              </View>
            )}
            {isPastMatch && match.status === 'FINISHED' && (
              <View style={[styles.finishedBadge, { backgroundColor: isDark ? '#1A1A1A' : '#E0E0E0' }]}>
                <Text style={[styles.finishedBadgeText, { color: isDark ? '#666666' : '#999999' }]}>{t.finished}</Text>
              </View>
            )}
          </View>
          <TouchableOpacity 
            style={[styles.favoriteButton, { backgroundColor: isDark ? '#1A1A1A' : '#F5F5F5' }]}
            onPress={(e) => {
              e.stopPropagation();
              handleToggleFavorite(match);
            }}
            activeOpacity={0.7}
          >
            <Ionicons 
              name={favorites[match.id] ? "star" : "star-outline"} 
              size={20} 
              color={favorites[match.id] ? "#FFD700" : (isDark ? '#666666' : '#999999')} 
            />
          </TouchableOpacity>
        </View>

        {/* Corps du match */}
        <View style={styles.matchBody}>
          {/* Équipe domicile */}
          <View style={styles.teamContainer}>
            <Image
              source={{ uri: match.homeTeam?.crest }}
              style={styles.teamLogo}
              resizeMode="contain"
            />
            <Text style={[styles.teamName, { color: isDark ? '#FFFFFF' : '#000000' }]} numberOfLines={1}>
              {match.homeTeam?.shortName || match.homeTeam?.name}
            </Text>
          </View>

          {/* Score ou heure */}
          <View style={styles.scoreContainer}>
            {isScheduled ? (
              // Match futur ou match du jour non commencé: afficher l'heure
              <>
                <Text style={[styles.matchTime, { color: isDark ? '#FFFFFF' : '#000000', fontWeight: '700' }]}>
                  {formatMatchTime(match.utcDate)}
                </Text>
              </>
            ) : (
              // Match terminé ou en cours: afficher le score
              <>
                <Text style={[styles.score, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                  {homeScore} - {awayScore}
                </Text>
                {isLive && minute && (
                  <Text style={[styles.minuteText, { color: '#00FF87' }]}>
                    {minute}'
                  </Text>
                )}
              </>
            )}
          </View>

          {/* Équipe extérieure */}
          <View style={styles.teamContainer}>
            <Image
              source={{ uri: match.awayTeam?.crest }}
              style={styles.teamLogo}
              resizeMode="contain"
            />
            <Text style={[styles.teamName, { color: isDark ? '#FFFFFF' : '#000000' }]} numberOfLines={1}>
              {match.awayTeam?.shortName || match.awayTeam?.name}
            </Text>
          </View>
        </View>

        {/* Flèche pour indiquer qu'on peut cliquer */}
        <View style={styles.arrowContainer}>
          <Ionicons name="chevron-forward" size={20} color="#666666" />
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: isDark ? '#000000' : '#FFFFFF' }]}>
        <ActivityIndicator size="large" color={isDark ? '#FFFFFF' : '#000000'} />
        <Text style={[styles.loadingText, { color: '#999999' }]}>
          Chargement des matchs...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={60} color="#666666" />
        <Text style={[styles.errorText, { color: '#FFFFFF' }]}>Erreur</Text>
        <Text style={[styles.errorMessage, { color: '#999999' }]}>{error}</Text>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: '#FFFFFF' }]}
          onPress={() => fetchTodayMatches()}
        >
          <Text style={[styles.retryText, { color: '#000000' }]}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#000000' : '#FFFFFF' }]}>
      {/* Header Sticky: Titre + Calendrier */}
      <View style={styles.stickyHeader}>
        {/* Titre */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.headerLeft}>
              <Ionicons name="football" size={28} color={isDark ? '#FFFFFF' : '#000000'} />
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={[styles.title, { color: isDark ? '#FFFFFF' : '#000000' }]} numberOfLines={1}>{formatSelectedDate()}</Text>
              </View>
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity 
                style={[styles.iconButton, { backgroundColor: isDark ? '#1A1A1A' : '#F5F5F5' }]} 
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  navigation.navigate('Favorites');
                }}
                activeOpacity={0.5}
              >
                <Ionicons name="star" size={24} color="#FFD700" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.iconButton, { backgroundColor: isDark ? '#1A1A1A' : '#F5F5F5' }]} 
                onPress={handleOpenSearch}
                activeOpacity={0.5}
              >
                <Ionicons name="search-outline" size={24} color={isDark ? '#FFFFFF' : '#000000'} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.iconButton, { backgroundColor: isDark ? '#1A1A1A' : '#F5F5F5' }]} 
                onPress={handleOpenCalendar}
                activeOpacity={0.5}
              >
                <Ionicons name="calendar-outline" size={24} color={isDark ? '#FFFFFF' : '#000000'} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
        
        {/* Séparation visuelle */}
        <View style={[styles.separator, { backgroundColor: isDark ? '#1A1A1A' : '#E0E0E0' }]} />
      </View>
      
      {/* Liste scrollable */}
      <ScrollView
        style={{ flex: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >

      {/* Liste des matchs */}
      {matches.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="calendar-outline" size={80} color="#333333" />
          <Text style={[styles.emptyTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
            {t.noMatches}
          </Text>
          <Text style={[styles.emptySubtitle, { color: '#666666' }]}>
            {language === 'fr' ? 'Tirez pour actualiser' : 'Pull to refresh'}
          </Text>
        </View>
      ) : (
        <View style={styles.competitionsContainer}>
          {Object.entries(matchesByCompetition).map(([compId, data]) => (
            <View key={compId} style={styles.competitionSection}>
              {/* Header de la compétition */}
              <View style={[styles.competitionHeader, { backgroundColor: isDark ? '#0A0A0A' : '#F5F5F5' }]}>
                {data.emblem && (
                  <Image
                    source={{ uri: data.emblem }}
                    style={styles.competitionEmblem}
                    resizeMode="contain"
                  />
                )}
                <Text style={[styles.competitionName, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                  {data.name}
                </Text>
                <View style={[styles.competitionBadge, { backgroundColor: isDark ? '#000000' : '#E0E0E0' }]}>
                  <Text style={[styles.competitionCount, { color: '#999999' }]}>
                    {data.matches.length}
                  </Text>
                </View>
              </View>

              {/* Matchs de cette compétition */}
              <View style={styles.competitionMatches}>
                {data.matches.map((match) => renderMatch(match))}
              </View>
            </View>
          ))}
        </View>
      )}

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Modal de recherche */}
      <Modal
        visible={showSearchModal}
        transparent={false}
        animationType="slide"
        onRequestClose={() => setShowSearchModal(false)}
      >
        <SafeAreaView style={[styles.searchModalContainer, { backgroundColor: isDark ? '#000000' : '#FFFFFF' }]}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
          >
            <View style={[styles.searchModalContent, { backgroundColor: isDark ? '#000000' : '#FFFFFF' }]}>
              <View style={[styles.modalHeader, { borderBottomColor: isDark ? '#1A1A1A' : '#E0E0E0' }]}>
                <View>
                  <Text style={[styles.modalTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>{t.search}</Text>
                  {searchQuery.length > 0 && (
                    <Text style={styles.resultsCount}>
                      {getFilteredMatches().length} {getFilteredMatches().length > 1 ? t.results : t.result}
                    </Text>
                  )}
                </View>
                <TouchableOpacity onPress={() => {
                  setShowSearchModal(false);
                  setSearchQuery('');
                }}>
                  <Ionicons name="close" size={28} color={isDark ? '#FFFFFF' : '#000000'} />
                </TouchableOpacity>
              </View>
              
              <View style={[styles.searchInputContainer, { backgroundColor: isDark ? '#1A1A1A' : '#F5F5F5' }]}>
                <Ionicons name="search-outline" size={20} color="#999999" />
                <TextInput
                  style={[styles.searchInput, { color: isDark ? '#FFFFFF' : '#000000' }]}
                  placeholder={t.searchPlaceholder}
                  placeholderTextColor="#666666"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoFocus={true}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <Ionicons name="close-circle" size={20} color="#666666" />
                  </TouchableOpacity>
                )}
              </View>

              <ScrollView 
                style={styles.searchResults}
                contentContainerStyle={styles.searchResultsContent}
                keyboardShouldPersistTaps="handled"
              >
                {getFilteredMatches().length === 0 ? (
                  <View style={styles.emptySearch}>
                    <Ionicons name="search-outline" size={60} color="#333333" />
                    <Text style={styles.emptySearchText}>
                      {searchQuery 
                        ? `${t.noResultsFor} "${searchQuery}"`
                        : t.typeToSearch}
                    </Text>
                    {searchQuery && matches.length > 0 && (
                      <Text style={styles.emptySearchHint}>
                        {t.searchAmong} {matches.length} {matches.length > 1 ? t.matchesOn : t.matchOn} {formatSelectedDate().toLowerCase()}
                      </Text>
                    )}
                  </View>
                ) : (
                  getFilteredMatches().map((match) => (
                    <TouchableOpacity
                      key={match.id}
                      style={[styles.searchResultItem, { backgroundColor: isDark ? '#1A1A1A' : '#F5F5F5' }]}
                      onPress={() => {
                        setShowSearchModal(false);
                        setSearchQuery('');
                        handleMatchPress(match.id);
                      }}
                    >
                      <View style={styles.searchTeams}>
                        <Text style={[styles.searchTeamName, { color: isDark ? '#FFFFFF' : '#000000' }]} numberOfLines={1}>{match.homeTeam?.name}</Text>
                        <Text style={styles.searchVs}>vs</Text>
                        <Text style={[styles.searchTeamName, { color: isDark ? '#FFFFFF' : '#000000' }]} numberOfLines={1}>{match.awayTeam?.name}</Text>
                      </View>
                      <Text style={styles.searchCompetition}>{match.competition?.name}</Text>
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      {/* Modal du date picker */}
      <Modal
        visible={showDatePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: isDark ? '#121212' : '#FFFFFF' }]}>
            <View style={[styles.modalHeader, { borderBottomColor: isDark ? '#1A1A1A' : '#E0E0E0' }]}>
              <Text style={[styles.modalTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>Choisir une date</Text>
              <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                <Ionicons name="close" size={28} color={isDark ? '#FFFFFF' : '#000000'} />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={generatePickerDates()}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) => {
                const isSelected = item.toDateString() === selectedDate.toDateString();
                const isToday = item.toDateString() === new Date().toDateString();
                
                const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
                const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
                
                return (
                  <TouchableOpacity
                    style={[
                      styles.datePickerItem,
                      { backgroundColor: isDark ? '#1A1A1A' : '#F5F5F5' },
                      isSelected && { backgroundColor: '#00FF87' }
                    ]}
                    onPress={() => handlePickerDateSelect(item)}
                  >
                    <View style={styles.datePickerItemContent}>
                      <Text style={[
                        styles.datePickerDay,
                        { color: isSelected ? '#000000' : '#999999' }
                      ]}>
                        {dayNames[item.getDay()]}
                      </Text>
                      <Text style={[
                        styles.datePickerDate,
                        { color: isSelected ? '#000000' : (isDark ? '#FFFFFF' : '#000000') }
                      ]}>
                        {item.getDate()} {monthNames[item.getMonth()]}
                      </Text>
                      {isToday && (
                        <View style={styles.todayBadgeSmall}>
                          <Text style={styles.todayBadgeText}>Aujourd'hui</Text>
                        </View>
                      )}
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={24} color="#00FF87" />
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  stickyHeader: {
  },
  separator: {
    height: 1,
    backgroundColor: '#1A1A1A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#000000',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
  },
  errorText: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 10,
  },
  errorMessage: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 30,
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  retryText: {
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    flex: 1,
    marginRight: 12,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  competitionsContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  competitionSection: {
    marginBottom: 24,
  },
  competitionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 16,
    gap: 12,
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
  competitionBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  competitionCount: {
    fontSize: 12,
    fontWeight: '600',
  },
  competitionMatches: {
    gap: 16,
  },
  matchList: {
    paddingHorizontal: 20,
  },
  matchCard: {
    borderRadius: 18,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 5,
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  matchHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  favoriteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  competition: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: '#00FF87',
    gap: 4,
  },
  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#000000',
  },
  liveText: {
    color: '#000000',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  futureBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  futureBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  finishedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  finishedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  matchBody: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  teamContainer: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  teamLogo: {
    width: 40,
    height: 40,
  },
  teamName: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  scoreContainer: {
    paddingHorizontal: 15,
    alignItems: 'center',
  },
  score: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  minuteText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 4,
    color: '#ff3b30',
  },
  matchTime: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  statusText: {
    fontSize: 11,
    marginTop: 2,
  },
  futureLabel: {
    fontSize: 11,
    marginTop: 4,
    fontWeight: '500',
  },
  arrowContainer: {
    position: 'absolute',
    right: 15,
    top: '50%',
    marginTop: -10,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'flex-end',
  },
  searchModalContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  modalContent: {
    backgroundColor: '#121212',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  searchModalContent: {
    flex: 1,
    backgroundColor: '#000000',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  resultsCount: {
    fontSize: 12,
    color: '#999999',
    marginTop: 4,
  },
  // Search modal styles
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    margin: 20,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
  },
  searchResults: {
    flex: 1,
  },
  searchResultsContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  emptySearch: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptySearchText: {
    color: '#666666',
    fontSize: 16,
    marginTop: 12,
    textAlign: 'center',
  },
  emptySearchHint: {
    color: '#444444',
    fontSize: 13,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  searchResultItem: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  searchTeams: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  searchTeamName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  searchVs: {
    color: '#666666',
    fontSize: 12,
  },
  searchCompetition: {
    color: '#999999',
    fontSize: 12,
  },
  // Date picker styles
  datePickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 12,
  },
  datePickerItemSelected: {
    backgroundColor: '#00FF87',
  },
  datePickerItemContent: {
    flex: 1,
  },
  datePickerDay: {
    color: '#999999',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  datePickerDate: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  datePickerTextSelected: {
    color: '#000000',
  },
  todayBadgeSmall: {
    backgroundColor: '#00FF87',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  todayBadgeText: {
    color: '#000000',
    fontSize: 10,
    fontWeight: '700',
  },
});
