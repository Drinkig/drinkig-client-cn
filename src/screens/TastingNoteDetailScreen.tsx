import React, { useState, useEffect } from "react";
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
  Platform,
  ScrollView,
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
  deleteTastingNote,
  deleteTastingNoteImage,
  uploadTastingNoteImages,
} from "../api/wine";
import { NOTE_PHOTO_MAX_COUNT, prepareNotePhoto } from "../utils/notePhoto";
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

  useEffect(() => {
    fetchNoteDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tastingNoteId]);

  const fetchNoteDetail = async () => {
    try {
      setIsLoading(true);
      const response = await getTastingNoteDetail(tastingNoteId);
      if (response.isSuccess) {
        setNote(response.result);
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
    const remaining = NOTE_PHOTO_MAX_COUNT - (note?.images?.length ?? 0);
    const picked = assets.slice(0, remaining);
    if (picked.length === 0) return;

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
      } else {
        showToast(response.message || t("tastingNoteDetail.photo.uploadFail"), {
          type: "error",
        });
      }
    } catch (error) {
      console.error("Note photo upload failed:", error);
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
      const result = await launchCamera({ mediaType: "photo" });
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
        <ActivityIndicator size="large" color={colors.primary} />
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
          >
            <Ionicons name="arrow-back" size={22} color={colors.white} />
          </TouchableOpacity>
        }
        right={
          <TouchableOpacity
            onPress={() => setMenuVisible(true)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={{ padding: 4 }}
          >
            <Ionicons
              name="ellipsis-horizontal"
              size={24}
              color={colors.white}
            />
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
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
              <View onLayout={(e) => setPagerWidth(e.nativeEvent.layout.width)}>
                {pagerWidth > 0 && (
                  <FlatList
                    data={photos}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={(img) => String(img.imageId)}
                    onMomentumScrollEnd={(e) =>
                      setPhotoPage(
                        Math.round(e.nativeEvent.contentOffset.x / pagerWidth)
                      )
                    }
                    renderItem={({ item }) => (
                      <View style={{ width: pagerWidth }}>
                        <Image
                          source={{ uri: item.imageUrl }}
                          style={styles.photoPageImage}
                          resizeMode="cover"
                        />
                        {isMine && (
                          <TouchableOpacity
                            style={styles.photoDeleteBadge}
                            onPress={() => handleDeletePhoto(item.imageId)}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
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
                    )}
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
                <Ionicons
                  name="camera-outline"
                  size={24}
                  color={colors.textTertiary}
                />
                <Text style={styles.emptyText}>
                  {t("tastingNoteDetail.photo.empty")}
                </Text>
              </TouchableOpacity>
            )}
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
      </ScrollView>

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
  photoPageImage: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: radius.sm,
  },
  photoDeleteBadge: {
    position: "absolute",
    top: spacing.sm,
    right: spacing.sm,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
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
});
