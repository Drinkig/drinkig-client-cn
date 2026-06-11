import React from "react";
import { View, Text, StyleSheet } from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import FeatureGauge from "../FeatureGauge";
import { colors } from "../../../constants/colors";
import { surfaces, radius } from "../../../constants/theme";
import { useTranslation } from "react-i18next";

interface InfoTabProps {
  type: string;
  country: string;
  grape: string;
  description: string | null;
  features: {
    sweetness: number;
    acidity: number;
    body: number;
    tannin: number;
  } | null;
  nose: string[] | null;
  palate: string[] | null;
  finish: string[] | null;
  showTastingNotes: boolean;
}

export default function InfoTab({
  type,
  country,
  grape,
  description,
  features,
  nose,
  palate,
  finish,
  showTastingNotes,
}: InfoTabProps) {
  const { t, i18n } = useTranslation();
  const isKorean = i18n.language === "ko";

  return (
    <View style={styles.tabContent}>
      <View style={styles.wineInfoCard}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>{t("wineDetail.type")}</Text>
          <Text style={styles.infoValue}>{type}</Text>
        </View>
        <View style={styles.infoSeparator} />
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>{t("wineDetail.country")}</Text>
          <Text style={styles.infoValue}>{country}</Text>
        </View>
        <View style={styles.infoSeparator} />
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>{t("wineDetail.grape")}</Text>
          <Text style={styles.infoValue}>{grape}</Text>
        </View>
      </View>

      {description && (
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>
            {t("wineDetail.info.descTitle")}
          </Text>
          <Text style={styles.description}>{description}</Text>
        </View>
      )}

      {showTastingNotes && (
        <>
          {features && (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>
                {t("wineDetail.info.noteTitle")}
              </Text>
              <View style={styles.featuresContainer}>
                <FeatureGauge
                  label={t("taste.sweetness")}
                  value={features.sweetness}
                />
                <FeatureGauge
                  label={t("taste.acidity")}
                  value={features.acidity}
                />
                <FeatureGauge label={t("taste.body")} value={features.body} />
                <FeatureGauge
                  label={t("taste.tannin")}
                  value={features.tannin}
                />
              </View>
            </View>
          )}

          {nose && nose.length > 0 && (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>
                {t("wineDetail.info.nose")}
                {isKorean && <Text style={styles.subTitleText}> (Nose)</Text>}
              </Text>
              <Text style={styles.aromaListText}>{nose.join(", ")}</Text>
            </View>
          )}

          {palate && palate.length > 0 && (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>
                {t("wineDetail.info.palate")}
                {isKorean && <Text style={styles.subTitleText}> (Palate)</Text>}
              </Text>
              <Text style={styles.aromaListText}>{palate.join(", ")}</Text>
            </View>
          )}

          {finish && finish.length > 0 && (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>
                {t("wineDetail.info.finish")}
                {isKorean && <Text style={styles.subTitleText}> (Finish)</Text>}
              </Text>
              <Text style={styles.aromaListText}>{finish.join(", ")}</Text>
            </View>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tabContent: {
    paddingTop: 24,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyText: {
    color: "#666",
    fontSize: 16,
  },
  wineInfoCard: {
    marginHorizontal: 24,
    marginBottom: 28,
    backgroundColor: surfaces.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: surfaces.hairline,
    paddingVertical: 4,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  infoLabel: {
    fontSize: 15,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 15,
    color: colors.white,
    fontWeight: "600",
    flex: 1,
    textAlign: "right",
    marginLeft: 16,
  },
  infoSeparator: {
    height: 1,
    backgroundColor: surfaces.hairline,
    marginHorizontal: 16,
  },
  sectionContainer: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.white,
    marginBottom: 16,
  },
  description: {
    fontSize: 15,
    color: "#ccc",
    lineHeight: 24,
  },
  featuresContainer: {
    gap: 12,
  },
  subTitleText: {
    fontSize: 14,
    fontWeight: "normal",
    color: "#aaa",
  },
  aromaListText: {
    color: "#ccc",
    fontSize: 15,
    lineHeight: 24,
  },
});
