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
  getRecommendedBottles,
  MyWineDTO,
  RecommendedBottleDTO,
  searchWinesPublic,
  WineUserDTO,
} from "../api/wine";
import { colors } from "../constants/colors";
import { spacing, radius, surfaces, accent } from "../constants/theme";
import { useTranslation } from "react-i18next";
import { useSubscription } from "../context/SubscriptionContext";
import { useUser, RecommendedWine } from "../context/UserContext";
import { RecentReviewsSection } from "../components/home/RecentReviewsSection";
import { RecommendedSection } from "../components/home/RecommendedSection";

const FLIP_DURATION = 550;

const normalize = (s?: string | null) =>
  (s ?? "").toLowerCase().replace(/\s+/g, "");

// 공개 GET /wine은 wineVariety 파라미터를 무시하고 이름순 첫 페이지를
// 반환하므로(어드민 전용 필터), 클라이언트에서 품종 일치를 반드시 검증한다.
// 과거의 "타입(레드 등)만 맞으면 통과" 폴백은 취향과 무관한 와인을
// 추천으로 노출시켜 제거했다 — 품종이 실제로 일치할 때만 통과.
const matchesStyle = (item: WineUserDTO, style: RecommendedWine): boolean => {
  const itemVariety = normalize(item.variety);
  const styleVariety = normalize(style.variety);
  const styleVarietyEng = normalize(style.varietyEng);
  if (!itemVariety || !styleVariety) return false;
  return (
    itemVariety.includes(styleVariety) ||
    styleVariety.includes(itemVariety) ||
    (!!styleVarietyEng && itemVariety.includes(styleVarietyEng))
  );
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

const bottleToWineDBItem = (item: RecommendedBottleDTO): WineDBItem => ({
  id: item.wineId,
  nameKor: item.wineName,
  nameEng: item.wineNameEng,
  type: item.sort,
  country: item.country,
  grape: item.variety,
  imageUri:
    item.imageUrl ||
    `https://drinkeg-bucket-1.s3.ap-northeast-2.amazonaws.com/wine/${item.wineId}.png`,
  vivinoRating: item.vivinoRating,
});

// 홈 재진입마다 추천을 다시 계산하지 않도록 세션 단위 캐시.
// 캐시 키를 추천 스타일 시그니처로 잡아 취향 재설정으로 추천이 바뀌면
// 자동으로 무효화되고, 이전 취향 기준 와인이 계속 보이지 않는다.
let recommendedWinesCache: WineDBItem[] | null = null;
let recommendedWinesCacheKey: string | null = null;

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
  const [recommendedWines, setRecommendedWines] = useState<WineDBItem[]>([]);
  const [recentWines, setRecentWines] = useState<WineDBItem[]>([]);

  // 온보딩/취향 재설정에서 받아둔 추천 스타일로 실제 와인을 찾아 보여준다.
  useEffect(() => {
    if (!recommendations || recommendations.length === 0) return;
    const cacheKey = JSON.stringify(
      recommendations.map((r) => [r.variety, r.sort])
    );
    if (recommendedWinesCache && recommendedWinesCacheKey === cacheKey) {
      setRecommendedWines(recommendedWinesCache); // 세션 내 재계산 방지
      return;
    }
    let alive = true;
    // 전체 목록(서버 최대 20병)을 들고 있다가 홈에는 10병만 노출하고,
    // "더보기" 화면에는 전체를 넘긴다.
    const commit = (wines: WineDBItem[]) => {
      recommendedWinesCache = wines;
      recommendedWinesCacheKey = cacheKey;
      if (alive) setRecommendedWines(wines);
    };
    (async () => {
      try {
        // 1순위: 서버의 취향 기반 실와인 추천 API.
        // 미배포(404)·실패 시엔 아래 품종 검색 폴백으로 조용히 넘어간다.
        try {
          const bottles = await getRecommendedBottles();
          if (bottles?.isSuccess && bottles.result.length >= 3) {
            commit(bottles.result.map(bottleToWineDBItem));
            return;
          }
        } catch {
          // 폴백 진행
        }

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

        // 타입(wineSort) 기반 2차 폴백은 제거 — 서버가 필터를 무시해
        // "타입만 같은 무관한 와인"을 채워 넣는 효과밖에 없었다.
        // 품종 일치 와인이 3개 미만이면 섹션을 숨기는 편이 낫다.
        if (wines.length >= 3) {
          commit(wines);
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
            data={recommendedWines.slice(0, 10)}
            title={t("home.recommended.title")}
            onPressMore={() =>
              navigation.navigate("RecommendedWines", {
                wines: recommendedWines,
              })
            }
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
