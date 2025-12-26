import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  StatusBar,
  FlatList,
  Image,
  ActivityIndicator,
  Dimensions,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { getMyWines, MyWineDTO, getWineDetailPublic } from '../api/wine';

const MyWineScreen = () => {
  const navigation = useNavigation();
  const isFocused = useIsFocused(); // 화면이 포커스될 때마다 데이터를 다시 불러오기 위해 사용

  // API 데이터 상태
  const [myWines, setMyWines] = useState<MyWineDTO[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedType, setSelectedType] = useState('전체');

  // 정렬 상태
  const [sortType, setSortType] = useState('latest'); // latest, oldest, vintage_high, vintage_low, price_high, price_low
  const [isSortModalVisible, setIsSortModalVisible] = useState(false);

  const wineTypes = ['전체', '레드', '화이트', '스파클링', '로제', '디저트', '주정강화', '기타'];
  const sortOptions = [
    { label: '최근 등록 순', value: 'latest' },
    { label: '보관 오래된 순', value: 'longest_period' },
    { label: '빈티지 높은 순', value: 'vintage_high' },
    { label: '빈티지 낮은 순', value: 'vintage_low' },
    { label: '가격 높은 순', value: 'price_high' },
    { label: '가격 낮은 순', value: 'price_low' },
  ];

  useEffect(() => {
    if (isFocused) {
      fetchMyWines();
    }
  }, [isFocused]);

  const fetchMyWines = async () => {
    try {
      setIsLoading(true);
      const response = await getMyWines();

      if (response.isSuccess) {
        let wines = response.result || [];

        // [임시 해결] 서버에서 wineImageUrl이 null로 오는 경우, 상세 조회를 통해 이미지 채우기
        const updatedWines = await Promise.all(wines.map(async (wine) => {
          if (!wine.wineImageUrl) {
            try {
              // 와인 상세 정보 조회 (이미지 URL 확보 목적)
              const detailRes = await getWineDetailPublic(wine.wineId);
              if (detailRes.isSuccess && detailRes.result.wineInfoResponse.imageUrl) {
                return { ...wine, wineImageUrl: detailRes.result.wineInfoResponse.imageUrl };
              }
            } catch (err) {
              // 실패 시 로그 없이 원본 반환
            }
          }
          return wine;
        }));

        setMyWines(updatedWines);
      } else {
        // 실패 시 (예: 데이터 없음 등) 빈 배열 처리
        setMyWines([]);
      }
    } catch (error) {
      console.error('Failed to fetch my wines:', error);
      // 에러 발생 시에도 빈 목록을 보여주어 로딩 상태 탈출
      setMyWines([]);
    } finally {
      setIsLoading(false);
    }
  };

  // 필터링된 와인 목록
  const filteredWines = myWines.filter(wine => {
    if (selectedType === '전체') return true;
    if (selectedType === '기타') {
      return !['Red', 'White', 'Sparkling', 'Rose', 'Dessert', 'Fortified', '레드', '화이트', '스파클링', '로제', '디저트', '주정강화'].includes(wine.wineSort);
    }
    // 영어/한글 매핑 또는 포함 여부 확인 (API 응답값에 따라 조정 필요)
    // 예: API가 'Red', 'White' 등으로 준다면 매핑 필요. 여기서는 간단히 포함 여부로 체크
    const typeMap: { [key: string]: string } = {
      '레드': 'Red',
      '화이트': 'White',
      '스파클링': 'Sparkling',
      '로제': 'Rose',
      '디저트': 'Dessert',
      '주정강화': 'Fortified'
    };

    const targetType = typeMap[selectedType] || selectedType;
    return wine.wineSort === targetType || wine.wineSort === selectedType;
  });

  // 정렬 로직 적용
  const sortedWines = [...filteredWines].sort((a, b) => {
    switch (sortType) {
      case 'latest':
        // myWineId가 클수록 최신이라고 가정 (또는 createdAt 필드가 있다면 그것 사용)
        return b.myWineId - a.myWineId;
      case 'longest_period':
        // 보관 기간(period)이 긴 순서 (내림차순)
        return b.period - a.period;
      case 'vintage_high':
        // NV(0)는 가장 뒤로 보내기
        if (a.vintageYear === 0) return 1;
        if (b.vintageYear === 0) return -1;
        return b.vintageYear - a.vintageYear;
      case 'vintage_low':
        // NV(0)는 가장 뒤로 보내기
        if (a.vintageYear === 0) return 1;
        if (b.vintageYear === 0) return -1;
        return a.vintageYear - b.vintageYear;
      case 'price_high':
        return b.purchasePrice - a.purchasePrice;
      case 'price_low':
        return a.purchasePrice - b.purchasePrice;
      default:
        return 0;
    }
  });

  // 와인 추가 핸들러
  const handleAddWine = () => {
    // 기존: navigation.navigate('Search' as never);
    // 수정: 와인 등록 화면으로 바로 이동
    navigation.navigate('WineAdd' as never);
  };

  const { width } = Dimensions.get('window');
  const numColumns = 3;
  const gap = 12;
  const padding = 16;
  // (전체 너비 - 좌우 패딩 - (아이템 간 간격 * (컬럼수 - 1))) / 컬럼수
  const itemWidth = (width - padding * 2 - gap * (numColumns - 1)) / numColumns;

  const renderWineItem = ({ item }: { item: MyWineDTO }) => (
    <TouchableOpacity
      style={[styles.wineItem, { width: itemWidth }]}
      onPress={() => navigation.navigate('MyWineDetail', { wineId: item.myWineId })} // myWineId를 넘겨줌
      activeOpacity={0.8}
    >
      <View style={styles.wineImageContainer}>
        {item.wineImageUrl ? (
          <Image source={{ uri: item.wineImageUrl }} style={styles.wineImage} />
        ) : (
          <View style={styles.placeholderImage}>
            <Icon name="wine" size={30} color="#555" />
          </View>
        )}
        {/* 보관 기간 배지 */}
        <View style={styles.periodBadge}>
          <Text style={styles.periodText}>D+{item.period}</Text>
        </View>
      </View>
      <View style={styles.wineInfo}>
        <Text style={styles.wineName} numberOfLines={1} ellipsizeMode="tail">{item.wineName}</Text>
        <Text style={styles.wineVintageText}>
          {item.vintageYear === 0 ? 'NV' : item.vintageYear}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />

      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>내 와인 창고</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAddWine}>
          <Icon name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* 필터 칩 */}
      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          data={wineTypes}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterChipsContainer}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterChip,
                selectedType === item && styles.filterChipSelected
              ]}
              onPress={() => setSelectedType(item)}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.filterChipText,
                selectedType === item && styles.filterChipTextSelected
              ]}>
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* 와인 개수 표시 및 정렬 버튼 */}
      {!isLoading && myWines.length > 0 && (
        <View style={styles.countAndSortContainer}>
          <Text style={styles.countText}>
            총 <Text style={styles.countValue}>{sortedWines.length}</Text>병
          </Text>

          <TouchableOpacity
            style={styles.sortButton}
            onPress={() => setIsSortModalVisible(true)}
          >
            <Text style={styles.sortButtonText}>
              {sortOptions.find(opt => opt.value === sortType)?.label}
            </Text>
            <Icon name="chevron-down" size={14} color="#888" style={{ marginLeft: 4 }} />
          </TouchableOpacity>
        </View>
      )}

      {/* 정렬 모달 */}
      <Modal
        visible={isSortModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsSortModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsSortModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>정렬</Text>
                  <TouchableOpacity onPress={() => setIsSortModalVisible(false)}>
                    <Icon name="close" size={24} color="#fff" />
                  </TouchableOpacity>
                </View>
                {sortOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={styles.sortOptionItem}
                    onPress={() => {
                      setSortType(option.value);
                      setIsSortModalVisible(false);
                    }}
                  >
                    <Text style={[
                      styles.sortOptionText,
                      sortType === option.value && styles.sortOptionTextSelected
                    ]}>
                      {option.label}
                    </Text>
                    {sortType === option.value && (
                      <Icon name="checkmark" size={20} color="#8e44ad" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* 컨텐츠 */}
      {isLoading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#8e44ad" />
        </View>
      ) : sortedWines.length > 0 ? (
        <FlatList
          data={sortedWines}
          renderItem={renderWineItem}
          keyExtractor={(item) => item.myWineId.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          numColumns={numColumns}
          columnWrapperStyle={{ gap: gap }}
        />
      ) : (
        <View style={styles.emptyContent}>
          <Image
            source={require('../assets/wine_cellar.png')}
            style={styles.emptyImage}
            resizeMode="contain"
          />
          {myWines.length > 0 ? (
            // 보유 와인은 있지만 필터링 결과가 없는 경우
            <>
              <Text style={styles.emptyText}>해당 종류의 와인이 없어요</Text>
              <Text style={styles.subText}>다른 종류를 선택하거나{'\n'}새로운 와인을 기록해보세요!</Text>
            </>
          ) : (
            // 보유 와인이 아예 없는 경우 (기존 문구)
            <>
              <Text style={styles.emptyText}>아직 기록된 와인이 없어요</Text>
              <Text style={styles.subText}>우측 상단의 + 버튼을 눌러{'\n'}첫 번째 와인을 기록해보세요!</Text>
            </>
          )}
        </View>
      )}
    </SafeAreaView>
  );
};

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
  addButton: {
    padding: 4,
  },
  filterContainer: {
    backgroundColor: '#1a1a1a',
    paddingTop: 24,
    paddingBottom: 12,
  },
  filterChipsContainer: {
    paddingHorizontal: 16,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#2a2a2a',
    borderWidth: 1,
    borderColor: '#333',
    marginRight: 8,
  },
  filterChipSelected: {
    backgroundColor: '#8e44ad',
    borderColor: '#8e44ad',
  },
  filterChipText: {
    fontSize: 14,
    color: '#888',
    fontWeight: '500',
  },
  filterChipTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
  countAndSortContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  countText: {
    color: '#888',
    fontSize: 14,
  },
  countValue: {
    color: '#fff',
    fontWeight: 'bold',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  sortButtonText: {
    color: '#888',
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '50%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  sortOptionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  sortOptionText: {
    fontSize: 16,
    color: '#ccc',
  },
  sortOptionTextSelected: {
    color: '#8e44ad',
    fontWeight: 'bold',
  },
  listContent: {
    padding: 16,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyImage: {
    width: 150,
    height: 150,
    marginBottom: 20,
  },
  emptyText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
  },
  subText: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 20,
  },
  wineItem: {
    flexDirection: 'column',
    marginBottom: 16,
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    overflow: 'hidden',
    // width는 renderWineItem에서 동적으로 설정
  },
  wineImageContainer: {
    width: '100%',
    aspectRatio: 1, // 정사각형
    backgroundColor: '#2a2a2a', // 카드 배경색과 통일
    position: 'relative', // 배지 위치 잡기 위해 추가
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  wineImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  placeholderImage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  periodBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  periodText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  wineInfo: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  wineName: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 2,
    textAlign: 'left',
  },
  wineVintageText: {
    color: '#888',
    fontSize: 11,
    textAlign: 'left',
  },
  // 기존 스타일 중 사용하지 않는 것들 삭제 또는 유지 (다른 곳에서 안쓰면 삭제)
  wineDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    display: 'none', // 숨김 처리
  },
  wineType: {
    color: '#8e44ad',
    fontSize: 12,
    fontWeight: '600',
  },
  separator: {
    color: '#666',
    fontSize: 12,
    marginHorizontal: 6,
  },
  wineCountry: {
    color: '#888',
    fontSize: 12,
  },
  wineVintage: {
    color: '#888',
    fontSize: 12,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    display: 'none', // 숨김 처리
  },
  priceLabel: {
    color: '#888',
    fontSize: 12,
  },
  priceValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default MyWineScreen;
