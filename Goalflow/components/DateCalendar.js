import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  Dimensions,
  Platform,
  StatusBar,
} from 'react-native';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = 64; // Largeur de chaque jour (optimisé pour thumb-friendly)
const STATUSBAR_HEIGHT = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0;

export default function DateCalendar({ onDateSelect, initialDate = new Date() }) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const scrollViewRef = useRef(null);

  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [dates, setDates] = useState([]);

  // Générer les dates (4 jours avant, aujourd'hui, 15 jours après)
  useEffect(() => {
    const generateDates = () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const datesArray = [];
      
      // 4 jours avant
      for (let i = 4; i > 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        datesArray.push(date);
      }
      
      // Aujourd'hui
      datesArray.push(new Date(today));
      
      // 15 jours après
      for (let i = 1; i <= 15; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() + i);
        datesArray.push(date);
      }
      
      return datesArray;
    };

    setDates(generateDates());
  }, []);

  // Scroll vers aujourd'hui au montage
  useEffect(() => {
    if (dates.length > 0 && scrollViewRef.current) {
      // Index 4 = aujourd'hui (4 jours avant + index 0)
      const todayIndex = 4;
      const offsetX = todayIndex * ITEM_WIDTH - (width / 2 - ITEM_WIDTH / 2);
      
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ x: offsetX, animated: true });
      }, 100);
    }
  }, [dates]);

  const handleDatePress = (date, index) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedDate(date);
    onDateSelect(date);
    
    // Scroll automatique vers la date sélectionnée
    if (scrollViewRef.current) {
      const offsetX = index * 72 - (width / 2 - 36); // 72 = 60 width + 12 margin, 36 = moitié de 72
      scrollViewRef.current.scrollTo({ x: offsetX, animated: true });
    }
  };

  const formatDay = (date) => {
    const days = ['DIM', 'LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM'];
    return days[date.getDay()];
  };

  const formatDate = (date) => {
    return date.getDate();
  };

  const formatMonth = (date) => {
    const months = ['JAN', 'FÉV', 'MAR', 'AVR', 'MAI', 'JUN', 'JUL', 'AOÛ', 'SEP', 'OCT', 'NOV', 'DÉC'];
    return months[date.getMonth()];
  };

  const isToday = (date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (date) => {
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    );
  };

  const isPast = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#000' : '#fff' }]}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        decelerationRate="fast"
      >
        {dates.map((date, index) => {
          const selected = isSelected(date);
          const today = isToday(date);
          const past = isPast(date);

          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.dateItem,
                selected && styles.dateItemSelected,
                selected && { backgroundColor: '#FFFFFF', transform: [{ scale: 1.05 }] },
                !selected && { backgroundColor: '#1a1a1a', opacity: 0.5 },
              ]}
              onPress={() => handleDatePress(date, index)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.dayText,
                  selected && { color: '#000000', fontWeight: '700' },
                  !selected && { color: '#FFFFFF' },
                  today && !selected && { color: '#007AFF' },
                ]}
              >
                {formatDay(date)}
              </Text>
              
              <Text
                style={[
                  styles.dateText,
                  selected && { color: '#000000', fontWeight: '800' },
                  !selected && { color: '#FFFFFF' },
                  today && !selected && { color: '#007AFF' },
                ]}
              >
                {formatDate(date)}
              </Text>
              
              <Text
                style={[
                  styles.monthText,
                  selected && { color: '#000000', fontWeight: '700' },
                  !selected && { color: '#FFFFFF' },
                  today && !selected && { color: '#007AFF' },
                ]}
              >
                {formatMonth(date)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: STATUSBAR_HEIGHT,
    height: 68 + STATUSBAR_HEIGHT,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    backgroundColor: '#000000',
  },
  scrollContent: {
    paddingHorizontal: 12,
    paddingVertical: 0,
  },
  dateItem: {
    width: 60,
    height: 60,
    marginHorizontal: 6,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  dateItemSelected: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  dayText: {
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 2,
  },
  dateText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  monthText: {
    fontSize: 9,
    fontWeight: '500',
  },
});
