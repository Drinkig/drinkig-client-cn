import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors } from "../../constants/colors";
import { surfaces, accent, radius } from "../../constants/theme";
import { useTranslation } from "react-i18next";

interface PriceStatsProps {
  prices: { price: number }[];
}

export default function PriceStats({ prices }: PriceStatsProps) {
  const { t } = useTranslation();

  if (!prices || prices.length === 0)
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateText}>{t("wineDetail.price.empty")}</Text>
      </View>
    );

  const priceValues = prices.map((p) => p.price);
  const avgPrice = Math.round(
    priceValues.reduce((a, b) => a + b, 0) / priceValues.length
  );
  const minPrice = Math.min(...priceValues);
  const maxPrice = Math.max(...priceValues);

  return (
    <View style={styles.priceStatsContainer}>
      <View style={styles.avgPriceContainer}>
        <Text style={styles.avgPriceLabel}>
          {t("wineDetail.price.avgPrice")}
        </Text>
        <Text style={styles.avgPriceValue}>₩{avgPrice.toLocaleString()}</Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.rangeContainer}>
        <View style={styles.rangeItem}>
          <Text style={styles.rangeLabel}>{t("wineDetail.price.lowest")}</Text>
          <Text style={styles.rangeValue}>₩{minPrice.toLocaleString()}</Text>
        </View>
        <View style={styles.rangeItem}>
          <Text style={styles.rangeLabel}>{t("wineDetail.price.highest")}</Text>
          <Text style={styles.rangeValue}>₩{maxPrice.toLocaleString()}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  emptyState: {
    padding: 40,
    alignItems: "center",
  },
  emptyStateText: {
    color: colors.textTertiary,
    fontSize: 16,
  },
  priceStatsContainer: {
    backgroundColor: surfaces.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: surfaces.hairline,
    padding: 20,
    marginBottom: 12,
  },
  avgPriceContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  avgPriceLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  avgPriceValue: {
    fontSize: 26,
    fontWeight: "bold",
    color: accent.text,
  },
  divider: {
    height: 1,
    backgroundColor: surfaces.hairline,
    marginBottom: 16,
  },
  rangeContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  rangeItem: {
    alignItems: "center",
  },
  rangeLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  rangeValue: {
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: "600",
  },
});
