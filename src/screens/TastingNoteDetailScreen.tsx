import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Image,
  ActivityIndicator,
  ActionSheetIOS,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import {
  Asset,
  launchCamera,
  launchImageLibrary,
} from "react-native-image-picker";
import { RootStackParamList } from "../types";
import {
  getTastingNoteDetail,
  TastingNoteDTO,
  TastingNoteImageDTO,
  deleteTastingNote,
  deleteTastingNoteImage,
  uploadTastingNoteImages,
  likeTastingNote,
  unlikeTastingNote,
  getNoteComments,
  addNoteComment,
  deleteNoteComment,
  NoteCommentDTO,
} from "../api/wine";
import { getApiErrorCode, getErrorMessageKey } from "../utils/apiError";
import { appEvents } from "../utils/appEvents";
import {
  NOTE_PHOTO_GRID_ASPECT,
  NOTE_PHOTO_MAX_COUNT,
  prepareNotePhoto,
} from "../utils/notePhoto";
import { useGlobalUI } from "../context/GlobalUIContext";
import PentagonRadarChart from "../components/common/PentagonRadarChart";
import { COLOR_PALETTES } from "../components/tasting_note/constants";
import { colors } from "../constants/colors";
import { spacing, radius, accent, surfaces } from "../constants/theme";
import {
  getWinePlaceholderImage,
  getWineTypeColor,
  WINE_TYPE_ON_COLOR,
} from "../constants/wineColors";
import { useTranslation } from "react-i18next";
import GlassHeader from "../components/common/GlassHeader";
import ActionMenuSheet from "../components/common/ActionMenuSheet";
import { sendContentReport } from "../utils/reportUtils";
import { blockMember } from "../api/block";

const RATING_STAR = colors.ratingStar;

type TastingNoteDetailRouteProp = RouteProp<
  RootStackParamList,
  "TastingNoteDetail"
>;

