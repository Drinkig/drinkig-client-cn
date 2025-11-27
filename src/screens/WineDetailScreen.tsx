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
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { RootStackParamList } from '../types';
import { WineDBItem, VintageData } from '../data/dummyWines';
import { MyWine } from '../context/WineContext';

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

// 랜덤 특징 생성기 (데이터가 없을 경우 사용)
const getRandomFeatures = () => ({
  sweetness: Math.floor(Math.random() * 3) + 1,
  acidity: Math.floor(Math.random() * 3) + 2,
  body: Math.floor(Math.random() * 3) + 2,
  tannin: Math.floor(Math.random() * 3) + 1,
});

const DEFAULT_DESCRIPTION = "이 와인은 균형 잡힌 구조감과 풍부한 과실향이 특징입니다. 다양한 음식과 잘 어울리며, 특별한 날 즐기기에도 손색이 없습니다.";
const DEFAULT_NOSE = ['과일', '꽃'];
const DEFAULT_PALATE = ['오크', '향신료'];
const DEFAULT_FINISH = ['허브', '흙'];

export default function WineDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute<WineDetailRouteProp>();
  const { wine } = route.params;
  const isMyWineItem = isMyWine(wine);

  // 탭 상태: 
  // DB 모드: info, review, price
  // My 모드: my_record, info, others (다른 사람들 리뷰/정보)
  const activeTabState = useState<string>(isMyWineItem ? 'my_record' : 'info');
  const [activeTab, setActiveTab] = activeTabState;
  const [selectedVintage, setSelectedVintage] = useState<VintageData | null>(null);
  const [isVintageModalVisible, setVintageModalVisible] = useState(false);

  // 공통 필드 추출
  const nameKor = isMyWineItem ? wine.name : wine.nameKor;
  const nameEng = isMyWineItem ? '' : wine.nameEng;
  const type = wine.type;
  const country = wine.country;
  const grape = wine.grape;
  
  // 상세 데이터 준비
  const features = !isMyWineItem && wine.features ? wine.features : getRandomFeatures();
  const description = !isMyWineItem && wine.description ? wine.description : DEFAULT_DESCRIPTION;
  const nose = !isMyWineItem && wine.nose ? wine.nose : DEFAULT_NOSE;
  const palate = !isMyWineItem && wine.palate ? wine.palate : DEFAULT_PALATE;
  const finish = !isMyWineItem && wine.finish ? wine.finish : DEFAULT_FINISH;
  const rawVintages = !isMyWineItem ? wine.vintages : undefined;

  // 빈티지 리스트 생성: NV + 2025 ~ 1950
  const vintages = useMemo(() => {
    // 1. NV (Non-Vintage)
    const list: VintageData[] = [{
      year: 'NV',
      rating: 0,
      reviews: [],
      prices: []
    }];

    // 2. 2025 ~ 1950
    for (let year = 2025; year >= 1950; year--) {
      list.push({
        year: year.toString(),
        rating: 0,
        reviews: [],
        prices: []
      });
    }

    // 3. 실제 데이터가 있으면 매핑
    if (rawVintages) {
      return list.map(vItem => {
        const realData = rawVintages.find(rv => rv.year === vItem.year);
        return realData ? realData : vItem;
      });
    }

    return list;
  }, [rawVintages]);

  // 리뷰 필터링 (선택된 빈티지에 따라)
  const filteredReviews = useMemo(() => {
    if (!vintages) return [];
    
    if (selectedVintage) {
      // 선택된 빈티지의 리뷰만 가져옴
      return selectedVintage.reviews.map(r => ({ ...r, vintageYear: selectedVintage.year }));
    } else {
      // 선택된 빈티지가 없으면 전체 리뷰 보여주기
      return vintages.flatMap(v => 
        v.reviews.map(r => ({ ...r, vintageYear: v.year }))
      );
    }
  }, [vintages, selectedVintage]);

  // 초기 빈티지 설정 (NV가 있으면 NV를, 아니면 가장 최신 빈티지를 기본 선택)
  useEffect(() => {
    if (vintages && vintages.length > 0 && !selectedVintage) {
      // 정렬된 vintages의 첫 번째 요소가 NV 혹은 최신 연도이므로 [0]을 선택
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
        return <PriceTab selectedVintage={selectedVintage} />;
      default:
        return null;
    }
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
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.content} stickyHeaderIndices={[2]}>
        {/* 1. 이미지 및 기본 정보 */}
        <View>
          <View style={styles.imageContainer}>
            {isMyWineItem && wine.imageUri ? (
              <Image source={{ uri: wine.imageUri }} style={styles.wineImage} resizeMode="contain" />
            ) : (
              <View style={styles.imagePlaceholder}>
                <MaterialCommunityIcons name="bottle-wine" size={80} color="#ccc" />
              </View>
            )}
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

      {/* 하단 버튼: 내 와인일 땐 '수정', 아닐 땐 '시음 기록 남기기' */}
      <View style={styles.bottomButtonContainer}>
        <TouchableOpacity style={styles.recordButton}>
          <MaterialCommunityIcons name="pencil" size={20} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.recordButtonText}>
            {isMyWineItem ? '기록 수정하기' : '시음 기록 남기기'}
          </Text>
        </TouchableOpacity>
      </View>

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
    height: 250,
    justifyContent: 'center',
  },
  wineImage: {
    width: 200,
    height: 200,
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
