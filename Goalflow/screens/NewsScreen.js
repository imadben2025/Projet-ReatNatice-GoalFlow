import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, RefreshControl, ActivityIndicator, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { getNews } from '../services/newsService';

export default function NewsScreen() {
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Format relative date with translations
  const formatRelativeDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) {
      return t.justNow;
    } else if (diffMins < 60) {
      return t.minutesAgo.replace('{{minutes}}', diffMins);
    } else if (diffHours < 24) {
      return t.hoursAgo.replace('{{hours}}', diffHours);
    } else if (diffDays === 1) {
      return t.yesterday;
    } else {
      return t.daysAgo.replace('{{days}}', diffDays);
    }
  };

  // Charger les news au montage initial
  useEffect(() => {
    fetchNews();
  }, []);

  // Recharger les news chaque fois que l'écran devient actif
  useFocusEffect(
    React.useCallback(() => {
      // Ne pas afficher le loading si on a déjà des news
      if (news.length > 0) {
        fetchNews(true);
      }
    }, [])
  );

  const fetchNews = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      setError(null);
      
      const articles = await getNews();
      setNews(articles);
    } catch (err) {
      setError(t.newsError);
      console.error('Erreur news:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchNews(true);
  };

  const handleArticlePress = async (url) => {
    try {
      await Linking.openURL(url);
    } catch (err) {
      console.error('Erreur lors de l\'ouverture du lien:', err);
    }
  };

  const renderArticle = ({ item }) => (
    <TouchableOpacity
      style={[styles.articleCard, {
        backgroundColor: isDark ? '#1a1a1a' : '#fff',
        borderColor: isDark ? '#333' : '#e0e0e0',
      }]}
      onPress={() => handleArticlePress(item.url)}
      activeOpacity={0.7}
    >
      {item.image && (
        <Image
          source={{ uri: item.image }}
          style={styles.articleImage}
          resizeMode="cover"
        />
      )}
      
      <View style={styles.articleContent}>
        <Text style={[styles.articleTitle, { color: isDark ? '#fff' : '#000' }]} numberOfLines={3}>
          {item.title}
        </Text>
        
        {item.description && (
          <Text style={[styles.articleDescription, { color: isDark ? '#999' : '#666' }]} numberOfLines={2}>
            {item.description}
          </Text>
        )}
        
        <View style={styles.articleMeta}>
          <View style={styles.metaLeft}>
            <Ionicons name="newspaper-outline" size={14} color={isDark ? '#666' : '#999'} />
            <Text style={[styles.source, { color: isDark ? '#666' : '#999' }]}>
              {item.source}
            </Text>
          </View>
          <Text style={[styles.time, { color: isDark ? '#666' : '#999' }]}>
            {formatRelativeDate(item.publishedAt)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: isDark ? '#000' : '#fff' }]}>
        <ActivityIndicator size="large" color={isDark ? '#fff' : '#000'} />
        <Text style={[styles.loadingText, { color: isDark ? '#999' : '#666' }]}>
          {t.loadingNews}
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: isDark ? '#000' : '#fff' }]}>
        <Ionicons name="alert-circle-outline" size={60} color={isDark ? '#333' : '#e0e0e0'} />
        <Text style={[styles.errorText, { color: isDark ? '#999' : '#666' }]}>
          {error}
        </Text>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}
          onPress={() => fetchNews()}
        >
          <Text style={[styles.retryButtonText, { color: isDark ? '#fff' : '#000' }]}>
            {t.retry}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#000' : '#fff' }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Ionicons name="newspaper" size={24} color={isDark ? '#fff' : '#000'} />
          <Text style={[styles.title, { color: isDark ? '#fff' : '#000' }]}>
            {t.newsTitle}
          </Text>
        </View>
        <Text style={[styles.subtitle, { color: isDark ? '#666' : '#999' }]}>
          {news.length} {news.length > 1 ? t.articles : t.article} {news.length > 1 ? t.available : t.availableSingular}
        </Text>
      </View>

      <FlatList
        data={news}
        renderItem={renderArticle}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={isDark ? '#fff' : '#000'}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="newspaper-outline" size={60} color={isDark ? '#333' : '#e0e0e0'} />
            <Text style={[styles.emptyText, { color: isDark ? '#999' : '#666' }]}>
              Aucune actualité disponible
            </Text>
          </View>
        }
      />
    </View>
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
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  articleCard: {
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  articleImage: {
    width: '100%',
    height: 200,
  },
  articleContent: {
    padding: 16,
  },
  articleTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    lineHeight: 24,
  },
  articleDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  articleMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  source: {
    fontSize: 12,
    fontWeight: '600',
  },
  time: {
    fontSize: 12,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 20,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
  },
});
