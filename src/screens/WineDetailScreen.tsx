import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Image,
  ActivityIndicator,
  LayoutAnimation,
  Alert,
  Animated,
  TouchableWithoutFeedback,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import LinearGradient from "react-native-linear-gradient";
import GlassHeader from "../components/common/GlassHeader";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  useNavigation,
  useRoute,
  useIsFocused,
  RouteProp,
} from "@react-navigation/native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import Ionicons from "react-native-vector-icons/Ionicons";
import { RootStackParamList } from "../types";
import { WineDBItem, VintageData } from "../types/Wine";
import { MyWine } from "../context/WineContext";
import { useGlobalUI } from "../context/GlobalUIContext";
import { useUser } from "../context/UserContext";
import { useSubscription } from "../context/SubscriptionContext";
import { useTranslation } from "react-i18next";
import {
  getWineDetailPublic,
  getWineReviews,
  addToWishlist,
  removeFromWishlist,
} from "../api/wine";
import VintageSelectionModal from "../components/wine_detail/VintageSelectionModal";
import MyRecordTab from "../components/wine_detail/tabs/MyRecordTab";
import InfoTab from "../components/wine_detail/tabs/InfoTab";
import ReviewTab from "../components/wine_detail/tabs/ReviewTab";
import PriceTab from "../components/wine_detail/tabs/PriceTab";
import {
  calculateCompatibilityScore,
  CompatibilityResult,
  getScoreColor,
} from "../utils/compatibility";
import {
  getCompatQuota,
  unlockCompat,
  COMPAT_QUOTA_EXCEEDED_CODE,
} from "../api/subscription";
import { colors } from "../constants/colors";
import { accent, surfaces, radius } from "../constants/theme";

type WineDetailRouteProp = RouteProp<RootStackParamList, "WineDetail">;

function isMyWine(wine: WineDBItem | MyWine): wine is MyWine {
  return "purchasePrice" in wine;
}

