import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
} from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import Icon from "react-native-vector-icons/Ionicons";
import { useTranslation } from "react-i18next";
import { WineDBItem } from "../../types/Wine";
import WineImage from "../common/WineImage";
import Skeleton from "../common/Skeleton";
import { colors } from "../../constants/colors";
import { spacing, radius, surfaces } from "../../constants/theme";

const SKELETON_CARD_COUNT = 3;

interface RecommendedSectionProps {
  data: WineDBItem[];
  title: string;
  /** true면 스켈레톤 카드 노출 (로딩 중과 "진짜 0건"을 구분) */
  loading?: boolean;
  onPressMore?: () => void;
  onPressWine?: (wine: WineDBItem) => void;
}

/**
 * 홈 피드: 와인 카드 가로 스크롤 섹션 (취향 추천 / 최근 본 와인 공용).
 * onPressMore가 없으면 "더보기"를 숨긴다. loading 동안은 스켈레톤 카드를
 * 보여주고, 데이터 도착 시 콘텐츠가 페이드인된다.
 */
export const RecommendedSection: React.FC<RecommendedSectionProps> = ({
  data,
  title,
  loading = false,
  onPressMore,
  onPressWine,
}) => {
  const { t, i18n } = useTranslation();

  // 스켈레톤 → 데이터 전환 시 콘텐츠 페이드인 (처음부터 데이터가 있으면 즉시 표시)
  const contentFade = useRef(new Animated.Value(loading ? 0 : 1)).current;
  useEffect(() => {
    if (!loading) {
      Animated.timing(contentFade, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [loading, contentFade]);

  if (!loading && data.length === 0) return null;

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {!loading && onPressMore && (
          <TouchableOpacity
            onPress={onPressMore}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel={t("home.sectionMore")}
          >
            <Text style={styles.moreText}>{t("home.sectionMore")}</Text>
          </TouchableOpacity>
        )}
      </View>
      {loading ? (
        <View style={[styles.horizontalList, styles.skeletonRow]}>
          {Array.from({ length: SKELETON_CARD_COUNT }).map((_, i) => (
            <View key={i} style={styles.wineCard}>
              <Skeleton width="100%" height={140} borderRadius={0} />
              <View style={styles.wineInfo}>
                <Skeleton width="82%" height={14} borderRadius={7} />
                <Skeleton
                  width="55%"
                  height={12}
                  borderRadius={6}
                  style={styles.skeletonSubLine}
                />
              </View>
            </View>
          ))}
        </View>
      ) : (
        <Animated.View style={{ opacity: contentFade }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          >
            {data.map((wine, index) => (
              <TouchableOpacity
                key={`${wine.id}-${index}`}
                style={styles.wineCard}
                activeOpacity={0.85}
                onPress={() => onPressWine?.(wine)}
                accessibilityRole="button"
                accessibilityLabel={wine.nameKor || wine.nameEng}
              >
                <View style={styles.wineImageContainer}>
                  <WineImage
                    uri={wine.imageUri}
                    style={styles.wineImage}
                    resizeMode="contain"
                    fallbackIcon={
                      <MaterialCommunityIcons
                        name="bottle-wine"
                        size={40}
                        color={colors.textTertiary}
                      />
                    }
                  />
                </View>
                <View style={styles.wineInfo}>
                  <Text style={styles.wineName} numberOfLines={1}>
                    {i18n.language === "en"
                      ? wine.nameEng || wine.nameKor
                      : wine.nameKor}
                  </Text>
                  <View style={styles.wineDetailsRow}>
                    <Text style={styles.wineType} numberOfLines={1}>
                      {wine.grape || wine.type}
                    </Text>
                    {!!wine.vivinoRating && (
                      <View style={styles.ratingContainer}>
                        <Icon name="star" size={10} color={colors.ratingGold} />
                        <Text style={styles.ratingText}>
                          {wine.vivinoRating.toFixed(1)}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: spacing.xxl,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  moreText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  horizontalList: {
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  skeletonRow: {
    flexDirection: "row",
    overflow: "hidden",
  },
  skeletonSubLine: {
    marginTop: spacing.sm,
  },
  wineCard: {
    width: 140,
    backgroundColor: surfaces.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: surfaces.hairline,
    overflow: "hidden",
  },
  wineImageContainer: {
    height: 140,
    backgroundColor: surfaces.imageWell,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  wineImage: {
    width: "100%",
    height: "100%",
  },
  wineInfo: {
    padding: spacing.md,
  },
  wineName: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 4,
  },
  wineDetailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  wineType: {
    fontSize: 12,
    color: colors.textSecondary,
    flex: 1,
    marginRight: 4,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  ratingText: {
    fontSize: 11,
    color: colors.ratingGold,
    fontWeight: "700",
  },
});
