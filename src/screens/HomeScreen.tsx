import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useNotification } from '../context/NotificationContext';
import { WineDBItem } from '../data/dummyWines';
import { HeroSection } from '../components/home/HeroSection';
import { BannerSection } from '../components/home/BannerSection';
import { RecommendedSection } from '../components/home/RecommendedSection';
import { getRecommendedWines } from '../api/wine';

export default function HomeScreen() {
  const navigation = useNavigation();
  const { unreadCount } = useNotification();
  
  // 추천 와인 상태
  const [recommendedWines, setRecommendedWines] = useState<WineDBItem[]>([]);

  useEffect(() => {
    fetchRecommendedWines();
  }, []);

  const fetchRecommendedWines = async () => {
    try {
      const response = await getRecommendedWines();
      if (response.isSuccess) {
        const mappedWines: WineDBItem[] = response.result.map(item => ({
          id: item.wineId,
          nameKor: item.wineName,
          nameEng: item.wineNameEng,
          type: item.sort,
          country: '', // API에서 국가 정보 제공 안함
          grape: '',   // API에서 품종 정보 제공 안함
          imageUri: item.imageUrl,
          // 기타 필수 필드는 나중에 상세 조회 시 채워짐
        }));
        setRecommendedWines(mappedWines);
      }
    } catch (error) {
      console.error('Failed to fetch recommended wines:', error);
      // 에러 시 빈 배열 또는 기존 더미 데이터 사용 등 처리 가능
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />

      {/* 헤더 */}
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
          onPress={() => navigation.navigate('Notification' as never)}
        >
          <Icon name="notifications-outline" size={24} color="#fff" />
          {unreadCount > 0 && <View style={styles.notificationBadge} />}
        </TouchableOpacity>
      </View>

      {/* 메인 컨텐츠 */}
      <View style={styles.content}>
        
        {/* 메인: 와인 추천받기 */}
        <HeroSection 
          onPress={() => {
            // TODO: 추천 플로우로 이동
            console.log('Start Recommendation Flow');
          }} 
        />

        {/* 광고 배너 영역 */}
        <BannerSection />

        {/* 보조: 최근 마신 와인과 비슷한 스타일 */}
        <RecommendedSection 
          data={recommendedWines}
          onPressMore={() => {
            console.log('More recommended wines');
            // 추천 더보기 화면 등으로 이동 가능
          }}
          onPressWine={(wine) => {
            navigation.navigate('WineDetail', { wine });
          }}
        />

      </View>
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
    paddingBottom: 40,
  },
});
