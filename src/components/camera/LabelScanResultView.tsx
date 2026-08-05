import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useTranslation } from "react-i18next";
import Ionicons from "react-native-vector-icons/Ionicons";
import { colors } from "../../constants/colors";
import { radius, surfaces } from "../../constants/theme";
import {
  getWinePlaceholderImage,
  getWineTypeColor,
} from "../../constants/wineColors";
import { formatOrigin } from "../../utils/wineUtils";
import { FlavorProfile } from "../onboarding/FlavorProfileStep";
import {
  AiEstimateDTO,
  MenuScanResultDTO,
  ScannedWineItemDTO,
  UnmatchedWineDTO,
} from "../../api/scan";
import ScoreRing, { getScoreTier, scoreColor } from "./ScoreRing";
import FlavorAxisCompare from "./FlavorAxisCompare";
import AiEstimateBadge from "./AiEstimateBadge";
import WineRequestButton from "./WineRequestButton";

// --- Entry model --------------------------------------------------------------
// 라벨 스캔에서도 여러 항목이 인식될 수 있어, 매칭/AI추정/미상 항목을 하나의
// 목록으로 통합해 최고 점수 항목을 히어로로 올린다.

type LabelEntry =
  | { kind: "matched"; wine: ScannedWineItemDTO; score: number }
  | {
      kind: "estimated";
      item: UnmatchedWineDTO;
      estimate: AiEstimateDTO;
      score: number;
    }
  | { kind: "unknown"; item: UnmatchedWineDTO };

interface LabelScanResultViewProps {
  data: MenuScanResultDTO;
  userProfile: FlavorProfile | null;
  wishedIds: Set<number>;
  onToggleWishlist: (wine: ScannedWineItemDTO) => void;
  onOpenWineDetail: (wine: ScannedWineItemDTO) => void;
  requestedTexts: Set<string>;
  requestingText: string | null;
  onRequestWine: (item: UnmatchedWineDTO) => void;
}

const estimateToProfile = (est: AiEstimateDTO): Partial<FlavorProfile> => ({
  sweetness: est.sweetness,
  acidity: est.acidity,
  tannin: est.tannin,
  body: est.body,
  alcohol: est.alcohol,
});

