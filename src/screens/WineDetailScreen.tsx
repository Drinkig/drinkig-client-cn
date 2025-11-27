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
  Modal,
  FlatList,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { RootStackParamList } from '../types';
import { WineDBItem, VintageData, PriceInfo, Review } from '../data/dummyWines';
import { MyWine } from '../context/WineContext';

type WineDetailRouteProp = RouteProp<RootStackParamList, 'WineDetail'>;

type SortOption = 'latest' | 'rating_high' | 'rating_low';

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
  const [sortOption, setSortOption] = useState<SortOption>('latest');
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

  // 모든 리뷰 통합 및 정렬 (선택된 빈티지에 따라 필터링)
  const sortedReviews = useMemo(() => {
    if (!vintages) return [];
    
    // 1. 빈티지가 선택되어 있으면 해당 빈티지의 리뷰만 필터링
    let reviews = [];
    
    if (selectedVintage) {
      // 선택된 빈티지의 리뷰만 가져옴
      reviews = selectedVintage.reviews.map(r => ({ ...r, vintageYear: selectedVintage.year }));
    } else {
      // (예외 케이스) 선택된 빈티지가 없으면 전체 리뷰 보여주기 (혹은 빈 배열)
      // 현재 로직상 selectedVintage는 항상 설정되도록 되어 있으나 안전장치로 유지
      reviews = vintages.flatMap(v => 
        v.reviews.map(r => ({ ...r, vintageYear: v.year }))
      );
    }

    // 2. 정렬
    return reviews.sort((a, b) => {
      switch (sortOption) {
        case 'rating_high':
          return b.rating - a.rating;
        case 'rating_low':
          return a.rating - b.rating;
        case 'latest':
        default:
          return b.date.localeCompare(a.date);
      }
    });
  }, [vintages, sortOption, selectedVintage]);

  // 초기 빈티지 설정 (NV가 있으면 NV를, 아니면 가장 최신 빈티지를 기본 선택)
  useEffect(() => {
    if (vintages && vintages.length > 0 && !selectedVintage) {
      // 정렬된 vintages의 첫 번째 요소가 NV 혹은 최신 연도이므로 [0]을 선택
      setSelectedVintage(vintages[0]);
    }
  }, [vintages, selectedVintage]);

  // 이미지 처리
  const renderImage = () => {
    if (isMyWineItem && wine.imageUri) {
      return (
        <Image source={{ uri: wine.imageUri }} style={styles.wineImage} resizeMode="contain" />
      );
    }
    return (
      <View style={styles.imagePlaceholder}>
        <MaterialCommunityIcons name="bottle-wine" size={80} color="#ccc" />
      </View>
    );
  };

  // 특성 게이지 렌더링
  const renderFeatureBar = (label: string, value: number) => (
    <View style={styles.featureRow}>
      <Text style={styles.featureLabel}>{label}</Text>
      <View style={styles.gaugeContainer}>
        {[1, 2, 3, 4, 5].map((step) => (
          <View 
            key={step} 
            style={[
              styles.gaugeStep, 
              step <= value ? styles.gaugeActive : styles.gaugeInactive
            ]} 
          />
        ))}
      </View>
    </View>
  );

  // 가격 통계 렌더링
  const renderPriceStats = (prices: PriceInfo[]) => {
    if (!prices || prices.length === 0) return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateText}>등록된 가격 정보가 없습니다.</Text>
      </View>
    );
    
    const priceValues = prices.map(p => p.price);
    const avgPrice = Math.round(priceValues.reduce((a, b) => a + b, 0) / priceValues.length);
    const minPrice = Math.min(...priceValues);
    const maxPrice = Math.max(...priceValues);

    return (
      <View style={styles.priceStatsContainer}>
        <View style={styles.priceStatItem}>
          <Text style={styles.priceStatLabel}>평균 구매가</Text>
          <Text style={styles.priceStatValue}>₩{avgPrice.toLocaleString()}</Text>
        </View>
        <View style={styles.priceStatDivider} />
        <View style={styles.priceStatItem}>
          <Text style={styles.priceStatLabel}>최저 ~ 최고</Text>
          <Text style={styles.priceStatRange}>
            ₩{minPrice.toLocaleString()} ~ ₩{maxPrice.toLocaleString()}
          </Text>
        </View>
      </View>
    );
  };

  // 리뷰 아이템 렌더링
  const renderReviewItem = (review: Review & { vintageYear?: string }) => (
    <View key={review.id} style={styles.reviewItem}>
      <View style={styles.reviewHeader}>
        <View style={styles.reviewUserContainer}>
          <Text style={styles.reviewUser}>{review.userName}</Text>
          {review.vintageYear && (
            <View style={styles.vintageBadge}>
              <Text style={styles.vintageBadgeText}>{review.vintageYear}</Text>
            </View>
          )}
        </View>
        <View style={styles.ratingContainer}>
          <Ionicons name="star" size={14} color="#f1c40f" />
          <Text style={styles.ratingText}>{review.rating}</Text>
        </View>
      </View>
      <Text style={styles.reviewComment}>{review.comment}</Text>
      <Text style={styles.reviewDate}>{review.date}</Text>
    </View>
  );

  // 정렬 옵션 버튼 렌더링
  const renderSortButton = (option: SortOption, label: string) => (
    <TouchableOpacity 
      style={[styles.sortButton, sortOption === option && styles.activeSortButton]}
      onPress={() => setSortOption(option)}
    >
      <Text style={[styles.sortButtonText, sortOption === option && styles.activeSortButtonText]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  // 탭 컨텐츠 렌더링
  const renderTabContent = () => {
    // [CASE 1] 내 와인일 때: 내 기록 (My Record)
    if (activeTab === 'my_record' && isMyWineItem) {
      return (
        <View style={styles.tabContent}>
          {/* 내 평점 및 코멘트 (가상 데이터) */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>나의 시음 기록</Text>
            <View style={styles.myRatingCard}>
              <View style={styles.myRatingHeader}>
                <Text style={styles.myRatingDate}>{wine.purchaseDate || '날짜 미입력'}</Text>
                <View style={styles.ratingContainer}>
                   <Ionicons name="star" size={20} color="#f1c40f" />
                   <Ionicons name="star" size={20} color="#f1c40f" />
                   <Ionicons name="star" size={20} color="#f1c40f" />
                   <Ionicons name="star" size={20} color="#f1c40f" />
                   <Ionicons name="star-outline" size={20} color="#f1c40f" />
                   <Text style={[styles.ratingText, {fontSize: 18, marginLeft: 4}]}>4.0</Text>
                </View>
              </View>
              <Text style={styles.myComment}>
                "기대보다 훨씬 향이 좋았습니다. 친구들과 파티할 때 가져갔는데 다들 좋아했네요. 재구매 의사 있습니다!"
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>구매 정보</Text>
            <View style={styles.detailRow}>
              <Text style={styles.label}>빈티지</Text>
              <Text style={styles.value}>{wine.vintage || '-'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.label}>구매가</Text>
              <Text style={styles.value}>
                {wine.purchasePrice ? `₩${parseInt(wine.purchasePrice).toLocaleString()}` : '-'}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.label}>구매처</Text>
              <Text style={styles.value}>{wine.purchaseLocation || '-'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.label}>구매일</Text>
              <Text style={styles.value}>{wine.purchaseDate || '-'}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>나의 테이스팅 노트</Text>
            {/* 내 와인이면 랜덤(가상)이 아니라 실제 저장된 데이터를 써야 하지만 여기선 랜덤 사용 */}
            <View style={styles.featuresContainer}>
              {renderFeatureBar('당도', features.sweetness)}
              {renderFeatureBar('산도', features.acidity)}
              {renderFeatureBar('바디', features.body)}
              {renderFeatureBar('타닌', features.tannin)}
            </View>
          </View>
        </View>
      );
    }

    // [CASE 2] 상세 정보 (공통)
    if (activeTab === 'info') {
      return (
        <View style={styles.tabContent}>
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>와인 설명</Text>
            <Text style={styles.description}>{description}</Text>
          </View>

          {/* DB 모드일 때만 테이스팅 노트/아로마 보여줌 (내 와인은 '내 기록'에 있으므로) */}
          {!isMyWineItem && (
            <>
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>테이스팅 노트</Text>
            <View style={styles.featuresContainer}>
                  {renderFeatureBar('당도', features.sweetness)}
                  {renderFeatureBar('산도', features.acidity)}
                  {renderFeatureBar('바디', features.body)}
                  {renderFeatureBar('타닌', features.tannin)}
                </View>
              </View>

              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>
                  노즈 <Text style={styles.subTitleText}>(Nose)</Text>
                </Text>
                <View style={styles.aromaContainer}>
                  {nose.map((item, index) => (
                    <View key={index} style={styles.aromaTag}>
                      <MaterialCommunityIcons name="scent" size={14} color="#8e44ad" style={{ marginRight: 4 }} />
                      <Text style={styles.aromaText}>{item}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>
                  팔레트 <Text style={styles.subTitleText}>(Palate)</Text>
                </Text>
                <View style={styles.aromaContainer}>
                  {palate.map((item, index) => (
                    <View key={index} style={styles.aromaTag}>
                      <MaterialCommunityIcons name="water-outline" size={14} color="#8e44ad" style={{ marginRight: 4 }} />
                      <Text style={styles.aromaText}>{item}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>
                  피니시 <Text style={styles.subTitleText}>(Finish)</Text>
                </Text>
                <View style={styles.aromaContainer}>
                  {finish.map((item, index) => (
                    <View key={index} style={styles.aromaTag}>
                      <MaterialCommunityIcons name="timer-sand" size={14} color="#8e44ad" style={{ marginRight: 4 }} />
                      <Text style={styles.aromaText}>{item}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </>
          )}
        </View>
      );
    }

    // [CASE 3] 리뷰 (공통)
    if (activeTab === 'review') {
      if (sortedReviews.length === 0) {
        return (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>아직 작성된 리뷰가 없습니다.</Text>
          </View>
        );
      }
      return (
        <View style={styles.tabContent}>
          <View style={styles.sectionContainer}>
            <View style={styles.reviewHeaderContainer}>
              <Text style={styles.sectionTitle}>
                {selectedVintage ? `${selectedVintage.year} 빈티지 리뷰` : '전체 리뷰'} ({sortedReviews.length})
              </Text>
              <View style={styles.sortContainer}>
                {renderSortButton('latest', '최신순')}
                {renderSortButton('rating_high', '별점높은순')}
                {renderSortButton('rating_low', '별점낮은순')}
              </View>
            </View>
            <View style={styles.reviewList}>
              {sortedReviews.map((review, index) => renderReviewItem({ ...review, id: `${review.id}-${index}` }))}
            </View>
          </View>
        </View>
      );
    }

    // [CASE 4] 가격 (공통)
    if (activeTab === 'price') {
      if (!selectedVintage) {
         return (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>빈티지를 선택해주세요.</Text>
          </View>
        );
      }

      if (!selectedVintage.prices || selectedVintage.prices.length === 0) {
        return (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>선택한 빈티지의 가격 정보가 없습니다.</Text>
          </View>
        );
      }

      return (
        <View style={styles.tabContent}>
          <View style={styles.sectionContainer}>
            <View style={styles.vintageInfoContainer}>
                <Text style={styles.subSectionTitle}>구매가 정보 ({selectedVintage.year})</Text>
                {renderPriceStats(selectedVintage.prices)}
                
                <View style={styles.priceInfoNote}>
                   <Ionicons name="information-circle-outline" size={14} color="#888" style={{marginRight: 4}} />
                   <Text style={styles.priceInfoText}>유저들이 등록한 구매 가격을 바탕으로 집계된 정보입니다.</Text>
                </View>
              </View>
          </View>
        </View>
      );
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
            {renderImage()}
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
      <Modal
        visible={isVintageModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setVintageModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>빈티지 선택</Text>
              <TouchableOpacity 
                onPress={() => setVintageModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={vintages}
              keyExtractor={(item) => item.year}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.vintageModalItem,
                    selectedVintage?.year === item.year && styles.vintageModalItemSelected
                  ]}
                  onPress={() => {
                    setSelectedVintage(item);
                    setVintageModalVisible(false);
                  }}
                >
                  <Text style={[
                    styles.vintageModalItemText,
                    selectedVintage?.year === item.year && styles.vintageModalItemTextSelected
                  ]}>
                    {item.year}
                  </Text>
                  {selectedVintage?.year === item.year && (
                    <Ionicons name="checkmark" size={20} color="#8e44ad" />
                  )}
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.vintageModalList}
            />
          </View>
        </View>
      </Modal>
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
  tabContent: {
    paddingTop: 24,
  },
  sectionContainer: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  subTitleText: {
    fontSize: 14,
    fontWeight: 'normal',
    color: '#aaa',
  },
  subSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ddd',
    marginBottom: 12,
    marginTop: 8,
  },
  featuresContainer: {
    gap: 12,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureLabel: {
    width: 50,
    color: '#888',
    fontSize: 14,
    fontWeight: '500',
  },
  gaugeContainer: {
    flex: 1,
    flexDirection: 'row',
    gap: 4,
    height: 8,
  },
  gaugeStep: {
    flex: 1,
    borderRadius: 4,
  },
  gaugeActive: {
    backgroundColor: '#8e44ad',
  },
  gaugeInactive: {
    backgroundColor: '#333',
  },
  aromaContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  aromaTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2d2033',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#4a3b52',
  },
  aromaText: {
    color: '#d2b4de',
    fontSize: 14,
    fontWeight: '500',
  },
  description: {
    fontSize: 15,
    color: '#ccc',
    lineHeight: 24,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  label: {
    width: 80,
    fontSize: 15,
    color: '#888',
  },
  value: {
    flex: 1,
    fontSize: 15,
    color: '#fff',
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
  vintageInfoContainer: {
    marginTop: 8,
    backgroundColor: '#222',
    borderRadius: 12,
    padding: 16,
  },
  // 가격 통계 스타일
  priceStatsContainer: {
    flexDirection: 'row',
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  priceStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  priceStatDivider: {
    width: 1,
    height: '80%',
    backgroundColor: '#444',
    marginHorizontal: 12,
  },
  priceStatLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  priceStatValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  priceStatRange: {
    fontSize: 14,
    color: '#fff',
  },
  priceInfoNote: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  priceInfoText: {
    color: '#888',
    fontSize: 12,
  },
  // 리뷰 스타일
  reviewHeaderContainer: {
    marginBottom: 16,
  },
  sortContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  sortButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#2a2a2a',
    borderWidth: 1,
    borderColor: '#444',
  },
  activeSortButton: {
    backgroundColor: '#333',
    borderColor: '#8e44ad',
  },
  sortButtonText: {
    color: '#888',
    fontSize: 12,
  },
  activeSortButtonText: {
    color: '#8e44ad',
    fontWeight: '600',
  },
  reviewList: {
    gap: 12,
  },
  reviewItem: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  reviewUserContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reviewUser: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  vintageBadge: {
    backgroundColor: '#333',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  vintageBadgeText: {
    color: '#aaa',
    fontSize: 10,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  reviewComment: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 6,
    lineHeight: 20,
  },
  reviewDate: {
    color: '#666',
    fontSize: 12,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    color: '#666',
    fontSize: 16,
  },
  // 내 기록 스타일
  myRatingCard: {
    backgroundColor: '#222',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  myRatingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  myRatingDate: {
    color: '#888',
    fontSize: 14,
  },
  myComment: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 24,
    fontStyle: 'italic',
  },
  // 빈티지 선택 버튼 스타일
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
  // 모달 스타일
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeButton: {
    padding: 4,
  },
  vintageModalList: {
    paddingBottom: 40,
  },
  vintageModalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  vintageModalItemSelected: {
    backgroundColor: '#333',
    borderBottomColor: '#333',
  },
  vintageModalItemText: {
    fontSize: 16,
    color: '#ccc',
  },
  vintageModalItemTextSelected: {
    color: '#8e44ad',
    fontWeight: 'bold',
  },
});
