import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  FlatList,
  Image,
  ActivityIndicator,
  Dimensions,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { getMyWines, MyWineDTO, getWineDetailPublic, searchWinesPublic } from '../api/wine';
import AdBanner from '../components/common/AdBanner';
import { colors } from '../constants/colors';

const MyWineScreen = () => {
  const navigation = useNavigation();
  const isFocused = useIsFocused();


  const [myWines, setMyWines] = useState<MyWineDTO[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedType, setSelectedType] = useState('전체');


  const [sortType, setSortType] = useState('latest');
  const [isSortModalVisible, setIsSortModalVisible] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(0);

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


        const updatedWines = wines.map((wine) => {
          if (!wine.wineImageUrl) {
            // S3 버킷의 wine 폴더에서 직접 이미지 URL 구성
            // 예: https://drinkeg-bucket-1.s3.ap-northeast-2.amazonaws.com/wine/123.png
            wine.wineImageUrl = `https://drinkeg-bucket-1.s3.ap-northeast-2.amazonaws.com/wine/${wine.wineId}.png`;
          }
          return wine;
        });

        setMyWines(updatedWines);
      } else {

        setMyWines([]);
      }
    } catch (error) {
      console.error('Failed to fetch my wines:', error);

      setMyWines([]);
    } finally {
      setIsLoading(false);
    }
  };


  const filteredWines = myWines.filter(wine => {
    if (selectedType === '전체') return true;
    if (selectedType === '기타') {
      return !['Red', 'White', 'Sparkling', 'Rose', 'Dessert', 'Fortified', '레드', '화이트', '스파클링', '로제', '디저트', '주정강화'].includes(wine.wineSort);
    }

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


  const sortedWines = [...filteredWines].sort((a, b) => {
    switch (sortType) {
      case 'latest':

        return b.myWineId - a.myWineId;
      case 'longest_period':

        return b.period - a.period;
      case 'vintage_high':

        if (a.vintageYear === 0) return 1;
        if (b.vintageYear === 0) return -1;
        return b.vintageYear - a.vintageYear;
      case 'vintage_low':

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

  const handleAddWine = () => {
    navigation.navigate('WineAdd' as never);
  };

  const { width } = Dimensions.get('window');
  const numColumns = 3;
  const gap = 12;
  const padding = 16;

  const itemWidth = (width - padding * 2 - gap * (numColumns - 1)) / numColumns;

  const renderWineItem = ({ item }: { item: MyWineDTO }) => (
    <TouchableOpacity
      style={[styles.wineItem, { width: itemWidth }]}
      onPress={() => navigation.navigate('MyWineDetail', {
        wineId: item.myWineId,
        wineImageUrl: item.wineImageUrl
      })}
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
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />


      <View
        style={styles.header}
        onLayout={(event) => setHeaderHeight(event.nativeEvent.layout.height)}
      >
        <Text style={styles.headerTitle}>내 와인 창고</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAddWine}>
          <Icon name="add" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>


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
            <Icon name="chevron-down" size={14} color={colors.textSecondary} style={{ marginLeft: 4 }} />
          </TouchableOpacity>
        </View>
      )}


      {isSortModalVisible && (
        <View style={[styles.sortModalOverlay, { top: headerHeight }]}>
          <TouchableOpacity
            style={styles.sortModalBackdrop}
            activeOpacity={1}
            onPress={() => setIsSortModalVisible(false)}
          >
            <View style={styles.sortModalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>정렬</Text>
                <TouchableOpacity onPress={() => setIsSortModalVisible(false)}>
                  <Icon name="close" size={24} color={colors.textPrimary} />
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
                    <Icon name="checkmark" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </View>
      )}


      {isLoading ? (
        <View style={styles.centerContent}>
          <AdBanner style={{ marginBottom: 20, backgroundColor: colors.background, width: '100%' }} />
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : sortedWines.length > 0 ? (
        <View style={{ flex: 1 }}>
          <FlatList
            data={sortedWines}
            renderItem={renderWineItem}
            keyExtractor={(item) => item.myWineId.toString()}
            contentContainerStyle={[styles.listContent, { paddingBottom: 20 }]}
            showsVerticalScrollIndicator={false}
            numColumns={numColumns}
            columnWrapperStyle={{ gap: gap }}
            ListFooterComponent={null}
          />
          <AdBanner style={{ marginTop: 0, marginBottom: 0, backgroundColor: colors.background, width: '100%' }} />
        </View>
      ) : (
        <View style={styles.emptyContent}>
          <View style={styles.emptyInner}>
            <Image
              source={require('../assets/Drinky_no_wine_1.png')}
              style={styles.emptyImage}
              resizeMode="contain"
            />
            {myWines.length > 0 ? (
              <>
                <Text style={styles.emptyText}>해당 종류의 와인이 없어요</Text>
                <Text style={styles.subText}>다른 종류를 선택하거나{'\n'}새로운 와인을 기록해보세요!</Text>
              </>
            ) : (
              <>
                <Text style={styles.emptyText}>아직 기록된 와인이 없어요</Text>
                <Text style={styles.subText}>우측 상단의 + 버튼을 눌러{'\n'}첫 번째 와인을 기록해보세요!</Text>
              </>
            )}
          </View>

          <AdBanner style={{ marginTop: 0, marginBottom: 0, backgroundColor: colors.background, width: '100%' }} />
        </View>
      )}


    </SafeAreaView >
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  addButton: {
    padding: 4,
  },
  filterContainer: {
    backgroundColor: colors.background,
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
    backgroundColor: colors.surface1,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
  },
  filterChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  filterChipTextSelected: {
    color: colors.white,
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
    color: colors.textSecondary,
    fontSize: 14,
  },
  countValue: {
    color: colors.textPrimary,
    fontWeight: 'bold',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  sortButtonText: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  sortModalOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
  },
  sortModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(25, 22, 28, 0.5)',
    justifyContent: 'flex-end',
  },
  sortModalContent: {
    backgroundColor: colors.background,
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
    color: colors.textPrimary,
  },
  sortOptionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sortOptionText: {
    fontSize: 16,
    color: colors.textTertiary,
  },
  sortOptionTextSelected: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContent: {
    flex: 1,
    justifyContent: 'space-between',
    paddingBottom: 0,
  },
  emptyInner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  emptyImage: {
    width: 200,
    height: 200,
    marginBottom: 20,
  },
  emptyText: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
  },
  subText: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 20,
  },
  wineItem: {
    flexDirection: 'column',
    marginBottom: 16,
    backgroundColor: colors.surface1,
    borderRadius: 12,
    overflow: 'hidden',

  },
  wineImageContainer: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: colors.surface1,
    position: 'relative',
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
    color: colors.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  wineInfo: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  wineName: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 2,
    textAlign: 'left',
  },
  wineVintageText: {
    color: colors.textSecondary,
    fontSize: 11,
    textAlign: 'left',
  },

});

export default MyWineScreen;
