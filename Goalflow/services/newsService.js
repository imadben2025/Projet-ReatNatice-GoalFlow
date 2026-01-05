/**
 * Service pour récupérer les news football
 * Utilise NewsAPI pour des actualités en temps réel
 */

const NEWS_API_KEY = '2794762a5e684f6189fff0bb89827a57';
const TOP_HEADLINES_URL = 'https://newsapi.org/v2/top-headlines';
const EVERYTHING_URL = 'https://newsapi.org/v2/everything';

// Données mockées en fallback
const MOCK_NEWS = [
  {
    id: '1',
    title: 'Manchester City remporte la Premier League pour la 4ème fois consécutive',
    description: 'Les Citizens confirment leur domination en s\'imposant face à Arsenal dans la course au titre.',
    image: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800',
    source: 'ESPN FC',
    publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // Il y a 2h
    url: 'https://espn.com'
  },
  {
    id: '2',
    title: 'Kylian Mbappé confirme son transfert au Real Madrid',
    description: 'L\'attaquant français rejoint les Merengues dans un transfert historique estimé à 200M€.',
    image: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800',
    source: 'Goal.com',
    publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // Il y a 4h
    url: 'https://goal.com'
  },
  {
    id: '3',
    title: 'FC Barcelona annonce le retour de Lionel Messi',
    description: 'Le club catalan officialise le retour de son ancienne star argentine pour une dernière danse.',
    image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800',
    source: 'BBC Sport',
    publishedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // Il y a 5h
    url: 'https://bbc.com/sport'
  },
  {
    id: '4',
    title: 'Ligue des Champions: Le PSG élimine le Bayern Munich',
    description: 'Paris s\'impose 3-2 au Parc des Princes et se qualifie pour les demi-finales.',
    image: 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800',
    source: 'Sky Sports',
    publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // Il y a 6h
    url: 'https://skysports.com'
  },
  {
    id: '5',
    title: 'Liverpool recrute un jeune prodige brésilien de 18 ans',
    description: 'Les Reds battent la concurrence pour s\'offrir le milieu offensif de Flamengo pour 45M€.',
    image: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=800',
    source: 'FourFourTwo',
    publishedAt: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString(), // Il y a 7h
    url: 'https://fourfourtwo.com'
  },
  {
    id: '6',
    title: 'Coupe du Monde 2026: Les stades américains dévoilés',
    description: 'La FIFA présente les 16 stades qui accueilleront la prochaine Coupe du Monde.',
    image: 'https://images.unsplash.com/photo-1459865264687-595d652de67e?w=800',
    source: 'ESPN FC',
    publishedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // Il y a 8h
    url: 'https://espn.com'
  },
  {
    id: '7',
    title: 'Juventus sanctionnée pour irrégularités financières',
    description: 'Le club turinois écope d\'une amende de 15M€ et d\'un retrait de 10 points.',
    image: 'https://images.unsplash.com/photo-1551958219-acbc608c6377?w=800',
    source: 'Goal.com',
    publishedAt: new Date(Date.now() - 9 * 60 * 60 * 1000).toISOString(), // Il y a 9h
    url: 'https://goal.com'
  },
  {
    id: '8',
    title: 'Erling Haaland bat le record de buts en Premier League',
    description: 'Le Norvégien inscrit son 53ème but de la saison, pulvérisant le record précédent.',
    image: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=800',
    source: 'BBC Sport',
    publishedAt: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(), // Il y a 10h
    url: 'https://bbc.com/sport'
  },
  {
    id: '9',
    title: 'Le Milan AC remporte le derby della Madonnina 3-1',
    description: 'L\'Inter Milan s\'incline face à son rival dans un match spectaculaire à San Siro.',
    image: 'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=800',
    source: 'Sky Sports',
    publishedAt: new Date(Date.now() - 11 * 60 * 60 * 1000).toISOString(), // Il y a 11h
    url: 'https://skysports.com'
  },
  {
    id: '10',
    title: 'Ballon d\'Or 2026: Les 30 nommés révélés',
    description: 'France Football dévoile la liste des prétendants au prestigieux trophée individuel.',
    image: 'https://images.unsplash.com/photo-1577223625816-7546f9e49fa5?w=800',
    source: 'FourFourTwo',
    publishedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // Il y a 12h
    url: 'https://fourfourtwo.com'
  }
];

