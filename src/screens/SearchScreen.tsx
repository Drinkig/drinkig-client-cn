import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  FlatList,
  StatusBar,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { DUMMY_WINE_DB, WineDBItem } from '../data/dummyWines';
import { searchWinesPublic, WineUserDTO } from '../api/wine'; // 사용자용 검색 API 사용

export default function SearchScreen() {
  const navigation = useNavigation();
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState<WineDBItem[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]); // 최근 검색어 (임시 로컬 상태)

  // 검색 로직
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchText.trim().length > 0) {
        try {
          // 사용자용 검색 API 호출
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
              // 상세 정보는 없으므로 undefined 처리 (상세 화면에서 기본값 사용됨)
            }));
            setSearchResults(mappedResults);
          }
        } catch (error) {
          console.error('Wine search failed:', error);
        }
      } else {
        setSearchResults([]);
      }
    }, 500); // 500ms 디바운스

    return () => clearTimeout(timer);
  }, [searchText]);

  const handleSearchSubmit = () => {
    if (searchText.trim() && !recentSearches.includes(searchText.trim())) {
      setRecentSearches(prev => [searchText.trim(), ...prev].slice(0, 10));
    }
  };

  const getWineTypeColor = (type: string) => {
    switch (type) {
      case '레드':
      case 'Red':
        return '#C0392B'; // Darker Red
      case '화이트':
      case 'White':
        return '#D4AC0D'; // Darker Gold/Yellow
      case '스파클링':
      case 'Sparkling':
        return '#2980B9'; // Darker Blue
      case '로제':
      case 'Rose':
        return '#C2185B'; // Darker Pink
      case '디저트':
      case 'Dessert':
        return '#D35400'; // Darker Orange
      default:
        return '#7F8C8D'; // Darker Gray
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
          <Icon name="wine" size={20} color="#8e44ad" />
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
            <Icon name="star" size={14} color="#e74c3c" />
            <Text style={styles.rightRatingText}>{item.vivinoRating.toFixed(1)}</Text>
          </View>
        )}
      </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
      
      {/* 헤더 (검색창) */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.searchBarContainer}>
          <Icon name="search" size={20} color="#888" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="와인 이름, 종류 등으로 검색"
            placeholderTextColor="#888"
            value={searchText}
            onChangeText={setSearchText}
            onSubmitEditing={handleSearchSubmit}
            autoFocus={true} // 진입 시 자동 포커스
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

      {/* 컨텐츠 */}
      <View style={styles.content}>
        {searchText.length > 0 ? (
          <FlatList
            data={searchResults}
            renderItem={renderSearchResult}
            keyExtractor={item => item.id.toString()}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>검색 결과가 없습니다.</Text>
              </View>
            }
          />
        ) : (
          <View style={styles.recentSearchContainer}>
            <Text style={styles.sectionTitle}>최근 검색어</Text>
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
                      <Icon name="close" size={14} color="#888" />
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <Text style={styles.emptyRecentText}>최근 검색 기록이 없습니다.</Text>
            )}
          </View>
        )}
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
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    gap: 12,
  },
  backButton: {
    padding: 4,
  },
  searchBarContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
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
    padding: 16,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  resultIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    overflow: 'hidden',
  },
  resultImage: {
    width: '80%',
    height: '80%',
  },
  resultTextContainer: {
    flex: 1,
    gap: 4, // 요소 간 간격 추가
    paddingVertical: 2, // 상하 여백 살짝 추가
  },
  resultNameKor: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    // marginBottom 제거하고 gap으로 제어
  },
  resultNameEng: {
    color: '#888',
    fontSize: 13,
    // marginBottom 제거하고 gap으로 제어
  },
  resultInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2, // 상단 여백 추가
  },
  typeChip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  typeChipText: {
    color: '#fff',
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
    color: '#e74c3c',
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
  },
  sectionTitle: {
    color: '#fff',
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
    backgroundColor: '#2a2a2a',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#333',
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

