import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  SectionList,
  TouchableOpacity,
  StatusBar,
  Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import Ionicons from "react-native-vector-icons/Ionicons";
import { colors } from "../constants/colors";
import { radius, accent, surfaces } from "../constants/theme";
import { getWineTypeColor } from "../constants/wineColors";
import { useTranslation } from "react-i18next";
import { incrementScanCount } from "./CameraScreen";
import { useSubscription } from "../context/SubscriptionContext";
import { useUser } from "../context/UserContext";
import ScanFeedbackSheet from "../components/common/ScanFeedbackSheet";
import GlassHeader from "../components/common/GlassHeader";
import { addToWishlist, removeFromWishlist } from "../api/wine";
import {
  scanWineImage,
  requestWineFromScan,
  toScanLang,
  AiEstimateDTO,
  MenuScanResultDTO,
  ScannedWineItemDTO,
  UnmatchedWineDTO,
} from "../api/scan";
import { getErrorMessageKey } from "../utils/apiError";
import { formatOrigin } from "../utils/wineUtils";
import ScoreRing, {
  getScoreTier,
  ScoreTier,
} from "../components/camera/ScoreRing";
import AiEstimateBadge from "../components/camera/AiEstimateBadge";
import WineRequestButton from "../components/camera/WineRequestButton";
import LabelScanResultView from "../components/camera/LabelScanResultView";
import AnalyzingOverlay from "../components/common/AnalyzingOverlay";

// --- Section model ------------------------------------------------------------
// 메뉴판 결과는 점수순 단일 리스트 대신 "잘 맞아요/무난해요/도전" 그룹 섹션으로
// 나눈다. AI 추정 항목도 점수에 따라 같은 그룹에 편입한다.

type MenuEntry =
  | { kind: "matched"; wine: ScannedWineItemDTO; score: number }
  | {
      kind: "estimated";
      item: UnmatchedWineDTO;
      estimate: AiEstimateDTO;
      score: number;
    }
  | { kind: "unknown"; item: UnmatchedWineDTO };

interface MenuSection {
  key: string;
  title: string;
  subtitle?: string;
  dotColor: string | null;
  data: MenuEntry[];
}

// --- Main Screen ------------------------------------------------------------

type Props = NativeStackScreenProps<any, "MenuScanResult">;

