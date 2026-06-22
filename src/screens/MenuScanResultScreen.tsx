import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  FlatList,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import Ionicons from "react-native-vector-icons/Ionicons";
import Svg, { Circle } from "react-native-svg";
import { colors } from "../constants/colors";
import { radius, accent } from "../constants/theme";
import { getWineTypeColor } from "../constants/wineColors";
import client from "../api/client";
import { useTranslation } from "react-i18next";
import { incrementScanCount } from "./CameraScreen";
import ScanFeedbackSheet from "../components/common/ScanFeedbackSheet";
import GlassHeader from "../components/common/GlassHeader";
import { addToWishlist, removeFromWishlist } from "../api/wine";

// --- Types ------------------------------------------------------------------

export interface ScannedWineItemDTO {
  wineId: number;
  nameEng: string;
  nameKor: string;
  imageUrl: string | null;
  vintageYear: number | null;
  menuPrice: string | null;
  sort: "RED" | "WHITE" | "SPARKLING" | "ROSE" | "PORT" | "OTHER";
  country: string;
  region: string;
  variety: string;
  flavorMatchScore: number; // 0–100
}

export interface MenuScanResultDTO {
  totalMatchedCount: number;
  matchedWines: ScannedWineItemDTO[];
  unmatchedWines: {
    rawText: string;
    vintageYear: number | null;
    menuPrice: string | null;
  }[];
}

export interface MenuScanResponse {
  isSuccess: boolean;
  code: string;
  message: string;
  result: MenuScanResultDTO;
}

// --- Helpers ----------------------------------------------------------------

// Animated SVG circle wrapper
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const RING_SIZE = 54;
const STROKE_WIDTH = 4;
const RADIUS = (RING_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function scoreColor(score: number) {
  if (score >= 70) return colors.success; // 좋음
  if (score >= 55) return colors.warning; // 준수
  return colors.textTertiary; // 낮음
}

function ScoreRing({ score }: { score: number }) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: score / 100,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [score]);

  // dashoffset: 0 = full ring filled, CIRCUMFERENCE = empty
  const strokeDashoffset = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [CIRCUMFERENCE, 0],
  });

  const color = scoreColor(score);

  return (
    <View style={styles.scoreRingWrapper}>
      <Svg width={RING_SIZE} height={RING_SIZE} style={styles.scoreSvg}>
        {/* Track (background) */}
        <Circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RADIUS}
          stroke={colors.surface2}
          strokeWidth={STROKE_WIDTH}
          fill="transparent"
        />
        {/* Progress arc */}
        <AnimatedCircle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RADIUS}
          stroke={color}
          strokeWidth={STROKE_WIDTH}
          fill="transparent"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </Svg>
      {/* Center label */}
      <View style={styles.scoreCenter}>
        <Text style={[styles.scorePercent, { color }]}>
          {score}
          <Text style={[styles.scoreLabel, { color }]}>%</Text>
        </Text>
      </View>
    </View>
  );
}

// --- Main Screen ------------------------------------------------------------

type Props = NativeStackScreenProps<any, "MenuScanResult">;

