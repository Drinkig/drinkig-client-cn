import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Animated,
  Easing,
  useWindowDimensions,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/Ionicons";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useNavigation, useIsFocused } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { RootStackParamList } from "../types";
import { WineDBItem } from "../types/Wine";
import { HeroSection } from "../components/home/HeroSection";
import {
  getMyWines,
  MyWineDTO,
  searchWinesPublic,
  WineUserDTO,
} from "../api/wine";
import { colors } from "../constants/colors";
import { spacing, radius, surfaces, accent } from "../constants/theme";
import { getWineTypeColor, wineTypeColors } from "../constants/wineColors";
import { useTranslation } from "react-i18next";
import { useSubscription } from "../context/SubscriptionContext";
import { useUser, RecommendedWine } from "../context/UserContext";
import { RecentReviewsSection } from "../components/home/RecentReviewsSection";
import { RecommendedSection } from "../components/home/RecommendedSection";

const FLIP_DURATION = 550;

const normalize = (s?: string | null) =>
  (s ?? "").toLowerCase().replace(/\s+/g, "");

// 서버가 wineVariety/wineSort 필터를 지원하지 않을 가능성에 대비해
// 클라이언트에서 한 번 더 스타일 일치 여부를 확인한다.
// (필터가 무시되면 무관한 와인이 "취향 추천"으로 나가는 것을 막는 안전망)
const matchesStyle = (item: WineUserDTO, style: RecommendedWine): boolean => {
  const itemVariety = normalize(item.variety);
  const styleVariety = normalize(style.variety);
  const styleVarietyEng = normalize(style.varietyEng);
  if (itemVariety && styleVariety) {
    if (
      itemVariety.includes(styleVariety) ||
      styleVariety.includes(itemVariety) ||
      (styleVarietyEng && itemVariety.includes(styleVarietyEng))
    ) {
      return true;
    }
  }
  // 품종 매칭 실패 시 와인 타입(레드/화이트 등)이라도 일치하면 통과 —
  // 한/영 표기가 섞여 있어 getWineTypeColor의 정규화 로직을 재사용한다.
  const itemColor = getWineTypeColor(item.sort);
  const styleColor = getWineTypeColor(style.sort);
  return itemColor === styleColor && itemColor !== wineTypeColors.default;
};

const toWineDBItem = (item: WineUserDTO): WineDBItem => ({
  id: item.wineId,
  nameKor: item.name,
  nameEng: item.nameEng,
  type: item.sort,
  country: item.country,
  grape: item.variety,
  // 응답에 이미지가 없으면 S3 병 이미지 규칙으로 폴백 (MyWineScreen과 동일)
  imageUri:
    item.imageUrl ||
    `https://drinkeg-bucket-1.s3.ap-northeast-2.amazonaws.com/wine/${item.wineId}.png`,
  vivinoRating: item.vivinoRating,
});

// 홈 재진입마다 추천을 다시 계산하지 않도록 세션 단위 캐시
let recommendedWinesCache: WineDBItem[] | null = null;