export default function MenuScanResultScreen({ route, navigation }: Props) {
  const { imageUri, scanType = "list" } = route.params as {
    imageUri: string;
    scanType?: "label" | "list";
  };
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const { isPremium } = useSubscription();
  const { flavorProfile } = useUser();
  // 라벨/메뉴판 스캔이 한 화면을 공유하므로 scanType에 맞춰 뷰를 분기한다.
  const isLabel = scanType === "label";
  const headerTitle = t(
    isLabel ? "menuScanResult.headerLabel" : "menuScanResult.header"
  );
  const [loading, setLoading] = useState(true);
  // 분석 연출(AnalyzingOverlay)이 100%에 도달해 끝날 때까지는 결과/에러를 감춘다.
  // 온보딩/추천 결과 로딩과 동일한 연출을 위해 loading과 분리해서 관리한다.
  const [analyzeDone, setAnalyzeDone] = useState(false);
  const [data, setData] = useState<MenuScanResultDTO | null>(null);
  const [error, setError] = useState<string | null>(null);
  // 한도 초과(429) 에러에서는 "차감 안 됨" 안내가 오히려 혼란이라 구분한다
  const [isLimitError, setIsLimitError] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [wishedIds, setWishedIds] = useState<Set<number>>(new Set());
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  // 등록 요청 상태 — rawText 기준으로 중복 요청을 막는다
  const [requestedTexts, setRequestedTexts] = useState<Set<string>>(new Set());
  const [requestingText, setRequestingText] = useState<string | null>(null);
  // AI 추정 카드 인라인 확장 상태 (메뉴판 리스트)
  const [expandedTexts, setExpandedTexts] = useState<Set<string>>(new Set());

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const toastAnim = useRef(new Animated.Value(0)).current;

  // Call the API
  useEffect(() => {
    let cancelled = false;
    let feedbackTimer: ReturnType<typeof setTimeout> | null = null;
    // 사용자가 로딩 중 화면을 떠나면 최대 60초짜리 업로드/OCR 요청도 끊는다
    const abortController = new AbortController();
    const scanMenu = async () => {
      try {
        const response = await scanWineImage({
          imageUri,
          scanType,
          // AI 추정 reason 등 서버 생성 문구가 UI 언어로 오도록 lang 전달
          lang: toScanLang(i18n.language),
          signal: abortController.signal,
        });

        if (cancelled) return;
        const scanResult = response.result;
        setData(scanResult);
        // 서버가 스캔 성공 시 횟수를 차감한다(인식 실패/네트워크 오류는 차감 없음).
        // 로컬 카운트는 /scan/remaining 조회 실패 시 폴백 표시용 — 서버와 동일하게
        // 와인을 하나도 추출 못 한 스캔은 세지 않는다.
        if (
          scanResult.totalMatchedCount > 0 ||
          (scanResult.unmatchedWines?.length ?? 0) > 0
        ) {
          await incrementScanCount();
        }
        if (cancelled) return;
        feedbackTimer = setTimeout(() => setShowFeedback(true), 2000);
      } catch (e: any) {
        if (cancelled) return;
        const status = e?.response?.status;
        let msg: string;
        if (status === 429) {
          setIsLimitError(true);
          msg = t("menuScanResult.error.limitReached");
        } else if (status === 413) {
          // nginx 등 게이트웨이 업로드 용량 제한 초과. "더 또렷하게 찍으세요"는
          // 오해를 부르므로 용량 문제임을 별도로 안내한다.
          msg = t("menuScanResult.error.tooLarge");
        } else if (
          !e?.response ||
          e?.code === "ECONNABORTED" ||
          status >= 500
        ) {
          // 오프라인/타임아웃/서버 오류를 "인식 실패"로 뭉개면 사용자가
          // 사진 탓을 하며 재촬영을 반복하게 된다 (§7 413 사건과 동일 패턴)
          msg = t(getErrorMessageKey(e));
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
      abortController.abort();
      if (feedbackTimer) clearTimeout(feedbackTimer);
    };
  }, [imageUri, scanType, t, i18n.language, fadeAnim]);

  // ----- Toast -----
  const showToast = useCallback(
    (message: string) => {
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
    },
    [toastAnim]
  );

  // ----- Wishlist toggle -----
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
        // Rollback — 무통보로 하트만 원복하면 "탭이 씹혔나?"로 읽히므로 안내
        setWishedIds((prev) => {
          const next = new Set(prev);
          if (wasWished) next.add(wine.wineId);
          else next.delete(wine.wineId);
          return next;
        });
        showToast(t("menuScanResult.wishlist.failed"));
      }
    },
    [wishedIds, showToast, t]
  );

  // ----- 등록 요청 (미매칭 와인) -----
  const handleRequestWine = useCallback(
    async (item: UnmatchedWineDTO) => {
      if (requestedTexts.has(item.rawText) || requestingText) return;
      setRequestingText(item.rawText);
      try {
        const response = await requestWineFromScan(item);
        if (response.isSuccess) {
          setRequestedTexts((prev) => new Set(prev).add(item.rawText));
          showToast(t("menuScanResult.request.success"));
        } else {
          showToast(response.message || t("menuScanResult.request.failed"));
        }
      } catch {
        showToast(t("menuScanResult.request.failed"));
      } finally {
        setRequestingText(null);
      }
    },
    [requestedTexts, requestingText, showToast, t]
  );

  const handleOpenWineDetail = useCallback(
    (wine: ScannedWineItemDTO) => {
      navigation.navigate("WineDetail", {
        wine: {
          id: wine.wineId,
          nameKor: wine.nameKor,
          nameEng: wine.nameEng,
          type: wine.sort,
          country: wine.country,
          grape: wine.variety,
          imageUri: wine.imageUrl ?? undefined,
        },
      });
    },
    [navigation]
  );

  // ----- 메뉴판 그룹 섹션 구성 -----
  const sections = useMemo<MenuSection[]>(() => {
    if (!data || isLabel) return [];
    const groups: Record<ScoreTier, Exclude<MenuEntry, { kind: "unknown" }>[]> =
      {
        great: [],
        okay: [],
        challenge: [],
      };
    data.matchedWines.forEach((wine) => {
      groups[getScoreTier(wine.flavorMatchScore)].push({
        kind: "matched",
        wine,
        score: wine.flavorMatchScore,
      });
    });
    (data.unmatchedWines ?? []).forEach((item) => {
      // 서버 미배포 등으로 aiEstimate가 없으면 기존처럼 하단 섹션으로 폴백
      if (!item.aiEstimate) return;
      groups[getScoreTier(item.aiEstimate.flavorMatchScore)].push({
        kind: "estimated",
        item,
        estimate: item.aiEstimate,
        score: item.aiEstimate.flavorMatchScore,
      });
    });

    const built: MenuSection[] = [];
    (["great", "okay", "challenge"] as ScoreTier[]).forEach((tier) => {
      const entries = groups[tier].sort((a, b) => b.score - a.score);
      if (entries.length > 0) {
        built.push({
          key: tier,
          title: t(`menuScanResult.group.${tier}`),
          dotColor:
            tier === "great"
              ? colors.success
              : tier === "okay"
              ? colors.warning
              : colors.textTertiary,
          data: entries,
        });
      }
    });

    const unknown: MenuEntry[] = (data.unmatchedWines ?? [])
      .filter((item) => !item.aiEstimate)
      .map((item) => ({ kind: "unknown" as const, item }));
    if (unknown.length > 0) {
      built.push({
        key: "unknown",
        title: t("menuScanResult.group.unknown"),
        subtitle: t("menuScanResult.unmatched.subtitle"),
        dotColor: null,
        data: unknown,
      });
    }
    return built;
  }, [data, isLabel, t]);

  const toggleExpanded = useCallback((rawText: string) => {
    setExpandedTexts((prev) => {
      const next = new Set(prev);
      if (next.has(rawText)) next.delete(rawText);
      else next.add(rawText);
      return next;
    });
  }, []);

  // ----- Render helpers (메뉴판 리스트) -----

  const renderMatchedCard = (wine: ScannedWineItemDTO) => {
    const isBest = wine.flavorMatchScore >= 80;
    return (
      <TouchableOpacity
        style={[styles.wineCard, isBest && styles.wineCardHighlight]}
        activeOpacity={0.75}
        onPress={() => handleOpenWineDetail(wine)}
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
          {wine.imageUrl ? (
            <View style={styles.wineImageContainer}>
              <Image
                source={{ uri: wine.imageUrl }}
                style={styles.wineImage}
                resizeMode="contain"
              />
              <View
                style={[
                  styles.sortBar,
                  { backgroundColor: getWineTypeColor(wine.sort) },
                ]}
              />
            </View>
          ) : null}

          {/* Wine info */}
          <View style={styles.wineInfo}>
            <Text style={styles.wineNameEng} numberOfLines={2}>
              {wine.nameEng}
            </Text>
            <Text style={styles.wineNameKor} numberOfLines={1}>
              {wine.nameKor}
            </Text>
            <Text style={styles.wineMeta} numberOfLines={1}>
              {[formatOrigin(wine.country, wine.region), wine.variety]
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
              handleToggleWishlist(wine);
            }}
          >
            <Ionicons
              name={wishedIds.has(wine.wineId) ? "heart" : "heart-outline"}
              size={22}
              color={
                wishedIds.has(wine.wineId) ? colors.error : colors.textTertiary
              }
            />
          </TouchableOpacity>

          {/* Score */}
          <View style={styles.scoreRingSpacing}>
            <ScoreRing score={wine.flavorMatchScore} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEstimatedCard = (item: UnmatchedWineDTO, est: AiEstimateDTO) => {
    const expanded = expandedTexts.has(item.rawText);
    const chips = [
      t(`menuScanResult.sortLabels.${est.sort}`),
      est.variety,
      est.country,
    ].filter(Boolean) as string[];
    return (
      <TouchableOpacity
        style={styles.wineCard}
        activeOpacity={0.75}
        onPress={() => toggleExpanded(item.rawText)}
      >
        <View style={styles.wineCardRow}>
          <View style={styles.wineInfo}>
            <AiEstimateBadge confidence={est.confidence} />
            <Text style={styles.estimatedName} numberOfLines={2}>
              {item.rawText}
            </Text>
            {!!est.reason && (
              <Text
                style={styles.estimatedReason}
                numberOfLines={expanded ? undefined : 2}
              >
                {est.reason}
              </Text>
            )}
          </View>
          <View style={styles.scoreRingSpacing}>
            <ScoreRing score={est.flavorMatchScore} />
          </View>
        </View>
        {/* 탭 → 상세 이동 대신 간이 정보 + 등록 요청 CTA 인라인 확장 */}
        {expanded && (
          <View style={styles.estimatedExpanded}>
            {chips.length > 0 && (
              <View style={styles.chipRow}>
                {chips.map((chip, i) => (
                  <View key={i} style={styles.metaChip}>
                    <Text style={styles.metaChipText}>{chip}</Text>
                  </View>
                ))}
              </View>
            )}
            <WineRequestButton
              requested={requestedTexts.has(item.rawText)}
              requesting={requestingText === item.rawText}
              onPress={() => handleRequestWine(item)}
            />
          </View>
        )}
        <View style={styles.expandIndicator}>
          <Ionicons
            name={expanded ? "chevron-up" : "chevron-down"}
            size={14}
            color={colors.textTertiary}
          />
        </View>
      </TouchableOpacity>
    );
  };

  const renderUnknownRow = (item: UnmatchedWineDTO) => (
    <View style={styles.unmatchedItem}>
      <Ionicons
        name="wine-outline"
        size={16}
        color={colors.textTertiary}
        style={styles.unmatchedIcon}
      />
      <Text style={styles.unmatchedText} numberOfLines={2}>
        {item.rawText}
      </Text>
      <WineRequestButton
        requested={requestedTexts.has(item.rawText)}
        requesting={requestingText === item.rawText}
        onPress={() => handleRequestWine(item)}
      />
    </View>
  );

  const renderEntry = ({ item }: { item: MenuEntry }) => {
    if (item.kind === "matched") return renderMatchedCard(item.wine);
    if (item.kind === "estimated")
      return renderEstimatedCard(item.item, item.estimate);
    return renderUnknownRow(item.item);
  };

  const renderSectionHeader = ({ section }: { section: MenuSection }) => (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionTitleRow}>
        {section.dotColor && (
          <View
            style={[styles.sectionDot, { backgroundColor: section.dotColor }]}
          />
        )}
        <Text style={styles.sectionTitle}>{section.title}</Text>
        <Text style={styles.sectionCount}>{section.data.length}</Text>
      </View>
      {!!section.subtitle && (
        <Text style={styles.sectionSubtitle}>{section.subtitle}</Text>
      )}
    </View>
  );

  const renderBackButton = () => (
    <TouchableOpacity
      onPress={() => navigation.goBack()}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Ionicons name="arrow-back" size={22} color={colors.white} />
    </TouchableOpacity>
  );

  // ----- Loading state -----
  // 온보딩/추천 결과와 동일한 분석 연출. 데이터가 먼저 와도 연출이 100%에
  // 도달(onDone)한 뒤에만 결과/에러로 넘어간다.
  if (!analyzeDone) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar
          barStyle="light-content"
          backgroundColor={colors.background}
        />
        <AnalyzingOverlay
          messages={[
            t(
              isLabel
                ? "menuScanResult.loading.titleLabel"
                : "menuScanResult.loading.title"
            ),
            t("menuScanResult.loading.subtitle"),
            t("menuScanResult.loading.ready"),
          ]}
          complete={!loading}
          onDone={() => setAnalyzeDone(true)}
        />
      </View>
    );
  }

  // ----- Error state -----
  const isEmptyResult =
    !!data &&
    data.matchedWines.length === 0 &&
    (data.unmatchedWines?.length ?? 0) === 0;

  // NativeSafeAreaView(=SafeAreaView 컴포넌트)는 인셋을 네이티브 패딩으로 늦게
  // 적용해, 이 화면처럼 분석 연출 이후 조건부로 늦게 마운트되면 첫 프레임이
  // top 인셋 0으로 깨져 나오고(다이나믹 아일랜드 겹침) 다음 리렌더에야 보정된다.
  // JS 컨텍스트를 동기로 읽는 useSafeAreaInsets로 첫 프레임부터 규격을 맞춘다.
  const safeAreaPad = {
    paddingTop: insets.top,
    paddingLeft: insets.left,
    paddingRight: insets.right,
  };

  if (error || !data || isEmptyResult) {
    return (
      <View style={[styles.safeArea, safeAreaPad]}>
        <StatusBar
          barStyle="light-content"
          backgroundColor={colors.background}
        />
        <GlassHeader
          floating={false}
          title={headerTitle}
          left={renderBackButton()}
        />
        <View style={styles.stateContainer}>
          <Ionicons
            name={isEmptyResult ? "search-outline" : "alert-circle-outline"}
            size={52}
            color={isEmptyResult ? colors.textTertiary : colors.error}
            style={styles.stateIcon}
          />
          <Text style={[styles.stateTitle, styles.stateTitleCenter]}>
            {isEmptyResult
              ? t("menuScanResult.empty")
              : error ?? t("menuScanResult.error.unknown")}
          </Text>
          {!isPremium && !isLimitError && !isEmptyResult && (
            <Text style={styles.quotaNotice}>
              {t("menuScanResult.error.quotaNotConsumed")}
            </Text>
          )}
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => navigation.replace("Camera", { scanType })}
          >
            <Text style={styles.retryButtonText}>
              {t("menuScanResult.error.rescan")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.goBackButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.goBackButtonText}>
              {t("menuScanResult.error.goBack")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ----- Result state -----
  return (
    <View style={[styles.safeArea, safeAreaPad]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <Animated.View style={[styles.flex, { opacity: fadeAnim }]}>
        {/* Header */}
        <GlassHeader
          floating={false}
          title={headerTitle}
          left={renderBackButton()}
        />

        {isLabel ? (
          // 라벨 스캔: 단일 와인 히어로형 (판정 헤드라인 + 5축 비교)
          <LabelScanResultView
            data={data}
            userProfile={flavorProfile}
            wishedIds={wishedIds}
            onToggleWishlist={handleToggleWishlist}
            onOpenWineDetail={handleOpenWineDetail}
            requestedTexts={requestedTexts}
            requestingText={requestingText}
            onRequestWine={handleRequestWine}
          />
        ) : (
          // 메뉴판 스캔: 궁합 그룹 섹션 리스트
          <SectionList
            sections={sections}
            keyExtractor={(item, index) =>
              item.kind === "matched"
                ? `m-${item.wine.wineId}-${index}`
                : `${item.kind}-${item.item.rawText}-${index}`
            }
            renderItem={renderEntry}
            renderSectionHeader={renderSectionHeader}
            stickySectionHeadersEnabled={false}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            // 라벨 스캔과 동일: 실기기에서 다이나믹 아일랜드 가로 인셋이
            // contentInset으로 잡혀 콘텐츠가 오른쪽으로 밀리는 것 방지.
            contentInsetAdjustmentBehavior="never"
            automaticallyAdjustsScrollIndicatorInsets={false}
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
          />
        )}
      </Animated.View>
      <ScanFeedbackSheet
        visible={showFeedback}
        onClose={() => setShowFeedback(false)}
        scanType={scanType}
      />

      {/* Toast (wishlist / 등록 요청) */}
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
          <Text style={styles.toastText}>{toastMessage}</Text>
        </Animated.View>
      )}
    </View>
  );
}

