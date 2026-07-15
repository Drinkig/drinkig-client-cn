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
import { getWineTypeColor } from "../../constants/wineColors";
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
  const renderVerdict = (score: number) => {
    const tier = getScoreTier(score);
    return (
      <View style={styles.verdictSection}>
        <ScoreRing score={score} size={116} strokeWidth={8} />
        <Text style={[styles.verdictHeadline, { color: scoreColor(score) }]}>
          {t(`menuScanResult.verdict.${tier}`)}
        </Text>
        <Text style={styles.verdictCaption}>
          {t("menuScanResult.verdict.caption")}
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
      {renderVerdict(wine.flavorMatchScore)}
      {/* 와인 카드 칩 → 상세 */}
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.75}
        onPress={() => onOpenWineDetail(wine)}
      >
        <View style={styles.wineChipRow}>
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
          <TouchableOpacity
            style={styles.wishlistButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            onPress={(e) => {
              e.stopPropagation();
              onToggleWishlist(wine);
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
          <Ionicons
            name="chevron-forward"
            size={18}
            color={colors.textTertiary}
          />
        </View>
      </TouchableOpacity>
      {renderAxisCompare(wine.profile ?? null)}
    </>
  );

  const renderEstimatedHero = (item: UnmatchedWineDTO, est: AiEstimateDTO) => {
    const chips = [
      t(`menuScanResult.sortLabels.${est.sort}`),
      est.variety,
      est.country,
    ].filter(Boolean) as string[];
    return (
      <>
        {renderVerdict(est.flavorMatchScore)}
        <View style={styles.card}>
          <AiEstimateBadge confidence={est.confidence} />
          <Text style={styles.estimateName}>{item.rawText}</Text>
          {chips.length > 0 && (
            <View style={styles.chipRow}>
              {chips.map((chip, i) => (
                <View key={i} style={styles.metaChip}>
                  <Text style={styles.metaChipText}>{chip}</Text>
                </View>
              ))}
            </View>
          )}
          {!!est.reason && <Text style={styles.reasonText}>{est.reason}</Text>}
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
  // ── Verdict (판정 헤드라인) ─────────────────────────────────────────────
  verdictSection: {
    alignItems: "center",
    paddingVertical: 20,
  },
  verdictHeadline: {
    marginTop: 16,
    fontSize: 22,
    fontWeight: "800",
  },
  verdictCaption: {
    marginTop: 6,
    fontSize: 13,
    color: colors.textSecondary,
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
  // ── Matched wine chip ────────────────────────────────────────────────────
  wineChipRow: {
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
  wineInfo: {
    flex: 1,
    gap: 3,
    justifyContent: "center",
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
  wishlistButton: {
    marginLeft: 8,
    padding: 4,
    flexShrink: 0,
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
    marginTop: 10,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 19,
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
