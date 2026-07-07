import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { ReviewDTO } from "../../api/wine";
import { sendReportEmail } from "../../utils/reportUtils";
import { useGlobalUI } from "../../context/GlobalUIContext";
import { colors } from "../../constants/colors";
import { surfaces, accent, radius } from "../../constants/theme";
import { useTranslation } from "react-i18next";

interface ReviewCardProps {
  review: ReviewDTO;
}

export default function ReviewCard({ review }: ReviewCardProps) {
  const { showToast } = useGlobalUI();
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const [isTruncatable, setIsTruncatable] = useState(false);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    return dateString.split("T")[0];
  };

  const displayDate = formatDate(review.tasteDate || review.createdAt);

  const getCleanReview = (text: string) => {
    if (!text) return "";

    let processed = text.replace(/^\[Finish\].*?\n\n/s, "");

    if (processed.startsWith("[Finish]")) {
      return "";
    }

    return processed;
  };

  const cleanReview = getCleanReview(review.review);

  return (
    <View style={styles.reviewItem}>
      <View style={styles.reviewHeader}>
        <View style={styles.reviewUserContainer}>
          {review.member?.imageUrl || review.imageUrl ? (
            <Image
              source={{ uri: review.member?.imageUrl || review.imageUrl }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {review.name?.trim()?.charAt(0)?.toUpperCase() || "?"}
              </Text>
            </View>
          )}
          <Text style={styles.reviewUser}>{review.name}</Text>
          {review.vintageYear ? (
            review.vintageYear > 0 ? (
              <View style={styles.vintageBadge}>
                <Text style={styles.vintageBadgeText}>
                  {review.vintageYear}
                </Text>
              </View>
            ) : null
          ) : null}
        </View>
        <View style={styles.ratingContainer}>
          <Ionicons name="star" size={14} color={colors.ratingGold} />
          <Text style={styles.ratingText}>{review.rating.toFixed(1)}</Text>
        </View>
      </View>
      {cleanReview !== "" && (
        <View>
          {/* Invisible measurer: detects whether the full text exceeds 3 lines
              without flickering the visible (clamped) copy. */}
          {!isTruncatable && (
            <Text
              style={[styles.reviewComment, styles.hiddenMeasure]}
              onTextLayout={(e) => {
                if (e.nativeEvent.lines.length > 3) setIsTruncatable(true);
              }}
            >
              {cleanReview}
            </Text>
          )}
          <Text
            style={styles.reviewComment}
            numberOfLines={expanded ? undefined : 3}
          >
            {cleanReview}
          </Text>
          {isTruncatable && (
            <TouchableOpacity
              onPress={() => setExpanded((v) => !v)}
              activeOpacity={0.7}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Text style={styles.moreText}>
                {expanded
                  ? t("wineDetail.review.collapse")
                  : t("wineDetail.review.more")}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
      <View style={styles.reviewDateContainer}>
        <Text style={styles.reviewDate}>시음일: {displayDate}</Text>
        <TouchableOpacity
          style={styles.reportButton}
          onPress={() =>
            sendReportEmail(
              "REVIEW",
              {
                writerName: review.name,
                reviewDate: displayDate,
                reviewContent: cleanReview,
              },
              (reason) => {
                showToast(
                  reason === "UNSUPPORTED"
                    ? "메일 앱을 열 수 없습니다."
                    : "메일 앱을 실행하는 중 문제가 발생했습니다.",
                  { type: "error" }
                );
              }
            )
          }
        >
          <MaterialCommunityIcons
            name="alarm-light-outline"
            size={16}
            color={colors.textTertiary}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  reviewItem: {
    backgroundColor: surfaces.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: surfaces.hairline,
    padding: 14,
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  reviewUserContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: accent.soft,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: accent.text,
    fontSize: 15,
    fontWeight: "700",
  },
  reviewUser: {
    color: colors.white,
    fontWeight: "600",
    fontSize: 14,
  },
  vintageBadge: {
    backgroundColor: accent.soft,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  vintageBadgeText: {
    color: accent.text,
    fontSize: 10,
    fontWeight: "600",
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "bold",
  },
  reviewComment: {
    color: colors.textSecondary,
    fontSize: 14,
    marginBottom: 6,
    lineHeight: 20,
  },
  hiddenMeasure: {
    position: "absolute",
    left: 0,
    right: 0,
    opacity: 0,
    zIndex: -1,
  },
  moreText: {
    color: accent.text,
    fontSize: 13,
    fontWeight: "600",
    marginTop: 2,
    marginBottom: 4,
  },
  reviewDateContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  reviewDate: {
    color: colors.textTertiary,
    fontSize: 12,
  },
  reportButton: {
    padding: 4,
  },
});
