import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { saveFavoriteTeam, getFavoriteTeam } from '../services/userService';
import { checkTeamNewsNow } from '../services/teamNewsNotificationService';
import * as Haptics from 'expo-haptics';

// Liste des équipes populaires par compétition
const POPULAR_TEAMS = [
  // Premier League
  { id: 57, name: 'Arsenal FC', shortName: 'Arsenal', crest: 'https://crests.football-data.org/57.png', league: 'Premier League' },
  { id: 65, name: 'Manchester City FC', shortName: 'Man City', crest: 'https://crests.football-data.org/65.png', league: 'Premier League' },
  { id: 66, name: 'Manchester United FC', shortName: 'Man United', crest: 'https://crests.football-data.org/66.png', league: 'Premier League' },
  { id: 64, name: 'Liverpool FC', shortName: 'Liverpool', crest: 'https://crests.football-data.org/64.png', league: 'Premier League' },
  { id: 61, name: 'Chelsea FC', shortName: 'Chelsea', crest: 'https://crests.football-data.org/61.png', league: 'Premier League' },
  { id: 73, name: 'Tottenham Hotspur FC', shortName: 'Tottenham', crest: 'https://crests.football-data.org/73.png', league: 'Premier League' },
  
  // La Liga
  { id: 81, name: 'FC Barcelona', shortName: 'Barcelona', crest: 'https://crests.football-data.org/81.png', league: 'La Liga' },
  { id: 86, name: 'Real Madrid CF', shortName: 'Real Madrid', crest: 'https://crests.football-data.org/86.png', league: 'La Liga' },
  { id: 78, name: 'Atlético Madrid', shortName: 'Atlético', crest: 'https://crests.football-data.org/78.png', league: 'La Liga' },
  { id: 90, name: 'Sevilla FC', shortName: 'Sevilla', crest: 'https://crests.football-data.org/90.png', league: 'La Liga' },
  
  // Bundesliga
  { id: 5, name: 'FC Bayern München', shortName: 'Bayern', crest: 'https://crests.football-data.org/5.png', league: 'Bundesliga' },
  { id: 4, name: 'Borussia Dortmund', shortName: 'Dortmund', crest: 'https://crests.football-data.org/4.png', league: 'Bundesliga' },
  { id: 11, name: 'RB Leipzig', shortName: 'RB Leipzig', crest: 'https://crests.football-data.org/11.png', league: 'Bundesliga' },
  
  // Serie A
  { id: 109, name: 'Juventus FC', shortName: 'Juventus', crest: 'https://crests.football-data.org/109.png', league: 'Serie A' },
  { id: 98, name: 'AC Milan', shortName: 'Milan', crest: 'https://crests.football-data.org/98.png', league: 'Serie A' },
  { id: 108, name: 'Inter Milan', shortName: 'Inter', crest: 'https://crests.football-data.org/108.png', league: 'Serie A' },
  { id: 100, name: 'AS Roma', shortName: 'Roma', crest: 'https://crests.football-data.org/100.png', league: 'Serie A' },
  
  // Ligue 1
  { id: 524, name: 'Paris Saint-Germain FC', shortName: 'PSG', crest: 'https://crests.football-data.org/524.png', league: 'Ligue 1' },
  { id: 516, name: 'Olympique de Marseille', shortName: 'Marseille', crest: 'https://crests.football-data.org/516.png', league: 'Ligue 1' },
  { id: 523, name: 'Olympique Lyonnais', shortName: 'Lyon', crest: 'https://crests.football-data.org/523.png', league: 'Ligue 1' },
  { id: 521, name: 'AS Monaco FC', shortName: 'Monaco', crest: 'https://crests.football-data.org/521.png', league: 'Ligue 1' },
];

export default function TeamSelectionScreen({ navigation }) {
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSavedTeam();
  }, []);

  const loadSavedTeam = async () => {
    try {
      const savedTeam = await getFavoriteTeam();
      if (savedTeam) {
        setSelectedTeam(savedTeam);
      }
    } catch (error) {
      console.error('Erreur lors du chargement de l\'équipe:', error);
    }
  };

  const handleSelectTeam = async (team) => {
    setSelectedTeam(team);
    setSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    try {
      await saveFavoriteTeam(team);
      
      // Déclencher une vérification immédiate des actualités de la nouvelle équipe
      await checkTeamNewsNow();
      
      setTimeout(() => {
        setSaving(false);
        navigation.goBack();
      }, 500);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de l\'équipe:', error);
      setSaving(false);
    }
  };

  const filteredTeams = POPULAR_TEAMS.filter(team =>
    team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    team.shortName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    team.league.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderTeam = ({ item }) => {
    const isSelected = selectedTeam?.id === item.id;
    
    return (
      <TouchableOpacity
        style={[
          styles.teamCard,
          {
            backgroundColor: isDark ? '#1a1a1a' : '#fff',
            borderColor: isSelected ? '#4caf50' : (isDark ? '#333' : '#e0e0e0'),
            borderWidth: isSelected ? 2 : 1,
          },
        ]}
        onPress={() => handleSelectTeam(item)}
        activeOpacity={0.7}
      >
        <Image 
          source={{ uri: item.crest }}
          style={styles.teamCrest}
          resizeMode="contain"
        />
        <View style={styles.teamInfo}>
          <Text style={[styles.teamName, { color: isDark ? '#fff' : '#000' }]}>
            {item.shortName}
          </Text>
          <Text style={[styles.teamLeague, { color: isDark ? '#999' : '#666' }]}>
            {item.league}
          </Text>
        </View>
        {isSelected && (
          <Ionicons name="checkmark-circle" size={28} color="#4caf50" />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#000' : '#fff' }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: isDark ? '#333' : '#e0e0e0' }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={isDark ? '#fff' : '#000'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: isDark ? '#fff' : '#000' }]}>
          {t.selectFavoriteTeam}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Barre de recherche */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { 
          backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5',
          borderColor: isDark ? '#333' : '#e0e0e0'
        }]}>
          <Ionicons name="search" size={20} color={isDark ? '#999' : '#666'} />
          <TextInput
            style={[styles.searchInput, { color: isDark ? '#fff' : '#000' }]}
            placeholder={t.searchTeam}
            placeholderTextColor={isDark ? '#666' : '#999'}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={isDark ? '#666' : '#999'} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Info */}
      <View style={[styles.infoBox, { 
        backgroundColor: isDark ? '#1a1a1a' : '#e8f5e9',
        borderColor: isDark ? '#333' : '#4caf50'
      }]}>
        <Ionicons name="information-circle-outline" size={18} color={isDark ? '#4caf50' : '#2e7d32'} />
        <Text style={[styles.infoText, { color: isDark ? '#4caf50' : '#2e7d32' }]}>
          {t.notificationInfo}
        </Text>
      </View>

      {/* Liste des équipes */}
      {saving ? (
        <View style={styles.savingContainer}>
          <ActivityIndicator size="large" color="#4caf50" />
          <Text style={[styles.savingText, { color: isDark ? '#999' : '#666' }]}>
            {t.teamSaved}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredTeams}
          renderItem={renderTeam}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
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
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 20,
    marginBottom: 15,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  infoText: {
    fontSize: 12,
    flex: 1,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  teamCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    gap: 15,
  },
  teamCrest: {
    width: 50,
    height: 50,
  },
  teamInfo: {
    flex: 1,
  },
  teamName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  teamLeague: {
    fontSize: 13,
  },
  savingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  savingText: {
    marginTop: 12,
    fontSize: 14,
  },
});
