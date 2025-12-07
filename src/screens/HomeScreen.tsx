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
import { useUser } from '../context/UserContext';
import { WineDBItem } from '../data/dummyWines';
import { HeroSection } from '../components/home/HeroSection';
import { BannerSection } from '../components/home/BannerSection';
import { RecommendedSection } from '../components/home/RecommendedSection';
import { getRecommendedWines, searchWinesPublic } from '../api/wine';

export default function HomeScreen() {
  const navigation = useNavigation();
  const { unreadCount } = useNotification();
  const { user, recommendations } = useUser();
  
  // 추천 와인 상태
  const [recommendedWines, setRecommendedWines] = useState<WineDBItem[]>([]);
  const [recommendationTitle, setRecommendationTitle] = useState('최근 마신 와인과 비슷한 스타일');

  useEffect(() => {
    fetchRecommendedWines();
  }, [recommendations]); // 추천 정보가 변경되면 다시 조회

  const fetchRecommendedWines = async () => {
    try {
      // 1. 유저 추천 정보(국가/품종)가 있는 경우 우선적으로 해당 정보로 검색
      if (recommendations && recommendations.length > 0) {
        // 첫 번째 추천 정보를 기준으로 검색 (또는 랜덤 선택 등 로직 적용 가능)
        const targetRec = recommendations[0];
        
        // 타이틀 설정
        const title = `${user?.nickname || '회원'}님이 좋아할만한 와인`;
        setRecommendationTitle(title);

        // 국가와 품종으로 와인 검색
        const response = await searchWinesPublic({
          wineCountry: targetRec.country,
          wineVariety: targetRec.variety,
          size: 10 // 적절한 수량 설정
        });

        if (response.isSuccess && response.result.content.length > 0) {
          const mappedWines: WineDBItem[] = response.result.content.map(item => ({
            id: item.wineId,
            nameKor: item.name,
            nameEng: item.nameEng,
            type: item.sort,
            country: item.country,
            grape: item.variety,
            imageUri: item.imageUrl,
            // WineDBItem 필수 필드 채우기 (API 응답에 없는 경우 기본값)
            description: '',
            features: { sweetness: 0, acidity: 0, body: 0, tannin: 0 }
          }));
          setRecommendedWines(mappedWines);
          return; // 성공적으로 로드했으면 종료
        }
      }

      // 2. 추천 정보가 없거나 검색 결과가 없는 경우 기존 추천 API 사용 (Fallback)
      setRecommendationTitle('최근 마신 와인과 비슷한 스타일');
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

        {/* 보조: 추천 와인 섹션 (동적 타이틀 적용) */}
        <RecommendedSection 
          title={recommendationTitle}
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
