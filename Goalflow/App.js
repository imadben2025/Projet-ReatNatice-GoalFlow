import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View, StyleSheet, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebaseConfig';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { registerForPushNotifications, setupNotificationListener } from './services/notificationService';
import { startTeamNewsMonitoring, stopTeamNewsMonitoring, setupTeamNewsNotificationHandler } from './services/teamNewsNotificationService';

import SplashScreen from './screens/SplashScreen';
import LoginScreen from './screens/LoginScreen';
import SignUpScreen from './screens/SignUpScreen';
import LiveScreen from './screens/LiveScreen';
import MatchsScreen from './screens/MatchsScreen';
import MatchDetailsScreen from './screens/MatchDetailsScreen';
import NewsScreen from './screens/NewsScreen';
import ProfilScreen from './screens/ProfilScreen';
import EditProfileScreen from './screens/EditProfileScreen';
import TeamSelectionScreen from './screens/TeamSelectionScreen';
import FavoritesScreen from './screens/FavoritesScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <LanguageProvider>
          <AppContent />
        </LanguageProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function AppContent() {
  const { isDark } = useTheme();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  const navigationRef = React.useRef(null);
  const newsMonitoringIntervalRef = React.useRef(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      
      // Enregistre les notifications si l'utilisateur est connecté
      if (currentUser && !currentUser.isAnonymous) {
        registerForPushNotifications();
        
        // Démarrer la surveillance des actualités de l'équipe favorite
        newsMonitoringIntervalRef.current = startTeamNewsMonitoring();
      } else {
        // Arrêter la surveillance si l'utilisateur se déconnecte
        if (newsMonitoringIntervalRef.current) {
          stopTeamNewsMonitoring(newsMonitoringIntervalRef.current);
          newsMonitoringIntervalRef.current = null;
        }
      }
    });

    return () => {
      unsubscribe();
      // Nettoyer la surveillance au démontage
      if (newsMonitoringIntervalRef.current) {
        stopTeamNewsMonitoring(newsMonitoringIntervalRef.current);
      }
    };
  }, []);

  // Configure le listener de notifications
  useEffect(() => {
    if (navigationRef.current) {
      const cleanup = setupNotificationListener(navigationRef.current);
      const teamNewsCleanup = setupTeamNewsNotificationHandler(navigationRef.current);
      
      return () => {
        cleanup();
        teamNewsCleanup?.remove();
      };
    }
  }, [navigationRef.current]);

  const handleSplashFinish = () => {
    setShowSplash(false);
  };

  if (showSplash) {
    return <SplashScreen onFinish={handleSplashFinish} />;
  }

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: isDark ? '#000' : '#f5f5f5' }]}>
        <ActivityIndicator size="large" color={isDark ? '#fff' : '#000'} />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <StatusBar style="auto" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <Stack.Screen name="MainTabs" component={MainTabs} />
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="SignUp" component={SignUpScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

function MainTabs() {
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          switch (route.name) {
            case 'LiveTab':
              iconName = focused ? 'radio' : 'radio-outline';
              break;
            case 'MatchsTab':
              iconName = focused ? 'football' : 'football-outline';
              break;
            case 'News':
              iconName = focused ? 'newspaper' : 'newspaper-outline';
              break;
            case 'ProfilTab':
              iconName = focused ? 'person' : 'person-outline';
              break;
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: isDark ? '#00FF87' : '#000000',
        tabBarInactiveTintColor: isDark ? '#666666' : '#999999',
        tabBarStyle: {
          backgroundColor: isDark ? '#000000' : '#FFFFFF',
          borderTopColor: isDark ? '#1A1A1A' : '#E0E0E0',
          borderTopWidth: 1,
          height: 60 + insets.bottom,
          paddingBottom: Platform.OS === 'ios' ? insets.bottom : 8,
          paddingTop: 8,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: isDark ? 0.3 : 0.1,
          shadowRadius: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          marginTop: 4,
        },
        tabBarItemStyle: {
          paddingVertical: 4,
        },
      })}
      screenListeners={{
        tabPress: () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        },
      }}
    >
      <Tab.Screen 
        name="LiveTab" 
        component={LiveStack}
        options={{ tabBarLabel: t.live }}
      />
      <Tab.Screen 
        name="MatchsTab" 
        component={MatchsStack} 
        options={{ tabBarLabel: t.matches }}
      />
      <Tab.Screen 
        name="News" 
        component={NewsScreen}
        options={{ tabBarLabel: t.news }}
      />
      <Tab.Screen 
        name="ProfilTab" 
        component={ProfilStack}
        options={{ tabBarLabel: t.profile }}
      />
    </Tab.Navigator>
  );
}

function ProfilStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Profil" component={ProfilScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="TeamSelection" component={TeamSelectionScreen} />
      <Stack.Screen name="Favorites" component={FavoritesScreen} />
    </Stack.Navigator>
  );
}

function LiveStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Live" component={LiveScreen} />
      <Stack.Screen name="MatchDetails" component={MatchDetailsScreen} />
    </Stack.Navigator>
  );
}

function MatchsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Matchs" component={MatchsScreen} />
      <Stack.Screen name="MatchDetails" component={MatchDetailsScreen} />
      <Stack.Screen name="Favorites" component={FavoritesScreen} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