// --- Styles -----------------------------------------------------------------

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  // 분석 연출(AnalyzingOverlay)은 absoluteFill + 자체 배경이라 flex 컨테이너만 감싼다.
  loadingContainer: {
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
  stateIcon: {
    marginBottom: 16,
  },
  stateTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 8,
    lineHeight: 24,
  },
  stateTitleCenter: {
    textAlign: "center",
  },
  stateSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  quotaNotice: {
    marginTop: 10,
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 18,
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
  goBackButton: {
    marginTop: 12,
    paddingHorizontal: 32,
    paddingVertical: 12,
  },
  goBackButtonText: {
    color: colors.textSecondary,
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
    paddingBottom: 4,
  },
  resultCountText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  resultCountHighlight: {
    color: colors.white,
    fontWeight: "bold",
  },
  // ── Section header ───────────────────────────────────────────────────────
  sectionHeader: {
    paddingTop: 20,
    paddingBottom: 10,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  sectionCount: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textTertiary,
  },
  sectionSubtitle: {
    marginTop: 4,
    fontSize: 12,
    color: colors.textTertiary,
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
    backgroundColor: surfaces.imageWell,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
    overflow: "hidden",
    flexShrink: 0,
    alignSelf: "center",
  },
  wineImage: {
    width: "100%",
    height: "100%",
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
  scoreRingSpacing: {
    marginLeft: 12,
    alignSelf: "center",
  },
  // ── Estimated (AI 추정) card ─────────────────────────────────────────────
  estimatedName: {
    marginTop: 6,
    fontSize: 15,
    fontWeight: "600",
    color: colors.textPrimary,
    lineHeight: 20,
  },
  estimatedReason: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 17,
  },
  estimatedExpanded: {
    marginTop: 12,
    gap: 12,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  metaChip: {
    backgroundColor: colors.surface2,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  metaChipText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  expandIndicator: {
    alignItems: "center",
    marginTop: 6,
  },
  // ── Unknown (정보 없음) row ──────────────────────────────────────────────
  unmatchedItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  unmatchedIcon: {
    flexShrink: 0,
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
    shadowColor: colors.black,
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
