import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Switch, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { signOut } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useFocusEffect } from '@react-navigation/native';
import { getFavoriteTeam, getNotificationPreferences, updateNotificationPreferences, getUserProfile } from '../services/userService';

export default function ProfilScreen({ navigation }) {
  const { isDark, themeMode, changeThemeMode } = useTheme();
  const { language, changeLanguage, t } = useLanguage();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [userProfile, setUserProfile] = useState(null);

  const handleNotificationToggle = async (value) => {
    setNotificationsEnabled(value);
    try {
      await updateNotificationPreferences(value);
    } catch (error) {
      console.error('Erreur lors de la mise à jour des notifications:', error);
    }
  };

  const isAnonymous = auth.currentUser?.isAnonymous;
  const userEmail = auth.currentUser?.email;

  useFocusEffect(
    React.useCallback(() => {
      loadFavoriteTeam();
    }, [])
  );

  const loadFavoriteTeam = async () => {
    try {
      // Charger le profil utilisateur
      const userId = auth.currentUser?.uid;
      if (userId && !auth.currentUser?.isAnonymous) {
        const profile = await getUserProfile(userId);
        setUserProfile(profile);
        console.log('Profil chargé:', profile);
      }

      const savedTeam = await getFavoriteTeam();
      if (savedTeam) {
        setSelectedTeam(savedTeam);
      } else {
        setSelectedTeam(null);
      }
      
      const notifEnabled = await getNotificationPreferences();
      setNotificationsEnabled(notifEnabled);
    } catch (error) {
      console.error('Erreur lors du chargement de l\'équipe:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  const handleConnectAccount = async () => {
    try {
      // Déconnecter l'utilisateur anonyme pour revenir à l'écran de connexion
      await signOut(auth);
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  const handleChooseTeam = () => {
    navigation.navigate('TeamSelection');
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: isDark ? '#000' : '#fff' }]}>
      {/* En-tête avec profil */}
      <View style={styles.header}>
        <View style={[styles.avatarContainer, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}>
          {!isAnonymous && userProfile?.firstName && userProfile?.lastName ? (
            <Text style={[styles.avatarInitials, { color: isDark ? '#fff' : '#000' }]}>
              {userProfile.firstName[0]}{userProfile.lastName[0]}
            </Text>
          ) : (
            <Ionicons 
              name="person" 
              size={50} 
              color={isDark ? '#fff' : '#000'} 
            />
          )}
        </View>
        
        <Text style={[styles.userName, { color: isDark ? '#fff' : '#000' }]}>
          {isAnonymous 
            ? t.guest 
            : (userProfile?.firstName && userProfile?.lastName 
                ? `${userProfile.firstName} ${userProfile.lastName}` 
                : userEmail?.split('@')[0] || t.user)}
        </Text>
        
        {!isAnonymous && userEmail && (
          <Text style={[styles.userEmail, { color: isDark ? '#999' : '#666' }]}>
            {userEmail}
          </Text>
        )}

        {/* Date de naissance stylisée */}
        {!isAnonymous && userProfile?.dateOfBirth && (
          <View style={[styles.birthdayCard, { backgroundColor: isDark ? '#1a1a1a' : '#f0f8ff' }]}>
            <Ionicons name="gift" size={20} color="#4caf50" />
            <Text style={[styles.birthdayText, { color: isDark ? '#999' : '#666' }]}>
              {new Date(userProfile.dateOfBirth).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </Text>
            <Text style={[styles.ageText, { color: isDark ? '#666' : '#999' }]}>
              ({Math.floor((new Date() - new Date(userProfile.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000))} {t.yearsOld || 'years old'})
            </Text>
          </View>
        )}

        {/* Bouton Modifier le profil */}
        {!isAnonymous && (
          <TouchableOpacity 
            style={[styles.editButton, { 
              backgroundColor: isDark ? '#1a1a1a' : '#fff',
              borderColor: isDark ? '#333' : '#e0e0e0'
            }]}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Ionicons name="create-outline" size={20} color={isDark ? '#fff' : '#000'} />
            <Text style={[styles.editButtonText, { color: isDark ? '#fff' : '#000' }]}>
              {language === 'fr' ? 'Modifier le profil' : 'Edit profile'}
            </Text>
          </TouchableOpacity>
        )}
        
        {isAnonymous && (
          <TouchableOpacity 
            style={[styles.connectButton, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5', borderColor: isDark ? '#333' : '#e0e0e0' }]}
            onPress={handleConnectAccount}
          >
            <Ionicons name="log-in-outline" size={20} color={isDark ? '#fff' : '#000'} />
            <Text style={[styles.connectButtonText, { color: isDark ? '#fff' : '#000' }]}>
              {language === 'fr' ? 'Se connecter avec son compte' : 'Sign in to your account'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Mon équipe préférée - Uniquement pour les utilisateurs authentifiés */}
      {!isAnonymous ? (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="star" size={20} color={isDark ? '#fff' : '#000'} />
            <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>
              {t.myFavoriteTeam}
            </Text>
          </View>
          
          <TouchableOpacity 
            style={[styles.teamCard, { 
              backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5',
              borderColor: isDark ? '#333' : '#e0e0e0' 
            }]}
            onPress={handleChooseTeam}
          >
            {selectedTeam ? (
              <View style={styles.teamInfo}>
                <Ionicons name="football" size={30} color={isDark ? '#fff' : '#000'} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.teamName, { color: isDark ? '#fff' : '#000' }]}>
                    {selectedTeam.shortName}
                  </Text>
                  <Text style={[styles.teamLeague, { color: isDark ? '#999' : '#666' }]}>
                    {selectedTeam.league}
                  </Text>
                </View>
                <Ionicons name="checkmark-circle" size={24} color="#4caf50" />
              </View>
            ) : (
              <View style={styles.noTeam}>
                <Ionicons name="add-circle-outline" size={30} color={isDark ? '#666' : '#999'} />
                <Text style={[styles.noTeamText, { color: isDark ? '#666' : '#999' }]}>
                  {t.chooseTeam}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Info sur les notifications d'équipe */}
          {selectedTeam && notificationsEnabled && (
            <View style={[styles.teamNotifInfo, { 
              backgroundColor: isDark ? '#0a2818' : '#e8f5e9',
              borderColor: isDark ? '#1b5e37' : '#4caf50'
            }]}>
              <Ionicons name="notifications-outline" size={20} color="#4caf50" />
              <Text style={[styles.teamNotifText, { color: isDark ? '#4caf50' : '#2e7d32' }]}>
                {language === 'fr' 
                  ? `Vous recevez les actualités de ${selectedTeam.shortName} toutes les 3 heures`
                  : `You receive ${selectedTeam.shortName} news every 3 hours`}
              </Text>
            </View>
          )}
          
          {selectedTeam && !notificationsEnabled && (
            <View style={[styles.teamNotifInfo, { 
              backgroundColor: isDark ? '#2a1a0a' : '#fff3e0',
              borderColor: isDark ? '#5e3b1b' : '#ff9800'
            }]}>
              <Ionicons name="notifications-off-outline" size={20} color="#ff9800" />
              <Text style={[styles.teamNotifText, { color: isDark ? '#ffa726' : '#ef6c00' }]}>
                {language === 'fr'
                  ? `Activez les notifications pour recevoir les actualités de ${selectedTeam.shortName}`
                  : `Enable notifications to receive ${selectedTeam.shortName} news`}
              </Text>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.section}>
          <View style={[styles.guestFeatureCard, { 
            backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5',
            borderColor: isDark ? '#333' : '#e0e0e0' 
          }]}>
            <Ionicons name="lock-closed" size={40} color={isDark ? '#666' : '#999'} />
            <Text style={[styles.guestFeatureTitle, { color: isDark ? '#fff' : '#000' }]}>
              {t.premiumFeature}
            </Text>
            <Text style={[styles.guestFeatureText, { color: isDark ? '#999' : '#666' }]}>
              {t.createAccountText}
            </Text>
            <TouchableOpacity 
              style={[styles.createAccountButton, { backgroundColor: isDark ? '#fff' : '#000' }]}
              onPress={handleConnectAccount}
            >
              <Text style={[styles.createAccountButtonText, { color: isDark ? '#000' : '#fff' }]}>
                {t.createAccount}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Notifications - Uniquement pour les utilisateurs authentifiés */}
      {!isAnonymous && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="notifications" size={20} color={isDark ? '#fff' : '#000'} />
            <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>
              {t.notifications}
            </Text>
          </View>
          
          <View style={[styles.settingRow, { 
            backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5',
            borderColor: isDark ? '#333' : '#e0e0e0' 
          }]}>
            <View style={styles.settingLeft}>
              <Ionicons name="football-outline" size={24} color={isDark ? '#fff' : '#000'} />
              <Text style={[styles.settingLabel, { color: isDark ? '#fff' : '#000' }]}>
                {language === 'fr' ? 'Alertes de matchs' : 'Match alerts'}
              </Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={handleNotificationToggle}
              trackColor={{ false: '#767577', true: isDark ? '#666' : '#ccc' }}
              thumbColor={notificationsEnabled ? (isDark ? '#fff' : '#000') : '#f4f3f4'}
            />
          </View>
        </View>
      )}

      {/* Paramètres */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="settings-outline" size={20} color={isDark ? '#fff' : '#000'} />
          <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>
            {t.settings}
          </Text>
        </View>
        
        <TouchableOpacity 
          style={[styles.settingRow, { 
            backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5',
            borderColor: isDark ? '#333' : '#e0e0e0' 
          }]}
          onPress={() => setShowLanguageModal(true)}
        >
          <View style={styles.settingLeft}>
            <Ionicons name="language-outline" size={24} color={isDark ? '#fff' : '#000'} />
            <Text style={[styles.settingLabel, { color: isDark ? '#fff' : '#000' }]}>
              {t.language}
            </Text>
          </View>
          <View style={styles.settingRight}>
            <Text style={[styles.settingValue, { color: isDark ? '#666' : '#999' }]}>
              {language === 'fr' ? t.french : t.english}
            </Text>
            <Ionicons name="chevron-forward" size={20} color={isDark ? '#666' : '#999'} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.settingRow, { 
            backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5',
            borderColor: isDark ? '#333' : '#e0e0e0' 
          }]}
          onPress={() => setShowThemeModal(true)}
        >
          <View style={styles.settingLeft}>
            <Ionicons name="moon-outline" size={24} color={isDark ? '#fff' : '#000'} />
            <Text style={[styles.settingLabel, { color: isDark ? '#fff' : '#000' }]}>
              {t.theme}
            </Text>
          </View>
          <View style={styles.settingRight}>
            <Text style={[styles.settingValue, { color: isDark ? '#666' : '#999' }]}>
              {themeMode === 'auto' ? t.auto : themeMode === 'dark' ? t.dark : t.light}
            </Text>
            <Ionicons name="chevron-forward" size={20} color={isDark ? '#666' : '#999'} />
          </View>
        </TouchableOpacity>
      </View>

      {/* Déconnexion */}
      {!isAnonymous && (
        <View style={styles.logoutSection}>
          <TouchableOpacity 
            style={[styles.logoutButton, { 
              backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5',
              borderColor: isDark ? '#333' : '#e0e0e0' 
            }]} 
            onPress={handleSignOut}
          >
            <Ionicons name="log-out-outline" size={24} color="#ff3b30" />
            <Text style={styles.logoutText}>{t.logout}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Modal de sélection du thème */}
      <Modal
        visible={showThemeModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowThemeModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowThemeModal(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: isDark ? '#1a1a1a' : '#fff' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: isDark ? '#fff' : '#000' }]}>
                {t.selectTheme}
              </Text>
              <TouchableOpacity onPress={() => setShowThemeModal(false)}>
                <Ionicons name="close" size={28} color={isDark ? '#fff' : '#000'} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.themeOption, { 
                backgroundColor: themeMode === 'auto' ? (isDark ? '#2a2a2a' : '#f0f0f0') : 'transparent',
                borderColor: isDark ? '#333' : '#e0e0e0'
              }]}
              onPress={() => {
                changeThemeMode('auto');
                setShowThemeModal(false);
              }}
            >
              <Ionicons name="phone-portrait-outline" size={24} color={isDark ? '#fff' : '#000'} />
              <View style={styles.themeOptionText}>
                <Text style={[styles.themeOptionTitle, { color: isDark ? '#fff' : '#000' }]}>
                  {language === 'fr' ? 'Automatique' : 'Automatic'}
                </Text>
                <Text style={[styles.themeOptionDesc, { color: isDark ? '#999' : '#666' }]}>
                  {language === 'fr' ? 'Suit les paramètres du système' : 'Follows system settings'}
                </Text>
              </View>
              {themeMode === 'auto' && (
                <Ionicons name="checkmark-circle" size={24} color="#4caf50" />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.themeOption, { 
                backgroundColor: themeMode === 'light' ? (isDark ? '#2a2a2a' : '#f0f0f0') : 'transparent',
                borderColor: isDark ? '#333' : '#e0e0e0'
              }]}
              onPress={() => {
                changeThemeMode('light');
                setShowThemeModal(false);
              }}
            >
              <Ionicons name="sunny-outline" size={24} color={isDark ? '#fff' : '#000'} />
              <View style={styles.themeOptionText}>
                <Text style={[styles.themeOptionTitle, { color: isDark ? '#fff' : '#000' }]}>
                  {language === 'fr' ? 'Mode clair' : 'Light mode'}
                </Text>
                <Text style={[styles.themeOptionDesc, { color: isDark ? '#999' : '#666' }]}>
                  {language === 'fr' ? 'Thème lumineux' : 'Light theme'}
                </Text>
              </View>
              {themeMode === 'light' && (
                <Ionicons name="checkmark-circle" size={24} color="#4caf50" />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.themeOption, { 
                backgroundColor: themeMode === 'dark' ? (isDark ? '#2a2a2a' : '#f0f0f0') : 'transparent',
                borderColor: isDark ? '#333' : '#e0e0e0'
              }]}
              onPress={() => {
                changeThemeMode('dark');
                setShowThemeModal(false);
              }}
            >
              <Ionicons name="moon-outline" size={24} color={isDark ? '#fff' : '#000'} />
              <View style={styles.themeOptionText}>
                <Text style={[styles.themeOptionTitle, { color: isDark ? '#fff' : '#000' }]}>
                  {language === 'fr' ? 'Mode sombre' : 'Dark mode'}
                </Text>
                <Text style={[styles.themeOptionDesc, { color: isDark ? '#999' : '#666' }]}>
                  {language === 'fr' ? 'Thème sombre' : 'Dark theme'}
                </Text>
              </View>
              {themeMode === 'dark' && (
                <Ionicons name="checkmark-circle" size={24} color="#4caf50" />
              )}
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modal de sélection de la langue */}
      <Modal
        visible={showLanguageModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowLanguageModal(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: isDark ? '#1a1a1a' : '#fff' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: isDark ? '#fff' : '#000' }]}>
                {t.selectLanguage}
              </Text>
              <TouchableOpacity onPress={() => setShowLanguageModal(false)}>
                <Ionicons name="close" size={28} color={isDark ? '#fff' : '#000'} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.themeOption, { 
                backgroundColor: language === 'fr' ? (isDark ? '#2a2a2a' : '#f0f0f0') : 'transparent',
                borderColor: isDark ? '#333' : '#e0e0e0'
              }]}
              onPress={() => {
                changeLanguage('fr');
                setShowLanguageModal(false);
              }}
            >
              <Text style={{ fontSize: 28 }}>🇫🇷</Text>
              <View style={styles.themeOptionText}>
                <Text style={[styles.themeOptionTitle, { color: isDark ? '#fff' : '#000' }]}>
                  Français
                </Text>
                <Text style={[styles.themeOptionDesc, { color: isDark ? '#999' : '#666' }]}>
                  French
                </Text>
              </View>
              {language === 'fr' && (
                <Ionicons name="checkmark-circle" size={24} color="#4caf50" />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.themeOption, { 
                backgroundColor: language === 'en' ? (isDark ? '#2a2a2a' : '#f0f0f0') : 'transparent',
                borderColor: isDark ? '#333' : '#e0e0e0'
              }]}
              onPress={() => {
                changeLanguage('en');
                setShowLanguageModal(false);
              }}
            >
              <Text style={{ fontSize: 28 }}>🇬🇧</Text>
              <View style={styles.themeOptionText}>
                <Text style={[styles.themeOptionTitle, { color: isDark ? '#fff' : '#000' }]}>
                  English
                </Text>
                <Text style={[styles.themeOptionDesc, { color: isDark ? '#999' : '#666' }]}>
                  Anglais
                </Text>
              </View>
              {language === 'en' && (
                <Ionicons name="checkmark-circle" size={24} color="#4caf50" />
              )}
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatarInitials: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 14,
    marginBottom: 15,
  },
  birthdayCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 10,
    gap: 8,
  },
  birthdayText: {
    fontSize: 14,
    fontWeight: '500',
  },
  ageText: {
    fontSize: 13,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
    marginBottom: 15,
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
    marginTop: 10,
  },
  connectButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 25,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  teamCard: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
  },
  teamInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  teamName: {
    fontSize: 18,
    fontWeight: '600',
  },
  teamLeague: {
    fontSize: 13,
    marginTop: 2,
  },
  noTeam: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    justifyContent: 'center',
  },
  noTeamText: {
    fontSize: 16,
    fontWeight: '500',
  },
  guestFeatureCard: {
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    gap: 12,
  },
  guestFeatureTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 8,
  },
  guestFeatureText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  createAccountButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    marginTop: 8,
  },
  createAccountButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  teamNotifInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 10,
    gap: 10,
  },
  teamNotifText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingValue: {
    fontSize: 15,
  },
  logoutSection: {
    paddingHorizontal: 20,
    marginTop: 10,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ff3b30',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  themeOptionText: {
    flex: 1,
  },
  themeOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  themeOptionDesc: {
    fontSize: 13,
  },
});