export default function WineDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute<WineDetailRouteProp>();
  const { wine } = route.params;
  const isMyWineItem = isMyWine(wine);
  const isFocused = useIsFocused();
  const { showToast } = useGlobalUI();
  const { flavorProfile } = useUser();
  const { checkFeature, isPremium } = useSubscription();
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const headerHeight = insets.top + 52;

  const [apiWineDetail, setApiWineDetail] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [showCompatBubble, setShowCompatBubble] = useState(false);
  const [compatUnlocked, setCompatUnlocked] = useState<boolean>(false);
  const [compatRemaining, setCompatRemaining] = useState<number>(0);
  const [compatDailyLimit, setCompatDailyLimit] = useState<number>(3);
  const [isUnlockingCompat, setIsUnlockingCompat] = useState(false);
  const [analyzeStep, setAnalyzeStep] = useState(0);

  const activeTabState = useState<string>(isMyWineItem ? "my_record" : "info");
  const [activeTab, setActiveTab] = activeTabState;
  const [selectedVintage, setSelectedVintage] = useState<VintageData | null>(
    null
  );
  const [isVintageModalVisible, setVintageModalVisible] = useState(false);

  // Animated segmented tab control + content transition.
  const TAB_KEYS = useMemo(
    () =>
      isMyWineItem
        ? ["my_record", "info", "review", "price"]
        : ["info", "review", "price"],
    [isMyWineItem]
  );
  const TAB_LABELS: Record<string, string> = {
    my_record: "myRecord",
    info: "info",
    review: "review",
    price: "price",
  };
  const [segWidth, setSegWidth] = useState(0);
  const segItemWidth = segWidth > 0 ? (segWidth - 8) / TAB_KEYS.length : 0;
  const activeTabIndex = Math.max(0, TAB_KEYS.indexOf(activeTab));
  const segIndicator = React.useRef(new Animated.Value(0)).current;
  const tabContentAnim = React.useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(segIndicator, {
      toValue: activeTabIndex,
      useNativeDriver: true,
      speed: 20,
      bounciness: 8,
    }).start();
    tabContentAnim.setValue(0);
    Animated.timing(tabContentAnim, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTabIndex]);

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
    outputRange: ["0deg", "45deg"],
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
        const vintageYear =
          selectedVintage &&
          selectedVintage.year !== "NV" &&
          selectedVintage.year !== "ALL"
            ? parseInt(selectedVintage.year)
            : undefined;

        try {
          setIsLoading(true);

          const response = await getWineDetailPublic(
            wine.id as number,
            vintageYear
          );
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
              "Server detail not found (local/dummy data), using local data only.",
              "\nCode:",
              error.response?.data?.code,
              "\nMessage:",
              error.response?.data?.message,
              "\nParams:",
              { wineId: wine.id, vintageYear }
            );
          } else {
            console.error("Failed to fetch wine detail:", error);
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
      const jsonValue = await AsyncStorage.getItem("recent_wines");
      let recentWines: WineDBItem[] = [];
      if (jsonValue != null) {
        try {
          const parsed = JSON.parse(jsonValue);
          if (Array.isArray(parsed)) recentWines = parsed;
        } catch {
          // corrupt entry — reset list
          recentWines = [];
        }
      }

      recentWines = recentWines.filter((w) => w.id !== item.id);

      recentWines.unshift(item);

      if (recentWines.length > 10) {
        recentWines = recentWines.slice(0, 10);
      }

      await AsyncStorage.setItem("recent_wines", JSON.stringify(recentWines));
    } catch (e) {
      console.error("Failed to save recent wine", e);
    }
  };

  const handleToggleWishlist = async () => {
    if (isMyWineItem) return;
    const previousState = isLiked;
    setIsLiked(!previousState);

    try {
      const vintageYear =
        selectedVintage &&
        selectedVintage.year !== "NV" &&
        selectedVintage.year !== "ALL"
          ? parseInt(selectedVintage.year)
          : undefined;

      if (previousState) {
        await removeFromWishlist(wine.id as number, vintageYear);
      } else {
        await addToWishlist(wine.id as number, vintageYear);
      }
    } catch (error) {
      console.error("Wishlist toggle failed:", error);
      setIsLiked(previousState);
      showToast(t("menuScanResult.wishlist.failed"), { type: "error" });
    }
  };

  const nameKor = isMyWineItem
    ? wine.name
    : apiWineDetail?.name || wine.nameKor;
  const nameEng = isMyWineItem ? "" : apiWineDetail?.nameEng || wine.nameEng;
  const type = apiWineDetail?.sort || wine.type;
  const country = apiWineDetail?.country || wine.country;
  const grape = apiWineDetail?.variety || wine.grape;
  const imageUri =
    !isMyWineItem && apiWineDetail?.imageUrl
      ? apiWineDetail.imageUrl
      : wine.imageUri;

  const features =
    !isMyWineItem && apiWineDetail
      ? {
          sweetness: apiWineDetail.officialSweetness,
          acidity: apiWineDetail.officialAcidity,
          body: apiWineDetail.officialBody,
          tannin: apiWineDetail.officialTannin,
        }
      : !isMyWineItem && wine.features
      ? wine.features
      : null;

  const compatResult = useMemo(() => {
    if (!features || !flavorProfile) return null;
    return calculateCompatibilityScore(
      flavorProfile,
      {
        sweetness: features.sweetness,
        acidity: features.acidity,
        tannin: features.tannin,
        body: features.body,
      },
      t
    );
  }, [features, flavorProfile, t]);

  // Load compatibility unlock state from server (premium bypasses; free users use daily quota)
  useEffect(() => {
    let cancelled = false;
    setShowCompatBubble(false);
    if (isPremium) {
      setCompatUnlocked(true);
      setCompatRemaining(-1);
      return;
    }
    setCompatUnlocked(false);
    getCompatQuota()
      .then((res) => {
        if (cancelled || !res.isSuccess) return;
        const { isUnlimited, dailyLimit, remaining, unlockedWineIds } =
          res.result;
        setCompatDailyLimit(dailyLimit);
        setCompatRemaining(isUnlimited ? -1 : remaining);
        setCompatUnlocked(
          isUnlimited || unlockedWineIds.includes(Number(wine.id))
        );
      })
      .catch((err) => {
        console.warn("Failed to load compat quota:", err);
      });
    return () => {
      cancelled = true;
    };
  }, [wine.id, isPremium]);

  const runUnlockAnalysis = () => {
    setIsUnlockingCompat(true);
    setShowCompatBubble(true);
    setAnalyzeStep(0);
    const stepDurations = [800, 900, 800];
    let cancelled = false;
    const timeouts: ReturnType<typeof setTimeout>[] = [];
    const advance = (step: number) => {
      if (cancelled) return;
      setAnalyzeStep(step);
      if (step < stepDurations.length - 1) {
        timeouts.push(setTimeout(() => advance(step + 1), stepDurations[step]));
      } else {
        timeouts.push(
          setTimeout(() => {
            if (cancelled) return;
            setIsUnlockingCompat(false);
            setCompatUnlocked(true);
          }, stepDurations[step])
        );
      }
    };
    advance(0);
    return () => {
      cancelled = true;
      timeouts.forEach(clearTimeout);
    };
  };

  const handleCompatBannerPress = async () => {
    if (isUnlockingCompat) return;
    if (!checkFeature("wineCompatibility") && !compatUnlocked) {
      // Premium feature: free users use daily reveal quota
      if (compatRemaining === 0) {
        navigation.navigate("Paywall" as never);
        return;
      }
      try {
        const res = await unlockCompat(wine.id);
        if (!res.isSuccess) {
          navigation.navigate("Paywall" as never);
          return;
        }
        setCompatRemaining(res.result.remaining);
        runUnlockAnalysis();
      } catch (err: any) {
        const code = err?.response?.data?.code;
        if (code === COMPAT_QUOTA_EXCEEDED_CODE) {
          setCompatRemaining(0);
          navigation.navigate("Paywall" as never);
        } else {
          console.warn("Failed to unlock compat:", err);
        }
      }
      return;
    }
    setShowCompatBubble((prev) => !prev);
  };

  const description =
    !isMyWineItem && apiWineDetail?.officialDescription
      ? apiWineDetail.officialDescription
      : null;

  const nose =
    !isMyWineItem && apiWineDetail
      ? [
          apiWineDetail.officialNose1,
          apiWineDetail.officialNose2,
          apiWineDetail.officialNose3,
        ].filter(Boolean)
      : null;

  const palate =
    !isMyWineItem && apiWineDetail
      ? [
          apiWineDetail.officialPalate1,
          apiWineDetail.officialPalate2,
          apiWineDetail.officialPalate3,
        ].filter(Boolean)
      : null;

  const finish =
    !isMyWineItem && apiWineDetail
      ? [
          apiWineDetail.officialFinish1,
          apiWineDetail.officialFinish2,
          apiWineDetail.officialFinish3,
        ].filter(Boolean)
      : null;

  const rawVintages = !isMyWineItem ? wine.vintages : undefined;

  const [vintageStats, setVintageStats] = useState<{
    [key: string]: { rating: number; count: number; reviews: any[] };
  }>({});

  const userRating = useMemo(() => {
    const entries = Object.values(vintageStats);
    if (entries.length === 0) return null;
    let totalSum = 0;
    let totalCount = 0;
    entries.forEach((e) => {
      totalSum += e.rating * e.count;
      totalCount += e.count;
    });
    return totalCount > 0
      ? { avg: totalSum / totalCount, count: totalCount }
      : null;
  }, [vintageStats]);

  useEffect(() => {
    const fetchVintageStats = async () => {
      if (!wine.id) return;
      try {
        const response = await getWineReviews(wine.id as number, {
          sortType: "최신순",
          page: 0,
          size: 100,
        });

        if (response.isSuccess) {
          const stats: {
            [key: string]: { sum: number; count: number; reviews: any[] };
          } = {};

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

          const finalStats: {
            [key: string]: { rating: number; count: number; reviews: any[] };
          } = {};
          Object.keys(stats).forEach((key) => {
            finalStats[key] = {
              rating: stats[key].sum / stats[key].count,
              count: stats[key].count,
              reviews: stats[key].reviews,
            };
          });

          setVintageStats(finalStats);
        }
      } catch (error) {
        console.error("Failed to fetch reviews for stats:", error);
      }
    };

    if (isFocused) {
      fetchVintageStats();
    }
  }, [wine.id, isFocused]);

  const vintages = useMemo(() => {
    const list: VintageData[] = [
      {
        year: "ALL",
        rating: 0,
        reviews: [],
        prices: [],
      },
    ];

    list.push({
      year: "NV",
      rating: 0,
      reviews: [],
      prices: [],
    });

    for (let year = 2025; year >= 1950; year--) {
      list.push({
        year: year.toString(),
        rating: 0,
        reviews: [],
        prices: [],
      });
    }

    let mergedList = list;
    if (rawVintages) {
      mergedList = list.map((vItem) => {
        if (vItem.year === "ALL") return vItem;
        const realData = rawVintages.find((rv) => rv.year === vItem.year);
        return realData ? realData : vItem;
      });
    }

    return mergedList.map((vItem) => {
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
      case "my_record":
        if (isMyWineItem) {
          return <MyRecordTab wine={wine} features={features} />;
        }
        return null;
      case "info":
        return (
          <InfoTab
            type={type}
            country={country}
            grape={grape}
            description={description}
            features={features}
            nose={nose}
            palate={palate}
            finish={finish}
            showTastingNotes={!isMyWineItem}
          />
        );
      case "review":
        return (
          <ReviewTab
            wineId={wine.id as number}
            selectedVintageYear={selectedVintage?.year}
          />
        );
      case "price":
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
    navigation.navigate("WineAdd", {
      wine: { ...wine, nameKor, nameEng, type, country, grape, id: wine.id },
    });
  };

  const handleWriteNote = () => {
    navigation.navigate("TastingNoteWrite", {
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
    navigation.navigate("WineAdd", { wine: wineToPass });
    closeFab();
  };

  const handleWriteNoteWithClose = () => {
    handleWriteNote();
    closeFab();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: headerHeight + 8 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.wineHeaderSection}>
          <View style={styles.imageContainer}>
            {isLoading && !apiWineDetail ? (
              <ActivityIndicator size="large" color={colors.primary} />
            ) : imageUri ? (
              <Image
                source={{ uri: imageUri }}
                style={styles.wineImage}
                resizeMode="contain"
              />
            ) : (
              <MaterialCommunityIcons
                name="image-off-outline"
                size={32}
                color={colors.textSecondary}
              />
            )}
          </View>

          <View style={styles.infoContainer}>
            {i18n.language === "en" ? (
              <Text style={styles.wineNameKor}>{nameEng || nameKor}</Text>
            ) : (
              <>
                <Text style={styles.wineNameKor}>{nameKor}</Text>
                {nameEng ? (
                  <Text style={styles.wineNameEng}>{nameEng}</Text>
                ) : null}
              </>
            )}

            <View style={styles.ratingRow}>
              <MaterialCommunityIcons
                name="star"
                size={16}
                color={userRating ? colors.ratingGold : colors.textSecondary}
              />
              <Text style={styles.ratingText}>
                {userRating ? userRating.avg.toFixed(1) : "-"}
              </Text>
              {userRating && (
                <Text style={styles.ratingCount}>({userRating.count})</Text>
              )}
            </View>
          </View>
        </View>

        {!isMyWineItem && (
          <View>
            <TouchableOpacity
              style={styles.compatibilityBanner}
              onPress={handleCompatBannerPress}
            >
              <View style={styles.compatIconChip}>
                <MaterialCommunityIcons
                  name={compatUnlocked ? "heart-pulse" : "lock-outline"}
                  size={20}
                  color={accent.text}
                />
              </View>
              <View style={styles.compatibilityBannerTextContainer}>
                <Text style={styles.compatibilityBannerTitle}>
                  {compatUnlocked
                    ? t("wineDetail.compatBannerTitle")
                    : t("wineDetail.compatBannerLockedTitle")}
                </Text>
                <Text style={styles.compatibilityBannerSubtitle}>
                  {isUnlockingCompat
                    ? t("wineDetail.compatBannerAnalyzing")
                    : compatUnlocked
                    ? t("wineDetail.compatBannerSubtitle")
                    : compatRemaining > 0
                    ? t("wineDetail.compatBannerQuotaRemaining", {
                        remaining: compatRemaining,
                        total: compatDailyLimit,
                      })
                    : t("wineDetail.compatBannerQuotaExhausted")}
                </Text>
              </View>
              {isUnlockingCompat ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : compatUnlocked ? (
                compatResult ? (
                  <Text
                    style={[
                      styles.compatibilityScoreText,
                      { color: getScoreColor(compatResult.score) },
                    ]}
                  >
                    {compatResult.score}
                    {t("wineCompatibility.scoreUnit")}
                  </Text>
                ) : (
                  <Text style={styles.compatibilityScoreText}>
                    ?{t("wineCompatibility.scoreUnit")}
                  </Text>
                )
              ) : (
                <Text
                  style={[
                    styles.compatibilityScoreText,
                    styles.compatibilityScoreLocked,
                  ]}
                >
                  ??{t("wineCompatibility.scoreUnit")}
                </Text>
              )}
              {!isUnlockingCompat && (
                <Ionicons
                  name={
                    compatUnlocked
                      ? showCompatBubble
                        ? "chevron-up"
                        : "chevron-down"
                      : "chevron-forward"
                  }
                  size={18}
                  color={colors.textSecondary}
                  style={{ marginLeft: 8 }}
                />
              )}
            </TouchableOpacity>
            {isUnlockingCompat && (
              <View style={styles.compatBubbleContainer}>
                <View style={styles.compatBubbleArrow} />
                <View style={styles.compatBubble}>
                  {[
                    t("wineDetail.compatAnalyzeStep1"),
                    t("wineDetail.compatAnalyzeStep2"),
                    t("wineDetail.compatAnalyzeStep3"),
                  ].map((label, idx) => {
                    const isDone = idx < analyzeStep;
                    const isActive = idx === analyzeStep;
                    return (
                      <View
                        key={idx}
                        style={[
                          styles.compatAnalyzeRow,
                          idx < 2 && styles.compatBubbleRowBorder,
                        ]}
                      >
                        {isDone ? (
                          <Ionicons
                            name="checkmark-circle"
                            size={16}
                            color={colors.primary}
                            style={{ marginRight: 8 }}
                          />
                        ) : isActive ? (
                          <ActivityIndicator
                            size="small"
                            color={colors.primary}
                            style={{ marginRight: 8, width: 16 }}
                          />
                        ) : (
                          <Ionicons
                            name="ellipse-outline"
                            size={16}
                            color={colors.textSecondary}
                            style={{ marginRight: 8, opacity: 0.4 }}
                          />
                        )}
                        <Text
                          style={[
                            styles.compatAnalyzeLabel,
                            isDone && styles.compatAnalyzeLabelDone,
                            !isDone &&
                              !isActive &&
                              styles.compatAnalyzeLabelPending,
                          ]}
                        >
                          {label}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}
            {!isUnlockingCompat &&
              compatUnlocked &&
              showCompatBubble &&
              compatResult && (
                <View style={styles.compatBubbleContainer}>
                  <View style={styles.compatBubbleArrow} />
                  <View style={styles.compatBubble}>
                    {compatResult.details.map((detail, idx) => {
                      const absDiff = Math.abs(detail.diff);
                      const feedbackStyle =
                        absDiff === 0
                          ? styles.compatBubbleFeedbackPerfect
                          : absDiff >= 2
                          ? styles.compatBubbleFeedbackStrong
                          : null;
                      return (
                        <View
                          key={detail.key}
                          style={[
                            styles.compatBubbleRow,
                            idx < compatResult.details.length - 1 &&
                              styles.compatBubbleRowBorder,
                          ]}
                        >
                          <Text style={styles.compatBubbleLabel}>
                            {detail.label}
                          </Text>
                          <Text
                            style={[styles.compatBubbleFeedback, feedbackStyle]}
                          >
                            {detail.feedback}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              )}
          </View>
        )}

        {!isMyWineItem && vintages && vintages.length > 0 && (
          <View style={styles.vintageSelectContainer}>
            <TouchableOpacity
              style={styles.vintageSelectButton}
              onPress={() => setVintageModalVisible(true)}
            >
              <Text style={styles.vintageSelectLabel}>
                {t("wineDetail.vintage")}
              </Text>
              <View style={styles.vintageSelectValueContainer}>
                <Text style={styles.vintageSelectValue}>
                  {selectedVintage
                    ? selectedVintage.year
                    : t("wineDetail.select")}
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={colors.textSecondary}
                />
              </View>
            </TouchableOpacity>
          </View>
        )}

        <View
          style={styles.segmentWrap}
          onLayout={(e) => setSegWidth(e.nativeEvent.layout.width)}
        >
          {segItemWidth > 0 && (
            <Animated.View
              style={[
                styles.segIndicator,
                {
                  width: segItemWidth,
                  transform: [
                    {
                      translateX: segIndicator.interpolate({
                        inputRange: TAB_KEYS.map((_, i) => i),
                        outputRange: TAB_KEYS.map((_, i) => i * segItemWidth),
                      }),
                    },
                  ],
                },
              ]}
            />
          )}
          {TAB_KEYS.map((key) => (
            <TouchableOpacity
              key={key}
              style={styles.segBtn}
              activeOpacity={0.8}
              onPress={() => setActiveTab(key)}
            >
              <Text
                style={[
                  styles.segText,
                  activeTab === key && styles.segTextActive,
                ]}
              >
                {t(`wineDetail.tabs.${TAB_LABELS[key]}`)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Animated.View
          style={[
            styles.tabBody,
            {
              opacity: tabContentAnim,
              transform: [
                {
                  translateY: tabContentAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [8, 0],
                  }),
                },
              ],
            },
          ]}
        >
          {renderTabContent()}
        </Animated.View>
      </ScrollView>

      {/* Bottom fade so content dissolves into the background as it scrolls off. */}
      <LinearGradient
        colors={["transparent", colors.background]}
        style={styles.bottomFade}
        pointerEvents="none"
      />

      {/* Translucent frosted header — content scrolls underneath it. */}
      <GlassHeader
        title={
          isMyWineItem
            ? t("wineDetail.myWineHeader")
            : t("wineDetail.infoHeader")
        }
        left={
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={22} color={colors.white} />
          </TouchableOpacity>
        }
        right={
          !isMyWineItem ? (
            <TouchableOpacity
              style={styles.wishlistButton}
              onPress={handleToggleWishlist}
            >
              <Ionicons
                name={isLiked ? "heart" : "heart-outline"}
                size={22}
                color={isLiked ? colors.error : colors.white}
              />
            </TouchableOpacity>
          ) : undefined
        }
      />

      {isMyWineItem ? (
        <View style={styles.bottomButtonContainer}>
          <TouchableOpacity
            style={styles.recordButton}
            onPress={handleAddRecord}
          >
            <MaterialCommunityIcons
              name="pencil"
              size={20}
              color={colors.white}
              style={{ marginRight: 8 }}
            />
            <Text style={styles.recordButtonText}>
              {t("wineDetail.fab.editRecord")}
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
                      marginBottom: 16,
                    },
                  ]}
                >
                  <TouchableOpacity
                    style={styles.fabCombinedButtonShadow}
                    onPress={handleAddToMyWine}
                    activeOpacity={0.8}
                  >
                    <View style={styles.fabCombinedGradient}>
                      <View style={styles.fabTextContainer}>
                        <Text style={styles.fabCombinedLabel}>
                          {t("wineDetail.fab.addWine")}
                        </Text>
                      </View>
                      <View style={styles.fabIconContainer}>
                        <MaterialCommunityIcons
                          name="bottle-wine-outline"
                          size={20}
                          color={colors.white}
                        />
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
                      marginBottom: 0,
                    },
                  ]}
                >
                  <TouchableOpacity
                    style={styles.fabCombinedButtonShadow}
                    onPress={handleWriteNoteWithClose}
                    activeOpacity={0.8}
                  >
                    <View style={styles.fabCombinedGradient}>
                      <View style={styles.fabTextContainer}>
                        <Text style={styles.fabCombinedLabel}>
                          {t("wineDetail.fab.writeNote")}
                        </Text>
                      </View>
                      <View style={styles.fabIconContainer}>
                        <MaterialCommunityIcons
                          name="pencil-outline"
                          size={20}
                          color={colors.white}
                        />
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
                style={[
                  styles.fabMainGradient,
                  { backgroundColor: isFabOpen ? surfaces.card : accent.base },
                ]}
              >
                <Animated.View style={{ transform: [{ rotate: fabRotation }] }}>
                  <MaterialCommunityIcons
                    name="plus"
                    size={32}
                    color={colors.white}
                  />
                </Animated.View>
              </View>
            </TouchableOpacity>
          </View>
        </>
      )}

      <VintageSelectionModal
        visible={isVintageModalVisible}
        onClose={() => setVintageModalVisible(false)}
        vintages={vintages}
        selectedVintage={selectedVintage}
        onSelect={setSelectedVintage}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  bottomFade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 96,
    zIndex: 5,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: surfaces.raised,
    borderWidth: 1,
    borderColor: surfaces.hairline,
    justifyContent: "center",
    alignItems: "center",
  },
  wishlistButton: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: surfaces.raised,
    borderWidth: 1,
    borderColor: surfaces.hairline,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    paddingBottom: 100,
  },
  wineHeaderSection: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    gap: 16,
  },
  imageContainer: {
    width: 120,
    height: 150,
    borderRadius: radius.sm,
    backgroundColor: surfaces.imageWell,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    flexShrink: 0,
  },
  wineImage: {
    width: "100%",
    height: "100%",
  },
  infoContainer: {
    flex: 1,
    gap: 6,
  },
  wineNameKor: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.white,
    lineHeight: 24,
  },
  wineNameEng: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  ratingText: {
    fontSize: 15,
    fontWeight: "bold",
    color: colors.white,
  },
  ratingCount: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 2,
  },
  divider: {
    height: 8,
    backgroundColor: "#111",
  },

  segmentWrap: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 4,
    padding: 4,
    backgroundColor: surfaces.raised,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: surfaces.hairline,
  },
  segIndicator: {
    position: "absolute",
    top: 4,
    bottom: 4,
    left: 4,
    borderRadius: radius.sm,
    backgroundColor: accent.base,
  },
  segBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  segText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  segTextActive: {
    color: accent.onAccent,
    fontWeight: "700",
  },
  tabBody: {
    minHeight: 300,
  },
  vintageSelectContainer: {
    paddingTop: 16,
    paddingBottom: 8,
    paddingHorizontal: 20,
    backgroundColor: colors.background,
  },
  vintageSelectButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: surfaces.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: surfaces.hairline,
  },
  compatibilityBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginHorizontal: 20,
    marginBottom: 0,
    backgroundColor: accent.soft,
    borderWidth: 1,
    borderColor: accent.border,
    borderRadius: radius.md,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  compatIconChip: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: surfaces.card,
    justifyContent: "center",
    alignItems: "center",
  },
  compatibilityBannerTextContainer: {
    flex: 1,
  },
  compatibilityBannerTitle: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "700",
  },
  compatibilityBannerSubtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  compatibilityScoreText: {
    fontSize: 17,
    fontWeight: "bold",
    color: colors.textSecondary,
  },
  compatibilityScoreLocked: {
    color: colors.textSecondary,
    opacity: 0.5,
  },
  compatBubbleContainer: {
    marginHorizontal: 20,
    marginTop: 4,
  },
  compatBubbleArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 10,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: colors.surface2,
    alignSelf: "center",
  },
  compatBubble: {
    backgroundColor: colors.surface2,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  compatBubbleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },
  compatBubbleRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  compatBubbleLabel: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: "600",
  },
  compatBubbleFeedback: {
    color: colors.white,
    fontSize: 13,
    flexShrink: 1,
    textAlign: "right",
    marginLeft: 12,
  },
  compatBubbleFeedbackPerfect: {
    color: "#2ecc71",
    fontWeight: "600",
  },
  compatBubbleFeedbackStrong: {
    color: "#f39c12",
    fontWeight: "700",
  },
  compatAnalyzeRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  compatAnalyzeLabel: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "500",
  },
  compatAnalyzeLabelDone: {
    color: colors.textSecondary,
  },
  compatAnalyzeLabelPending: {
    color: colors.textSecondary,
    opacity: 0.5,
  },
  vintageSelectLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.white,
  },
  vintageSelectValueContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  vintageSelectValue: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: "600",
  },
  bottomButtonContainer: {
    position: "absolute",
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
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  recordButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "bold",
  },
  fabContainer: {
    position: "absolute",
    bottom: 30,
    right: 24,
    alignItems: "center",
    zIndex: 1000,
  },
  fabOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
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
    width: "100%",
    height: "100%",
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.border,
  },
  fabOptionsContainer: {
    position: "absolute",
    bottom: 50,
    right: 0,
    minWidth: 300,
    alignItems: "flex-end",
    marginBottom: 0,
    zIndex: 2000,
  },
  fabOptionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
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
    justifyContent: "center",
  },
  fabCombinedGradient: {
    width: "100%",
    height: "100%",
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 24,
    backgroundColor: colors.border,
    paddingRight: 6,
  },
  fabTextContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingLeft: 12,
  },
  fabIconContainer: {
    width: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  fabCombinedLabel: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "600",
    includeFontPadding: false,
    textAlignVertical: "center",
  },
  fabIcon: {
    marginLeft: 0,
  },
});
