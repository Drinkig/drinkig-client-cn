import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { colors } from "../../constants/colors";
import { spacing, radius, accent, surfaces } from "../../constants/theme";
import { useTranslation } from "react-i18next";

interface TasteLevelSelectorProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  onHelpPress?: () => void;
}

export default function TasteLevelSelector({
  label,
  value,
  onChange,
  onHelpPress,
}: TasteLevelSelectorProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <View style={styles.labelLeft}>
          <Text style={styles.label}>{label}</Text>
          {onHelpPress && (
            <TouchableOpacity onPress={onHelpPress} style={styles.helpButton}>
              <Icon
                name="help-circle-outline"
                size={18}
                color={colors.textTertiary}
              />
            </TouchableOpacity>
          )}
        </View>
        <View style={[styles.valueBadge, value > 0 && styles.valueBadgeActive]}>
          <Text style={[styles.valueText, value > 0 && styles.valueTextActive]}>
            {value > 0 ? value : "-"}
          </Text>
        </View>
      </View>

      <View style={styles.segments}>
        {[1, 2, 3, 4, 5].map((level) => (
          <TouchableOpacity
            key={level}
            style={styles.segmentTouch}
            onPress={() => onChange(level)}
            activeOpacity={0.7}
          >
            <View
              style={[styles.segment, level <= value && styles.segmentFilled]}
            />
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.rangeRow}>
        <Text style={styles.rangeText}>
          {t("tastingNoteWrite.tasteLevel.weak")}
        </Text>
        <Text style={styles.rangeText}>
          {t("tastingNoteWrite.tasteLevel.strong")}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.xxl,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  labelLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  label: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: "600",
  },
  helpButton: {
    marginLeft: spacing.xs,
    padding: 2,
  },
  valueBadge: {
    minWidth: 26,
    height: 26,
    borderRadius: 13,
    paddingHorizontal: spacing.sm,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: surfaces.card,
  },
  valueBadgeActive: {
    backgroundColor: accent.soft,
  },
  valueText: {
    color: colors.textTertiary,
    fontSize: 13,
    fontWeight: "700",
  },
  valueTextActive: {
    color: accent.text,
  },
  segments: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  segmentTouch: {
    flex: 1,
    paddingVertical: spacing.xs,
  },
  segment: {
    height: 10,
    borderRadius: radius.pill,
    backgroundColor: surfaces.card,
    borderWidth: 1,
    borderColor: surfaces.hairline,
  },
  segmentFilled: {
    backgroundColor: accent.base,
    borderColor: accent.base,
  },
  rangeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.sm,
  },
  rangeText: {
    color: colors.textTertiary,
    fontSize: 12,
  },
});
