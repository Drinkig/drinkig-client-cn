import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Image,
  ActivityIndicator,
  Alert,
  Animated,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute, useIsFocused, RouteProp } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { RootStackParamList } from '../types';
import { WineDBItem, VintageData } from '../types/Wine';
import { MyWine } from '../context/WineContext';
import { useGlobalUI } from '../context/GlobalUIContext';
import { useUser } from '../context/UserContext';
import { useTranslation } from 'react-i18next';
import {
  getWineDetailPublic,
  getWineReviews,
  addToWishlist,
  removeFromWishlist
} from '../api/wine';
import VintageSelectionModal from '../components/wine_detail/VintageSelectionModal';
import MyRecordTab from '../components/wine_detail/tabs/MyRecordTab';
import InfoTab from '../components/wine_detail/tabs/InfoTab';
import ReviewTab from '../components/wine_detail/tabs/ReviewTab';
import PriceTab from '../components/wine_detail/tabs/PriceTab';
import { colors } from '../constants/colors';

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
  const { flavorProfile } = useUser();
  const { t, i18n } = useTranslation();

  const [apiWineDetail, setApiWineDetail] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  const activeTabState = useState<string>(isMyWineItem ? 'my_record' : 'info');
  const [activeTab, setActiveTab] = activeTabState;
  const [selectedVintage, setSelectedVintage] = useState<VintageData | null>(null);
  const [isVintageModalVisible, setVintageModalVisible] = useState(false);

  const [isFabOpen, setIsFabOpen] = useState(false);
  const fabAnimation = React.useRef(new Animated.Value(0)).current;

  const toggleFab = () => {
    const toValue = isFabOpen ? 0 : 1;
    Animated.timing(fabAnimation, {
      toValue,
      duration: 250,
      useNativeDriver: true,
    }).start();
    setIsFabOpen(!isFabOpen);
  };

  const fabRotation = fabAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  const option1TranslateY = fabAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [20, -10],
  });

  const option1Opacity = fabAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const option2TranslateY = fabAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [20, -20],
  });

  const option2Opacity = fabAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const closeFab = () => {
    if (isFabOpen) {
      toggleFab();
    }
  };


  useEffect(() => {
    const fetchDetail = async () => {
      if (!isMyWineItem && wine.id) {
        const vintageYear = selectedVintage && selectedVintage.year !== 'NV' && selectedVintage.year !== 'ALL'
          ? parseInt(selectedVintage.year)
          : undefined;

        try {
          setIsLoading(true);

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
            console.log(
              'Server detail not found (local/dummy data), using local data only.',
              '\nCode:', error.response?.data?.code,
              '\nMessage:', error.response?.data?.message,
              '\nParams:', { wineId: wine.id, vintageYear }
            );
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

  const [vintageStats, setVintageStats] = useState<{ [key: string]: { rating: number; count: number; reviews: any[] } }>({});

  useEffect(() => {
    const fetchVintageStats = async () => {
      if (!wine.id) return;
      try {
        const response = await getWineReviews(wine.id as number, {
          sortType: '최신순',
          page: 0,
          size: 100,
        });

        if (response.isSuccess) {
          const stats: { [key: string]: { sum: number; count: number; reviews: any[] } } = {};

          response.result.content.forEach((review) => {
            if (review.vintageYear) {
              const year = review.vintageYear.toString();
              if (!stats[year]) {
                stats[year] = { sum: 0, count: 0, reviews: [] };
              }
              stats[year].sum += review.rating;
              stats[year].count += 1;
              stats[year].reviews.push(review);
            }
          });

          const finalStats: { [key: string]: { rating: number; count: number; reviews: any[] } } = {};
          Object.keys(stats).forEach(key => {
            finalStats[key] = {
              rating: stats[key].sum / stats[key].count,
              count: stats[key].count,
              reviews: stats[key].reviews
            };
          });

          setVintageStats(finalStats);
        }
      } catch (error) {
        console.error('Failed to fetch reviews for stats:', error);
      }
    };

    if (isFocused) {
      fetchVintageStats();
    }
  }, [wine.id, isFocused]);

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

    let mergedList = list;
    if (rawVintages) {
      mergedList = list.map(vItem => {
        if (vItem.year === 'ALL') return vItem;
        const realData = rawVintages.find(rv => rv.year === vItem.year);
        return realData ? realData : vItem;
      });
    }

    return mergedList.map(vItem => {
      if (vintageStats[vItem.year]) {
        return {
          ...vItem,
          rating: vintageStats[vItem.year].rating,
          reviews: vintageStats[vItem.year].reviews,
        };
      }
      return vItem;
    });
  }, [rawVintages, vintageStats]);




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

  const handleWriteNote = () => {
    navigation.navigate('TastingNoteWrite', {
      wineId: wine.id as number,
      wineName: nameKor,
      wineImage: imageUri,
      wineType: type,
    });
  };

  const handleAddToMyWine = () => {
    const wineToPass = {
      ...wine,
      nameKor: nameKor,
      nameEng: nameEng,
      type: type,
      country: country,
      grape: grape,
      imageUri: imageUri,
      id: wine.id,
    };
    // @ts-ignore
    navigation.navigate('WineAdd', { wine: wineToPass });
    closeFab();
  };

  const handleWriteNoteWithClose = () => {
    handleWriteNote();
    closeFab();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />


      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isMyWineItem ? t('wineDetail.myWineHeader') : t('wineDetail.infoHeader')}
        </Text>


        {!isMyWineItem ? (
          <TouchableOpacity
            style={styles.wishlistButton}
            onPress={handleToggleWishlist}
          >
            <Ionicons
              name={isLiked ? "heart" : "heart-outline"}
              size={24}
              color={isLiked ? colors.error : colors.white}
            />
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholder} />
        )}
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {(isLoading && !apiWineDetail) || imageUri ? (
          <View style={styles.imageContainer}>
            {isLoading && !apiWineDetail ? (
              <ActivityIndicator size="large" color={colors.primary} />
            ) : (
              <Image source={{ uri: imageUri! }} style={styles.wineImage} resizeMode="contain" />
            )}
            {!isMyWineItem && (
              <TouchableOpacity
                style={styles.compatibilityButton}
                onPress={() => navigation.navigate('WineCompatibility', {
                  userProfile: flavorProfile,
                  wineStats: {
                    sweetness: features?.sweetness,
                    acidity: features?.acidity,
                    tannin: features?.tannin,
                    body: features?.body,
                    alcohol: 0,
                  },
                  wineName: nameKor
                })}
              >
                <MaterialCommunityIcons name="heart-pulse" size={16} color={colors.white} style={{ marginRight: 6 }} />
                <Text style={styles.compatibilityButtonText}>{t('wineDetail.compatibility')}</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          !isMyWineItem && (
            <View style={styles.compatibilityButtonContainer}>
              <TouchableOpacity
                style={styles.compatibilityButton}
                onPress={() => navigation.navigate('WineCompatibility', {
                  userProfile: flavorProfile,
                  wineStats: {
                    sweetness: features?.sweetness,
                    acidity: features?.acidity,
                    tannin: features?.tannin,
                    body: features?.body,
                    alcohol: 0,
                  },
                  wineName: nameKor
                })}
              >
                <MaterialCommunityIcons name="heart-pulse" size={16} color={colors.white} style={{ marginRight: 6 }} />
                <Text style={styles.compatibilityButtonText}>{t('wineDetail.compatibility')}</Text>
              </TouchableOpacity>
            </View>
          )
        )}
        <View style={styles.infoContainer}>
          {i18n.language === 'en' ? (
            <Text style={styles.wineNameKor}>{nameEng || nameKor}</Text>
          ) : (
            <>
              <Text style={styles.wineNameKor}>{nameKor}</Text>
              {nameEng ? <Text style={styles.wineNameEng}>{nameEng}</Text> : null}
            </>
          )}

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


        {!isMyWineItem && vintages && vintages.length > 0 && (
          <View style={styles.vintageSelectContainer}>
            <TouchableOpacity
              style={styles.vintageSelectButton}
              onPress={() => setVintageModalVisible(true)}
            >
              <Text style={styles.vintageSelectLabel}>{t('wineDetail.vintage')}</Text>
              <View style={styles.vintageSelectValueContainer}>
                <Text style={styles.vintageSelectValue}>
                  {selectedVintage ? selectedVintage.year : t('wineDetail.select')}
                </Text>
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
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
                <Text style={[styles.tabText, activeTab === 'my_record' && styles.activeTabText]}>{t('wineDetail.tabs.myRecord')}</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'info' && styles.activeTabButton]}
              onPress={() => setActiveTab('info')}
            >
              <Text style={[styles.tabText, activeTab === 'info' && styles.activeTabText]}>{t('wineDetail.tabs.info')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'review' && styles.activeTabButton]}
              onPress={() => setActiveTab('review')}
            >
              <Text style={[styles.tabText, activeTab === 'review' && styles.activeTabText]}>{t('wineDetail.tabs.review')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'price' && styles.activeTabButton]}
              onPress={() => setActiveTab('price')}
            >
              <Text style={[styles.tabText, activeTab === 'price' && styles.activeTabText]}>{t('wineDetail.tabs.price')}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>


        <View style={styles.tabBody}>
          {renderTabContent()}
        </View>

      </ScrollView>


      {isMyWineItem ? (
        <View style={styles.bottomButtonContainer}>
          <TouchableOpacity
            style={styles.recordButton}
            onPress={handleAddRecord}
          >
            <MaterialCommunityIcons name="pencil" size={20} color={colors.white} style={{ marginRight: 8 }} />
            <Text style={styles.recordButtonText}>
              {t('wineDetail.fab.editRecord')}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {isFabOpen && (
            <TouchableWithoutFeedback onPress={toggleFab}>
              <View style={styles.fabOverlay} />
            </TouchableWithoutFeedback>
          )}
          <View style={styles.fabContainer}>
            {isFabOpen && (
              <View style={styles.fabOptionsContainer}>
                <Animated.View
                  style={[
                    styles.fabOptionItem,
                    {
                      opacity: option1Opacity,
                      transform: [{ translateY: option1TranslateY }],
                      marginBottom: 16
                    }
                  ]}
                >
                  <TouchableOpacity
                    style={styles.fabCombinedButtonShadow}
                    onPress={handleAddToMyWine}
                    activeOpacity={0.8}
                  >
                    <View
                      style={styles.fabCombinedGradient}
                    >
                      <View style={styles.fabTextContainer}>
                        <Text style={styles.fabCombinedLabel}>{t('wineDetail.fab.addWine')}</Text>
                      </View>
                      <View style={styles.fabIconContainer}>
                        <MaterialCommunityIcons name="bottle-wine-outline" size={20} color={colors.white} />
                      </View>
                    </View>
                  </TouchableOpacity>
                </Animated.View>

                <Animated.View
                  style={[
                    styles.fabOptionItem,
                    {
                      opacity: option2Opacity,
                      transform: [{ translateY: option2TranslateY }],
                      marginBottom: 0
                    }
                  ]}
                >
                  <TouchableOpacity
                    style={styles.fabCombinedButtonShadow}
                    onPress={handleWriteNoteWithClose}
                    activeOpacity={0.8}
                  >
                    <View
                      style={styles.fabCombinedGradient}
                    >
                      <View style={styles.fabTextContainer}>
                        <Text style={styles.fabCombinedLabel}>{t('wineDetail.fab.writeNote')}</Text>
                      </View>
                      <View style={styles.fabIconContainer}>
                        <MaterialCommunityIcons name="pencil-outline" size={20} color={colors.white} />
                      </View>
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              </View>
            )}

            <TouchableOpacity
              style={styles.fabMainButtonShadow}
              onPress={toggleFab}
              activeOpacity={0.9}
            >
              <View
                style={[styles.fabMainGradient, { backgroundColor: isFabOpen ? '#555' : colors.border }]}
              >
                <Animated.View style={{ transform: [{ rotate: fabRotation }] }}>
                  <MaterialCommunityIcons name="plus" size={32} color={colors.white} />
                </Animated.View>
              </View>
            </TouchableOpacity>
          </View>
        </>
      )
      }



      <VintageSelectionModal
        visible={isVintageModalVisible}
        onClose={() => setVintageModalVisible(false)}
        vintages={vintages}
        selectedVintage={selectedVintage}
        onSelect={setSelectedVintage}
      />


    </SafeAreaView >
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.white,
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
    paddingVertical: 16,
    backgroundColor: '#222',
    height: 320,
    justifyContent: 'center',
  },
  wineImage: {
    width: '100%',
    height: '90%',
  },
  compatibilityButtonContainer: {
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  infoContainer: {
    padding: 24,
    paddingBottom: 12,
  },
  wineNameKor: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 8,
  },
  wineNameEng: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: colors.surface1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
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
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
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
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  activeTabText: {
    color: colors.white,
    fontWeight: 'bold',
  },
  tabBody: {
    minHeight: 300,
  },
  vintageSelectContainer: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: colors.background,
  },
  vintageSelectButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.surface1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  compatibilityButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  compatibilityButtonText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: 'bold',
  },
  vintageSelectLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  vintageSelectValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  vintageSelectValue: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },
  bottomButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 34,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  recordButton: {
    backgroundColor: colors.error,
    borderRadius: 12,
    height: 50,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  fabContainer: {
    position: 'absolute',
    bottom: 30,
    right: 24,
    alignItems: 'center',
    zIndex: 1000,
  },
  fabOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    zIndex: 999,
  },
  fabMainButtonShadow: {
    width: 56,
    height: 56,
    borderRadius: 28,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  fabMainGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.border,
  },
  fabOptionsContainer: {
    position: 'absolute',
    bottom: 50,
    right: 0,
    minWidth: 300,
    alignItems: 'flex-end',
    marginBottom: 0,
    zIndex: 2000,
  },
  fabOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 16,
    paddingRight: 0,
  },
  fabCombinedButtonShadow: {
    width: 154,
    height: 48,
    borderRadius: 24,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
    marginRight: 0,
    justifyContent: 'center',
  },
  fabCombinedGradient: {
    width: '100%',
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    backgroundColor: colors.border,
    paddingRight: 6,
  },
  fabTextContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 12,
  },
  fabIconContainer: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabCombinedLabel: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '600',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  fabIcon: {
    marginLeft: 0,
  },
});