/**
 * Récupérer toutes les news football
 * 
 * @returns {Promise<Array>} Liste des articles
 */
export const getNews = async () => {
  try {
    console.log('[NewsService] Fetching news from NewsAPI...');
    
    // Essayer d'abord top-headlines pour le sport
    const topHeadlinesParams = new URLSearchParams({
      category: 'sports',
      language: 'fr',
      pageSize: 50,
      apiKey: NEWS_API_KEY
    });

    let response = await fetch(`${TOP_HEADLINES_URL}?${topHeadlinesParams}`);
    let data = await response.json();
    
    console.log('[NewsService] Top headlines response:', data.status, data.totalResults);
    
    let allArticles = [];
    
    // Si on a des résultats de top-headlines
    if (response.ok && data.articles && data.articles.length > 0) {
      allArticles = [...data.articles];
    }
    
    // Compléter avec des recherches spécifiques
    const searchQueries = [
      'football France',
      'Ligue 1',
      'Champions League',
      'Premier League',
      'transfert football'
    ];
    
    // Faire plusieurs requêtes pour avoir plus de diversité
    for (const query of searchQueries.slice(0, 2)) { // Limiter à 2 pour éviter rate limit
      try {
        const searchParams = new URLSearchParams({
          q: query,
          language: 'fr',
          sortBy: 'publishedAt',
          pageSize: 20,
          apiKey: NEWS_API_KEY
        });
        
        const searchResponse = await fetch(`${EVERYTHING_URL}?${searchParams}`);
        const searchData = await searchResponse.json();
        
        if (searchResponse.ok && searchData.articles) {
          allArticles = [...allArticles, ...searchData.articles];
        }
      } catch (err) {
        console.warn('[NewsService] Search query failed:', query);
      }
    }
    
    console.log('[NewsService] Total articles fetched:', allArticles.length);
    
    if (allArticles.length === 0) {
      console.warn('[NewsService] No articles found, using mock data');
      return MOCK_NEWS;
    }

    // Formatter et dédupliquer les articles
    const seenUrls = new Set();
    const formattedArticles = allArticles
      .filter(article => {
        if (!article.title || 
            article.title === '[Removed]' || 
            !article.description ||
            !article.url ||
            seenUrls.has(article.url)) {
          return false;
        }
        
        // Filtrer uniquement le football
        const text = (article.title + ' ' + article.description).toLowerCase();
        const isFootball = text.includes('football') || 
                          text.includes('soccer') || 
                          text.includes('ligue') ||
                          text.includes('league') ||
                          text.includes('coupe') ||
                          text.includes('match') ||
                          text.includes('champion') ||
                          text.includes('psg') ||
                          text.includes('om') ||
                          text.includes('real') ||
                          text.includes('barcelona') ||
                          text.includes('messi') ||
                          text.includes('ronaldo');
        
        if (isFootball) {
          seenUrls.add(article.url);
          return true;
        }
        return false;
      })
      .map((article, index) => ({
        id: `newsapi_${Date.now()}_${index}`,
        title: article.title,
        description: article.description,
        image: article.urlToImage || 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800',
        source: article.source?.name || 'News',
        publishedAt: article.publishedAt,
        url: article.url
      }))
      .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt)) // Trier par date
      .slice(0, 20); // Garder les 20 plus récents

    console.log('[NewsService] Formatted articles:', formattedArticles.length);
    
    return formattedArticles.length > 0 ? formattedArticles : MOCK_NEWS;
  } catch (error) {
    console.error('[NewsService] Error:', error.message);
    return MOCK_NEWS;
  }
};

/**
 * Formater la date relative (Il y a X heures)
 * 
 * @param {string} dateString - Date ISO
 * @returns {string} Date formatée
 */
export const formatRelativeDate = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) {
    return 'À l\'instant';
  } else if (diffMins < 60) {
    return `Il y a ${diffMins} min`;
  } else if (diffHours < 24) {
    return `Il y a ${diffHours}h`;
  } else if (diffDays === 1) {
    return 'Hier';
  } else {
    return `Il y a ${diffDays} jours`;
  }
};