export default function TastingNoteDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute<TastingNoteDetailRouteProp>();
  const { tastingNoteId } = route.params;
  const { showAlert, showToast } = useGlobalUI();
  const { t, i18n } = useTranslation();

  const [note, setNote] = useState<TastingNoteDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [menuVisible, setMenuVisible] = useState(false);
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);
  const [photoPage, setPhotoPage] = useState(0);
  const [pagerWidth, setPagerWidth] = useState(0);
  // 좋아요/댓글 — 구 서버는 소셜 필드를 안 내려주므로(likeCount undefined) 전부 미노출
  const likePendingRef = useRef(false);
  const [comments, setComments] = useState<NoteCommentDTO[]>([]);
  const [commentCount, setCommentCount] = useState(0);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [commentsErrored, setCommentsErrored] = useState(false);
  const [commentInput, setCommentInput] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  useEffect(() => {
    fetchNoteDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tastingNoteId]);

  // v1은 전체 로드(최대 100) — 노트당 댓글 규모가 작아 페이지네이션 생략
  const loadComments = async () => {
    setIsLoadingComments(true);
    setCommentsErrored(false);
    try {
      const res = await getNoteComments(tastingNoteId, 0, 100);
      if (!res.isSuccess || !res.result) {
        throw new Error(res.message);
      }
      setComments(res.result.content);
      setCommentCount(res.result.commentCount);
    } catch (error) {
      console.error("Failed to load note comments:", error);
      setCommentsErrored(true);
    } finally {
      setIsLoadingComments(false);
    }
  };

  const fetchNoteDetail = async () => {
    try {
      setIsLoading(true);
      const response = await getTastingNoteDetail(tastingNoteId);
      if (response.isSuccess) {
        setNote(response.result);
        if (response.result.likeCount != null) {
          setCommentCount(response.result.commentCount ?? 0);
          loadComments();
        }
      } else {
        showToast(
          response.message || t("tastingNoteDetail.error.fetchFailMsg"),
          {
            type: "error",
            onHide: () => navigation.goBack(),
          }
        );
      }
    } catch (error) {
      console.error("Failed to fetch tasting note detail:", error);
      showToast(t("tastingNoteDetail.error.networkFailMsg"), {
        type: "error",
        onHide: () => navigation.goBack(),
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 첨부는 작성 화면과 동일하게 항상 JPEG 재인코딩 경로를 태운다(HEIC 서버 거부).
  const addPickedPhotos = async (assets: Asset[]) => {
    const prevCount = note?.images?.length ?? 0;
    const remaining = NOTE_PHOTO_MAX_COUNT - prevCount;
    const picked = assets.slice(0, remaining);
    if (picked.length === 0) return;
    // 잔여 슬롯보다 많이 골랐으면 일부만 첨부된다는 걸 미리 알려준다
    if (picked.length < assets.length) {
      showToast(
        t("tastingNoteWrite.photo.maxReached", { max: NOTE_PHOTO_MAX_COUNT }),
        { type: "info" }
      );
    }

    setIsUploadingPhotos(true);
    try {
      const prepared: string[] = [];
      for (const asset of picked) {
        if (!asset.uri) continue;
        prepared.push(
          await prepareNotePhoto(asset.uri, asset.width, asset.height)
        );
      }
      if (prepared.length === 0) return;

      const response = await uploadTastingNoteImages(tastingNoteId, prepared);
      if (response.isSuccess) {
        setNote((prev) => (prev ? { ...prev, images: response.result } : prev));
        showToast(t("tastingNoteDetail.photo.uploadSuccess"), {
          type: "success",
        });
      } else {
        showToast(response.message || t("tastingNoteDetail.photo.uploadFail"), {
          type: "error",
        });
      }
    } catch (error) {
      console.error("Note photo upload failed:", error);
      // 한도 초과(NOTE4004)는 재시도해도 소용없으니 전용 안내
      if (getApiErrorCode(error) === "NOTE4004") {
        showToast(
          t("tastingNoteWrite.photo.maxReached", { max: NOTE_PHOTO_MAX_COUNT }),
          { type: "info" }
        );
        return;
      }
      // 타임아웃 등에서는 서버 트랜잭션이 뒤늦게 완료됐을 수 있다 —
      // 실패로 안내하기 전에 실제 저장 여부를 재조회로 확인 (중복 재첨부 방지)
      try {
        const refreshed = await getTastingNoteDetail(tastingNoteId);
        if (
          refreshed.isSuccess &&
          (refreshed.result.images?.length ?? 0) > prevCount
        ) {
          setNote(refreshed.result);
          showToast(t("tastingNoteDetail.photo.uploadSuccess"), {
            type: "success",
          });
          return;
        }
      } catch {
        // 재조회도 실패 — 아래 일반 실패 안내로
      }
      showToast(t("tastingNoteDetail.photo.uploadFail"), { type: "error" });
    } finally {
      setIsUploadingPhotos(false);
    }
  };

  const handleAddPhotos = () => {
    if ((note?.images?.length ?? 0) >= NOTE_PHOTO_MAX_COUNT) {
      showToast(
        t("tastingNoteWrite.photo.maxReached", { max: NOTE_PHOTO_MAX_COUNT }),
        { type: "info" }
      );
      return;
    }

    const openCamera = async () => {
      // 촬영본을 갤러리에도 남긴다 — 업로드가 실패하면 임시 폴더 원본은
      // 재첨부할 방법이 없어 사진이 영구 유실된다
      const result = await launchCamera({
        mediaType: "photo",
        saveToPhotos: true,
      });
      if (!result.didCancel && !result.errorCode && result.assets) {
        await addPickedPhotos(result.assets);
      }
    };

    const openGallery = async () => {
      const result = await launchImageLibrary({
        mediaType: "photo",
        selectionLimit: NOTE_PHOTO_MAX_COUNT - (note?.images?.length ?? 0),
      });
      if (!result.didCancel && !result.errorCode && result.assets) {
        await addPickedPhotos(result.assets);
      }
    };

    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [
            t("common.cancel"),
            t("tastingNoteWrite.photo.camera"),
            t("tastingNoteWrite.photo.gallery"),
          ],
          cancelButtonIndex: 0,
        },
        (idx) => {
          if (idx === 1) openCamera();
          else if (idx === 2) openGallery();
        }
      );
    } else {
      Alert.alert(t("tastingNoteWrite.photo.add"), undefined, [
        { text: t("tastingNoteWrite.photo.camera"), onPress: openCamera },
        { text: t("tastingNoteWrite.photo.gallery"), onPress: openGallery },
        { text: t("common.cancel"), style: "cancel" },
      ]);
    }
  };

  const handleDeletePhoto = (imageId: number) => {
    showAlert({
      title: t("tastingNoteDetail.photo.deleteTitle"),
      message: t("tastingNoteDetail.photo.deleteMsg"),
      confirmText: t("tastingNoteDetail.menu.delete"),
      singleButton: false,
      onConfirm: async () => {
        try {
          const response = await deleteTastingNoteImage(tastingNoteId, imageId);
          if (response.isSuccess) {
            setNote((prev) =>
              prev ? { ...prev, images: response.result } : prev
            );
            setPhotoPage((prev) =>
              Math.max(0, Math.min(prev, response.result.length - 1))
            );
          } else {
            showToast(
              response.message || t("tastingNoteDetail.photo.deleteFail"),
              { type: "error" }
            );
          }
        } catch (error) {
          console.error("Note photo delete failed:", error);
          showToast(t("tastingNoteDetail.photo.deleteFail"), {
            type: "error",
          });
        }
      },
    });
  };

  const handleToggleLike = async () => {
    if (!note || note.likeCount == null || likePendingRef.current) {
      return;
    }
    likePendingRef.current = true;
    const wasLiked = !!note.likedByMe;
    const prevCount = note.likeCount;
    // 낙관적 반영 — 실패 시 원복
    setNote((prev) =>
      prev
        ? {
            ...prev,
            likedByMe: !wasLiked,
            likeCount: Math.max(0, prevCount + (wasLiked ? -1 : 1)),
          }
        : prev
    );
    try {
      const res = wasLiked
        ? await unlikeTastingNote(tastingNoteId)
        : await likeTastingNote(tastingNoteId);
      if (!res.isSuccess || !res.result) {
        throw new Error(res.message);
      }
      const { likedByMe, likeCount } = res.result;
      setNote((prev) => (prev ? { ...prev, likedByMe, likeCount } : prev));
      // 피드 카드 카운트 동기화
      appEvents.emit("noteLikeChanged", {
        noteId: tastingNoteId,
        likedByMe,
        likeCount,
      });
    } catch (error) {
      console.error("Note like toggle failed:", error);
      setNote((prev) =>
        prev ? { ...prev, likedByMe: wasLiked, likeCount: prevCount } : prev
      );
      showToast(t(getErrorMessageKey(error)), { type: "error" });
    } finally {
      likePendingRef.current = false;
    }
  };

  const handleSubmitComment = async () => {
    const content = commentInput.trim();
    if (!content || isSubmittingComment) {
      return;
    }
    setIsSubmittingComment(true);
    try {
      const res = await addNoteComment(tastingNoteId, content);
      if (!res.isSuccess || !res.result) {
        throw new Error(res.message);
      }
      setCommentInput("");
      setCommentCount(res.result.commentCount);
      appEvents.emit("noteCommentCountChanged", {
        noteId: tastingNoteId,
        commentCount: res.result.commentCount,
      });
      await loadComments();
    } catch (error) {
      console.error("Failed to add note comment:", error);
      showToast(t("noteComments.addFail"), { type: "error" });
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeleteComment = (comment: NoteCommentDTO) => {
    showAlert({
      title: t("noteComments.deleteTitle"),
      message: t("noteComments.deleteMsg"),
      confirmText: t("tastingNoteDetail.menu.delete"),
      singleButton: false,
      onConfirm: async () => {
        try {
          const res = await deleteNoteComment(tastingNoteId, comment.commentId);
          if (!res.isSuccess || !res.result) {
            throw new Error(res.message);
          }
          setCommentCount(res.result.commentCount);
          setComments((prev) =>
            prev.filter((c) => c.commentId !== comment.commentId)
          );
          appEvents.emit("noteCommentCountChanged", {
            noteId: tastingNoteId,
            commentCount: res.result.commentCount,
          });
        } catch (error) {
          console.error("Failed to delete note comment:", error);
          showToast(t("noteComments.deleteFail"), { type: "error" });
        }
      },
    });
  };

  const handleReportComment = (comment: NoteCommentDTO) => {
    sendContentReport(
      "COMMENT",
      {
        writerName: comment.authorName,
        commentContent: comment.content,
        targetId: comment.commentId,
      },
      {
        onSuccess: () =>
          showToast(t("contentReport.success"), { type: "success" }),
        onError: () => showToast(t("contentReport.error"), { type: "error" }),
      }
    );
  };

  // 타인 노트 신고 — 기존 리뷰 신고 플로우(사유 입력 → POST /report) 재사용
  const handleReport = () => {
    if (!note) return;
    sendContentReport(
      "REVIEW",
      {
        writerName: note.authorName || "-",
        reviewDate: note.tasteDate,
        reviewContent: note.review,
      },
      {
        onSuccess: () =>
          showToast(t("contentReport.success"), { type: "success" }),
        onError: () => showToast(t("contentReport.error"), { type: "error" }),
      }
    );
  };

  // 타인 작성자 차단 — 차단 후에는 이 노트도 볼 수 없으므로 목록으로 돌아간다
  const handleBlockAuthor = () => {
    if (!note?.authorId) return;
    const authorId = note.authorId;
    Alert.alert(
      t("userProfile.blockConfirmTitle"),
      t("userProfile.blockConfirmMsg"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("userProfile.blockAction"),
          style: "destructive",
          onPress: async () => {
            try {
              const res = await blockMember(authorId);
              if (!res.isSuccess) throw new Error(res.message);
              // 이미 렌더된 피드 목록에서도 이 작성자의 카드를 걷어낸다
              appEvents.emit("memberBlocked", authorId);
              showToast(t("userProfile.blockSuccess"), {
                type: "success",
                onHide: () => navigation.goBack(),
              });
            } catch (error) {
              console.error("Failed to block author:", error);
              showToast(t("userProfile.error.blockFail"), { type: "error" });
            }
          },
        },
      ]
    );
  };

  const handleDelete = () => {
    showAlert({
      title: t("tastingNoteDetail.delete.title"),
      message: t("tastingNoteDetail.delete.message"),
      confirmText: t("tastingNoteDetail.delete.confirm"),
      singleButton: false,
      onConfirm: async () => {
        try {
          const response = await deleteTastingNote(tastingNoteId);
          if (response.isSuccess) {
            showToast(t("tastingNoteDetail.delete.successMsg"), {
              type: "success",
              onHide: () => navigation.goBack(),
            });
          } else {
            showToast(
              response.message || t("tastingNoteDetail.delete.failMsg"),
              { type: "error" }
            );
          }
        } catch (error) {
          console.error("Failed to delete tasting note:", error);
          showToast(t("tastingNoteDetail.delete.networkFailMsg"), {
            type: "error",
          });
        }
      },
    });
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={accent.text} />
      </View>
    );
  }

  if (!note) return null;

  const parseReview = (fullReview: string) => {
    const finishMatch = fullReview.match(/\[Finish\] (.*?)(?:\n\n|$)/s);
    const finishTextRaw = finishMatch ? finishMatch[1] : null;

    const finishTags = finishTextRaw
      ? finishTextRaw
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag.length > 0)
      : [];

    let reviewText = fullReview.replace(/\[Finish\] .*?(?:\n\n|$)/s, "").trim();

    return { finishTags, reviewText };
  };

  const { finishTags, reviewText } = parseReview(note.review);
  const photos = note.images ?? [];
  // 업로드(재인코딩 포함, 수십 초 가능) 동안 페이저 끝에 처리 중 페이지를 붙여
  // 헤더의 작은 스피너만으로는 안 보이던 진행 상태를 사진 영역에서도 보여준다
  const PROCESSING_PAGE: TastingNoteImageDTO = { imageId: -1, imageUrl: "" };
  const pagerData = isUploadingPhotos ? [...photos, PROCESSING_PAGE] : photos;
  // 구 서버는 mine을 안 내려주므로 undefined면 내 노트로 취급 (기존 동작 보존)
  const isMine = note.mine !== false;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      <GlassHeader
        floating={false}
        title={t("tastingNoteDetail.header")}
        left={
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel={t("common.back")}
          >
            <Ionicons name="arrow-back" size={22} color={colors.white} />
          </TouchableOpacity>
        }
        right={
          <TouchableOpacity
            onPress={() => setMenuVisible(true)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={{ padding: 4 }}
            accessibilityRole="button"
            accessibilityLabel={t("common.more")}
          >
            <Ionicons
              name="ellipsis-horizontal"
              size={24}
              color={colors.white}
            />
          </TouchableOpacity>
        }
      />

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.hero}>
            <View style={styles.heroImageBox}>
              {note.imageUrl ? (
                <Image
                  source={{ uri: note.imageUrl }}
                  style={styles.heroImage}
                  resizeMode="contain"
                />
              ) : (
                <Image
                  source={getWinePlaceholderImage(note.sort)}
                  style={styles.heroImage}
                  resizeMode="contain"
                />
              )}
            </View>

            <View style={styles.heroInfo}>
              <View style={styles.heroTopRow}>
                <View
                  style={[
                    styles.typeBadge,
                    { backgroundColor: getWineTypeColor(note.sort || "") },
                  ]}
                >
                  <Text style={styles.typeText}>{note.sort || "Wine"}</Text>
                </View>
                <Text style={styles.dateText}>{note.tasteDate}</Text>
              </View>

              <Text style={styles.wineName} numberOfLines={3}>
                {i18n.language === "en"
                  ? note.wineNameEng || note.wineName
                  : note.wineName}
              </Text>
              <Text style={styles.vintageText}>
                {note.vintageYear === 0
                  ? t("tastingNoteDetail.info.nv")
                  : t("tastingNoteDetail.info.vintage", {
                      year: note.vintageYear,
                    })}
              </Text>
            </View>
          </View>

          {!isMine && note.authorName ? (
            <TouchableOpacity
              style={styles.authorRow}
              onPress={() =>
                note.authorId &&
                navigation.navigate("UserProfile", { memberId: note.authorId })
              }
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={note.authorName}
            >
              <Image
                source={
                  note.authorImageUrl
                    ? { uri: note.authorImageUrl }
                    : require("../assets/Standard_profile.png")
                }
                style={styles.authorAvatar}
              />
              <Text style={styles.authorName} numberOfLines={1}>
                {note.authorName}
              </Text>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={colors.textTertiary}
              />
            </TouchableOpacity>
          ) : null}

          {(isMine || photos.length > 0) && (
            <View style={styles.card}>
              <View style={styles.photoHeaderRow}>
                <Text style={styles.cardTitle}>
                  {t("tastingNoteDetail.photo.title")} ({photos.length}/
                  {NOTE_PHOTO_MAX_COUNT})
                </Text>
                {isMine && photos.length < NOTE_PHOTO_MAX_COUNT && (
                  <TouchableOpacity
                    onPress={handleAddPhotos}
                    disabled={isUploadingPhotos}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    accessibilityRole="button"
                    accessibilityLabel={t("tastingNoteWrite.photo.add")}
                  >
                    {isUploadingPhotos ? (
                      <ActivityIndicator size="small" color={accent.text} />
                    ) : (
                      <Ionicons name="add" size={22} color={accent.text} />
                    )}
                  </TouchableOpacity>
                )}
              </View>

              {photos.length > 0 ? (
                <View
                  onLayout={(e) => setPagerWidth(e.nativeEvent.layout.width)}
                >
                  {pagerWidth > 0 && (
                    <FlatList
                      data={pagerData}
                      horizontal
                      pagingEnabled
                      showsHorizontalScrollIndicator={false}
                      keyExtractor={(img) => String(img.imageId)}
                      onMomentumScrollEnd={(e) =>
                        setPhotoPage(
                          Math.round(e.nativeEvent.contentOffset.x / pagerWidth)
                        )
                      }
                      renderItem={({ item, index }) =>
                        item.imageId === -1 ? (
                          <View
                            style={[
                              styles.photoPageImage,
                              styles.photoProcessingPage,
                              { width: pagerWidth },
                            ]}
                          >
                            <ActivityIndicator
                              size="small"
                              color={accent.text}
                            />
                          </View>
                        ) : (
                          <View
                            style={{ width: pagerWidth }}
                            accessible
                            accessibilityLabel={t(
                              "tastingNoteWrite.photo.pageA11y",
                              { current: index + 1, total: photos.length }
                            )}
                          >
                            <Image
                              source={{ uri: item.imageUrl }}
                              style={styles.photoPageImage}
                              resizeMode="cover"
                            />
                            {isMine && (
                              <TouchableOpacity
                                style={styles.photoDeleteBadge}
                                onPress={() => handleDeletePhoto(item.imageId)}
                                hitSlop={{
                                  top: 8,
                                  bottom: 8,
                                  left: 8,
                                  right: 8,
                                }}
                                accessibilityRole="button"
                                accessibilityLabel={t(
                                  "tastingNoteWrite.photo.remove"
                                )}
                              >
                                <Ionicons
                                  name="trash-outline"
                                  size={14}
                                  color={colors.white}
                                />
                              </TouchableOpacity>
                            )}
                          </View>
                        )
                      }
                    />
                  )}
                  {photos.length > 1 && (
                    <View style={styles.photoDots}>
                      {photos.map((img, index) => (
                        <View
                          key={img.imageId}
                          style={[
                            styles.photoDot,
                            index === photoPage && styles.photoDotActive,
                          ]}
                        />
                      ))}
                    </View>
                  )}
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.photoEmpty}
                  onPress={handleAddPhotos}
                  disabled={isUploadingPhotos}
                  accessibilityRole="button"
                  accessibilityLabel={t("tastingNoteWrite.photo.add")}
                >
                  {isUploadingPhotos ? (
                    <ActivityIndicator size="small" color={accent.text} />
                  ) : (
                    <Ionicons
                      name="camera-outline"
                      size={24}
                      color={colors.textTertiary}
                    />
                  )}
                  <Text style={styles.emptyText}>
                    {t("tastingNoteDetail.photo.empty")}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {note.likeCount != null && (
            <View style={styles.socialRow}>
              <TouchableOpacity
                style={styles.socialItem}
                onPress={handleToggleLike}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityRole="button"
                accessibilityLabel={t("feed.like")}
                accessibilityState={{ selected: !!note.likedByMe }}
              >
                <Ionicons
                  name={note.likedByMe ? "heart" : "heart-outline"}
                  size={26}
                  color={note.likedByMe ? accent.base : colors.textPrimary}
                />
                {(note.likeCount ?? 0) > 0 && (
                  <Text style={styles.socialCount}>{note.likeCount}</Text>
                )}
              </TouchableOpacity>
              <View style={styles.socialItem}>
                <Ionicons
                  name="chatbubble-outline"
                  size={23}
                  color={colors.textPrimary}
                />
                {commentCount > 0 && (
                  <Text style={styles.socialCount}>{commentCount}</Text>
                )}
              </View>
            </View>
          )}

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>
                {t("tastingNoteWrite.conclusion.ratingLabel")}
              </Text>
              <View style={styles.statValueRow}>
                <Ionicons name="star" size={20} color={RATING_STAR} />
                <Text style={styles.ratingValue}>{note.rating.toFixed(1)}</Text>
              </View>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statLabel}>
                {t("tastingNoteDetail.info.color")}
              </Text>
              <View style={styles.statValueRow}>
                <View
                  style={[
                    styles.colorSwatch,
                    { backgroundColor: getHexColorFromValue(note.color) },
                  ]}
                />
                <Text style={styles.colorLabel} numberOfLines={1}>
                  {getColorLabel(note.color) || "-"}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              {t("tastingNoteDetail.info.palate")}
            </Text>
            <View style={styles.chartContainer}>
              <PentagonRadarChart
                data={{
                  acidity: note.acidity / 20,
                  sweetness: note.sweetness / 20,
                  tannin: note.tannin / 20,
                  body: note.body / 20,
                  alcohol: note.alcohol / 20,
                }}
                size={180}
              />
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              {t("tastingNoteDetail.info.nose")}
            </Text>
            <View style={styles.chipWrap}>
              {note.noseList && note.noseList.length > 0 ? (
                note.noseList.map((scent, index) => (
                  <View key={index} style={styles.chip}>
                    <Text style={styles.chipText}>{scent}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>-</Text>
              )}
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              {t("tastingNoteDetail.info.finish")}
            </Text>
            <View style={styles.chipWrap}>
              {finishTags.length > 0 ? (
                finishTags.map((tag, index) => (
                  <View key={index} style={styles.chip}>
                    <Text style={styles.chipText}>{tag}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>-</Text>
              )}
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              {t("tastingNoteDetail.info.review")}
            </Text>
            <Text style={styles.bodyText}>
              {reviewText || t("tastingNoteDetail.info.emptyReview")}
            </Text>
          </View>

          {note.likeCount != null && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>
                {t("noteComments.title")}
                {commentCount > 0 ? ` (${commentCount})` : ""}
              </Text>

              {isLoadingComments ? (
                <ActivityIndicator size="small" color={accent.text} />
              ) : commentsErrored ? (
                <TouchableOpacity
                  style={styles.commentsError}
                  onPress={loadComments}
                  accessibilityRole="button"
                  accessibilityLabel={t("common.retry")}
                >
                  <Text style={styles.emptyText}>
                    {t("noteComments.loadFail")}
                  </Text>
                  <Text style={styles.commentsRetryText}>
                    {t("common.retry")}
                  </Text>
                </TouchableOpacity>
              ) : comments.length === 0 ? (
                <Text style={styles.emptyText}>{t("noteComments.empty")}</Text>
              ) : (
                comments.map((comment) => (
                  <View key={comment.commentId} style={styles.commentRow}>
                    <TouchableOpacity
                      onPress={() =>
                        comment.mine
                          ? navigation.navigate("Main", { screen: "Profile" })
                          : navigation.navigate("UserProfile", {
                              memberId: comment.authorId,
                            })
                      }
                      accessibilityRole="button"
                      accessibilityLabel={comment.authorName}
                    >
                      <Image
                        source={
                          comment.authorImageUrl
                            ? { uri: comment.authorImageUrl }
                            : require("../assets/Standard_profile.png")
                        }
                        style={styles.commentAvatar}
                      />
                    </TouchableOpacity>
                    <View style={styles.commentBody}>
                      <View style={styles.commentMetaRow}>
                        <Text style={styles.commentAuthor} numberOfLines={1}>
                          {comment.authorName}
                        </Text>
                        <Text style={styles.commentDate}>
                          {comment.createdAt?.slice(0, 10)}
                        </Text>
                      </View>
                      <Text style={styles.commentContent}>
                        {comment.content}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.commentAction}
                      onPress={() =>
                        comment.canDelete
                          ? handleDeleteComment(comment)
                          : handleReportComment(comment)
                      }
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      accessibilityRole="button"
                      accessibilityLabel={
                        comment.canDelete
                          ? t("noteComments.deleteTitle")
                          : t("contentReport.commentTitle")
                      }
                    >
                      <Ionicons
                        name={
                          comment.canDelete ? "trash-outline" : "flag-outline"
                        }
                        size={15}
                        color={colors.textTertiary}
                      />
                    </TouchableOpacity>
                  </View>
                ))
              )}

              <View style={styles.commentInputRow}>
                <TextInput
                  style={styles.commentInput}
                  value={commentInput}
                  onChangeText={setCommentInput}
                  placeholder={t("noteComments.inputPlaceholder")}
                  placeholderTextColor={colors.textTertiary}
                  maxLength={300}
                  multiline
                />
                <TouchableOpacity
                  onPress={handleSubmitComment}
                  disabled={!commentInput.trim() || isSubmittingComment}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityRole="button"
                  accessibilityLabel={t("noteComments.send")}
                >
                  {isSubmittingComment ? (
                    <ActivityIndicator size="small" color={accent.text} />
                  ) : (
                    <Ionicons
                      name="arrow-up-circle"
                      size={30}
                      color={
                        commentInput.trim() ? accent.base : colors.textTertiary
                      }
                    />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <ActionMenuSheet
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        cancelLabel={t("tastingNoteDetail.menu.cancel")}
        actions={
          isMine
            ? [
                {
                  label: t("tastingNoteDetail.menu.delete"),
                  icon: "trash-outline",
                  destructive: true,
                  onPress: handleDelete,
                },
              ]
            : [
                {
                  label: t("tastingNoteDetail.menu.report"),
                  icon: "flag-outline",
                  destructive: true,
                  onPress: handleReport,
                },
                {
                  label: t("tastingNoteDetail.menu.block"),
                  icon: "ban-outline",
                  destructive: true,
                  onPress: handleBlockAuthor,
                },
              ]
        }
      />
    </SafeAreaView>
  );
}

const getHexColorFromValue = (value: string) => {
  if (!value) return "transparent";
  for (const paletteKey in COLOR_PALETTES) {
    const palette = COLOR_PALETTES[paletteKey];
    const found = palette.find((item) => item.value === value);
    if (found) return found.color;
  }
  return value.startsWith("#") ? value : "transparent";
};

const getColorLabel = (value: string) => {
  if (!value) return "";
  for (const paletteKey in COLOR_PALETTES) {
    const found = COLOR_PALETTES[paletteKey].find(
      (item) => item.value === value
    );
    if (found) return found.label;
  }
  return value;
};

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
    padding: spacing.xl,
    gap: spacing.lg,
    paddingBottom: spacing.xxxl,
  },

  // Hero
  hero: {
    flexDirection: "row",
    gap: spacing.lg,
  },
  heroImageBox: {
    width: 96,
    height: 128,
    borderRadius: radius.sm,
    overflow: "hidden",
    backgroundColor: surfaces.imageWell,
    borderWidth: 1,
    borderColor: surfaces.hairline,
    justifyContent: "center",
    alignItems: "center",
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  heroInfo: {
    flex: 1,
    justifyContent: "center",
    gap: spacing.sm,
  },
  heroTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  typeBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  typeText: {
    color: WINE_TYPE_ON_COLOR,
    fontSize: 10,
    fontWeight: "bold",
  },
  dateText: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  wineName: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: "800",
    lineHeight: 26,
    letterSpacing: -0.3,
  },
  vintageText: {
    color: colors.textSecondary,
    fontSize: 14,
  },

  // Stat cards
  statsRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: surfaces.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: surfaces.hairline,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  statLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: "600",
  },
  statValueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  ratingValue: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: "800",
  },
  colorSwatch: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: surfaces.hairlineStrong,
  },
  colorLabel: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "700",
  },

  // Cards
  card: {
    backgroundColor: surfaces.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: surfaces.hairline,
    padding: spacing.lg,
    gap: spacing.md,
  },
  cardTitle: {
    color: accent.text,
    fontSize: 14,
    fontWeight: "700",
  },
  chartContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.sm,
  },

  // 타인 노트 작성자 행
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: surfaces.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: surfaces.hairline,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  authorAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: surfaces.raised,
  },
  authorName: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "700",
  },

  // Photos
  photoHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  // 마이페이지 그리드/작성 미리보기와 동일한 3:4 — 크롭으로 잡은 프레이밍이 그대로 보인다
  photoPageImage: {
    width: "100%",
    aspectRatio: NOTE_PHOTO_GRID_ASPECT,
    borderRadius: radius.sm,
  },
  photoDeleteBadge: {
    position: "absolute",
    top: spacing.sm,
    right: spacing.sm,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: surfaces.scrim,
    alignItems: "center",
    justifyContent: "center",
  },
  photoProcessingPage: {
    backgroundColor: surfaces.raised,
    alignItems: "center",
    justifyContent: "center",
  },
  photoDots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.xs,
    marginTop: spacing.md,
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
  photoEmpty: {
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.xl,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: surfaces.hairlineStrong,
  },
  chipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  chip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: accent.soft,
    borderWidth: 1,
    borderColor: accent.border,
  },
  chipText: {
    color: accent.text,
    fontSize: 13,
    fontWeight: "600",
  },
  emptyText: {
    color: colors.textTertiary,
    fontSize: 13,
  },
  bodyText: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 22,
  },

  // 좋아요/댓글
  socialRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xl,
    paddingHorizontal: spacing.xs,
  },
  socialItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  socialCount: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "600",
  },
  commentRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  commentAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: surfaces.raised,
  },
  commentBody: {
    flex: 1,
    gap: 2,
  },
  commentMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  commentAuthor: {
    flexShrink: 1,
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: "700",
  },
  commentDate: {
    color: colors.textTertiary,
    fontSize: 11,
  },
  commentContent: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  commentAction: {
    paddingTop: 2,
  },
  commentsError: {
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: spacing.sm,
  },
  commentsRetryText: {
    color: accent.text,
    fontSize: 13,
    fontWeight: "700",
  },
  commentInputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  commentInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: surfaces.hairline,
    backgroundColor: surfaces.raised,
    color: colors.textPrimary,
    fontSize: 14,
  },
});