export default function LabelScanResultView({
  data,
  userProfile,
  wishedIds,
  onToggleWishlist,
  onOpenWineDetail,
  requestedTexts,
  requestingText,
  onRequestWine,
}: LabelScanResultViewProps) {
  const { t } = useTranslation();
  const [othersExpanded, setOthersExpanded] = useState(false);

  const entries = useMemo<LabelEntry[]>(() => {
    const scored: Exclude<LabelEntry, { kind: "unknown" }>[] = [
      ...data.matchedWines.map((wine) => ({
        kind: "matched" as const,
        wine,
        score: wine.flavorMatchScore,
      })),
      ...data.unmatchedWines
        .filter(
          (item): item is UnmatchedWineDTO & { aiEstimate: AiEstimateDTO } =>
            !!item.aiEstimate
        )
        .map((item) => ({
          kind: "estimated" as const,
          item,
          estimate: item.aiEstimate,
          score: item.aiEstimate.flavorMatchScore,
        })),
    ];
    // DB 매칭이 AI 추정보다 신뢰도가 높으므로 동점이면 매칭을 앞에 둔다
    scored.sort((a, b) => {
      const scoreDiff = b.score - a.score;
      if (scoreDiff !== 0) return scoreDiff;
      return a.kind === "matched" ? -1 : b.kind === "matched" ? 1 : 0;
    });
    const unknown: LabelEntry[] = data.unmatchedWines
      .filter((item) => !item.aiEstimate)
      .map((item) => ({ kind: "unknown" as const, item }));
    return [...scored, ...unknown];
  }, [data]);

  if (entries.length === 0) return null;

  const hero = entries[0];
  const others = entries.slice(1);

  // ----- Hero render -----
  // 큰 중앙 링이 화면을 과하게 차지해, 히어로 헤더 우측에 얹는 소형 링으로 대체.
  const renderCompactScore = (score: number) => {
    const tier = getScoreTier(score);
    return (
      <View style={styles.compactScore}>
        <ScoreRing score={score} size={52} strokeWidth={5} />
        <Text
          style={[styles.compactTier, { color: scoreColor(score) }]}
          numberOfLines={1}
        >
          {t(`menuScanResult.verdict.${tier}`)}
        </Text>
      </View>
    );
  };

  const renderAxisCompare = (wineProfile: Partial<FlavorProfile> | null) => {
    // 유저 취향 미설정이거나 서버가 아직 프로파일을 안 주면(미배포) 생략 → 폴백
    if (!userProfile || !wineProfile) return null;
    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          {t("menuScanResult.flavorCompare.title")}
        </Text>
        <FlavorAxisCompare
          userProfile={userProfile}
          wineProfile={wineProfile}
        />
      </View>
    );
  };

  const renderMatchedHero = (wine: ScannedWineItemDTO) => (
    <>
      <View style={styles.card}>
        {/* 헤더: 이미지 + 영/한 이름 + 소형 점수 */}
        <View style={styles.heroHeader}>
          <View style={styles.wineImageContainer}>
            <Image
              source={
                wine.imageUrl
                  ? { uri: wine.imageUrl }
                  : getWinePlaceholderImage(wine.sort)
              }
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
          <View style={styles.heroTitleCol}>
            <Text style={styles.heroNameEng} numberOfLines={2}>
              {wine.nameEng || wine.nameKor}
            </Text>
            {!!wine.nameKor && (
              <Text style={styles.heroNameKor} numberOfLines={1}>
                {wine.nameKor}
              </Text>
            )}
            <Text style={styles.heroMeta} numberOfLines={1}>
              {[formatOrigin(wine.country, wine.region), wine.variety]
                .filter(Boolean)
                .join(" · ")}
            </Text>
          </View>
          {renderCompactScore(wine.flavorMatchScore)}
        </View>

        {/* 액션: 찜 / 상세 보기 */}
        <View style={styles.heroActions}>
          <TouchableOpacity
            style={styles.heroActionButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            onPress={() => onToggleWishlist(wine)}
          >
            <Ionicons
              name={wishedIds.has(wine.wineId) ? "heart" : "heart-outline"}
              size={18}
              color={
                wishedIds.has(wine.wineId) ? colors.error : colors.textSecondary
              }
            />
            <Text style={styles.heroActionText}>
              {t("menuScanResult.label.wishlist")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.heroDetailButton}
            activeOpacity={0.75}
            onPress={() => onOpenWineDetail(wine)}
          >
            <Text style={styles.heroDetailText}>
              {t("menuScanResult.label.detail")}
            </Text>
            <Ionicons name="chevron-forward" size={16} color={colors.white} />
          </TouchableOpacity>
        </View>
      </View>
      {renderAxisCompare(wine.profile ?? null)}
    </>
  );

  const renderEstimatedHero = (item: UnmatchedWineDTO, est: AiEstimateDTO) => {
    const chips = [
      t(`menuScanResult.sortLabels.${est.sort}`),
      est.variety,
      est.country,
    ].filter(Boolean) as string[];
    const nameEng = est.nameEng || item.rawText;
    return (
      <>
        <View style={styles.card}>
          {/* 헤더: 영/한 이름 + 소형 점수 */}
          <View style={styles.heroHeader}>
            <View style={styles.heroTitleCol}>
              <Text style={styles.heroNameEng} numberOfLines={2}>
                {nameEng}
              </Text>
              {!!est.nameKor && (
                <Text style={styles.heroNameKor} numberOfLines={1}>
                  {est.nameKor}
                </Text>
              )}
            </View>
            {renderCompactScore(est.flavorMatchScore)}
          </View>

          {/* 타입/품종/국가 칩 + AI 추정 배지 */}
          <View style={styles.chipRow}>
            <AiEstimateBadge confidence={est.confidence} />
            {chips.map((chip, i) => (
              <View key={i} style={styles.metaChip}>
                <Text style={styles.metaChipText}>{chip}</Text>
              </View>
            ))}
          </View>

          {/* 와인 설명 (한두 줄) */}
          {!!est.description && (
            <Text style={styles.descText}>{est.description}</Text>
          )}

          {/* 내 취향과의 궁합 */}
          {!!est.reason && (
            <View style={styles.matchBlock}>
              <Text style={styles.matchLabel}>
                {t("menuScanResult.matchTitle")}
              </Text>
              <Text style={styles.reasonText}>{est.reason}</Text>
            </View>
          )}

          <View style={styles.requestCtaContainer}>
            <WineRequestButton
              large
              requested={requestedTexts.has(item.rawText)}
              requesting={requestingText === item.rawText}
              onPress={() => onRequestWine(item)}
            />
          </View>
        </View>
        {renderAxisCompare(estimateToProfile(est))}
      </>
    );
  };

  const renderUnknownHero = (item: UnmatchedWineDTO) => (
    <View style={styles.card}>
      <View style={styles.unknownHeroIcon}>
        <Ionicons name="wine-outline" size={28} color={colors.textTertiary} />
      </View>
      <Text style={[styles.estimateName, styles.unknownHeroName]}>
        {item.rawText}
      </Text>
      <Text style={[styles.reasonText, styles.unknownHeroDesc]}>
        {t("menuScanResult.unmatched.subtitleLabel")}
      </Text>
      <View style={styles.requestCtaContainer}>
        <WineRequestButton
          large
          requested={requestedTexts.has(item.rawText)}
          requesting={requestingText === item.rawText}
          onPress={() => onRequestWine(item)}
        />
      </View>
    </View>
  );

  // ----- Others (접힌 리스트) -----
  const renderOtherRow = (entry: LabelEntry, index: number) => {
    if (entry.kind === "matched") {
      return (
        <TouchableOpacity
          key={`m-${entry.wine.wineId}-${index}`}
          style={styles.otherRow}
          activeOpacity={0.75}
          onPress={() => onOpenWineDetail(entry.wine)}
        >
          <View style={styles.otherInfo}>
            <Text style={styles.otherName} numberOfLines={1}>
              {entry.wine.nameEng || entry.wine.nameKor}
            </Text>
            <Text style={styles.otherMeta} numberOfLines={1}>
              {formatOrigin(entry.wine.country, entry.wine.region)}
            </Text>
          </View>
          <Text style={[styles.otherScore, { color: scoreColor(entry.score) }]}>
            {entry.score}%
          </Text>
          <Ionicons
            name="chevron-forward"
            size={16}
            color={colors.textTertiary}
          />
        </TouchableOpacity>
      );
    }
    if (entry.kind === "estimated") {
      return (
        <View key={`e-${index}`} style={styles.otherRow}>
          <View style={styles.otherInfo}>
            <Text style={styles.otherName} numberOfLines={1}>
              {entry.item.rawText}
            </Text>
            <AiEstimateBadge confidence={entry.estimate.confidence} />
          </View>
          <Text style={[styles.otherScore, { color: scoreColor(entry.score) }]}>
            {entry.score}%
          </Text>
          <WineRequestButton
            requested={requestedTexts.has(entry.item.rawText)}
            requesting={requestingText === entry.item.rawText}
            onPress={() => onRequestWine(entry.item)}
          />
        </View>
      );
    }
    return (
      <View key={`u-${index}`} style={styles.otherRow}>
        <View style={styles.otherInfo}>
          <Text style={styles.otherName} numberOfLines={1}>
            {entry.item.rawText}
          </Text>
        </View>
        <WineRequestButton
          requested={requestedTexts.has(entry.item.rawText)}
          requesting={requestingText === entry.item.rawText}
          onPress={() => onRequestWine(entry.item)}
        />
      </View>
    );
  };

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      // iOS는 기본(automatic)으로 safe-area 인셋을 contentInset(=평행이동)으로
      // 적용한다. 실기기의 다이나믹 아일랜드 가로 폭이 수평 인셋으로 잡혀 스크롤
      // 콘텐츠가 통째로 오른쪽으로 밀리는 문제가 있어, 상위 SafeAreaView가 이미
      // top 인셋을 처리하므로 여기선 자동 조정을 끈다. (앱은 Portrait 고정)
      contentInsetAdjustmentBehavior="never"
      automaticallyAdjustsScrollIndicatorInsets={false}
    >
      {hero.kind === "matched" && renderMatchedHero(hero.wine)}
      {hero.kind === "estimated" &&
        renderEstimatedHero(hero.item, hero.estimate)}
      {hero.kind === "unknown" && renderUnknownHero(hero.item)}

      {others.length > 0 && (
        <View style={styles.othersSection}>
          <TouchableOpacity
            style={styles.othersToggle}
            activeOpacity={0.75}
            onPress={() => setOthersExpanded((v) => !v)}
          >
            <Text style={styles.othersToggleText}>
              {t("menuScanResult.label.others", { count: others.length })}
            </Text>
            <Ionicons
              name={othersExpanded ? "chevron-up" : "chevron-down"}
              size={18}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
          {othersExpanded && (
            <View style={styles.othersList}>{others.map(renderOtherRow)}</View>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 48,
  },
  // ── Cards ────────────────────────────────────────────────────────────────
  card: {
    backgroundColor: colors.surface1,
    borderRadius: radius.md,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 12,
  },
  // ── Hero header (이름 + 소형 점수) ────────────────────────────────────────
  heroHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  heroTitleCol: {
    flex: 1,
    gap: 3,
    justifyContent: "center",
  },
  heroNameEng: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.white,
    lineHeight: 24,
  },
  heroNameKor: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  heroMeta: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 2,
  },
  // ── Compact score (소형 링 + 티어) ───────────────────────────────────────
  compactScore: {
    alignItems: "center",
    gap: 4,
    flexShrink: 0,
    width: 60,
  },
  compactTier: {
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },
  // ── Matched hero image ───────────────────────────────────────────────────
  wineImageContainer: {
    width: 52,
    height: 60,
    borderRadius: 8,
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
  sortBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  // ── Matched hero actions ─────────────────────────────────────────────────
  heroActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  heroActionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  heroActionText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  heroDetailButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  heroDetailText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.white,
  },
  // ── Description / taste-match ─────────────────────────────────────────────
  descText: {
    marginTop: 14,
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 21,
  },
  matchBlock: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  matchLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textSecondary,
    marginBottom: 6,
  },
  // ── Estimated / unknown hero ────────────────────────────────────────────
  estimateName: {
    marginTop: 10,
    fontSize: 17,
    fontWeight: "700",
    color: colors.textPrimary,
    lineHeight: 23,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 10,
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
  reasonText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 21,
  },
  requestCtaContainer: {
    marginTop: 14,
  },
  unknownHeroIcon: {
    alignSelf: "center",
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surface2,
    alignItems: "center",
    justifyContent: "center",
  },
  unknownHeroName: {
    textAlign: "center",
  },
  unknownHeroDesc: {
    marginTop: 10,
    textAlign: "center",
  },
  // ── Others (접힌 리스트) ─────────────────────────────────────────────────
  othersSection: {
    marginTop: 4,
  },
  othersToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  othersToggleText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  othersList: {
    gap: 4,
  },
  otherRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.surface1,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  otherInfo: {
    flex: 1,
    gap: 4,
  },
  otherName: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  otherMeta: {
    fontSize: 11,
    color: colors.textTertiary,
  },
  otherScore: {
    fontSize: 13,
    fontWeight: "800",
  },
});
