import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  StatusBar,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { searchWinesPublic, WineUserDTO } from '../api/wine';
import { WineDBItem } from '../types/Wine';
import { RootStackParamList } from '../types';
import AdBanner from '../components/common/AdBanner';
import { colors } from '../constants/colors';

type SearchResultScreenRouteProp = RouteProp<RootStackParamList, 'SearchResult'>;

export default function SearchResultScreen() {
  const navigation = useNavigation();
  const route = useRoute<SearchResultScreenRouteProp>();
  const { searchKeyword, returnScreen } = route.params;

  const [isLoading, setIsLoading] = useState(true);
  const [searchResults, setSearchResults] = useState<WineDBItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetchSearchResults();
  }, [searchKeyword]);

  const fetchSearchResults = async () => {
    setIsLoading(true);
    try {
      const response = await searchWinesPublic({
        searchName: searchKeyword,
        page: 0,
        size: 50,
      });

      if (response.isSuccess) {
        const total = response.result.totalElements ?? response.result.content.length;
        setTotalCount(total);

        const mappedResults: WineDBItem[] = response.result.content.map((item: WineUserDTO) => ({
          id: item.wineId,
          nameKor: item.name,
          nameEng: item.nameEng,
          type: item.sort,
          country: item.country,
          grape: item.variety,
          imageUri: item.imageUrl,
          vivinoRating: item.vivinoRating,
        }));
        setSearchResults(mappedResults);
      }
    } catch (error) {
      console.error('Search result fetch failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getWineTypeColor = (type: string) => {
    switch (type) {
      case '레드':
      case 'Red': return '#EF5350';
      case '화이트':
      case 'White': return '#F4D03F';
      case '스파클링':
      case 'Sparkling': return '#5DADE2';
      case '로제':
      case 'Rose': return '#F1948A';
      case '디저트':
      case 'Dessert': return '#F5B041';
      default: return '#95A5A6';
    }
  };

  const handleWinePress = (item: WineDBItem) => {
    if (returnScreen === 'TastingNoteWrite') {
      navigation.navigate('TastingNoteWrite', {
        wineId: item.id,
        wineName: item.nameKor,
        wineImage: item.imageUri,
        wineType: item.type,
      });
    } else {
      navigation.navigate('WineDetail', { wine: item });
    }
  };

  const renderSearchResult = ({ item }: { item: WineDBItem }) => (
    <TouchableOpacity
      style={styles.resultItem}
      onPress={() => handleWinePress(item)}
    >
      <View style={styles.resultIconContainer}>
        {item.imageUri ? (
          <Image
            source={{ uri: item.imageUri }}
            style={styles.resultImage}
            resizeMode="contain"
          />
        ) : (
          <Icon name="wine" size={20} color={colors.primary} />
        )}
      </View>
      <View style={styles.resultTextContainer}>
        <Text style={styles.resultNameKor}>{item.nameKor}</Text>
        <Text style={styles.resultNameEng}>{item.nameEng}</Text>
        <View style={styles.resultInfoContainer}>
          <View style={[styles.typeChip, { backgroundColor: getWineTypeColor(item.type) }]}>
            <Text style={styles.typeChipText}>{item.type}</Text>
          </View>
          <Text style={styles.resultCountryText}>{item.country}</Text>
        </View>
      </View>
      {item.vivinoRating && (
        <View style={styles.rightRatingContainer}>
          <Icon name="star" size={14} color={colors.error} />
          <Text style={styles.rightRatingText}>{item.vivinoRating.toFixed(1)}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />


      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>'{searchKeyword}' 검색 결과</Text>
        <View style={{ width: 24 }} />
      </View>


      <View style={styles.content}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <AdBanner style={{ marginTop: 0, marginBottom: 0, marginVertical: 0, backgroundColor: colors.background }} />
            <ActivityIndicator size="large" color="#E50914" />
          </View>
        ) : (
          <FlatList
            showsVerticalScrollIndicator={false}
            data={searchResults}
            renderItem={renderSearchResult}
            keyExtractor={item => item.id.toString()}
            contentContainerStyle={styles.listContent}
            ListHeaderComponent={
              <View>
                <AdBanner style={{ marginTop: 0, marginBottom: 0, marginVertical: 0, backgroundColor: colors.background }} />
                {!isLoading && searchResults.length > 0 ? <SearchResultHeader count={totalCount} /> : null}
              </View>
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>검색 결과가 없습니다.</Text>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const SearchResultHeader = ({ count }: { count: number }) => (
  <View style={styles.resultCountContainer}>
    <Text style={styles.resultCountText}>총 <Text style={styles.resultCountHighlight}>{count}개</Text>의 검색 결과</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultCountContainer: {
    paddingTop: 16,
    paddingBottom: 16,
  },
  resultCountText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  resultCountHighlight: {
    color: colors.white,
    fontWeight: 'bold',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 0,
    paddingBottom: 110,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  resultIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: colors.surface1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    overflow: 'hidden',
  },
  resultImage: {
    width: '85%',
    height: '85%',
  },
  resultTextContainer: {
    flex: 1,
    gap: 4,
    paddingVertical: 2,
  },
  resultNameKor: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  resultNameEng: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  resultInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  typeChip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  typeChipText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  resultCountryText: {
    color: '#666',
    fontSize: 12,
  },
  rightRatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingLeft: 8,
  },
  rightRatingText: {
    fontSize: 14,
    color: colors.error,
    fontWeight: 'bold',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
  },
});

