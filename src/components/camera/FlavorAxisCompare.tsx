import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { colors } from "../../constants/colors";
import { accent } from "../../constants/theme";
import { FlavorProfile } from "../onboarding/FlavorProfileStep";
import { COMPATIBILITY_KEYS } from "../../utils/compatibility";

interface FlavorAxisCompareProps {
  /** 유저 취향 (1~5, 없는 축은 3으로 간주) */
  userProfile: FlavorProfile;
  /** 와인 프로파일 (매칭 와인의 공식 5축 또는 AI 추정) */
  wineProfile: Partial<FlavorProfile>;
}

const clamp = (v: number | null | undefined) =>
  Math.max(1, Math.min(5, v || 3));

/** 축 위치(1~5)를 트랙 좌측 % 로 변환 */
const toPercent = (v: number) => ((v - 1) / 4) * 100;

/**
 * 유저 취향 vs 와인 프로파일 5축 비교.
 * 축마다 하나의 트랙 위에 와인 마커(밝은 원)와 취향 마커(액센트 원)를 겹쳐
 * 두 값이 얼마나 가까운지 한눈에 보여준다.
 */
export default function FlavorAxisCompare({
  userProfile,
  wineProfile,
}: FlavorAxisCompareProps) {
  const { t } = useTranslation();

  return (
    <View>
      {/* Legend */}
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: accent.base }]} />
          <Text style={styles.legendText}>
            {t("menuScanResult.flavorCompare.user")}
          </Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.white }]} />
          <Text style={styles.legendText}>
            {t("menuScanResult.flavorCompare.wine")}
          </Text>
        </View>
      </View>

      {COMPATIBILITY_KEYS.map((key) => {
        const userVal = clamp(userProfile[key]);
        const wineVal = clamp(wineProfile[key]);
        return (
          <View key={key} style={styles.axisRow}>
            <Text style={styles.axisLabel} numberOfLines={1}>
              {t(`wineCompatibility.attribute.${key}`)}
            </Text>
            <View style={styles.trackArea}>
              <View style={styles.track} />
              {/* 와인 마커 (아래, 크게) */}
              <View
                style={[styles.wineMarker, { left: `${toPercent(wineVal)}%` }]}
              />
              {/* 취향 마커 (위, 작게) — 겹쳐도 둘 다 보이도록 */}
              <View
                style={[styles.userMarker, { left: `${toPercent(userVal)}%` }]}
              />
            </View>
          </View>
        );
      })}
    </View>
  );
}

const MARKER_WINE = 16;
const MARKER_USER = 10;

const styles = StyleSheet.create({
  legendRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 14,
    marginBottom: 10,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  axisRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 9,
  },
  axisLabel: {
    width: 72,
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  trackArea: {
    flex: 1,
    height: MARKER_WINE,
    justifyContent: "center",
    // 마커 지름만큼 안쪽으로 여백을 줘 1/5 값이 트랙 밖으로 나가지 않게
    marginHorizontal: MARKER_WINE / 2,
  },
  track: {
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.surface2,
  },
  wineMarker: {
    position: "absolute",
    width: MARKER_WINE,
    height: MARKER_WINE,
    borderRadius: MARKER_WINE / 2,
    marginLeft: -MARKER_WINE / 2,
    backgroundColor: colors.white,
  },
  userMarker: {
    position: "absolute",
    width: MARKER_USER,
    height: MARKER_USER,
    borderRadius: MARKER_USER / 2,
    marginLeft: -MARKER_USER / 2,
    backgroundColor: accent.base,
    borderWidth: 1.5,
    borderColor: colors.background,
  },
});
