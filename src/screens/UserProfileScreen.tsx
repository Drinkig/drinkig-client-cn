import React, { useCallback, useRef, useState } from "react";
import {
  ActionSheetIOS,
  Alert,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Dimensions,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/Ionicons";
import {
  useNavigation,
  useRoute,
  useFocusEffect,
  RouteProp,
} from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { RootStackParamList } from "../types";
import { getMemberProfile, MemberProfileResult } from "../api/member";
import { getMemberTastingNotes, TastingNotePreviewDTO } from "../api/wine";
import { followMember, unfollowMember } from "../api/follow";
import { blockMember, unblockMember } from "../api/block";
import { getApiErrorCode } from "../utils/apiError";
import { appEvents } from "../utils/appEvents";
import { useGlobalUI } from "../context/GlobalUIContext";
import { colors } from "../constants/colors";
import { spacing, radius, accent, surfaces } from "../constants/theme";
import GlassHeader from "../components/common/GlassHeader";

type UserProfileRouteProp = RouteProp<RootStackParamList, "UserProfile">;

/**
 * 타인 프로필 — 피드/노트에서 작성자를 탭해 진입한다.
 * 비공개 계정도 헤더(닉네임·카운트)는 보이고, 노트 그리드는 공개 계정만.
 */
export default function UserProfileScreen() {
  const navigation = useNavigation();
  const route = useRoute<UserProfileRouteProp>();
  const { memberId } = route.params;
  const { showToast } = useGlobalUI();
  const { t, i18n } = useTranslation();

  const [profile, setProfile] = useState<MemberProfileResult | null>(null);
  const [notes, setNotes] = useState<TastingNotePreviewDTO[]>([]);
  const [notesError, setNotesError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowPending, setIsFollowPending] = useState(false);
  const [isBlockPending, setIsBlockPending] = useState(false);

  const { width } = Dimensions.get("window");
  const gridItemWidth = width / 3;

  // 노트 로드 실패는 프로필 실패와 분리 — 헤더는 멀쩡한데 goBack당하거나
  // 실패가 "노트 없음" 빈 상태로 위장되지 않게 한다.
  const loadNotes = useCallback(
    async (profileResult: MemberProfileResult) => {
      // 내가 차단한 유저·비공개 계정이면 서버가 노트 조회를 거부하므로 건너뛴다
      if (!profileResult.isProfilePublic || profileResult.isBlocked) {
        setNotes([]);
        setNotesError(false);
        return;
      }
      try {
        const notesRes = await getMemberTastingNotes(memberId);
        if (notesRes.isSuccess && notesRes.result) {
          setNotes(
            Array.isArray(notesRes.result)
              ? (notesRes.result as any)
              : notesRes.result.content || []
          );
          setNotesError(false);
        } else {
          setNotesError(true);
        }
      } catch (error) {
        console.error("Failed to load member notes:", error);
        setNotesError(true);
      }
    },
    [memberId]
  );

  const loadProfile = useCallback(
    async (silent: boolean) => {
      try {
        if (!silent) setIsLoading(true);
        const profileRes = await getMemberProfile(memberId);
        if (!profileRes.isSuccess || !profileRes.result) {
          throw new Error(profileRes.message);
        }
        setProfile(profileRes.result);
        await loadNotes(profileRes.result);
      } catch (error) {
        console.error("Failed to load user profile:", error);
        // 조용한 재검증 실패는 보고 있던 화면을 유지한다
        if (!silent) {
          showToast(t("userProfile.error.fetchFail"), {
            type: "error",
            onHide: () => navigation.goBack(),
          });
        }
      } finally {
        if (!silent) setIsLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [memberId, loadNotes]
  );

  // 최초 진입은 스피너와 함께, 복귀는 조용히 재검증 — 노트 상세에서 작성자를
  // 차단하고 back으로 돌아오는 경우 등 이 화면 밖에서 상태가 바뀔 수 있다.
  const didInitialLoad = useRef(false);
  useFocusEffect(
    useCallback(() => {
      loadProfile(didInitialLoad.current);
      didInitialLoad.current = true;
    }, [loadProfile])
  );

  // 차단 관계(BLOCK 계열)는 재시도해도 영원히 실패하므로
  // "다시 시도해주세요" 대신 전용 카피로 안내한다
  const showFollowError = (code?: string) => {
    const key = code?.startsWith("BLOCK")
      ? "userProfile.error.followBlocked"
      : "userProfile.error.followFail";
    showToast(t(key), { type: "error" });
  };

  const handleToggleFollow = async () => {
    if (!profile || isFollowPending) return;
    setIsFollowPending(true);
    try {
      if (profile.isFollowing) {
        const res = await unfollowMember(memberId);
        if (!res.isSuccess) {
          showFollowError(res.code);
          return;
        }
        setProfile((prev) =>
          prev
            ? {
                ...prev,
                isFollowing: false,
                followerCount: Math.max(0, prev.followerCount - 1),
              }
            : prev
        );
        appEvents.emit("memberFollowChanged", {
          memberId,
          isFollowing: false,
        });
      } else {
        const res = await followMember(memberId);
        if (!res.isSuccess) {
          showFollowError(res.code);
          return;
        }
        setProfile((prev) =>
          prev
            ? {
                ...prev,
                isFollowing: true,
                followerCount: prev.followerCount + 1,
              }
            : prev
        );
        appEvents.emit("memberFollowChanged", {
          memberId,
          isFollowing: true,
        });
      }
    } catch (error) {
      console.error("Failed to toggle follow:", error);
      showFollowError(getApiErrorCode(error));
    } finally {
      setIsFollowPending(false);
    }
  };

  const handleBlock = () => {
    Alert.alert(
      t("userProfile.blockConfirmTitle"),
      t("userProfile.blockConfirmMsg"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("userProfile.blockAction"),
          style: "destructive",
          onPress: async () => {
            if (isBlockPending) return;
            setIsBlockPending(true);
            try {
              const res = await blockMember(memberId);
              if (!res.isSuccess) throw new Error(res.message);
              showToast(t("userProfile.blockSuccess"), { type: "success" });
              // 이미 렌더된 피드 목록에서도 이 작성자의 카드를 걷어낸다
              appEvents.emit("memberBlocked", memberId);
              // 차단 시 서버가 팔로우를 양방향 해제하므로 상태를 맞춰준다
              setProfile((prev) =>
                prev
                  ? {
                      ...prev,
                      isBlocked: true,
                      isFollowing: false,
                      followerCount: prev.isFollowing
                        ? Math.max(0, prev.followerCount - 1)
                        : prev.followerCount,
                    }
                  : prev
              );
              setNotes([]);
            } catch (error) {
              console.error("Failed to block member:", error);
              showToast(t("userProfile.error.blockFail"), { type: "error" });
            } finally {
              setIsBlockPending(false);
            }
          },
        },
      ]
    );
  };

  const handleUnblock = async () => {
    // 연타 시 DELETE 중복 전송 → 두 번째가 실패해 성공/실패 토스트가 겹치는 것 방지
    if (isBlockPending) return;
    setIsBlockPending(true);
    try {
      const res = await unblockMember(memberId);
      if (!res.isSuccess) throw new Error(res.message);
      showToast(t("userProfile.unblockSuccess"), { type: "success" });
      loadProfile(false);
    } catch (error) {
      console.error("Failed to unblock member:", error);
      showToast(t("userProfile.error.blockFail"), { type: "error" });
    } finally {
      setIsBlockPending(false);
    }
  };

  const openMenu = () => {
    if (!profile) return;
    const actionLabel = profile.isBlocked
      ? t("userProfile.unblockAction")
      : t("userProfile.blockAction");
    const onAction = profile.isBlocked ? handleUnblock : handleBlock;

    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [t("common.cancel"), actionLabel],
          cancelButtonIndex: 0,
          destructiveButtonIndex: profile.isBlocked ? undefined : 1,
        },
        (idx) => {
          if (idx === 1) onAction();
        }
      );
    } else {
      Alert.alert(profile.name, undefined, [
        {
          text: actionLabel,
          style: profile.isBlocked ? "default" : "destructive",
          onPress: onAction,
        },
        { text: t("common.cancel"), style: "cancel" },
      ]);
    }
  };

  const navigateToNote = (item: TastingNotePreviewDTO) => {
    navigation.navigate("TastingNoteDetail", {
      tastingNoteId: item.tastingNoteId || (item as any).noteId,
    });
  };

  const renderGridItem = (item: TastingNotePreviewDTO) => (
    <TouchableOpacity
      key={item.tastingNoteId || (item as any).noteId}
      style={[styles.gridItem, { width: gridItemWidth }]}
      onPress={() => navigateToNote(item)}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={
        i18n.language === "en"
          ? item.wineNameEng || item.wineName
          : item.wineName
      }
    >
      {item.thumbnailUrl ? (
        <>
          <Image
            source={{ uri: item.thumbnailUrl }}
            style={styles.gridPhoto}
            resizeMode="cover"
          />
          <View style={styles.gridRatingBadge}>
            <Icon name="star" size={10} color={colors.ratingStar} />
            <Text style={styles.gridRatingText}>{item.rating.toFixed(1)}</Text>
          </View>
        </>
      ) : (
        <View style={styles.gridInfoCell}>
          <Text style={styles.gridInfoName} numberOfLines={4}>
            {i18n.language === "en"
              ? item.wineNameEng || item.wineName
              : item.wineName}
          </Text>
          <View>
            <View style={styles.gridInfoRatingRow}>
              <Icon name="star" size={11} color={colors.ratingStar} />
              <Text style={styles.gridInfoRating}>
                {item.rating.toFixed(1)}
              </Text>
            </View>
            <Text style={styles.gridInfoDate}>{item.tasteDate}</Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={accent.text} />
      </View>
    );
  }

  if (!profile) return null;

  const isPrivate = profile.isProfilePublic === false;

  return (
    <SafeAreaView style={styles.container}>
      <GlassHeader
        floating={false}
        title={profile.name}
        left={
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel={t("common.back")}
          >
            <Icon name="arrow-back" size={22} color={colors.white} />
          </TouchableOpacity>
        }
        right={
          <TouchableOpacity
            onPress={openMenu}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel={t("common.more")}
          >
            <Icon name="ellipsis-horizontal" size={22} color={colors.white} />
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileHeader}>
          <Image
            source={
              profile.imageUrl
                ? { uri: profile.imageUrl }
                : require("../assets/Standard_profile.png")
            }
            style={styles.avatar}
          />
          <View style={styles.profileInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.name} numberOfLines={1}>
                {profile.name}
              </Text>
              {isPrivate && (
                <Icon
                  name="lock-closed"
                  size={14}
                  color={colors.textSecondary}
                  accessibilityLabel={t("profile.privateAccount")}
                />
              )}
            </View>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{profile.noteCount}</Text>
                <Text style={styles.statLabel}>{t("userProfile.notes")}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{profile.followerCount}</Text>
                <Text style={styles.statLabel}>
                  {t("userProfile.followers")}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{profile.followingCount}</Text>
                <Text style={styles.statLabel}>
                  {t("userProfile.followingCount")}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {profile.isBlocked ? (
          <TouchableOpacity
            style={[styles.followButton, styles.followButtonActive]}
            onPress={handleUnblock}
            disabled={isBlockPending}
            activeOpacity={0.85}
            accessibilityRole="button"
          >
            {isBlockPending ? (
              <ActivityIndicator size="small" color={colors.textPrimary} />
            ) : (
              <Text
                style={[styles.followButtonText, styles.followButtonTextActive]}
              >
                {t("userProfile.unblockAction")}
              </Text>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[
              styles.followButton,
              profile.isFollowing && styles.followButtonActive,
            ]}
            onPress={handleToggleFollow}
            disabled={isFollowPending}
            activeOpacity={0.85}
            accessibilityRole="button"
          >
            {isFollowPending ? (
              <ActivityIndicator
                size="small"
                color={
                  profile.isFollowing ? colors.textPrimary : accent.onAccent
                }
              />
            ) : (
              <Text
                style={[
                  styles.followButtonText,
                  profile.isFollowing && styles.followButtonTextActive,
                ]}
              >
                {profile.isFollowing
                  ? t("userProfile.following")
                  : t("userProfile.follow")}
              </Text>
            )}
          </TouchableOpacity>
        )}

        {profile.isBlocked ? (
          <View style={styles.privateWrapper}>
            <Icon name="ban-outline" size={32} color={colors.textTertiary} />
            <Text style={styles.privateTitle}>
              {t("userProfile.blockedTitle")}
            </Text>
            <Text style={styles.privateDesc}>
              {t("userProfile.blockedDesc")}
            </Text>
          </View>
        ) : isPrivate ? (
          <View style={styles.privateWrapper}>
            <Icon
              name="lock-closed-outline"
              size={32}
              color={colors.textTertiary}
            />
            <Text style={styles.privateTitle}>
              {t("userProfile.privateTitle")}
            </Text>
            <Text style={styles.privateDesc}>
              {t("userProfile.privateDesc")}
            </Text>
          </View>
        ) : notesError ? (
          <View style={styles.privateWrapper}>
            <Icon
              name="alert-circle-outline"
              size={32}
              color={colors.textTertiary}
            />
            <Text style={styles.privateDesc}>
              {t("common.error.loadFailed")}
            </Text>
            <TouchableOpacity
              onPress={() => profile && loadNotes(profile)}
              accessibilityRole="button"
              accessibilityLabel={t("common.retry")}
            >
              <Text style={styles.notesRetryText}>{t("common.retry")}</Text>
            </TouchableOpacity>
          </View>
        ) : notes.length > 0 ? (
          <View style={styles.photoGrid}>
            {notes.map((item) => renderGridItem(item))}
          </View>
        ) : (
          <View style={styles.privateWrapper}>
            <Text style={styles.privateDesc}>{t("userProfile.empty")}</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: spacing.xxxl,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    marginBottom: spacing.lg,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: surfaces.raised,
  },
  profileInfo: {
    flex: 1,
    gap: spacing.md,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  name: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: "800",
    flexShrink: 1,
  },
  statsRow: {
    flexDirection: "row",
    gap: spacing.xxl,
  },
  statItem: {
    alignItems: "flex-start",
  },
  statValue: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "800",
  },
  statLabel: {
    color: colors.textTertiary,
    fontSize: 12,
  },
  followButton: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: accent.base,
    alignItems: "center",
    justifyContent: "center",
  },
  followButtonActive: {
    backgroundColor: surfaces.card,
    borderWidth: 1,
    borderColor: surfaces.hairlineStrong,
  },
  followButtonText: {
    color: accent.onAccent,
    fontSize: 15,
    fontWeight: "bold",
  },
  followButtonTextActive: {
    color: colors.textPrimary,
  },
  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  gridItem: {
    aspectRatio: 3 / 4,
    overflow: "hidden",
    backgroundColor: surfaces.raised,
  },
  gridPhoto: {
    width: "100%",
    height: "100%",
  },
  gridRatingBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: surfaces.scrim,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    borderWidth: 1,
    borderColor: surfaces.onScrimHairline,
  },
  gridRatingText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: "bold",
  },
  gridInfoCell: {
    flex: 1,
    backgroundColor: surfaces.raised,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: surfaces.hairline,
    padding: 10,
    justifyContent: "space-between",
  },
  gridInfoName: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 16,
  },
  gridInfoRatingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginBottom: 2,
  },
  gridInfoRating: {
    color: colors.white,
    fontSize: 11,
    fontWeight: "bold",
  },
  gridInfoDate: {
    color: colors.textTertiary,
    fontSize: 10,
  },
  privateWrapper: {
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.xxxl,
  },
  privateTitle: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: "700",
  },
  privateDesc: {
    color: colors.textTertiary,
    fontSize: 13,
    textAlign: "center",
    lineHeight: 19,
  },
  notesRetryText: {
    color: accent.text,
    fontSize: 14,
    fontWeight: "700",
    padding: spacing.sm,
  },
});
