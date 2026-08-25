import React, { useEffect, useState } from "react";
import Skeleton from "../common/Skeleton";
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
import { getTastingNoteFeed, TastingNoteFeedItemDTO } from "../../api/wine";
import { RootStackParamList } from "../../types";

const FEED_COUNT = 20;

/**
 * 홈 소셜 피드: 공개 계정 유저들이 사진과 함께 남긴 테이스팅 노트.
 * 사진 있는 노트만 서버가 내려주므로 카드가 항상 이미지 중심이다.
 * 카드 탭 → 노트 보기(읽기 전용), 작성자 탭 → 유저 프로필 → 팔로우.
 */
export const FeedSection = () => {
  const { t, i18n } = useTranslation();
  const isFocused = useIsFocused();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [items, setItems] = useState<TastingNoteFeedItemDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    // isFocused가 의존성에 있으므로 blur 시에도 이펙트가 다시 도는데,
    // 그때는 조회하지 않는다 (홈을 떠날 때마다 요청 1회 낭비 방지)
    if (!isFocused) return;
    let alive = true;
    (async () => {
      try {
        const res = await getTastingNoteFeed(FEED_COUNT);
        if (!alive) return;
        if (res.isSuccess && Array.isArray(res.result)) {
          setItems(res.result);
          setHasError(false);
        } else {
          setHasError(true);
        }
      } catch {
        if (alive) setHasError(true);
      } finally {
        if (alive) setIsLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [isFocused, reloadKey]);

  // 로딩: 스켈레톤으로 자리를 잡아 첫 페인트 후 팝인을 없앤다.
  // 에러: 섹션이 통째로 사라져 "피드 없음"으로 위장되지 않도록 재시도 행 노출.
  // 성공 + 0건: 진짜 빈 피드이므로 섹션을 숨긴다.
  if (isLoading && items.length === 0) {
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t("home.feed.title")}</Text>
        </View>
        <View style={[styles.list, styles.skeletonRow]}>
          {Array.from({ length: 3 }).map((_, i) => (
            <View key={i} style={styles.card}>
              <Skeleton width="100%" height={156 * (4 / 3)} borderRadius={0} />
              <View style={styles.body}>
                <Skeleton width="80%" height={13} borderRadius={6} />
                <Skeleton width="50%" height={12} borderRadius={6} />
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  }

  if (items.length === 0) {
    if (!hasError) return null;
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t("home.feed.title")}</Text>
        </View>
        <TouchableOpacity
          style={styles.errorRow}
          onPress={() => {
            setHasError(false);
            setIsLoading(true);
            setReloadKey((k) => k + 1);
          }}
          accessibilityRole="button"
          accessibilityLabel={t("common.retry")}
        >
          <Text style={styles.errorText}>{t("common.error.loadFailed")}</Text>
          <Text style={styles.errorRetry}>{t("common.retry")}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{t("home.feed.title")}</Text>
        <TouchableOpacity
          onPress={() => (navigation as any).navigate("Feed")}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel={t("home.sectionMore")}
        >
          <Text style={styles.sectionMore}>{t("home.sectionMore")}</Text>
        </TouchableOpacity>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
      >
        {items.map((item) => (
          <TouchableOpacity
            key={item.noteId}
            style={styles.card}
            activeOpacity={0.85}
            onPress={() =>
              navigation.navigate("TastingNoteDetail", {
                tastingNoteId: item.noteId,
              })
            }
          >
            <View style={styles.imageWrap}>
              <Image
                source={{ uri: item.thumbnailUrl }}
                style={styles.image}
                resizeMode="cover"
              />
              <View style={styles.rating}>
                <Icon name="star" size={11} color={colors.ratingStar} />
                <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
              </View>
            </View>

            <View style={styles.body}>
              <Text style={styles.wineName} numberOfLines={1}>
                {i18n.language === "en"
                  ? item.wineNameEng || item.wineName
                  : item.wineName}
              </Text>
              <TouchableOpacity
                style={styles.authorRow}
                onPress={() =>
                  navigation.navigate("UserProfile", {
                    memberId: item.authorId,
                  })
                }
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                accessibilityRole="button"
                accessibilityLabel={item.authorName}
              >
                <Image
                  source={
                    item.authorImageUrl
                      ? { uri: item.authorImageUrl }
                      : require("../../assets/Standard_profile.png")
                  }
                  style={styles.authorAvatar}
                />
                <Text style={styles.authorName} numberOfLines={1}>
                  {item.authorName}
                </Text>
              </TouchableOpacity>
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
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  sectionMore: {
    color: colors.textTertiary,
    fontSize: 13,
    fontWeight: "600",
  },
  list: {
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  card: {
    width: 156,
    backgroundColor: surfaces.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: surfaces.hairline,
    overflow: "hidden",
  },
  imageWrap: {
    width: "100%",
    aspectRatio: 3 / 4,
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
    backgroundColor: surfaces.scrim,
  },
  ratingText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "700",
  },
  body: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  wineName: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  authorAvatar: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: surfaces.raised,
  },
  skeletonRow: {
    flexDirection: "row",
  },
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: surfaces.raised,
    borderWidth: 1,
    borderColor: surfaces.hairline,
  },
  errorText: {
    flex: 1,
    color: colors.textTertiary,
    fontSize: 13,
  },
  errorRetry: {
    color: accent.text,
    fontSize: 13,
    fontWeight: "700",
  },
  authorName: {
    flex: 1,
    color: colors.textTertiary,
    fontSize: 12,
    fontWeight: "600",
  },
});
