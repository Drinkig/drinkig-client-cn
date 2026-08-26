import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import {
  useIsFocused,
  useNavigation,
  useScrollToTop,
} from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Icon from "react-native-vector-icons/Ionicons";
import { useTranslation } from "react-i18next";
import GlassHeader, {
  useGlassHeaderHeight,
} from "../components/common/GlassHeader";
import ListStateView from "../components/common/ListStateView";
import {
  getTastingNoteFeed,
  likeTastingNote,
  unlikeTastingNote,
  TastingNoteFeedItemDTO,
} from "../api/wine";
import { followMember } from "../api/follow";
import { getApiErrorCode, getErrorMessageKey } from "../utils/apiError";
import { appEvents } from "../utils/appEvents";
import { useGlobalUI } from "../context/GlobalUIContext";
import { logScreen } from "utils/analytics";
import { colors } from "../constants/colors";
import { accent, radius, spacing, surfaces } from "../constants/theme";
import { RootStackParamList } from "../types";

const PAGE_SIZE = 20;

// 피드 카드 — 사진은 화면 풀블리드, 여러 장이면 스와이프 캐러셀(dots + n/m 표시).
// 작성자 행·와인명만 좌우 패딩을 갖는 인스타그램 문법.
function FeedCard({
  item,
  width,
  language,
  followLabel,
  likeA11y,
  commentA11y,
  onPressNote,
  onPressAuthor,
  onPressFollow,
  followPending,
  onToggleLike,
}: {
  item: TastingNoteFeedItemDTO;
  width: number;
  language: string;
  followLabel: string;
  likeA11y: string;
  commentA11y: string;
  onPressNote: () => void;
  onPressAuthor: () => void;
  onPressFollow: () => void;
  followPending: boolean;
  onToggleLike: () => void;
}) {
  const [photoPage, setPhotoPage] = useState(0);
  // 구버전 서버는 imageUrls를 안 내려주므로 썸네일 1장으로 폴백
  const photos = item.imageUrls?.length
    ? item.imageUrls
    : item.thumbnailUrl
    ? [item.thumbnailUrl]
    : [];
  const wineName =
    language === "en" ? item.wineNameEng || item.wineName : item.wineName;
  // 소셜 필드는 구버전 서버에선 undefined → 팔로우 버튼/액션 행 미노출로 폴백
  const showFollow = item.isFollowing === false && !item.mine;
  const hasSocial = item.likeCount != null;

  return (
    <View style={styles.card}>
      <View style={styles.authorRow}>
        <TouchableOpacity
          style={styles.authorTouch}
          onPress={onPressAuthor}
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
          <View style={styles.authorMeta}>
            <Text style={styles.authorName} numberOfLines={1}>
              {item.authorName}
            </Text>
            <Text style={styles.tasteDate}>{item.tasteDate}</Text>
          </View>
        </TouchableOpacity>
        {showFollow && (
          <TouchableOpacity
            style={styles.followButton}
            onPress={onPressFollow}
            disabled={followPending}
            accessibilityRole="button"
            accessibilityLabel={followLabel}
          >
            {followPending ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Text style={styles.followButtonText}>{followLabel}</Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.pagerWrap}>
        <FlatList
          data={photos}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(uri, index) => `${index}-${uri}`}
          onMomentumScrollEnd={(e) =>
            setPhotoPage(Math.round(e.nativeEvent.contentOffset.x / width))
          }
          renderItem={({ item: uri }) => (
            <TouchableOpacity activeOpacity={0.9} onPress={onPressNote}>
              <Image
                source={{ uri }}
                style={[styles.image, { width }]}
                resizeMode="cover"
              />
            </TouchableOpacity>
          )}
        />
        {photos.length > 1 && (
          <View style={styles.photoCountPill} pointerEvents="none">
            <Text style={styles.photoCountText}>
              {Math.min(photoPage, photos.length - 1) + 1}/{photos.length}
            </Text>
          </View>
        )}
        <View style={styles.rating} pointerEvents="none">
          <Icon name="star" size={12} color={colors.ratingStar} />
          <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
        </View>
      </View>

      {hasSocial ? (
        <View style={styles.actionRow}>
          {photos.length > 1 && (
            <View style={styles.actionDots} pointerEvents="none">
              {photos.map((uri, index) => (
                <View
                  key={`${index}-${uri}`}
                  style={[
                    styles.photoDot,
                    index === Math.min(photoPage, photos.length - 1) &&
                      styles.photoDotActive,
                  ]}
                />
              ))}
            </View>
          )}
          <TouchableOpacity
            style={styles.actionItem}
            onPress={onToggleLike}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel={likeA11y}
            accessibilityState={{ selected: !!item.likedByMe }}
          >
            <Icon
              name={item.likedByMe ? "heart" : "heart-outline"}
              size={24}
              color={item.likedByMe ? accent.base : colors.textPrimary}
            />
            {(item.likeCount ?? 0) > 0 && (
              <Text style={styles.actionCount}>{item.likeCount}</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionItem}
            onPress={onPressNote}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel={commentA11y}
          >
            <Icon
              name="chatbubble-outline"
              size={22}
              color={colors.textPrimary}
            />
            {(item.commentCount ?? 0) > 0 && (
              <Text style={styles.actionCount}>{item.commentCount}</Text>
            )}
          </TouchableOpacity>
        </View>
      ) : (
        photos.length > 1 && (
          <View style={styles.photoDots}>
            {photos.map((uri, index) => (
              <View
                key={`${index}-${uri}`}
                style={[
                  styles.photoDot,
                  index === Math.min(photoPage, photos.length - 1) &&
                    styles.photoDotActive,
                ]}
              />
            ))}
          </View>
        )
      )}

      <TouchableOpacity activeOpacity={0.8} onPress={onPressNote}>
        <Text style={styles.wineName} numberOfLines={2}>
          {wineName}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

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
  const { width: windowWidth } = useWindowDimensions();
  const { showToast } = useGlobalUI();

  const [items, setItems] = useState<TastingNoteFeedItemDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadMoreFailed, setLoadMoreFailed] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  // 연타로 인한 중복 요청 방지 — 좋아요는 아이콘이 item 상태를 따르므로 ref로 충분,
  // 팔로우 버튼은 스피너를 그려야 해서 state
  const pendingLikeIds = useRef<Set<number>>(new Set());
  const [pendingFollowIds, setPendingFollowIds] = useState<Set<number>>(
    new Set()
  );

  // 탭 재선택 시 최상단으로 (다른 탭·타 앱과 동일한 표준 기대 동작)
  const listRef = useRef<FlatList<TastingNoteFeedItemDTO>>(null);
  useScrollToTop(listRef);

  useEffect(() => {
    logScreen("feed");
  }, []);

  // 노트 상세/프로필에서 작성자를 차단하면 이미 렌더된 피드에서도 즉시 걷어낸다
  useEffect(
    () =>
      appEvents.on("memberBlocked", (memberId) =>
        setItems((prev) => prev.filter((it) => it.authorId !== memberId))
      ),
    []
  );

  // 프로필 화면 등 다른 곳에서 팔로우 상태가 바뀌면 카드 버튼도 동기화
  useEffect(
    () =>
      appEvents.on("memberFollowChanged", ({ memberId, isFollowing }) =>
        setItems((prev) =>
          prev.map((it) =>
            it.authorId === memberId && it.isFollowing != null
              ? { ...it, isFollowing }
              : it
          )
        )
      ),
    []
  );

  // 노트 상세에서 좋아요/댓글이 바뀌면 카드 카운트도 동기화 (본 화면의 낙관적 업데이트도 이 이벤트를 탄다)
  useEffect(
    () =>
      appEvents.on("noteLikeChanged", ({ noteId, likedByMe, likeCount }) =>
        setItems((prev) =>
          prev.map((it) =>
            it.noteId === noteId && it.likeCount != null
              ? { ...it, likedByMe, likeCount }
              : it
          )
        )
      ),
    []
  );
  useEffect(
    () =>
      appEvents.on("noteCommentCountChanged", ({ noteId, commentCount }) =>
        setItems((prev) =>
          prev.map((it) =>
            it.noteId === noteId && it.commentCount != null
              ? { ...it, commentCount }
              : it
          )
        )
      ),
    []
  );

  const loadFirstPage = useCallback(
    async (viaRefresh: boolean) => {
      if (viaRefresh) setIsRefreshing(true);
      else setIsLoading(true);
      if (!viaRefresh) setErrorKey(null);
      try {
        const res = await getTastingNoteFeed(PAGE_SIZE, 0);
        if (res.isSuccess && Array.isArray(res.result)) {
          setItems(res.result);
          setPage(0);
          setHasMore(res.result.length >= PAGE_SIZE);
          setLoadMoreFailed(false);
          setErrorKey(null);
        } else if (viaRefresh) {
          // 보고 있던 목록을 에러 화면으로 갈아치우지 않는다 — 토스트로만 알림
          showToast(t("common.error.loadFailed"), { type: "error" });
        } else {
          setErrorKey("common.error.loadFailed");
        }
      } catch (error) {
        console.error("Feed load failed:", error);
        if (viaRefresh) {
          showToast(t(getErrorMessageKey(error)), { type: "error" });
        } else {
          setErrorKey(getErrorMessageKey(error));
        }
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [showToast, t]
  );

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
    setLoadMoreFailed(false);
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
      // 리스트 끝에 머문 상태면 onEndReached가 다시 안 울리므로 footer에 재시도 노출
      setLoadMoreFailed(true);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleToggleLike = async (item: TastingNoteFeedItemDTO) => {
    if (item.likeCount == null || pendingLikeIds.current.has(item.noteId)) {
      return;
    }
    const wasLiked = !!item.likedByMe;
    const prevCount = item.likeCount;
    pendingLikeIds.current.add(item.noteId);
    // 낙관적 반영 — 실패 시 원복
    appEvents.emit("noteLikeChanged", {
      noteId: item.noteId,
      likedByMe: !wasLiked,
      likeCount: Math.max(0, prevCount + (wasLiked ? -1 : 1)),
    });
    try {
      const res = wasLiked
        ? await unlikeTastingNote(item.noteId)
        : await likeTastingNote(item.noteId);
      if (!res.isSuccess || !res.result) {
        throw new Error(res.message);
      }
      // 서버 카운트가 정본 — 다른 유저의 좋아요가 겹쳐도 여기서 보정된다
      appEvents.emit("noteLikeChanged", {
        noteId: item.noteId,
        likedByMe: res.result.likedByMe,
        likeCount: res.result.likeCount,
      });
    } catch (error) {
      console.error("Feed like toggle failed:", error);
      appEvents.emit("noteLikeChanged", {
        noteId: item.noteId,
        likedByMe: wasLiked,
        likeCount: prevCount,
      });
      showToast(t(getErrorMessageKey(error)), { type: "error" });
    } finally {
      pendingLikeIds.current.delete(item.noteId);
    }
  };

  const handleFollow = async (item: TastingNoteFeedItemDTO) => {
    const memberId = item.authorId;
    if (pendingFollowIds.has(memberId)) {
      return;
    }
    setPendingFollowIds((prev) => new Set(prev).add(memberId));
    try {
      const res = await followMember(memberId);
      if (!res.isSuccess) {
        throw new Error(res.message);
      }
      appEvents.emit("memberFollowChanged", { memberId, isFollowing: true });
    } catch (error) {
      console.error("Feed follow failed:", error);
      const code = getApiErrorCode(error);
      if (code === "FOLLOW4002") {
        // 이미 팔로우 중(다른 화면에서 먼저 누른 경우) — 에러가 아니라 상태 동기화
        appEvents.emit("memberFollowChanged", { memberId, isFollowing: true });
      } else if (code?.startsWith("BLOCK")) {
        showToast(t("userProfile.error.followBlocked"), { type: "error" });
      } else {
        showToast(t("userProfile.error.followFail"), { type: "error" });
      }
    } finally {
      setPendingFollowIds((prev) => {
        const next = new Set(prev);
        next.delete(memberId);
        return next;
      });
    }
  };

  const renderItem = ({ item }: { item: TastingNoteFeedItemDTO }) => (
    <FeedCard
      item={item}
      width={windowWidth}
      language={i18n.language}
      followLabel={t("userProfile.follow")}
      likeA11y={t("feed.like")}
      commentA11y={t("feed.comment")}
      onPressNote={() =>
        navigation.navigate("TastingNoteDetail", { tastingNoteId: item.noteId })
      }
      onPressAuthor={() =>
        item.mine
          ? navigation.navigate("Main", { screen: "Profile" })
          : navigation.navigate("UserProfile", { memberId: item.authorId })
      }
      onPressFollow={() => handleFollow(item)}
      followPending={pendingFollowIds.has(item.authorId)}
      onToggleLike={() => handleToggleLike(item)}
    />
  );

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
        ref={listRef}
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
          ) : loadMoreFailed ? (
            <TouchableOpacity
              style={styles.footerRetry}
              onPress={loadMore}
              accessibilityRole="button"
              accessibilityLabel={t("common.retry")}
            >
              <Text style={styles.footerRetryTitle}>
                {t("common.error.loadFailed")}
              </Text>
              <Text style={styles.footerRetryAction}>{t("common.retry")}</Text>
            </TouchableOpacity>
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
  // 사진은 풀블리드(패딩/라운딩 없음), 텍스트 행만 좌우 패딩 — 인스타그램 문법
  listContent: {
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
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  authorTouch: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  authorAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: surfaces.raised,
  },
  authorMeta: {
    flex: 1,
    gap: 1,
  },
  authorName: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  tasteDate: {
    color: colors.textTertiary,
    fontSize: 12,
  },
  followButton: {
    minWidth: 64,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: accent.base,
  },
  followButtonText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "700",
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xl,
    paddingHorizontal: spacing.xl,
  },
  actionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  actionCount: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: "600",
  },
  actionDots: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.xs,
  },
  pagerWrap: {
    width: "100%",
    backgroundColor: surfaces.imageWell,
  },
  image: {
    aspectRatio: 3 / 4,
  },
  photoCountPill: {
    position: "absolute",
    top: spacing.md,
    left: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: surfaces.scrim,
  },
  photoCountText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "700",
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
    backgroundColor: surfaces.scrim,
  },
  ratingText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "700",
  },
  photoDots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.xs,
  },
  photoDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: surfaces.hairlineStrong,
  },
  photoDotActive: {
    backgroundColor: accent.base,
  },
  wineName: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: -0.2,
    paddingHorizontal: spacing.xl,
  },
  footerLoader: {
    marginTop: spacing.lg,
  },
  footerRetry: {
    alignItems: "center",
    gap: spacing.xs,
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
  },
  footerRetryTitle: {
    color: colors.textTertiary,
    fontSize: 13,
  },
  footerRetryAction: {
    color: accent.text,
    fontSize: 14,
    fontWeight: "700",
  },
});