export default function HomeScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const isFocused = useIsFocused();
  const { t } = useTranslation();
  const { refreshSubscription } = useSubscription();
  const { width: SCREEN_W, height: SCREEN_H } = useWindowDimensions();

  // null = 아직 로드 전 → 카운트를 0으로 단정하지 않고 "—"로 표시
  const [myWines, setMyWines] = useState<MyWineDTO[] | null>(null);
  const { recommendations } = useUser();
  const [recommendedWines, setRecommendedWines] = useState<WineDBItem[]>(
    recommendedWinesCache ?? []
  );
  const [recentWines, setRecentWines] = useState<WineDBItem[]>([]);

  // 온보딩/취향 재설정에서 받아둔 추천 스타일로 실제 와인을 찾아 보여준다.
  useEffect(() => {
    if (recommendedWinesCache) return; // 세션 내 재계산 방지
    if (!recommendations || recommendations.length === 0) return;
    let alive = true;
    (async () => {
      try {
        const styleTargets = recommendations.slice(0, 2);
        const responses = await Promise.all(
          styleTargets.map((style) =>
            searchWinesPublic({ wineVariety: style.variety, size: 10 }).catch(
              () => null
            )
          )
        );
        const seen = new Set<number>();
        const wines: WineDBItem[] = [];
        responses.forEach((res, i) => {
          if (!res?.isSuccess) return;
          res.result.content.forEach((item: WineUserDTO) => {
            if (seen.has(item.wineId)) return;
            if (!matchesStyle(item, styleTargets[i])) return;
            seen.add(item.wineId);
            wines.push(toWineDBItem(item));
          });
        });

        // 품종 검색이 빈약하면 대표 스타일의 타입(레드 등)으로 한 번 더 시도
        if (wines.length < 3) {
          const fallback = await searchWinesPublic({
            wineSort: styleTargets[0].sort,
            size: 10,
          }).catch(() => null);
          if (fallback?.isSuccess) {
            fallback.result.content.forEach((item: WineUserDTO) => {
              if (seen.has(item.wineId)) return;
              if (!matchesStyle(item, styleTargets[0])) return;
              seen.add(item.wineId);
              wines.push(toWineDBItem(item));
            });
          }
        }

        if (alive && wines.length >= 3) {
          const sliced = wines.slice(0, 10);
          recommendedWinesCache = sliced;
          setRecommendedWines(sliced);
        }
      } catch (e) {
        console.warn("Failed to build home recommendations:", e);
      }
    })();
    return () => {
      alive = false;
    };
  }, [recommendations]);

  // 최근 본 와인 (검색/상세에서 이미 저장 중인 recent_wines 재사용)
  useEffect(() => {
    if (!isFocused) return;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem("recent_wines");
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) setRecentWines(parsed);
        }
      } catch (e) {
        console.warn("Failed to load recent wines for home:", e);
      }
    })();
  }, [isFocused]);

  // Flip transition state
  const heroRef = useRef<View>(null);
  const [flipping, setFlipping] = useState(false);
  const [cardRect, setCardRect] = useState<{
    x: number;
    y: number;
    w: number;
    h: number;
  } | null>(null);
  const layoutAnim = useRef(new Animated.Value(0)).current;
  const flipAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isFocused) {
      fetchMyWines();
    }
  }, [isFocused]);

  useEffect(() => {
    refreshSubscription();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleHeroPress = () => {
    // Free users can enter the chat — Drinky will explain the premium
    // subscription inside the conversation rather than blocking entry here.
    if (flipping) return;
    heroRef.current?.measureInWindow((x, y, w, h) => {
      if (!w || !h) {
        // Fallback if measurement fails
        navigation.navigate("SommelierChat");
        return;
      }
      setCardRect({ x, y, w, h });
      setFlipping(true);
      layoutAnim.setValue(0);
      flipAnim.setValue(0);
      Animated.parallel([
        Animated.timing(layoutAnim, {
          toValue: 1,
          duration: FLIP_DURATION,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(flipAnim, {
          toValue: 1,
          duration: FLIP_DURATION,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start(() => {
        navigation.navigate("SommelierChat");
        // Keep overlay visible briefly so the chat screen can fade in underneath
        setTimeout(() => {
          setFlipping(false);
          setCardRect(null);
          layoutAnim.setValue(0);
          flipAnim.setValue(0);
        }, 400);
      });
    });
  };

  const fetchMyWines = async () => {
    try {
      const response = await getMyWines();
      if (response.isSuccess && response.result) {
        setMyWines(response.result);
      } else {
        setMyWines([]);
      }
    } catch (error) {
      console.error("Failed to fetch my wines summary:", error);
    }
  };

  return (
    <View style={styles.rootContainer}>
      <SafeAreaView style={styles.container}>
        <StatusBar
          barStyle="light-content"
          backgroundColor={colors.background}
        />

        <View style={styles.headerContainer}>
          <TouchableOpacity
            style={styles.searchBar}
            onPress={() => navigation.navigate("Search" as never)}
            activeOpacity={0.85}
          >
            <Icon name="search" size={19} color={colors.textSecondary} />
            <Text style={styles.searchPlaceholder}>
              {t("home.searchPlaceholder")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigation.navigate("Wishlist" as never)}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={t("wishlist.header")}
          >
            <Icon name="heart-outline" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View
            ref={heroRef}
            collapsable={false}
            style={{ opacity: flipping ? 0 : 1 }}
          >
            <HeroSection onPress={handleHeroPress} />
          </View>

          {/* Two core actions as wide side-by-side cards. */}
          <View style={styles.quickCardRow}>
            <TouchableOpacity
              style={styles.quickCard}
              onPress={() => navigation.navigate("TastingNoteWrite" as never)}
              activeOpacity={0.85}
            >
              <View style={styles.iconChip}>
                <MaterialCommunityIcons
                  name="notebook-edit-outline"
                  size={24}
                  color={accent.text}
                />
              </View>
              <View>
                <Text style={styles.quickCardTitle}>
                  {t("home.quickMenu.tastingNoteTitle")}
                </Text>
                <Text style={styles.quickCardSub}>
                  {t("home.quickMenu.tastingNoteSub")}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickCard}
              onPress={() => navigation.navigate("MyWine" as never)}
              activeOpacity={0.85}
            >
              <View style={styles.iconChip}>
                <MaterialCommunityIcons
                  name="bottle-wine-outline"
                  size={24}
                  color={accent.text}
                />
              </View>
              <View>
                <Text style={styles.quickCardTitle}>
                  {t("home.quickMenu.myWineTitle")}
                </Text>
                <Text style={styles.quickCardSub}>
                  {myWines === null ? "—" : myWines.length}
                  {t("home.quickMenu.bottlesUnit")}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* 온보딩 취향 데이터를 홈에서 처음으로 활용하는 개인화 섹션 */}
          <RecommendedSection
            data={recommendedWines}
            title={t("home.recommended.title")}
            onPressMore={() => navigation.navigate("RecommendationList")}
            onPressWine={(wine) => navigation.navigate("WineDetail", { wine })}
          />

          <RecommendedSection
            data={recentWines}
            title={t("home.recentWines.title")}
            onPressWine={(wine) => navigation.navigate("WineDetail", { wine })}
          />

          {/* Discovery feed sits below the user's own tools. */}
          <RecentReviewsSection />
        </ScrollView>
      </SafeAreaView>

      {flipping && cardRect && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <Animated.View
            style={{
              position: "absolute",
              left: layoutAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [cardRect.x, 0],
              }),
              top: layoutAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [cardRect.y, 0],
              }),
              width: layoutAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [cardRect.w, SCREEN_W],
              }),
              height: layoutAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [cardRect.h, SCREEN_H],
              }),
              borderRadius: layoutAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [radius.xl, 0],
              }),
              overflow: "hidden",
            }}
          >
            {/* Front face - hero card accent */}
            <Animated.View
              style={[
                StyleSheet.absoluteFillObject,
                {
                  backfaceVisibility: "hidden",
                  transform: [
                    { perspective: 1200 },
                    {
                      rotateY: flipAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ["0deg", "180deg"],
                      }),
                    },
                  ],
                },
              ]}
            >
              <View
                style={[
                  StyleSheet.absoluteFillObject,
                  { backgroundColor: surfaces.card },
                ]}
              />
              <LinearGradient
                colors={[accent.soft, "transparent"]}
                start={{ x: 1, y: 0 }}
                end={{ x: 0.1, y: 0.9 }}
                style={StyleSheet.absoluteFillObject}
              />
            </Animated.View>

            {/* Back face - chat screen */}
            <Animated.View
              style={[
                StyleSheet.absoluteFillObject,
                {
                  backfaceVisibility: "hidden",
                  transform: [
                    { perspective: 1200 },
                    {
                      rotateY: flipAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ["180deg", "360deg"],
                      }),
                    },
                  ],
                },
              ]}
            >
              <View
                style={[
                  StyleSheet.absoluteFillObject,
                  { backgroundColor: colors.background },
                ]}
              />
            </Animated.View>
          </Animated.View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    backgroundColor: colors.background,
    zIndex: 10,
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    height: 48,
    paddingHorizontal: spacing.lg,
    backgroundColor: surfaces.raised,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: surfaces.hairline,
  },
  searchPlaceholder: {
    color: colors.textSecondary,
    fontSize: 15,
  },
  iconButton: {
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: radius.pill,
    backgroundColor: surfaces.raised,
    borderWidth: 1,
    borderColor: surfaces.hairline,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  quickCardRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.xxl,
  },
  quickCard: {
    flex: 1,
    height: 152,
    padding: spacing.lg,
    justifyContent: "space-between",
    backgroundColor: surfaces.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: surfaces.hairline,
  },
  iconChip: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: accent.soft,
    justifyContent: "center",
    alignItems: "center",
  },
  quickCardTitle: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: -0.2,
    marginBottom: spacing.xs,
  },
  quickCardSub: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: "500",
  },
});
