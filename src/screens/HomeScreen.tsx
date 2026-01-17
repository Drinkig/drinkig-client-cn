import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Image,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { HeroSection } from '../components/home/HeroSection';
import { BannerSection } from '../components/home/BannerSection';
import { getMyWines, MyWineDTO } from '../api/wine';

export default function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const isFocused = useIsFocused();

  const [myWines, setMyWines] = useState<MyWineDTO[]>([]);
  const [recentWine, setRecentWine] = useState<MyWineDTO | null>(null);

  useEffect(() => {
    if (isFocused) {
      fetchMyWines();
    }
  }, [isFocused]);

  const fetchMyWines = async () => {
    try {
      const response = await getMyWines();
      if (response.isSuccess && response.result) {
        setMyWines(response.result);
        if (response.result.length > 0) {
          setRecentWine(response.result[0]);
        } else {
          setRecentWine(null);
        }
      } else {
        setMyWines([]);
        setRecentWine(null);
      }
    } catch (error) {
      console.error('Failed to fetch my wines summary:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />


      <View style={styles.header}>
        <TouchableOpacity
          style={styles.searchBarContainer}
          onPress={() => navigation.navigate('Search' as never)}
          activeOpacity={0.9}
        >
          <Icon name="search" size={20} color="#888" style={styles.searchIcon} />
          <Text style={styles.searchPlaceholder}>와인 이름, 종류 등으로 검색</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.notificationButton}
          onPress={() => navigation.navigate('Wishlist' as never)}
        >
          <Icon name="heart-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>


      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >


        <HeroSection
          onPress={() => {
            navigation.navigate('PlaceSelection');
          }}
        />


        <BannerSection />


        <View style={styles.quickMenuContainer}>

          <TouchableOpacity
            style={[styles.quickMenuItem, styles.tastingNoteButton]}
            onPress={() => navigation.navigate('TastingNoteWrite' as never)}
            activeOpacity={0.8}
          >
            <ImageBackground
              source={require('../assets/taste_note.png')}
              style={styles.tastingNoteBackground}
              imageStyle={{ borderRadius: 20 }}
              resizeMode="cover"
            >
              <View style={styles.tastingNoteContent}>
                <View>
                  <Text style={[styles.menuLabel, { color: '#ddd' }]}>테이스팅 노트</Text>
                  <Text style={styles.menuSubLabel}>기록하기</Text>
                </View>
                <View style={styles.arrowIconContainer}>
                  <Icon name="chevron-forward" size={20} color="rgba(255,255,255,0.5)" />
                </View>
              </View>
            </ImageBackground>
          </TouchableOpacity>


          <TouchableOpacity
            style={[styles.quickMenuItem, styles.tastingNoteButton]}
            onPress={() => navigation.navigate('MyWine' as never)}
            activeOpacity={0.8}
          >
            <ImageBackground
              source={require('../assets/wine_cellar.png')}
              style={styles.tastingNoteBackground}
              imageStyle={{ borderRadius: 20 }}
              resizeMode="cover"
            >
              <View style={styles.tastingNoteContent}>
                <View>
                  <Text style={[styles.menuLabel, { color: '#ddd' }]}>내 와인 창고</Text>
                  <View style={styles.statRow}>
                    <Text style={styles.statNumber}>{myWines.length}</Text>
                    <Text style={[styles.statUnit, { color: '#ddd' }]}>병</Text>
                  </View>
                </View>
                <View style={styles.arrowIconContainer}>
                  <Icon name="chevron-forward" size={20} color="rgba(255,255,255,0.5)" />
                </View>
              </View>
            </ImageBackground>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    backgroundColor: '#1a1a1a',
    zIndex: 10,
  },
  searchBarContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchPlaceholder: {
    color: '#888',
    fontSize: 14,
  },
  notificationButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#e74c3c',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  quickMenuContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  quickMenuItem: {
    flex: 1,
    backgroundColor: '#252525',
    borderRadius: 20,
    padding: 20,
    height: 140,
    justifyContent: 'space-between',
  },
  tastingNoteButton: {
    padding: 0,
    backgroundColor: 'transparent',
  },
  tastingNoteBackground: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  tastingNoteContent: {
    flex: 1,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
  },
  arrowIconContainer: {
    marginTop: 2,
  },
  menuIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuLabel: {
    color: '#888',
    fontSize: 13,
    marginBottom: 4,
    fontWeight: '500',
  },
  menuSubLabel: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  statNumber: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 4,
  },
  statUnit: {
    color: '#888',
    fontSize: 14,
    fontWeight: '600',
  },
});
