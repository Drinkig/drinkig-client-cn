import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { RootStackParamList } from '../types';
import { WineDBItem, VintageData } from '../data/dummyWines';
import { MyWine } from '../context/WineContext';
import { getWineDetailPublic, WineDetailDTO, addToWishlist, removeFromWishlist } from '../api/wine';

// Components
import VintageSelectionModal from '../components/wine_detail/VintageSelectionModal';
import MyRecordTab from '../components/wine_detail/tabs/MyRecordTab';
import InfoTab from '../components/wine_detail/tabs/InfoTab';
import ReviewTab from '../components/wine_detail/tabs/ReviewTab';
import PriceTab from '../components/wine_detail/tabs/PriceTab';

type WineDetailRouteProp = RouteProp<RootStackParamList, 'WineDetail'>;

// 타입 가드
function isMyWine(wine: WineDBItem | MyWine): wine is MyWine {
  return 'purchasePrice' in wine;
}

export default function WineDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute<WineDetailRouteProp>();
  const { wine } = route.params;
  const isMyWineItem = isMyWine(wine);

  // API 데이터 상태
  const [apiWineDetail, setApiWineDetail] = useState<any | null>(null); // any로 임시 처리 (상세 스펙 확인 필요)
  const [isLoading, setIsLoading] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  // 탭 상태: 
  const activeTabState = useState<string>(isMyWineItem ? 'my_record' : 'info');
  const [activeTab, setActiveTab] = activeTabState;
  const [selectedVintage, setSelectedVintage] = useState<VintageData | null>(null);
  const [isVintageModalVisible, setVintageModalVisible] = useState(false);

  // API 상세 조회
  useEffect(() => {
    const fetchDetail = async () => {
      if (!isMyWineItem && wine.id) {
        try {
          setIsLoading(true);
          // 사용자용 API는 vintageYear를 받을 수 있음. 현재는 선택된 빈티지 또는 기본값(NV 등)
          // ALL일 때는 vintageYear를 보내지 않음 (전체 조회)
          const vintageYear = selectedVintage && selectedVintage.year !== 'NV' && selectedVintage.year !== 'ALL' 
            ? parseInt(selectedVintage.year) 
            : undefined;
          
          const response = await getWineDetailPublic(wine.id as number, vintageYear);
          if (response.isSuccess) {
            const detail = response.result.wineInfoResponse;
            setApiWineDetail(detail);
            setIsLiked(detail.liked);
            
            // 최근 본 와인 저장 (상세 정보가 로드된 후 저장)
            const wineToSave: WineDBItem = {
              ...wine,
              imageUri: detail.imageUrl || wine.imageUri, // API 이미지 우선
              nameKor: detail.name || wine.nameKor,
              nameEng: detail.nameEng || wine.nameEng,
              type: detail.sort || wine.type,
              country: detail.country || wine.country,
              grape: detail.variety || wine.grape,
              vivinoRating: detail.vivinoRating || wine.vivinoRating,
            };
            saveToRecent(wineToSave);
          }
        } catch (error) {
          console.error('Failed to fetch wine detail:', error);
          // API 실패 시에도 기본 정보로 저장 시도
          saveToRecent(wine);
        } finally {
          setIsLoading(false);
        }
      } else if (!isMyWineItem && wine.id) {
        // 이미 API 상세 정보가 있는 경우 등 (혹은 재진입)
        saveToRecent(wine);
      }
    };

    fetchDetail();
  }, [isMyWineItem, wine.id, selectedVintage]); // selectedVintage 변경 시 재조회 가능하도록

  // 최근 본 와인 저장 함수
  const saveToRecent = async (item: WineDBItem) => {
    try {
      const jsonValue = await AsyncStorage.getItem('recent_wines');
      let recentWines: WineDBItem[] = jsonValue != null ? JSON.parse(jsonValue) : [];
      
      // 중복 제거 (이미 있으면 제거 후 맨 앞으로)
      recentWines = recentWines.filter(w => w.id !== item.id);
      
      // 맨 앞에 추가
      recentWines.unshift(item);
      
      // 10개 제한
      if (recentWines.length > 10) {
        recentWines = recentWines.slice(0, 10);
      }
      
      await AsyncStorage.setItem('recent_wines', JSON.stringify(recentWines));
    } catch (e) {
      console.error('Failed to save recent wine', e);
    }
  };

  // 위시리스트 토글 핸들러
  const handleToggleWishlist = async () => {
    if (isMyWineItem) return; // 내 와인은 위시리스트 대상 아님 (이미 보유)
    
    // 낙관적 업데이트
    const previousState = isLiked;
    setIsLiked(!previousState);

    try {
      // ALL일 때는 vintageYear를 undefined로 보냄
      const vintageYear = selectedVintage && selectedVintage.year !== 'NV' && selectedVintage.year !== 'ALL' 
        ? parseInt(selectedVintage.year) 
        : undefined;
      
      if (previousState) {
        // 이미 좋아요 상태였으면 삭제
        await removeFromWishlist(wine.id as number, vintageYear);
      } else {
        // 아니었으면 추가
        await addToWishlist(wine.id as number, vintageYear);
      }
    } catch (error) {
      console.error('Wishlist toggle failed:', error);
      setIsLiked(previousState); // 실패 시 롤백
      Alert.alert('오류', '위시리스트 변경에 실패했습니다.');
    }
  };

  // 공통 필드 추출 (API 데이터 우선 사용)
  const nameKor = isMyWineItem ? wine.name : (apiWineDetail?.name || wine.nameKor);
  const nameEng = isMyWineItem ? '' : (apiWineDetail?.nameEng || wine.nameEng);
  const type = apiWineDetail?.sort || wine.type;
  const country = apiWineDetail?.country || wine.country;
  const grape = apiWineDetail?.variety || wine.grape;
  const imageUri = !isMyWineItem && apiWineDetail?.imageUrl ? apiWineDetail.imageUrl : wine.imageUri;
  
  // 상세 데이터 준비
  // [수정] API에서 features(맛 그래프)를 제공하면 사용, 없으면 null
  // 우선순위: official > avg > null
  const features = !isMyWineItem && apiWineDetail ? {
    sweetness: apiWineDetail.officialSweetness ?? apiWineDetail.avgSweetness,
    acidity: apiWineDetail.officialAcidity ?? apiWineDetail.avgAcidity,
    body: apiWineDetail.officialBody ?? apiWineDetail.avgBody,
    tannin: apiWineDetail.officialTannin ?? apiWineDetail.avgTannin,
  } : (!isMyWineItem && wine.features ? wine.features : null);

  // [수정] 설명: API officialDescription 우선, 없으면 wine.description, 없으면 null
  const description = !isMyWineItem && apiWineDetail?.officialDescription 
    ? apiWineDetail.officialDescription 
    : (!isMyWineItem && wine.description ? wine.description : null);
  
  // [수정] Nose: official 우선, 없으면 nose, 없으면 wine.nose
  const nose = !isMyWineItem && apiWineDetail ? 
    [
      apiWineDetail.officialNose1 || apiWineDetail.nose1,
      apiWineDetail.officialNose2 || apiWineDetail.nose2,
      apiWineDetail.officialNose3 || apiWineDetail.nose3
    ].filter(Boolean) : 
    (!isMyWineItem && wine.nose ? wine.nose : null);
  
  // [수정] Palate: officialPalate 사용
  const palate = !isMyWineItem && apiWineDetail ? 
    [
      apiWineDetail.officialPalate1,
      apiWineDetail.officialPalate2,
      apiWineDetail.officialPalate3
    ].filter(Boolean) :
    (!isMyWineItem && wine.palate ? wine.palate : null);

  // [수정] Finish: officialFinish 사용
  const finish = !isMyWineItem && apiWineDetail ? 
    [
      apiWineDetail.officialFinish1,
      apiWineDetail.officialFinish2,
      apiWineDetail.officialFinish3
    ].filter(Boolean) :
    (!isMyWineItem && wine.finish ? wine.finish : null);
  
  const rawVintages = !isMyWineItem ? wine.vintages : undefined;

  // 빈티지 리스트 생성: ALL + NV + 2025 ~ 1950
  const vintages = useMemo(() => {
    // 1. ALL (전체)
    const list: VintageData[] = [{
      year: 'ALL',
      rating: 0,
      reviews: [],
      prices: []
    }];

    // 2. NV (Non-Vintage)
    list.push({
      year: 'NV',
      rating: 0,
      reviews: [],
      prices: []
    });

    // 3. 2025 ~ 1950
    for (let year = 2025; year >= 1950; year--) {
      list.push({
        year: year.toString(),
        rating: 0,
        reviews: [],
        prices: []
      });
    }

    // 4. 실제 데이터가 있으면 매핑 (ALL은 그대로 둠)
    if (rawVintages) {
      return list.map(vItem => {
        if (vItem.year === 'ALL') return vItem; // ALL은 매핑 제외
        const realData = rawVintages.find(rv => rv.year === vItem.year);
        return realData ? realData : vItem;
      });
    }

    return list;
  }, [rawVintages]);

  // 리뷰 필터링 (선택된 빈티지에 따라)
  const filteredReviews = useMemo(() => {
    if (!vintages) return [];
    
    // selectedVintage가 없거나 'ALL'인 경우 전체 리뷰 표시
    if (!selectedVintage || selectedVintage.year === 'ALL') {
      // API나 더미 데이터 구조상 vintages 배열에 전체 리뷰가 모여있지 않을 수 있음.
      // 따라서 모든 빈티지의 리뷰를 합쳐서 보여줘야 함.
      // 단, API 연동 시 '전체 조회' API가 따로 있다면 그것을 사용해야 함.
      // 현재 구조에서는 각 빈티지별 리뷰를 합치는 방식으로 구현
      
      // 만약 apiWineDetail에 전체 리뷰 목록이 있다면 그것을 우선 사용 (API 구조에 따라 다름)
      // 현재는 더미 데이터 구조(vintages 배열 안에 reviews)를 따름
      if (rawVintages) {
        return rawVintages.flatMap(v => 
          v.reviews.map(r => ({ ...r, vintageYear: v.year }))
        );
      }
      return []; 
    } else {
      // 특정 빈티지 선택 시
      return selectedVintage.reviews.map(r => ({ ...r, vintageYear: selectedVintage.year }));
    }
  }, [vintages, selectedVintage, rawVintages]);

  // 초기 빈티지 설정
  useEffect(() => {
    if (vintages && vintages.length > 0 && !selectedVintage) {
      setSelectedVintage(vintages[0]);
    }
  }, [vintages, selectedVintage]);

  // 탭 컨텐츠 렌더링
  const renderTabContent = () => {
    switch (activeTab) {
      case 'my_record':
        if (isMyWineItem) {
          return <MyRecordTab wine={wine} features={features} />;
        }
        return null;
      case 'info':
        return (
          <InfoTab 
            description={description}
            features={features}
            nose={nose}
            palate={palate}
            finish={finish}
            showTastingNotes={!isMyWineItem}
          />
        );
      case 'review':
        return (
          <ReviewTab 
            reviews={filteredReviews}
            selectedVintageYear={selectedVintage?.year}
          />
        );
      case 'price':
        return (
          <PriceTab 
            wineId={wine.id as number} 
            selectedVintageYear={selectedVintage?.year} 
          />
        );
      default:
        return null;
    }
  };

  // 와인 등록 화면으로 이동 (시음 기록 남기기)
  const handleAddRecord = () => {
    // 현재 보고 있는 와인 정보를 넘겨주어 WineAddScreen에서 활용
    navigation.navigate('WineAdd', { wine: { ...wine, nameKor, nameEng, type, country, grape, id: wine.id } });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
      
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isMyWineItem ? '내 와인 상세' : '와인 정보'}
        </Text>
        
        {/* 위시리스트 버튼 (내 와인이 아닐 때만 표시) */}
        {!isMyWineItem ? (
          <TouchableOpacity 
            style={styles.wishlistButton}
            onPress={handleToggleWishlist}
          >
            <Ionicons 
              name={isLiked ? "heart" : "heart-outline"} 
              size={24} 
              color={isLiked ? "#e74c3c" : "#fff"} 
            />
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholder} />
        )}
      </View>

      <ScrollView contentContainerStyle={styles.content} stickyHeaderIndices={[2]}>
        {/* 1. 이미지 및 기본 정보 */}
        <View>
          <View style={styles.imageContainer}>
            {isLoading && !apiWineDetail ? (
              <ActivityIndicator size="large" color="#8e44ad" />
            ) : (imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.wineImage} resizeMode="contain" />
            ) : (
              <View style={styles.imagePlaceholder}>
                <MaterialCommunityIcons name="bottle-wine" size={80} color="#ccc" />
              </View>
            ))}
          </View>
          <View style={styles.infoContainer}>
            <Text style={styles.wineNameKor}>{nameKor}</Text>
            {nameEng ? <Text style={styles.wineNameEng}>{nameEng}</Text> : null}
            
            <View style={styles.tagContainer}>
              <View style={styles.tag}>
                <Text style={styles.tagText}>{type}</Text>
              </View>
              <View style={styles.tag}>
                <Text style={styles.tagText}>{country}</Text>
              </View>
              <View style={styles.tag}>
                <Text style={styles.tagText}>{grape}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 2. 빈티지 선택 버튼 - 상단 이동 */}
        {!isMyWineItem && vintages && vintages.length > 0 && (
          <View style={styles.vintageSelectContainer}>
            <TouchableOpacity 
              style={styles.vintageSelectButton}
              onPress={() => setVintageModalVisible(true)}
            >
              <Text style={styles.vintageSelectLabel}>빈티지</Text>
              <View style={styles.vintageSelectValueContainer}>
                <Text style={styles.vintageSelectValue}>
                  {selectedVintage ? selectedVintage.year : '선택'}
                </Text>
                <Ionicons name="chevron-forward" size={20} color="#888" />
              </View>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.divider} />

        {/* 3. 탭 헤더 (가로 스크롤) */}
        <View style={styles.tabHeaderContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={styles.tabHeaderContent}
          >
            {/* 내 와인일 때만 보이는 '내 기록' 탭 */}
            {isMyWineItem && (
              <TouchableOpacity 
                style={[styles.tabButton, activeTab === 'my_record' && styles.activeTabButton]}
                onPress={() => setActiveTab('my_record')}
              >
                <Text style={[styles.tabText, activeTab === 'my_record' && styles.activeTabText]}>내 기록</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity 
              style={[styles.tabButton, activeTab === 'info' && styles.activeTabButton]}
              onPress={() => setActiveTab('info')}
            >
              <Text style={[styles.tabText, activeTab === 'info' && styles.activeTabText]}>상세 정보</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tabButton, activeTab === 'review' && styles.activeTabButton]}
              onPress={() => setActiveTab('review')}
            >
              <Text style={[styles.tabText, activeTab === 'review' && styles.activeTabText]}>리뷰</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tabButton, activeTab === 'price' && styles.activeTabButton]}
              onPress={() => setActiveTab('price')}
            >
              <Text style={[styles.tabText, activeTab === 'price' && styles.activeTabText]}>가격</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* 4. 탭 컨텐츠 */}
        <View style={styles.tabBody}>
          {renderTabContent()}
        </View>

      </ScrollView>

      {/* 하단 버튼: 내 와인일 때만 '기록 수정하기' 표시 */}
      {isMyWineItem && (
        <View style={styles.bottomButtonContainer}>
          <TouchableOpacity 
            style={styles.recordButton}
            onPress={handleAddRecord}
          >
            <MaterialCommunityIcons name="pencil" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.recordButtonText}>
              기록 수정하기
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 빈티지 선택 모달 */}
      <VintageSelectionModal
        visible={isVintageModalVisible}
        onClose={() => setVintageModalVisible(false)}
        vintages={vintages}
        selectedVintage={selectedVintage}
        onSelect={setSelectedVintage}
      />
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
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    backgroundColor: '#1a1a1a',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  wishlistButton: {
    padding: 4,
  },
  placeholder: {
    width: 32,
  },
  content: {
    paddingBottom: 100,
  },
  imageContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#222',
    height: 320, // 400 -> 320으로 축소 (너무 크지 않게)
    justifyContent: 'center',
  },
  wineImage: {
    width: '60%', // 80% -> 60% (가로폭을 줄여서 좀 더 슬림하게)
    height: 300,  // 이미지 높이를 컨테이너보다 약간 작게 설정
  },
  imagePlaceholder: {
    width: 120,
    height: 180,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    },
  infoContainer: {
    padding: 24,
    paddingBottom: 12,
  },
  wineNameKor: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  wineNameEng: {
    fontSize: 16,
    color: '#888',
    marginBottom: 16,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  tagText: {
    color: '#ccc',
    fontSize: 13,
  },
  divider: {
    height: 8,
    backgroundColor: '#111',
  },
  // 탭 스타일
  tabHeaderContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    backgroundColor: '#1a1a1a',
  },
  tabHeaderContent: {
    paddingHorizontal: 8,
  },
  tabButton: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTabButton: {
    borderBottomColor: '#8e44ad',
  },
  tabText: {
    fontSize: 16,
    color: '#888',
    fontWeight: '600',
  },
  activeTabText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  tabBody: {
    minHeight: 300,
  },
  bottomButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 34, // 홈 인디케이터 영역 확보
    backgroundColor: '#1a1a1a',
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  recordButton: {
    backgroundColor: '#e74c3c',
    borderRadius: 12,
    height: 50,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  vintageSelectContainer: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: '#1a1a1a',
  },
  vintageSelectButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  vintageSelectLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  vintageSelectValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  vintageSelectValue: {
    fontSize: 16,
    color: '#8e44ad',
    fontWeight: '600',
  },
});
