import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors } from "../../constants/colors";
import { spacing, radius, accent, surfaces } from "../../constants/theme";

interface StepProgressProps {
  steps: string[];
  current: number; // 0-indexed
}

/**
 * Slim segmented progress indicator for the tasting-note wizard. Each step gets
 * a bar segment (filled once reached) and a label that highlights when active.
 */
export default function StepProgress({ steps, current }: StepProgressProps) {
  return (
    <View style={styles.container}>
      <View style={styles.bars}>
        {steps.map((label, index) => (
          <View
            key={label}
            style={[
              styles.segment,
              index <= current ? styles.segmentFilled : styles.segmentEmpty,
            ]}
          />
        ))}
      </View>
      <View style={styles.labels}>
        {steps.map((label, index) => (
          <Text
            key={label}
            style={[
              styles.label,
              index === current && styles.labelActive,
              index < current && styles.labelDone,
            ]}
            numberOfLines={1}
          >
            {label}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  bars: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  segment: {
    flex: 1,
    height: 4,
    borderRadius: radius.pill,
  },
  segmentFilled: {
    backgroundColor: accent.base,
  },
  segmentEmpty: {
    backgroundColor: surfaces.hairlineStrong,
  },
  labels: {
    flexDirection: "row",
    marginTop: spacing.sm,
  },
  label: {
    flex: 1,
    textAlign: "center",
    fontSize: 11,
    color: colors.textTertiary,
  },
  labelActive: {
    color: accent.text,
    fontWeight: "700",
  },
  labelDone: {
    color: colors.textSecondary,
  },
});
