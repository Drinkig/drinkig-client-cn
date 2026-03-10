import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  StatusBar,
  Image,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation, useFocusEffect, useRoute, RouteProp } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback } from 'react';
import { WineDBItem } from '../types/Wine';
import { searchWinesPublic, WineUserDTO } from '../api/wine';
import { RootStackParamList } from '../types';
import { colors } from '../constants/colors';
import { useTranslation, Trans } from 'react-i18next';

type SearchScreenRouteProp = RouteProp<RootStackParamList, 'Search'> | RouteProp<RootStackParamList, 'WineSearch'>;

export default function SearchScreen() {
  const navigation = useNavigation();
  const route = useRoute<SearchScreenRouteProp>();
  const { t } = useTranslation();
  const [returnScreen, setReturnScreen] = useState<keyof RootStackParamList | undefined>(undefined);

  useFocusEffect(
    useCallback(() => {
      if (route.params?.returnScreen) {
        setReturnScreen(route.params.returnScreen);
      } else {

        setReturnScreen(undefined);
      }
    }, [route.params])
  );

  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState<WineDBItem[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [recentWines, setRecentWines] = useState<WineDBItem[]>([]);


  useFocusEffect(
    useCallback(() => {
      loadRecentWines();
    }, [])
  );

  const loadRecentWines = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem('recent_wines');
      if (jsonValue != null) {
        setRecentWines(JSON.parse(jsonValue));
      }
    } catch (e) {
      console.error('Failed to load recent wines', e);
    }
  };


  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchText.trim().length > 0) {
        try {

          const response = await searchWinesPublic({
            searchName: searchText,
            page: 0,
            size: 20
          });

          if (response.isSuccess) {
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
          console.error('Wine search failed:', error);
        }
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchText]);

  const handleSearchSubmit = () => {
    const trimmedText = searchText.trim();
    if (trimmedText) {

      if (!recentSearches.includes(trimmedText)) {
        setRecentSearches(prev => [trimmedText, ...prev].slice(0, 10));
      }

      navigation.navigate('SearchResult', { searchKeyword: trimmedText, returnScreen });
    }
  };

  const getWineTypeColor = (type: string) => {
    switch (type) {
      case '레드':
      case 'Red':
        return '#EF5350';
      case '화이트':
      case 'White':
        return '#F4D03F';
      case '스파클링':
      case 'Sparkling':
        return '#5DADE2';
      case '로제':
      case 'Rose':
        return '#F1948A';
      case '디저트':
      case 'Dessert':
        return '#F5B041';
      default:
        return '#95A5A6';
    }
  };

  const renderSearchResult = ({ item }: { item: WineDBItem }) => (
    <TouchableOpacity
      style={styles.resultItem}
      onPress={() => navigation.navigate('WineDetail', { wine: item })}
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


      <View style={styles.headerContainer}>
        <View style={styles.headerPill}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color={colors.white} />
          </TouchableOpacity>
          <View style={styles.searchBarContainer}>
            <Icon name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder={t('search.placeholder')}
              placeholderTextColor={colors.textSecondary}
              value={searchText}
              onChangeText={setSearchText}
              onSubmitEditing={handleSearchSubmit}
              autoFocus={true}
            />
            {searchText.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchText('')}
                style={styles.clearButton}
              >
                <Icon name="close-circle" size={18} color="#666" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>


      <View style={styles.content}>
        {searchText.length > 0 ? (
          <FlatList
            showsVerticalScrollIndicator={false}
            data={searchResults}
            renderItem={renderSearchResult}
            keyExtractor={item => item.id.toString()}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>{t('search.emptyResult')}</Text>
              </View>
            }
          />
        ) : (
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.recentSearchContainer}>
              <Text style={styles.sectionTitle}>{t('search.recentSearch')}</Text>
              {recentSearches.length > 0 ? (
                <View style={styles.recentTags}>
                  {recentSearches.map((text, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.recentTag}
                      onPress={() => setSearchText(text)}
                    >
                      <Text style={styles.recentTagText}>{text}</Text>
                      <TouchableOpacity
                        style={styles.removeTagButton}
                        onPress={() => setRecentSearches(prev => prev.filter((_, i) => i !== index))}
                      >
                        <Icon name="close" size={14} color={colors.textSecondary} />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <Text style={styles.emptyRecentText}>{t('search.emptyRecentSearch')}</Text>
              )}
            </View>

            <View style={styles.recentWineContainer}>
              <Text style={styles.sectionTitle}>{t('search.recentWine')}</Text>
              {recentWines.length > 0 ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.recentWineList}
                >
                  {recentWines.map((wine) => (
                    <TouchableOpacity
                      key={wine.id}
                      style={styles.recentWineItem}
                      onPress={() => navigation.navigate('WineDetail', { wine })}
                    >
                      <View style={styles.recentWineImageContainer}>
                        {wine.imageUri ? (
                          <Image
                            source={{ uri: wine.imageUri }}
                            style={styles.recentWineImage}
                            resizeMode="contain"
                          />
                        ) : (
                          <Icon name="wine" size={30} color={colors.primary} />
                        )}
                      </View>
                      <Text style={styles.recentWineName} numberOfLines={2}>{wine.nameKor}</Text>
                      <Text style={styles.recentWineType}>{wine.type}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              ) : (
                <Text style={styles.emptyRecentText}>{t('search.emptyRecentWine')}</Text>
              )}
            </View>
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingVertical: 18,
    paddingTop: 20,
    backgroundColor: colors.background,
    zIndex: 10,
  },
  headerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface1, // Matte pill color
    borderRadius: 24, // High border radius for pill shape
    height: 52, // Taller pill
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  backButton: {
    padding: 8,
    marginRight: 4,
  },
  searchBarContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent', // Transparent to let pill show
    height: '100%',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: colors.white,
    fontSize: 16,
    padding: 0,
    height: '100%',
  },
  clearButton: {
    padding: 4,
  },
  content: {
    flex: 1,
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
  recentSearchContainer: {
    padding: 24,
    paddingBottom: 12,
  },
  recentWineContainer: {
    padding: 24,
    paddingTop: 12,
  },
  recentWineList: {
    gap: 16,
    paddingRight: 24,
  },
  recentWineItem: {
    width: 100,
  },
  recentWineImageContainer: {
    width: 100,
    height: 100,
    backgroundColor: colors.surface1,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  recentWineImage: {
    width: '80%',
    height: '80%',
  },
  recentWineName: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
    height: 32,
  },
  recentWineType: {
    color: colors.textSecondary,
    fontSize: 11,
  },
  sectionTitle: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  recentTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  recentTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  recentTagText: {
    color: '#ccc',
    fontSize: 14,
    marginRight: 6,
  },
  removeTagButton: {
    padding: 2,
  },
  emptyRecentText: {
    color: '#666',
    fontSize: 14,
  },
});