export default function MenuScanResultScreen({ route, navigation }: Props) {
  const { imageUri, scanType = "list" } = route.params as {
    imageUri: string;
    scanType?: "label" | "list";
  };
  const { t } = useTranslation();
  // 라벨/메뉴판 스캔이 한 화면을 공유하므로 scanType에 맞춰 안내 문구를 분기한다.
  const isLabel = scanType === "label";
  const headerTitle = t(
    isLabel ? "menuScanResult.headerLabel" : "menuScanResult.header"
  );
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<MenuScanResultDTO | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [wishedIds, setWishedIds] = useState<Set<number>>(new Set());
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const toastAnim = useRef(new Animated.Value(0)).current;

  // Call the API
  useEffect(() => {
    let cancelled = false;
    let feedbackTimer: ReturnType<typeof setTimeout> | null = null;
    const scanMenu = async () => {
      try {
        const formData = new FormData();
        formData.append("image", {
          uri: imageUri,
          name: "menu_scan.jpg",
          type: "image/jpeg",
        } as any);
        formData.append("scanType", scanType);

        const response = await client.post<MenuScanResponse>(
          "/wine/menu-scan",
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
            timeout: 60000,
          }
        );

        if (cancelled) return;
        setData(response.data.result);
        await incrementScanCount();
        if (cancelled) return;
        feedbackTimer = setTimeout(() => setShowFeedback(true), 2000);
      } catch (e: any) {
        if (cancelled) return;
        const status = e?.response?.status;
        let msg: string;
        if (status === 429) {
          msg = t("menuScanResult.error.limitReached");
        } else if (status === 413) {
          // nginx 등 게이트웨이 업로드 용량 제한 초과. "더 또렷하게 찍으세요"는
          // 오해를 부르므로 용량 문제임을 별도로 안내한다.
          msg = t("menuScanResult.error.tooLarge");
        } else {
          msg = t(
            scanType === "label"
              ? "menuScanResult.error.recognitionLabel"
              : "menuScanResult.error.recognition"
          );
        }
        setError(msg);
      } finally {
        if (cancelled) return;
        setLoading(false);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }).start();
      }
    };
    scanMenu();
    return () => {
      cancelled = true;
      if (feedbackTimer) clearTimeout(feedbackTimer);
    };
  }, [imageUri, scanType, t, fadeAnim]);

  // ----- Wishlist toggle -----
  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    toastAnim.setValue(0);
    Animated.sequence([
      Animated.timing(toastAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.delay(1500),
      Animated.timing(toastAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => setToastMessage(null));
  }, []);

  const handleToggleWishlist = useCallback(
    async (wine: ScannedWineItemDTO) => {
      const wasWished = wishedIds.has(wine.wineId);
      setWishedIds((prev) => {
        const next = new Set(prev);
        if (wasWished) next.delete(wine.wineId);
        else next.add(wine.wineId);
        return next;
      });

      try {
        const vintageYear = wine.vintageYear ?? undefined;
        if (wasWished) {
          await removeFromWishlist(wine.wineId, vintageYear);
          showToast(t("menuScanResult.wishlist.removed"));
        } else {
          await addToWishlist(wine.wineId, vintageYear);
          showToast(t("menuScanResult.wishlist.added"));
        }
      } catch {
        // Rollback
        setWishedIds((prev) => {
          const next = new Set(prev);
          if (wasWished) next.add(wine.wineId);
          else next.delete(wine.wineId);
          return next;
        });
      }
    },
    [wishedIds, showToast, t]
  );

  // ----- Render helpers -----

  const renderWineItem = ({ item }: { item: ScannedWineItemDTO }) => {
    const isBest = item.flavorMatchScore >= 80;
    return (
      <TouchableOpacity
        style={[styles.wineCard, isBest && styles.wineCardHighlight]}
        activeOpacity={0.75}
        onPress={() =>
          navigation.navigate("WineDetail", {
            wine: {
              id: item.wineId,
              nameKor: item.nameKor,
              nameEng: item.nameEng,
              type: item.sort,
              country: item.country,
              grape: item.variety,
              imageUri: item.imageUrl ?? undefined,
            },
          })
        }
      >
        {isBest && (
          <View style={styles.bestBadge}>
            <Ionicons name="star" size={10} color={colors.white} />
            <Text style={styles.bestBadgeText}>
              {" "}
              {t("menuScanResult.bestBadge")}
            </Text>
          </View>
        )}
        <View style={styles.wineCardRow}>
          {/* Wine image + sort color bar */}
          {item.imageUrl ? (
            <View style={styles.wineImageContainer}>
              <Image
                source={{ uri: item.imageUrl }}
                style={styles.wineImage}
                resizeMode="contain"
              />
              <View
                style={[
                  styles.sortBar,
                  { backgroundColor: getWineTypeColor(item.sort) },
                ]}
              />
            </View>
          ) : null}

          {/* Wine info */}
          <View style={styles.wineInfo}>
            <Text style={styles.wineNameEng} numberOfLines={2}>
              {item.nameEng}
            </Text>
            <Text style={styles.wineNameKor} numberOfLines={1}>
              {item.nameKor}
            </Text>
            <Text style={styles.wineMeta} numberOfLines={1}>
              {[item.country, item.region, item.variety]
                .filter(Boolean)
                .join(" · ")}
            </Text>
          </View>

          {/* Wishlist */}
          <TouchableOpacity
            style={styles.wishlistButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            onPress={(e) => {
              e.stopPropagation();
              handleToggleWishlist(item);
            }}
          >
            <Ionicons
              name={wishedIds.has(item.wineId) ? "heart" : "heart-outline"}
              size={22}
              color={
                wishedIds.has(item.wineId) ? colors.error : colors.textTertiary
              }
            />
          </TouchableOpacity>

          {/* Score */}
          <ScoreRing score={item.flavorMatchScore} />
        </View>
      </TouchableOpacity>
    );
  };

  // ----- Loading state -----
  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        <StatusBar
          barStyle="light-content"
          backgroundColor={colors.background}
        />
        <GlassHeader
          floating={false}
          title={headerTitle}
          left={
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="arrow-back" size={22} color={colors.white} />
            </TouchableOpacity>
          }
        />
        <View style={styles.stateContainer}>
          <ActivityIndicator
            size="large"
            color={accent.base}
            style={{ marginBottom: 20 }}
          />
          <Text style={styles.stateTitle}>
            {t(
              isLabel
                ? "menuScanResult.loading.titleLabel"
                : "menuScanResult.loading.title"
            )}
          </Text>
          <Text style={styles.stateSubtitle}>
            {t("menuScanResult.loading.subtitle")}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ----- Error state -----
  if (error || !data) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        <StatusBar
          barStyle="light-content"
          backgroundColor={colors.background}
        />
        <GlassHeader
          floating={false}
          title={headerTitle}
          left={
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="arrow-back" size={22} color={colors.white} />
            </TouchableOpacity>
          }
        />
        <View style={styles.stateContainer}>
          <Ionicons
            name="alert-circle-outline"
            size={52}
            color={colors.error}
            style={{ marginBottom: 16 }}
          />
          <Text style={[styles.stateTitle, { textAlign: "center" }]}>
            {error ?? t("menuScanResult.error.unknown")}
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.retryButtonText}>
              {t("menuScanResult.error.goBack")}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ----- Result state -----
  const sorted = [...data.matchedWines].sort(
    (a, b) => b.flavorMatchScore - a.flavorMatchScore
  );
  const hasUnmatched = data.unmatchedWines && data.unmatchedWines.length > 0;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        {/* Header */}
        <GlassHeader
          floating={false}
          title={headerTitle}
          left={
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="arrow-back" size={22} color={colors.white} />
            </TouchableOpacity>
          }
        />

        <FlatList
          data={sorted}
          keyExtractor={(item, index) => `${item.wineId}-${index}`}
          renderItem={renderWineItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={styles.resultCountContainer}>
              <Text style={styles.resultCountText}>
                <Text style={styles.resultCountHighlight}>
                  {t("menuScanResult.resultCountHighlight", {
                    count: data.totalMatchedCount,
                  })}
                </Text>
                {t("menuScanResult.resultCountSuffix")}
              </Text>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons
                name="search-outline"
                size={48}
                color={colors.textTertiary}
              />
              <Text style={styles.emptyText}>{t("menuScanResult.empty")}</Text>
            </View>
          }
          ListFooterComponent={
            hasUnmatched ? (
              <View style={styles.unmatchedSection}>
                <View style={styles.unmatchedDivider} />
                <Text style={styles.unmatchedTitle}>
                  {t("menuScanResult.unmatched.title", {
                    count: data.unmatchedWines.length,
                  })}
                </Text>
                <Text style={styles.unmatchedSubtitle}>
                  {t(
                    isLabel
                      ? "menuScanResult.unmatched.subtitleLabel"
                      : "menuScanResult.unmatched.subtitle"
                  )}
                </Text>
                {data.unmatchedWines.map((w, i) => (
                  <View key={i} style={styles.unmatchedItem}>
                    <Ionicons
                      name="wine-outline"
                      size={16}
                      color={colors.textTertiary}
                      style={{ marginRight: 10 }}
                    />
                    <Text style={styles.unmatchedText}>{w.rawText}</Text>
                  </View>
                ))}
              </View>
            ) : null
          }
        />
      </Animated.View>
      <ScanFeedbackSheet
        visible={showFeedback}
        onClose={() => setShowFeedback(false)}
        scanType={scanType}
      />

      {/* Wishlist toast */}
      {toastMessage && (
        <Animated.View
          style={[
            styles.toastContainer,
            {
              opacity: toastAnim,
              transform: [
                {
                  translateY: toastAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
              ],
            },
          ]}
          pointerEvents="none"
        >
          <Ionicons
            name="heart"
            size={16}
            color={accent.text}
            style={{ marginRight: 8 }}
          />
          <Text style={styles.toastText}>{toastMessage}</Text>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

// --- Styles -----------------------------------------------------------------

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  // ── Loading / Error states ───────────────────────────────────────────────
  stateContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  stateTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 8,
    lineHeight: 24,
  },
  stateSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  retryButton: {
    marginTop: 28,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: radius.pill,
    backgroundColor: accent.base,
  },
  retryButtonText: {
    color: accent.onAccent,
    fontWeight: "600",
    fontSize: 15,
  },
  // ── List ────────────────────────────────────────────────────────────────
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 48,
  },
  resultCountContainer: {
    paddingTop: 16,
    paddingBottom: 12,
  },
  resultCountText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  resultCountHighlight: {
    color: colors.white,
    fontWeight: "bold",
  },
  // ── Wine card ────────────────────────────────────────────────────────────
  wineCard: {
    backgroundColor: colors.surface1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  wineCardHighlight: {
    borderColor: accent.border,
    backgroundColor: accent.soft,
  },
  bestBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: accent.base,
    borderRadius: radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 10,
  },
  bestBadgeText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: "700",
  },
  wineCardRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  wineImageContainer: {
    width: 56,
    height: 64,
    borderRadius: 8,
    backgroundColor: colors.surface2,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
    overflow: "hidden",
    flexShrink: 0,
    alignSelf: "center",
  },
  wineImage: {
    width: "85%",
    height: "90%",
  },
  wineInfo: {
    flex: 1,
    gap: 3,
    justifyContent: "center",
  },
  sortBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  wineNameEng: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.white,
    lineHeight: 20,
  },
  wineNameKor: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  wineMeta: {
    fontSize: 11,
    color: colors.textTertiary,
  },
  // ── Score ring ───────────────────────────────────────────────────────────
  scoreRingWrapper: {
    width: 54,
    height: 54,
    marginLeft: 12,
    flexShrink: 0,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
  },
  scoreSvg: {
    position: "absolute",
    // rotate so the arc starts from the top (12 o'clock)
    transform: [{ rotate: "-90deg" }],
  },
  scoreCenter: {
    alignItems: "center",
    justifyContent: "center",
  },
  scorePercent: {
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 16,
  },
  scoreLabel: {
    fontSize: 9,
    fontWeight: "700",
  },
  // ── Empty ────────────────────────────────────────────────────────────────
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 52,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: "center",
  },
  // ── Unmatched section ────────────────────────────────────────────────────
  unmatchedSection: {
    marginTop: 8,
    paddingTop: 16,
  },
  unmatchedDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginBottom: 16,
  },
  unmatchedTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textSecondary,
    marginBottom: 4,
  },
  unmatchedSubtitle: {
    fontSize: 12,
    color: colors.textTertiary,
    marginBottom: 12,
  },
  unmatchedItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  unmatchedText: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
  },
  // ── Wishlist button ─────────────────────────────────────────────────────
  wishlistButton: {
    marginLeft: 8,
    padding: 4,
    flexShrink: 0,
    alignSelf: "center",
  },
  // ── Toast ────────────────────────────────────────────────────────────────
  toastContainer: {
    position: "absolute",
    bottom: 48,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface2,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  toastText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "600",
  },
});
