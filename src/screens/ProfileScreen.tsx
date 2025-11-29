import React, { useState, useMemo, useEffect } from 'react';
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
  Platform,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { useUser } from '../context/UserContext';
import { getMyWines, MyWineDTO } from '../api/wine';

const ProfileScreen = () => {
  const navigation = useNavigation();
  const { user: userInfo, refreshUserInfo } = useUser();
  const isFocused = useIsFocused();
  
  const [myWines, setMyWines] = useState<MyWineDTO[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 화면 포커스 시 유저 정보 및 와인 목록 갱신
  useEffect(() => {
    if (isFocused) {
      refreshUserInfo();
      fetchMyWines();
    }
  }, [isFocused]);

  const fetchMyWines = async () => {
    try {
      setIsLoading(true);
      const response = await getMyWines();
      if (response.isSuccess) {
        setMyWines(response.result || []);
      } else {
        setMyWines([]);
      }
    } catch (error) {
      console.error('Failed to fetch my wines for profile:', error);
      setMyWines([]);
    } finally {
      setIsLoading(false);
    }
  };

  // 나의 취향 계산 로직 (가장 많이 마신 종류)
  const favoriteCategory = useMemo(() => {
    if (myWines.length === 0) return '없음';

    const categoryCounts: Record<string, number> = {};
    myWines.forEach(wine => {
      const type = wine.wineSort || '기타';
      categoryCounts[type] = (categoryCounts[type] || 0) + 1;
    });

    let bestCategory = '없음';
    let maxCount = 0;

    Object.entries(categoryCounts).forEach(([type, count]) => {
      if (count > maxCount) {
        maxCount = count;
        bestCategory = type;
      }
    });

    return bestCategory;
  }, [myWines]);

  // 필터 카테고리 리스트
  const categories = ['모두', 'Red', 'White', 'Sparkling', 'Rose', 'Dessert', 'Fortified'];
  
  // 선택된 카테고리 상태 관리
  const [selectedCategory, setSelectedCategory] = useState('모두');

  // 정렬 옵션 상태 관리 (기본: 최신순)
  const [sortOption, setSortOption] = useState('최신순');

  // 정렬 버튼 핸들러
  const handleSortPress = () => {
    const options = ['취소', '최신순', '가격 높은 순', '가격 낮은 순'];
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: options,
          cancelButtonIndex: 0,
          userInterfaceStyle: 'dark',
        },
        (buttonIndex) => {
          if (buttonIndex === 1) setSortOption('최신순');
          else if (buttonIndex === 2) setSortOption('가격 높은 순');
          else if (buttonIndex === 3) setSortOption('가격 낮은 순');
        }
      );
    } else {
      // Android용 구현 필요 (모달 등) - 현재는 간단히 토글 등으로 대체하거나 라이브러리 사용
      // 임시: 누를 때마다 순환
      if (sortOption === '최신순') setSortOption('가격 높은 순');
      else if (sortOption === '가격 높은 순') setSortOption('가격 낮은 순');
      else setSortOption('최신순');
    }
  };

  // 필터링 및 정렬된 와인 목록
  const getFilteredAndSortedWines = () => {
    // 1. 필터링
    let result = selectedCategory === '모두'
      ? [...myWines]
      : myWines.filter(wine => wine.wineSort === selectedCategory);

    // 2. 정렬
    result.sort((a, b) => {
      if (sortOption === '최신순') {
        // purchaseDate 기준 내림차순
        return new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime();
      } else if (sortOption === '가격 높은 순') {
        return b.purchasePrice - a.purchasePrice;
      } else if (sortOption === '가격 낮은 순') {
        return a.purchasePrice - b.purchasePrice;
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
          onPress={() => navigation.navigate('Setting' as never)}
        >
          <Icon name="settings-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* 1. 프로필 정보 섹션 */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            {userInfo?.profileImage ? (
              <Image source={{ uri: userInfo.profileImage }} style={styles.profileImage} />
            ) : (
              <Icon name="person" size={40} color="#ccc" />
            )}
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.nickname}>{userInfo?.nickname || '게스트'}</Text>
            <Text style={styles.email}>{userInfo?.email || ''}</Text>
          </View>
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => navigation.navigate('ProfileEdit' as never)}
          >
            <Text style={styles.editButtonText}>수정</Text>
          </TouchableOpacity>
        </View>

        {/* 2. 활동 요약 카드 */}
        <View style={styles.summarySection}>
          <View style={styles.summaryCard}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>보유 와인</Text>
              <Text style={styles.summaryValue}>{myWines.length}병</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>나의 취향</Text>
              <Text style={styles.summaryValue}>{favoriteCategory}</Text>
            </View>
          </View>
        </View>

        {/* 3. 내가 보유한 와인 섹션 */}
        <View style={styles.myWineSection}>
          {/* 섹션 헤더 (타이틀 + 정렬 버튼) */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>내 와인 컬렉션</Text>
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
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#8e44ad" />
            </View>
          ) : (
            <View style={styles.wineListContainer}>
              {displayWines.map((wine) => (
                <TouchableOpacity 
                  key={wine.myWineId} 
                  style={styles.wineCard}
                  onPress={() => navigation.navigate('MyWineDetail', { wineId: wine.myWineId })}
                >
                  {/* 와인 이미지 */}
                  {wine.wineImageUrl ? (
                    <Image source={{ uri: wine.wineImageUrl }} style={styles.wineImage} resizeMode="cover" />
                  ) : (
                    <View style={styles.wineImagePlaceholder}>
                      <Icon name="wine" size={30} color="#ccc" />
                    </View>
                  )}
                  <View style={styles.wineInfo}>
                    <Text style={styles.wineType}>{wine.wineSort}</Text>
                    <Text style={styles.wineName} numberOfLines={1}>{wine.wineName}</Text>
                    <View style={styles.ratingContainer}>
                      {/* 빈티지 표시 */}
                      <Text style={styles.vintageText}>{wine.vintageYear || 'NV'}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
              {displayWines.length === 0 && (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>와인이 없습니다.</Text>
                </View>
              )}
            </View>
          )}
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
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
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
    overflow: 'hidden',
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
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#888',
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
  wineImage: {
    width: '100%',
    height: 120,
  },
  wineImagePlaceholder: {
    width: '100%',
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#333',
  },
  wineInfo: {
    padding: 12,
  },
  wineType: {
    fontSize: 12,
    color: '#8e44ad',
    marginBottom: 4,
    fontWeight: '600',
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
  vintageText: {
    color: '#888',
    fontSize: 12,
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
