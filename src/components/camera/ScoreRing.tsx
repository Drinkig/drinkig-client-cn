import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { colors } from "../../constants/colors";

// Animated SVG circle wrapper
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/** 점수 구간: 잘 맞음(≥70) / 무난(≥55) / 도전(<55) — 화면 전체가 공유하는 기준 */
export type ScoreTier = "great" | "okay" | "challenge";

export function getScoreTier(score: number): ScoreTier {
  if (score >= 70) return "great";
  if (score >= 55) return "okay";
  return "challenge";
}

export function scoreColor(score: number): string {
  const tier = getScoreTier(score);
  if (tier === "great") return colors.success;
  if (tier === "okay") return colors.warning;
  return colors.textTertiary;
}

interface ScoreRingProps {
  score: number;
  /** 지름(px). 기본 54 — 메뉴 리스트 카드용. 라벨 히어로는 크게 쓴다. */
  size?: number;
  strokeWidth?: number;
}

export default function ScoreRing({
  score,
  size = 54,
  strokeWidth = 4,
}: ScoreRingProps) {
  const progress = useRef(new Animated.Value(0)).current;

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: score / 100,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [score, progress]);

  // dashoffset: 0 = full ring filled, circumference = empty
  const strokeDashoffset = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  const color = scoreColor(score);
  // 링 크기에 비례한 중앙 숫자 크기 (기본 54px 기준 13px)
  const percentFontSize = Math.round((size / 54) * 13);
  const unitFontSize = Math.round((size / 54) * 9);

  return (
    <View style={[styles.wrapper, { width: size, height: size }]}>
      <Svg width={size} height={size} style={styles.svg}>
        {/* Track (background) */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.surface2}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress arc */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </Svg>
      {/* Center label */}
      <View style={styles.center}>
        <Text
          style={[styles.percent, { color, fontSize: percentFontSize }]}
          allowFontScaling={false}
        >
          {score}
          <Text style={[styles.unit, { color, fontSize: unitFontSize }]}>
            %
          </Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  svg: {
    position: "absolute",
    // rotate so the arc starts from the top (12 o'clock)
    transform: [{ rotate: "-90deg" }],
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
  },
  percent: {
    fontWeight: "800",
  },
  unit: {
    fontWeight: "700",
  },
});
