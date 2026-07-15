import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import Ionicons from "react-native-vector-icons/Ionicons";
import { radius, accent } from "../../constants/theme";
import { AiEstimateConfidence } from "../../api/scan";

interface AiEstimateBadgeProps {
  confidence: AiEstimateConfidence;
}

/**
 * DB 매칭이 아닌 AI 추정 결과임을 알리는 배지.
 * confidence LOW면 "품종 기반 추정"으로 표현 수위를 낮춘다.
 */
export default function AiEstimateBadge({ confidence }: AiEstimateBadgeProps) {
  const { t } = useTranslation();
  const isLow = confidence === "LOW";
  return (
    <View style={styles.badge}>
      <Ionicons name="sparkles" size={10} color={accent.text} />
      <Text style={styles.text}>
        {t(
          isLow
            ? "menuScanResult.aiEstimate.badgeLow"
            : "menuScanResult.aiEstimate.badge"
        )}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 4,
    backgroundColor: accent.soft,
    borderWidth: 1,
    borderColor: accent.border,
    borderRadius: radius.sm,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  text: {
    color: accent.text,
    fontSize: 10,
    fontWeight: "700",
  },
});
