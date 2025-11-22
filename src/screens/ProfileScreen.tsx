import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  ActionSheetIOS,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '../context/UserContext';

// 더미 데이터 타입 정의
interface Wine {
  id: number;
  name: string;
  type: string; // 화이트, 레드, 스파클링, 디저트, 기타
  rating: number;
  date: string; // 마신 날짜 (YYYY-MM-DD)
  image?: string; // 실제 이미지가 없으므로 플레이스홀더 색상으로 대체
  color: string; // 와인 색상 (UI용)
}

const ProfileScreen = () => {
  const navigation = useNavigation();
  const { user: userInfo } = useUser();
  
  // 더미 와인 데이터 (5개) - 날짜 추가
  const myWines: Wine[] = [
    { id: 1, name: '샤토 마고 2015', type: '레드', rating: 4.8, date: '2023-10-15', color: '#C0392B' },
    { id: 2, name: '클라우디 베이 쇼비뇽 블랑', type: '화이트', rating: 4.5, date: '2023-11-02', color: '#F1C40F' },
    { id: 3, name: '돔 페리뇽 2012', type: '스파클링', rating: 4.9, date: '2023-12-25', color: '#3498DB' },
    { id: 4, name: '샤토 디켐 2005', type: '디저트', rating: 5.0, date: '2024-01-01', color: '#E67E22' },
    { id: 5, name: '포트 와인 샘플', type: '기타', rating: 4.2, date: '2023-09-10', color: '#8E44AD' },
    { id: 6, name: '카베르네 소비뇽 샘플', type: '레드', rating: 3.5, date: '2023-08-10', color: '#C0392B' }, // 레드 추가 (평균 깎아먹기 테스트용)
  ];

  // 나의 취향 계산 로직 (평균 별점이 가장 높은 카테고리 찾기)
  const favoriteCategory = useMemo(() => {
    if (myWines.length === 0) return '없음';

    const categoryStats: Record<string, { totalRating: number; count: number }> = {};

    // 1. 종류별 합계 및 개수 집계
    myWines.forEach(wine => {
      if (!categoryStats[wine.type]) {
        categoryStats[wine.type] = { totalRating: 0, count: 0 };
      }
      categoryStats[wine.type].totalRating += wine.rating;
      categoryStats[wine.type].count += 1;
    });

    // 2. 평균 별점 계산 및 최대값 찾기
    let maxAvgRating = -1;
    let bestCategory = '없음';

    Object.keys(categoryStats).forEach(type => {
      const { totalRating, count } = categoryStats[type];
      const avgRating = totalRating / count;

      if (avgRating > maxAvgRating) {
        maxAvgRating = avgRating;
        bestCategory = type;
      }
    });

    return bestCategory;
  }, [myWines]);

  // 사용자 정보 (동적 데이터 반영)
  const user = {
    ...userInfo,
    wineCount: myWines.length, 
    favoriteCategory: favoriteCategory, // 계산된 취향 반영
  };

  // 필터 카테고리 리스트
  const categories = ['모두', '화이트', '레드', '스파클링', '디저트', '기타'];
  
  // 선택된 카테고리 상태 관리
  const [selectedCategory, setSelectedCategory] = useState('모두');

  // 정렬 옵션 상태 관리 (기본: 최신순)
  const [sortOption, setSortOption] = useState('최신순');

  // 정렬 버튼 핸들러
  const handleSortPress = () => {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options: ['취소', '최신순', '별점 높은 순', '별점 낮은 순'],
        cancelButtonIndex: 0,
        userInterfaceStyle: 'dark', // 다크 모드 스타일
      },
      (buttonIndex) => {
        if (buttonIndex === 1) setSortOption('최신순');
        else if (buttonIndex === 2) setSortOption('별점 높은 순');
        else if (buttonIndex === 3) setSortOption('별점 낮은 순');
      }
    );
  };

  // 필터링 및 정렬된 와인 목록
  const getFilteredAndSortedWines = () => {
    // 1. 필터링
    let result = selectedCategory === '모두'
      ? [...myWines]
      : myWines.filter(wine => wine.type === selectedCategory);

    // 2. 정렬
    result.sort((a, b) => {
      if (sortOption === '최신순') {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      } else if (sortOption === '별점 높은 순') {
        return b.rating - a.rating;
      } else if (sortOption === '별점 낮은 순') {
        return a.rating - b.rating;
      }
      return 0;
    });

    return result;
  };

  const displayWines = getFilteredAndSortedWines();

  return (
    <SafeAreaView style={styles.container}>
      {/* 상단 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>프로필</Text>
        <TouchableOpacity 
          style={styles.settingsButton}
          onPress={() => navigation.navigate('Setting')}
        >
          <Icon name="settings-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* 1. 프로필 정보 섹션 */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            {user.profileImage ? (
              <Image source={{ uri: user.profileImage }} style={styles.profileImage} />
            ) : (
              <Icon name="person" size={40} color="#ccc" />
            )}
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.nickname}>{user.nickname}</Text>
          </View>
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => navigation.navigate('ProfileEdit')}
          >
            <Text style={styles.editButtonText}>수정</Text>
          </TouchableOpacity>
        </View>

        {/* 2. 활동 요약 카드 */}
        <View style={styles.summarySection}>
          <View style={styles.summaryCard}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>마신 와인</Text>
              <Text style={styles.summaryValue}>{user.wineCount}병</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>나의 취향</Text>
              <Text style={styles.summaryValue}>{user.favoriteCategory}</Text>
            </View>
          </View>
        </View>

        {/* 3. 내가 마신 와인 섹션 */}
        <View style={styles.myWineSection}>
          {/* 섹션 헤더 (타이틀 + 정렬 버튼) */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>내가 마신 와인</Text>
            <TouchableOpacity style={styles.sortButton} onPress={handleSortPress}>
              <Text style={styles.sortButtonText}>{sortOption}</Text>
              <Icon name="chevron-down" size={12} color="#888" />
            </TouchableOpacity>
          </View>
          
          {/* 필터 버튼 */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryContainer}
          >
            {categories.map((category, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.categoryButton,
                  selectedCategory === category && styles.categoryButtonActive
                ]}
                onPress={() => setSelectedCategory(category)}
              >
                <Text 
                  style={[
                    styles.categoryText,
                    selectedCategory === category && styles.categoryTextActive
                  ]}
                >
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* 와인 리스트 (그리드) */}
          <View style={styles.wineListContainer}>
            {displayWines.map((wine) => (
              <View key={wine.id} style={styles.wineCard}>
                {/* 와인 이미지 플레이스홀더 */}
                <View style={[styles.wineImagePlaceholder, { backgroundColor: wine.color + '40' }]}>
                  <Icon name="wine" size={30} color={wine.color} />
                </View>
                <View style={styles.wineInfo}>
                  <Text style={styles.wineType}>{wine.type}</Text>
                  <Text style={styles.wineName} numberOfLines={1}>{wine.name}</Text>
                  <View style={styles.ratingContainer}>
                    <Icon name="star" size={12} color="#F1C40F" />
                    <Text style={styles.ratingText}>{wine.rating}</Text>
                  </View>
                </View>
              </View>
            ))}
            {displayWines.length === 0 && (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>마신 와인이 없습니다.</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const { width } = Dimensions.get('window');
const cardWidth = (width - 48 - 12) / 2; // (화면너비 - 패딩 - 사이간격) / 2

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  settingsButton: {
    padding: 4,
  },
  scrollContent: {
    paddingVertical: 20,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 10,
    paddingHorizontal: 24,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#444',
    marginRight: 16,
    overflow: 'hidden', // 이미지가 둥근 테두리를 넘지 않도록
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  userInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  nickname: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    fontFamily: 'Georgia',
  },
  editButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#333',
    borderWidth: 1,
    borderColor: '#555',
  },
  editButtonText: {
    color: '#ccc',
    fontSize: 13,
    fontWeight: '500',
  },
  summarySection: {
    width: '100%',
    marginBottom: 40,
    paddingHorizontal: 24,
  },
  summaryCard: {
    backgroundColor: '#333',
    borderRadius: 16,
    padding: 24,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#888',
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#8e44ad',
  },
  divider: {
    width: 1,
    height: '80%',
    backgroundColor: '#444',
  },
  myWineSection: {
    width: '100%',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sortButtonText: {
    color: '#888',
    fontSize: 14,
  },
  categoryContainer: {
    paddingHorizontal: 24,
    gap: 10,
    marginBottom: 20,
  },
  categoryButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#333',
    borderWidth: 1,
    borderColor: '#444',
  },
  categoryButtonActive: {
    backgroundColor: '#8e44ad',
    borderColor: '#8e44ad',
  },
  categoryText: {
    color: '#888',
    fontSize: 14,
    fontWeight: '500',
  },
  categoryTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  wineListContainer: {
    paddingHorizontal: 24,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  wineCard: {
    width: cardWidth,
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  wineImagePlaceholder: {
    width: '100%',
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wineInfo: {
    padding: 12,
  },
  wineType: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  wineName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 6,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    color: '#F1C40F',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyContainer: {
    width: '100%',
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#666',
    fontSize: 14,
  },
});

export default ProfileScreen;
