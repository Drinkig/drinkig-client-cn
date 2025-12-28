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
import { useNavigation, useRoute, useIsFocused, RouteProp } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { RootStackParamList } from '../types';
import { WineDBItem, VintageData } from '../types/Wine';
import { MyWine } from '../context/WineContext';
import { getWineDetailPublic, WineDetailDTO, addToWishlist, removeFromWishlist } from '../api/wine';
import { useGlobalUI } from '../context/GlobalUIContext';


import VintageSelectionModal from '../components/wine_detail/VintageSelectionModal';
import MyRecordTab from '../components/wine_detail/tabs/MyRecordTab';
import InfoTab from '../components/wine_detail/tabs/InfoTab';
import ReviewTab from '../components/wine_detail/tabs/ReviewTab';
import PriceTab from '../components/wine_detail/tabs/PriceTab';

type WineDetailRouteProp = RouteProp<RootStackParamList, 'WineDetail'>;


function isMyWine(wine: WineDBItem | MyWine): wine is MyWine {
  return 'purchasePrice' in wine;
}

export default function WineDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute<WineDetailRouteProp>();
  const { wine } = route.params;
  const isMyWineItem = isMyWine(wine);
  const isFocused = useIsFocused();
  const { showAlert } = useGlobalUI();

  const [apiWineDetail, setApiWineDetail] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  const activeTabState = useState<string>(isMyWineItem ? 'my_record' : 'info');
  const [activeTab, setActiveTab] = activeTabState;
  const [selectedVintage, setSelectedVintage] = useState<VintageData | null>(null);
  const [isVintageModalVisible, setVintageModalVisible] = useState(false);


  useEffect(() => {
    const fetchDetail = async () => {
      if (!isMyWineItem && wine.id) {
        try {
          setIsLoading(true);

          const vintageYear = selectedVintage && selectedVintage.year !== 'NV' && selectedVintage.year !== 'ALL'
            ? parseInt(selectedVintage.year)
            : undefined;

          const response = await getWineDetailPublic(wine.id as number, vintageYear);
          if (response.isSuccess) {
            const detail = response.result.wineInfoResponse;
            setApiWineDetail(detail);
            setIsLiked(detail.liked);


            const wineToSave: WineDBItem = {
              ...wine,
              imageUri: detail.imageUrl || wine.imageUri,
              nameKor: detail.name || wine.nameKor,
              nameEng: detail.nameEng || wine.nameEng,
              type: detail.sort || wine.type,
              country: detail.country || wine.country,
              grape: detail.variety || wine.grape,
              vivinoRating: detail.vivinoRating || wine.vivinoRating,
            };
            saveToRecent(wineToSave);
          }
        } catch (error: any) {
          if (error.response && error.response.status === 400) {
            console.log('Server detail not found (local/dummy data), using local data only.');
          } else {
            console.error('Failed to fetch wine detail:', error);
          }


          saveToRecent(wine);
        } finally {
          setIsLoading(false);
        }
      } else if (!isMyWineItem && wine.id) {

        saveToRecent(wine);
      }
    };

    if (isFocused || !apiWineDetail) {
      fetchDetail();
    }
  }, [isMyWineItem, wine.id, selectedVintage, isFocused]);


  const saveToRecent = async (item: WineDBItem) => {
    try {
      const jsonValue = await AsyncStorage.getItem('recent_wines');
      let recentWines: WineDBItem[] = jsonValue != null ? JSON.parse(jsonValue) : [];


      recentWines = recentWines.filter(w => w.id !== item.id);


      recentWines.unshift(item);


      if (recentWines.length > 10) {
        recentWines = recentWines.slice(0, 10);
      }

      await AsyncStorage.setItem('recent_wines', JSON.stringify(recentWines));
    } catch (e) {
      console.error('Failed to save recent wine', e);
    }
  };

  const handleToggleWishlist = async () => {
    if (isMyWineItem) return;
    const previousState = isLiked;
    setIsLiked(!previousState);

    try {
      const vintageYear = selectedVintage && selectedVintage.year !== 'NV' && selectedVintage.year !== 'ALL'
        ? parseInt(selectedVintage.year)
        : undefined;

      if (previousState) {
        await removeFromWishlist(wine.id as number, vintageYear);
      } else {
        await addToWishlist(wine.id as number, vintageYear);
      }
    } catch (error) {
      console.error('Wishlist toggle failed:', error);
      setIsLiked(previousState);
      showAlert({
        title: '오류',
        message: '위시리스트 변경에 실패했습니다.',
        singleButton: true,
      });
    }
  };


  const nameKor = isMyWineItem ? wine.name : (apiWineDetail?.name || wine.nameKor);
  const nameEng = isMyWineItem ? '' : (apiWineDetail?.nameEng || wine.nameEng);
  const type = apiWineDetail?.sort || wine.type;
  const country = apiWineDetail?.country || wine.country;
  const grape = apiWineDetail?.variety || wine.grape;
  const imageUri = !isMyWineItem && apiWineDetail?.imageUrl ? apiWineDetail.imageUrl : wine.imageUri;


  const features = !isMyWineItem && apiWineDetail ? {
    sweetness: apiWineDetail.officialSweetness,
    acidity: apiWineDetail.officialAcidity,
    body: apiWineDetail.officialBody,
    tannin: apiWineDetail.officialTannin,
  } : (!isMyWineItem && wine.features ? wine.features : null);


  const description = !isMyWineItem && apiWineDetail?.officialDescription
    ? apiWineDetail.officialDescription
    : null;


  const nose = !isMyWineItem && apiWineDetail ?
    [
      apiWineDetail.officialNose1,
      apiWineDetail.officialNose2,
      apiWineDetail.officialNose3
    ].filter(Boolean) :
    null;


  const palate = !isMyWineItem && apiWineDetail ?
    [
      apiWineDetail.officialPalate1,
      apiWineDetail.officialPalate2,
      apiWineDetail.officialPalate3
    ].filter(Boolean) :
    null;


  const finish = !isMyWineItem && apiWineDetail ?
    [
      apiWineDetail.officialFinish1,
      apiWineDetail.officialFinish2,
      apiWineDetail.officialFinish3
    ].filter(Boolean) :
    null;

  const rawVintages = !isMyWineItem ? wine.vintages : undefined;

  const vintages = useMemo(() => {
    const list: VintageData[] = [{
      year: 'ALL',
      rating: 0,
      reviews: [],
      prices: []
    }];


    list.push({
      year: 'NV',
      rating: 0,
      reviews: [],
      prices: []
    });


    for (let year = 2025; year >= 1950; year--) {
      list.push({
        year: year.toString(),
        rating: 0,
        reviews: [],
        prices: []
      });
    }


    if (rawVintages) {
      return list.map(vItem => {
        if (vItem.year === 'ALL') return vItem;
        const realData = rawVintages.find(rv => rv.year === vItem.year);
        return realData ? realData : vItem;
      });
    }

    return list;
  }, [rawVintages]);




  useEffect(() => {
    if (vintages && vintages.length > 0 && !selectedVintage) {
      setSelectedVintage(vintages[0]);
    }
  }, [vintages, selectedVintage]);


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
            wineId={wine.id as number}
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

  const handleAddRecord = () => {
    navigation.navigate('WineAdd', { wine: { ...wine, nameKor, nameEng, type, country, grape, id: wine.id } });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />


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


        <View style={styles.tabHeaderContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabHeaderContent}
          >

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


        <View style={styles.tabBody}>
          {renderTabContent()}
        </View>

      </ScrollView>


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
    height: 320,
    justifyContent: 'center',
  },
  wineImage: {
    width: '60%',
    height: 300,
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
    paddingBottom: 34,
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
