import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { colors } from "../../constants/colors";
import { spacing, surfaces } from "../../constants/theme";
import { useTranslation } from "react-i18next";

interface StarRatingProps {
  rating: number;
  onRatingChange: (rating: number) => void;
}

const STAR = 44;
const STAR_GOLD = colors.ratingGold;

export default function StarRating({
  rating,
  onRatingChange,
}: StarRatingProps) {
  const { t } = useTranslation();

  const renderStar = (index: number) => {
    let iconName = "star-outline";
    if (rating >= index) {
      iconName = "star";
    } else if (rating >= index - 0.5) {
      iconName = "star-half";
    }

    return (
      <View key={index} style={styles.starWrapper}>
        <Icon
          name={iconName}
          size={STAR}
          color={rating >= index - 0.5 ? STAR_GOLD : surfaces.hairlineStrong}
        />
        <View style={styles.touchOverlay}>
          <TouchableOpacity
            style={styles.halfStarTouch}
            onPress={() => onRatingChange(index - 0.5)}
            activeOpacity={0.6}
          />
          <TouchableOpacity
            style={styles.halfStarTouch}
            onPress={() => onRatingChange(index)}
            activeOpacity={0.6}
          />
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View
        style={styles.starsContainer}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={t("tastingNoteWrite.starRating.a11yLabel")}
        accessibilityValue={{
          text: t("tastingNoteWrite.starRating.a11yValue", { rating }),
        }}
        accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
        onAccessibilityAction={(event) => {
          // VoiceOver 스와이프 업/다운으로 0.5점 단위 조절
          if (event.nativeEvent.actionName === "increment") {
            onRatingChange(Math.min(5, rating + 0.5));
          } else if (event.nativeEvent.actionName === "decrement") {
            onRatingChange(Math.max(0, rating - 0.5));
          }
        }}
      >
        {[1, 2, 3, 4, 5].map((index) => renderStar(index))}
      </View>
      <View style={[styles.scorePill, rating > 0 && styles.scorePillActive]}>
        <Text style={[styles.scoreText, rating > 0 && styles.scoreTextActive]}>
          {rating > 0
            ? t("tastingNoteWrite.starRating.score", { rating })
            : t("tastingNoteWrite.starRating.placeholder")}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingVertical: spacing.md,
  },
  starsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  starWrapper: {
    position: "relative",
    marginHorizontal: spacing.xs,
    width: STAR,
    height: STAR,
    justifyContent: "center",
    alignItems: "center",
  },
  touchOverlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
  },
  halfStarTouch: {
    flex: 1,
  },
  scorePill: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.lg,
    borderRadius: 999,
    backgroundColor: surfaces.card,
  },
  scorePillActive: {
    backgroundColor: "rgba(245,197,24,0.16)",
  },
  scoreText: {
    color: colors.textTertiary,
    fontSize: 14,
    fontWeight: "600",
  },
  scoreTextActive: {
    color: STAR_GOLD,
  },
});
