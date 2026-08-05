import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { useNavigation, useIsFocused } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import { colors } from "../../constants/colors";
import { spacing, radius, surfaces, accent } from "../../constants/theme";
import { getWinePlaceholderImage } from "../../constants/wineColors";
import { getRecentReviews, HomeRecentReviewDTO } from "../../api/wine";
import { RootStackParamList } from "../../types";

const RECENT_REVIEW_COUNT = 10;

/**
 * 홈 피드: 다른 사용자들의 최신 리뷰를 가로 스크롤 카드로 보여준다.
 * 와인 이미지를 카드의 주인공으로 삼는 이미지 중심 구성이라, 대표 이미지가
 * 있는 리뷰만 노출한다(`wineImageUrl` 보유분만 필터). 백엔드가 recent 응답에
 * 와인 이미지를 포함하기 전까진 필터 결과가 비어 섹션이 조용히 숨겨진다.
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
          // 이미지 있는 와인 리뷰 우선 — 대표 이미지가 없는 리뷰는 제외한다.
          setReviews(res.result.filter((r) => !!r.wineImageUrl));
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
            <View style={styles.imageWrap}>
              <Image
                source={
                  review.wineImageUrl
                    ? { uri: review.wineImageUrl }
                    : getWinePlaceholderImage()
                }
                style={styles.image}
                resizeMode="contain"
              />
              <View style={styles.rating}>
                <Icon name="star" size={11} color={accent.base} />
                <Text style={styles.ratingText}>
                  {review.rating.toFixed(1)}
                </Text>
              </View>
            </View>

            <View style={styles.body}>
              <Text style={styles.wineName} numberOfLines={1}>
                {review.wineName}
              </Text>

              <Text style={styles.reviewText} numberOfLines={3}>
                {review.review}
              </Text>

              <Text style={styles.name} numberOfLines={1}>
                {review.name}
              </Text>
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
    width: 208,
    backgroundColor: surfaces.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: surfaces.hairline,
    overflow: "hidden",
  },
  imageWrap: {
    width: "100%",
    height: 132,
    backgroundColor: surfaces.imageWell,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  rating: {
    position: "absolute",
    top: spacing.sm,
    right: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  ratingText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  body: {
    padding: spacing.lg,
  },
  wineName: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  reviewText: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    marginTop: spacing.sm,
  },
  name: {
    color: accent.text,
    fontSize: 12,
    fontWeight: "600",
    marginTop: spacing.md,
  },
});
