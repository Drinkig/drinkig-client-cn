import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { COLOR_PALETTES } from "./constants";
import { colors } from "../../constants/colors";
import { spacing, radius, accent, surfaces } from "../../constants/theme";
import { useTranslation } from "react-i18next";

interface ColorSelectorProps {
  wineType?: string;
  selectedColor: string;
  onSelectColor: (color: string) => void;
}

export default function ColorSelector({
  wineType,
  selectedColor,
  onSelectColor,
}: ColorSelectorProps) {
  const { t } = useTranslation();

  const getPaletteType = (type?: string) => {
    if (!type) return "RED";
    const upper = type.toUpperCase();
    if (upper === "RED" || upper === "레드") return "RED";
    if (upper === "WHITE" || upper === "화이트") return "WHITE";
    if (upper === "ROSE" || upper === "로제") return "ROSE";
    if (upper === "SPARKLING" || upper === "스파클링") return "SPARKLING";
    if (upper === "DESSERT" || upper === "디저트") return "DESSERT";
    if (upper === "FORTIFIED" || upper === "주정강화") return "FORTIFIED";
    return "RED";
  };

  const paletteType = getPaletteType(wineType);
  const palette = COLOR_PALETTES[paletteType] || COLOR_PALETTES.WHITE;
  const selected = palette.find((p) => p.value === selectedColor);

  return (
    <View>
      <View style={styles.headerRow}>
        <Text style={styles.prompt}>{t("tastingNoteWrite.color.prompt")}</Text>
        {selected ? (
          <View style={styles.selectedReadout}>
            <View
              style={[
                styles.readoutSwatch,
                { backgroundColor: selected.color },
              ]}
            />
            <Text style={styles.readoutLabel}>{selected.label}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.palette}>
        {palette.map((option) => {
          const isSelected = selectedColor === option.value;
          return (
            <TouchableOpacity
              key={option.value}
              style={styles.swatchSlot}
              onPress={() => onSelectColor(option.value)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={option.label}
              accessibilityState={{ selected: isSelected }}
            >
              <View
                style={[
                  styles.swatchRing,
                  isSelected && styles.swatchRingSelected,
                ]}
              >
                <View
                  style={[styles.swatch, { backgroundColor: option.color }]}
                >
                  {isSelected && (
                    <Icon name="checkmark" size={18} color="#fff" />
                  )}
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const SWATCH = 40;

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
  },
  prompt: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  selectedReadout: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: surfaces.card,
    borderWidth: 1,
    borderColor: surfaces.hairline,
  },
  readoutSwatch: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: surfaces.hairlineStrong,
  },
  readoutLabel: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: "600",
  },
  palette: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: spacing.md,
    justifyContent: "space-between",
  },
  swatchSlot: {
    width: "16.66%",
    alignItems: "center",
  },
  swatchRing: {
    width: SWATCH + 8,
    height: SWATCH + 8,
    borderRadius: (SWATCH + 8) / 2,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  swatchRingSelected: {
    borderColor: accent.base,
  },
  swatch: {
    width: SWATCH,
    height: SWATCH,
    borderRadius: SWATCH / 2,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: surfaces.hairlineStrong,
  },
});
