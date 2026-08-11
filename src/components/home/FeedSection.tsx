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
import { spacing, radius, surfaces } from "../../constants/theme";
import { getTastingNoteFeed, TastingNoteFeedItemDTO } from "../../api/wine";
import { RootStackParamList } from "../../types";

const FEED_COUNT = 20;

/**
 * 홈 소셜 피드: 공개 계정 유저들이 사진과 함께 남긴 테이스팅 노트.
 * 사진 있는 노트만 서버가 내려주므로 카드가 항상 이미지 중심이다.
 * 카드 탭 → 노트 보기(읽기 전용), 작성자 탭 → 유저 프로필 → 팔로우.
 */
export const FeedSection = () => {
  const { t } = useTranslation();
  const isFocused = useIsFocused();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [items, setItems] = useState<TastingNoteFeedItemDTO[]>([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await getTastingNoteFeed(FEED_COUNT);
        if (alive && res.isSuccess && Array.isArray(res.result)) {
          setItems(res.result);
        }
      } catch {
        // 엔드포인트 미배포/네트워크 오류 시 섹션을 조용히 숨긴다.
        if (alive) setItems([]);
      }
    })();
    return () => {
      alive = false;
    };
  }, [isFocused]);

  if (items.length === 0) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{t("home.feed.title")}</Text>
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
                {item.wineName}
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
    backgroundColor: "rgba(0,0,0,0.55)",
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
  authorName: {
    flex: 1,
    color: colors.textTertiary,
    fontSize: 12,
    fontWeight: "600",
  },
});
