import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { useNavigation, useIsFocused } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import { colors } from "../../constants/colors";
import { spacing, radius, surfaces, accent } from "../../constants/theme";
import { getRecentReviews, HomeRecentReviewDTO } from "../../api/wine";
import { RootStackParamList } from "../../types";

const RECENT_REVIEW_COUNT = 10;

/**
 * 홈 피드: 다른 사용자들의 최신 리뷰를 가로 스크롤 카드로 보여준다.
 * 와인 이미지가 없어도 성립하도록 텍스트(작성자·별점·코멘트) 중심으로 구성.
 * 백엔드 `GET /wine/review/recent`가 준비되기 전까진 호출이 실패하므로
 * 조용히 섹션을 숨긴다(홈은 정상 동작).
 */
export const RecentReviewsSection = () => {
  const { t } = useTranslation();
  const isFocused = useIsFocused();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [reviews, setReviews] = useState<HomeRecentReviewDTO[]>([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await getRecentReviews(RECENT_REVIEW_COUNT);
        if (alive && res.isSuccess && Array.isArray(res.result)) {
          setReviews(res.result);
        }
      } catch {
        // 엔드포인트 미준비/네트워크 오류 시 섹션을 숨긴다.
        if (alive) setReviews([]);
      }
    })();
    return () => {
      alive = false;
    };
  }, [isFocused]);

  if (reviews.length === 0) return null;

  const openWine = (review: HomeRecentReviewDTO) => {
    navigation.navigate("WineDetail", {
      wine: {
        id: review.wineId,
        nameKor: review.wineName,
        nameEng: review.wineNameEng ?? "",
        type: "",
        country: "",
        grape: "",
      },
    });
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{t("home.recentReviews.title")}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
      >
        {reviews.map((review, index) => (
          <TouchableOpacity
            key={`${review.wineId}-${index}`}
            style={styles.card}
            activeOpacity={0.85}
            onPress={() => openWine(review)}
          >
            <View style={styles.cardHeader}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {review.name?.trim()?.[0] ?? "?"}
                </Text>
              </View>
              <Text style={styles.name} numberOfLines={1}>
                {review.name}
              </Text>
              <View style={styles.rating}>
                <Icon name="star" size={12} color={accent.base} />
                <Text style={styles.ratingText}>
                  {review.rating.toFixed(1)}
                </Text>
              </View>
            </View>

            <Text style={styles.wineName} numberOfLines={1}>
              {review.wineName}
            </Text>

            <Text style={styles.reviewText} numberOfLines={3}>
              {review.review}
            </Text>
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
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.3,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  list: {
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  card: {
    width: 264,
    padding: spacing.lg,
    backgroundColor: surfaces.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: surfaces.hairline,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: accent.soft,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: accent.text,
    fontSize: 14,
    fontWeight: "700",
  },
  name: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "600",
  },
  rating: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  ratingText: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: "700",
  },
  wineName: {
    color: accent.text,
    fontSize: 12,
    fontWeight: "600",
    marginTop: spacing.md,
  },
  reviewText: {
    color: colors.textSecondary,
    fontSize: 13.5,
    lineHeight: 20,
    marginTop: spacing.xs,
  },
});
