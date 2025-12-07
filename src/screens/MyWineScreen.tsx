import React, { useEffect, useState } from 'react';
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
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { getMyWines, MyWineDTO } from '../api/wine';

const MyWineScreen = () => {
  const navigation = useNavigation();
  const isFocused = useIsFocused(); // 화면이 포커스될 때마다 데이터를 다시 불러오기 위해 사용

  // API 데이터 상태
  const [myWines, setMyWines] = useState<MyWineDTO[]>([]);
  const [isLoading, setIsLoading] = useState(false);

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
        // result가 null일 경우 빈 배열로 처리
        setMyWines(response.result || []);
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

  // 와인 추가 핸들러
  const handleAddWine = () => {
    navigation.navigate('Search' as never); // 와인 추가는 검색 화면에서 시작
  };

  const renderWineItem = ({ item }: { item: MyWineDTO }) => (
    <TouchableOpacity 
      style={styles.wineItem}
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
      </View>
      <View style={styles.wineInfo}>
        <Text style={styles.wineName}>{item.wineName}</Text>
        <View style={styles.wineDetails}>
          <Text style={styles.wineType}>{item.wineSort}</Text>
          <Text style={styles.separator}>|</Text>
          <Text style={styles.wineCountry}>{item.wineCountry}</Text>
          {item.vintageYear ? (
            <>
              <Text style={styles.separator}>|</Text>
              <Text style={styles.wineVintage}>{item.vintageYear}</Text>
            </>
          ) : null}
        </View>
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>구매가 </Text>
          <Text style={styles.priceValue}>
            {item.purchasePrice ? `₩${item.purchasePrice.toLocaleString()}` : '-'}
          </Text>
        </View>
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

      {/* 컨텐츠 */}
      {isLoading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#8e44ad" />
        </View>
      ) : myWines.length > 0 ? (
        <FlatList
          data={myWines}
          renderItem={renderWineItem}
          keyExtractor={(item) => item.myWineId.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContent}>
          <Image 
            source={require('../assets/user_image/Drinky_1.png')} 
            style={styles.emptyImage}
            resizeMode="contain"
          />
          <Text style={styles.emptyText}>아직 기록된 와인이 없어요</Text>
          <Text style={styles.subText}>우측 상단의 + 버튼을 눌러{'\n'}첫 번째 와인을 기록해보세요!</Text>
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
    flexDirection: 'row',
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    marginBottom: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  wineImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#333',
    marginRight: 16,
  },
  wineImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderImage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wineInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  wineName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  wineDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
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
