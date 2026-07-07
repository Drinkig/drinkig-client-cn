import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import Icon from "react-native-vector-icons/Ionicons";
import { useTranslation } from "react-i18next";
import { WineDBItem } from "../../types/Wine";
import { colors } from "../../constants/colors";
import { spacing, radius, surfaces } from "../../constants/theme";

interface RecommendedSectionProps {
  data: WineDBItem[];
  title: string;
  onPressMore?: () => void;
  onPressWine?: (wine: WineDBItem) => void;
}

/**
 * 홈 피드: 와인 카드 가로 스크롤 섹션 (취향 추천 / 최근 본 와인 공용).
 * onPressMore가 없으면 "더보기"를 숨긴다.
 */
export const RecommendedSection: React.FC<RecommendedSectionProps> = ({
  data,
  title,
  onPressMore,
  onPressWine,
}) => {
  const { t, i18n } = useTranslation();
  // S3 폴백 URL조차 404인 와인은 병 아이콘으로 대체
  const [failedImageIds, setFailedImageIds] = useState<Set<number>>(new Set());

  if (data.length === 0) return null;

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {onPressMore && (
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
              {wine.imageUri && !failedImageIds.has(wine.id) ? (
                <Image
                  source={{ uri: wine.imageUri }}
                  style={styles.wineImage}
                  resizeMode="contain"
                  onError={() =>
                    setFailedImageIds((prev) => new Set(prev).add(wine.id))
                  }
                />
              ) : (
                <MaterialCommunityIcons
                  name="bottle-wine"
                  size={40}
                  color={colors.textTertiary}
                />
              )}
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
    backgroundColor: surfaces.raised,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  wineImage: {
    width: "65%",
    height: "85%",
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
