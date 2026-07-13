import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Image,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "../types";
import {
  getTastingNoteDetail,
  TastingNoteDTO,
  deleteTastingNote,
} from "../api/wine";
import { useGlobalUI } from "../context/GlobalUIContext";
import PentagonRadarChart from "../components/common/PentagonRadarChart";
import { COLOR_PALETTES } from "../components/tasting_note/constants";
import { colors } from "../constants/colors";
import { spacing, radius, accent, surfaces } from "../constants/theme";
import { getWineTypeColor, WINE_TYPE_ON_COLOR } from "../constants/wineColors";
import { useTranslation } from "react-i18next";
import GlassHeader from "../components/common/GlassHeader";
import ActionMenuSheet from "../components/common/ActionMenuSheet";

const RATING_GOLD = colors.ratingGold;

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

  useEffect(() => {
    fetchNoteDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tastingNoteId]);

  const fetchNoteDetail = async () => {
    try {
      setIsLoading(true);
      const response = await getTastingNoteDetail(tastingNoteId);
      if (response.isSuccess) {
        let noteData = response.result;
        if (!noteData.imageUrl && noteData.wineId) {
          noteData.imageUrl = `https://drinkeg-bucket-1.s3.ap-northeast-2.amazonaws.com/wine/${noteData.wineId}.png`;
        }
        setNote(noteData);
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
              <Ionicons name="wine" size={40} color={colors.textTertiary} />
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

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>
              {t("tastingNoteWrite.conclusion.ratingLabel")}
            </Text>
            <View style={styles.statValueRow}>
              <Ionicons name="star" size={20} color={RATING_GOLD} />
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
        actions={[
          {
            label: t("tastingNoteDetail.menu.delete"),
            icon: "trash-outline",
            destructive: true,
            onPress: handleDelete,
          },
        ]}
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
