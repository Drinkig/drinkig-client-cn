import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Icon from "react-native-vector-icons/Ionicons";
import { useTranslation } from "react-i18next";
import GlassHeader, {
  useGlassHeaderHeight,
} from "../components/common/GlassHeader";
import ListStateView from "../components/common/ListStateView";
import { getTastingNoteFeed, TastingNoteFeedItemDTO } from "../api/wine";
import { getErrorMessageKey } from "../utils/apiError";
import { logScreen } from "utils/analytics";
import { colors } from "../constants/colors";
import { accent, radius, spacing, surfaces } from "../constants/theme";
import { RootStackParamList } from "../types";

const PAGE_SIZE = 20;

/**
 * 피드 탭: 공개 계정 유저들이 사진과 함께 남긴 테이스팅 노트 전체 목록.
 * 홈의 피드 섹션(가로 티저)의 "머무는 공간" 버전 — 세로 풀폭 카드 + 무한 스크롤.
 * 카드 탭 → 노트 보기(읽기 전용), 작성자 탭 → 유저 프로필 → 팔로우.
 */
export default function FeedScreen() {
  const { t, i18n } = useTranslation();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const isFocused = useIsFocused();
  const headerHeight = useGlassHeaderHeight();

  const [items, setItems] = useState<TastingNoteFeedItemDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [errorKey, setErrorKey] = useState<string | null>(null);

  useEffect(() => {
    logScreen("feed");
  }, []);

  const loadFirstPage = useCallback(async (viaRefresh: boolean) => {
    if (viaRefresh) setIsRefreshing(true);
    else setIsLoading(true);
    setErrorKey(null);
    try {
      const res = await getTastingNoteFeed(PAGE_SIZE, 0);
      if (res.isSuccess && Array.isArray(res.result)) {
        setItems(res.result);
        setPage(0);
        setHasMore(res.result.length >= PAGE_SIZE);
      } else {
        setErrorKey("common.error.loadFailed");
      }
    } catch (error) {
      console.error("Feed load failed:", error);
      setErrorKey(getErrorMessageKey(error));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadFirstPage(false);
  }, [loadFirstPage]);

  // 서버 미배포/일시 오류로 비어 있던 경우 탭 재진입 시 재시도
  useEffect(() => {
    if (isFocused && !isLoading && items.length === 0 && !errorKey) {
      loadFirstPage(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFocused]);

  const loadMore = async () => {
    if (isLoading || isLoadingMore || isRefreshing || !hasMore) return;
    setIsLoadingMore(true);
    try {
      const nextPage = page + 1;
      const res = await getTastingNoteFeed(PAGE_SIZE, nextPage);
      if (res.isSuccess && Array.isArray(res.result)) {
        setItems((prev) => {
          // 페이지 사이에 새 노트가 끼어들면 중복이 생길 수 있어 noteId로 걸러낸다
          const seen = new Set(prev.map((it) => it.noteId));
          return [...prev, ...res.result.filter((it) => !seen.has(it.noteId))];
        });
        setPage(nextPage);
        setHasMore(res.result.length >= PAGE_SIZE);
      }
    } catch (error) {
      console.error("Feed load more failed:", error);
      // 추가 로드 실패는 치명적이지 않다 — 스크롤 재시도에 맡긴다
    } finally {
      setIsLoadingMore(false);
    }
  };

  const renderItem = ({ item }: { item: TastingNoteFeedItemDTO }) => {
    const wineName =
      i18n.language === "en"
        ? item.wineNameEng || item.wineName
        : item.wineName;
    return (
      <View style={styles.card}>
        <TouchableOpacity
          style={styles.authorRow}
          onPress={() =>
            navigation.navigate("UserProfile", { memberId: item.authorId })
          }
          accessibilityRole="button"
          accessibilityLabel={item.authorName}
        >
          <Image
            source={
              item.authorImageUrl
                ? { uri: item.authorImageUrl }
                : require("../assets/Standard_profile.png")
            }
            style={styles.authorAvatar}
          />
          <Text style={styles.authorName} numberOfLines={1}>
            {item.authorName}
          </Text>
          <Text style={styles.tasteDate}>{item.tasteDate}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.9}
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
              <Icon name="star" size={12} color={colors.ratingStar} />
              <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
            </View>
          </View>
          <Text style={styles.wineName} numberOfLines={2}>
            {wineName}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderBody = () => {
    if (isLoading) {
      return (
        <View style={[styles.stateWrap, { paddingTop: headerHeight }]}>
          <ListStateView state="loading" />
        </View>
      );
    }
    if (errorKey) {
      return (
        <View style={[styles.stateWrap, { paddingTop: headerHeight }]}>
          <ListStateView
            state="error"
            title={t(errorKey)}
            onAction={() => loadFirstPage(false)}
          />
        </View>
      );
    }
    return (
      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => String(item.noteId)}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.listContent,
          { paddingTop: headerHeight + spacing.lg },
          items.length === 0 && styles.listContentEmpty,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => loadFirstPage(true)}
            tintColor={accent.text}
            progressViewOffset={headerHeight}
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.6}
        ListEmptyComponent={
          <ListStateView
            state="empty"
            icon="images-outline"
            title={t("feed.empty.title")}
            subtitle={t("feed.empty.subtitle")}
            actionLabel={t("feed.empty.cta")}
            onAction={() => navigation.navigate("TastingNoteWrite", {})}
          />
        }
        ListFooterComponent={
          isLoadingMore ? (
            <ActivityIndicator
              size="small"
              color={accent.text}
              style={styles.footerLoader}
            />
          ) : null
        }
      />
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      {renderBody()}
      <GlassHeader
        title={t("feed.headerTitle")}
        right={
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.navigate("FriendSearch")}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel={t("feed.findFriends")}
          >
            <Icon name="person-add-outline" size={20} color={colors.white} />
          </TouchableOpacity>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  stateWrap: {
    flex: 1,
  },
  headerButton: {
    padding: spacing.xs,
  },
  listContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 140,
    gap: spacing.xxl,
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  card: {
    gap: spacing.md,
  },
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  authorAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: surfaces.raised,
  },
  authorName: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  tasteDate: {
    color: colors.textTertiary,
    fontSize: 12,
  },
  imageWrap: {
    width: "100%",
    aspectRatio: 3 / 4,
    borderRadius: radius.lg,
    overflow: "hidden",
    backgroundColor: surfaces.imageWell,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  rating: {
    position: "absolute",
    top: spacing.md,
    right: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  ratingText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "700",
  },
  wineName: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  footerLoader: {
    marginTop: spacing.lg,
  },
});
