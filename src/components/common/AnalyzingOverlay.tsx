import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import LinearGradient from "react-native-linear-gradient";
import Svg, { Defs, RadialGradient, Stop, Circle } from "react-native-svg";
import { colors } from "../../constants/colors";
import { spacing, accent } from "../../constants/theme";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Brand-violet glows in 5 lightness tones for the rising motion background.
const GLOW_TONES = ["#C9A0E8", "#B47AE0", "#9231BF", "#7A2BA6", "#5E2080"];

// Each blob differs in size, horizontal start, speed and delay so they drift up
// without ever lining up — the staggered overlap is what reads as "alive".
const GLOW_BLOBS = [
  { size: 300, startX: SCREEN_WIDTH * 0.04, duration: 4800, delay: 0 },
  { size: 232, startX: SCREEN_WIDTH * 0.56, duration: 3600, delay: 1200 },
  { size: 360, startX: SCREEN_WIDTH * 0.28, duration: 5800, delay: 600 },
  { size: 258, startX: SCREEN_WIDTH * 0.7, duration: 4200, delay: 2400 },
  { size: 322, startX: -SCREEN_WIDTH * 0.1, duration: 5200, delay: 3200 },
];

// A single radial glow that rises bottom → top, swaying and breathing, forever.
const GlowBlob = ({
  size,
  startX,
  duration,
  delay,
  color,
  gradId,
}: {
  size: number;
  startX: number;
  duration: number;
  delay: number;
  color: string;
  gradId: string;
}) => {
  const t = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(t, {
        toValue: 1,
        duration,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    const starter = setTimeout(() => loop.start(), delay);
    return () => {
      clearTimeout(starter);
      loop.stop();
    };
  }, [t, duration, delay]);

  const translateY = t.interpolate({
    inputRange: [0, 1],
    outputRange: [SCREEN_HEIGHT * 0.95, -size * 0.6],
  });
  const translateX = t.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: [0, 16, 0, -16, 0],
  });
  const scale = t.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.8, 1.1, 0.85],
  });
  const opacity = t.interpolate({
    inputRange: [0, 0.15, 0.5, 0.85, 1],
    outputRange: [0, 0.26, 0.28, 0.18, 0],
  });

  return (
    <Animated.View
      style={{
        position: "absolute",
        left: startX,
        width: size,
        height: size,
        opacity,
        transform: [{ translateX }, { translateY }, { scale }],
      }}
    >
      <Svg width={size} height={size}>
        <Defs>
          <RadialGradient id={gradId} cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <Stop offset="60%" stopColor={color} stopOpacity={0.22} />
            <Stop offset="100%" stopColor={color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={size / 2}
          fill={`url(#${gradId})`}
        />
      </Svg>
    </Animated.View>
  );
};

// Thresholds at which the stage copy advances to the next message.
// 메시지 개수에 맞춰 앞에서부터 잘라 쓴다 (마지막 메시지는 100% 도달 시 표시).
const STAGE_THRESHOLDS = [25, 55, 80];

interface AnalyzingOverlayProps {
  /** 단계 문구 배열 — 마지막 문구는 100% 도달 시 표시된다 */
  messages: string[];
  visible?: boolean;
  /**
   * 컨트롤드 모드: 이 prop을 넘기면 자동 100% 점프가 꺼지고(92%에서 대기),
   * true가 되는 순간 빠르게 100%까지 램프업한 뒤 onDone을 호출한다.
   * 생략하면 자율 모드 — autoFinishMs 후 100%로 점프 (기존 TasteReset 동작).
   */
  complete?: boolean;
  /** 100% 도달 후(짧은 여운 뒤) 호출 */
  onDone?: () => void;
  /** 자율 모드에서 100%로 점프하는 시점(ms). 기본 9000 */
  autoFinishMs?: number;
  /** 아이콘 배지의 강조 색. 생략 시 브랜드 accent 그라데이션 */
  accentColor?: string;
  /** Ionicons 이름. 기본 sparkles */
  iconName?: string;
}

/**
 * 분석/생성형 로딩 공용 오버레이 (TasteResetScreen에서 추출):
 *  - rising radial glow background (no progress gauge anywhere)
 *  - a static icon badge with a soft halo
 *  - stage copy that swaps with an up-out / down-in transition
 *  - a plain "%" text that climbs fast → slow, stalls at 92, then jumps to 100
 * Left-aligned. Self-contained — 보이는 동안만 조건부 마운트해서 쓴다.
 */
const AnalyzingOverlay = ({
  messages,
  visible = true,
  complete,
  onDone,
  autoFinishMs = 9000,
  accentColor,
  iconName = "sparkles",
}: AnalyzingOverlayProps) => {
  const [percent, setPercent] = useState(6);
  const [stage, setStage] = useState(0);
  const percentRef = useRef(6);
  const stageRef = useRef(0);
  const finishedRef = useRef(false);
  const controlled = complete !== undefined;

  const messagesRef = useRef(messages);
  messagesRef.current = messages;
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  const textY = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(1)).current;

  // Stage copy transition: current line lifts up + fades out, swaps while hidden,
  // then the new line floats up from below + fades in. translateY only, so the
  // "%" underneath never jumps.
  const goToStage = (next: number) => {
    Animated.parallel([
      Animated.timing(textOpacity, {
        toValue: 0,
        duration: 150,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(textY, {
        toValue: -8,
        duration: 150,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setStage(next);
      textY.setValue(8);
      Animated.parallel([
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 380,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(textY, {
          toValue: 0,
          duration: 380,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const showLastStage = () => {
    const lastIndex = messagesRef.current.length - 1;
    if (stageRef.current < lastIndex) {
      stageRef.current = lastIndex;
      goToStage(lastIndex);
    }
  };

  // Percentage climb: fast early, slower late, stall at 92. 자율 모드에서는
  // autoFinishMs 후 100으로 점프 (the parent typically navigates ~1s later).
  useEffect(() => {
    const thresholds = STAGE_THRESHOLDS.slice(
      0,
      Math.max(0, messagesRef.current.length - 2)
    );
    const tick = setInterval(() => {
      if (finishedRef.current) return;
      const p = percentRef.current;
      if (p >= 92) return;
      const inc = p < 60 ? 3 : p < 85 ? 2 : 1;
      const np = Math.min(92, p + inc);
      percentRef.current = np;
      setPercent(np);
      const reached = thresholds.filter((th) => np >= th).length;
      if (reached > stageRef.current) {
        stageRef.current = reached;
        goToStage(reached);
      }
    }, 320);

    let finish: ReturnType<typeof setTimeout> | null = null;
    let doneTimer: ReturnType<typeof setTimeout> | null = null;
    if (!controlled) {
      finish = setTimeout(() => {
        finishedRef.current = true;
        percentRef.current = 100;
        setPercent(100);
        showLastStage();
        doneTimer = setTimeout(() => onDoneRef.current?.(), 600);
      }, autoFinishMs);
    }

    return () => {
      clearInterval(tick);
      if (finish) clearTimeout(finish);
      if (doneTimer) clearTimeout(doneTimer);
    };
    // Runs once on mount; re-running would restart the climb each render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 컨트롤드 모드: 데이터가 도착해도 퍼센트가 순간이동하지 않도록
  // 빠른 램프업(약 30ms 간격 +4)으로 100까지 채운 뒤 onDone을 호출한다.
  useEffect(() => {
    if (!complete || finishedRef.current) return;
    finishedRef.current = true;
    let doneTimer: ReturnType<typeof setTimeout> | null = null;
    const ramp = setInterval(() => {
      const np = Math.min(100, percentRef.current + 4);
      percentRef.current = np;
      setPercent(np);
      if (np >= 100) {
        clearInterval(ramp);
        showLastStage();
        doneTimer = setTimeout(() => onDoneRef.current?.(), 600);
      }
    }, 30);
    return () => {
      clearInterval(ramp);
      if (doneTimer) clearTimeout(doneTimer);
    };
    // goToStage/showLastStage는 안정적인 애니메이션 헬퍼 — complete에만 반응.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [complete]);

  if (!visible) return null;

  const gradStart = accentColor ?? accent.base;
  const gradEnd = accentColor ?? accent.strong;

  return (
    <View style={[StyleSheet.absoluteFill, styles.container]}>
      {/* Rising glow background */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {GLOW_BLOBS.map((b, i) => (
          <GlowBlob
            key={i}
            size={b.size}
            startX={b.startX}
            duration={b.duration}
            delay={b.delay}
            color={GLOW_TONES[i]}
            gradId={`analyzingGlow${i}`}
          />
        ))}
      </View>

      {/* Foreground content (left-aligned) */}
      <View style={styles.top}>
        <View style={styles.iconWrap}>
          <View style={[styles.iconHalo, { backgroundColor: gradStart }]} />
          <View style={[styles.iconBox, { shadowColor: gradStart }]}>
            <LinearGradient
              colors={[gradStart, gradEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <Icon name={iconName} size={26} color={colors.white} />
          </View>
        </View>

        <Animated.Text
          style={[
            styles.stageText,
            { opacity: textOpacity, transform: [{ translateY: textY }] },
          ]}
        >
          {messages[stage]}
        </Animated.Text>

        <Text style={styles.percentText}>
          {percent}
          <Text style={styles.percentSign}>%</Text>
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    zIndex: 9999,
    paddingHorizontal: 28,
    paddingTop: SCREEN_HEIGHT * 0.16,
    paddingBottom: 48,
    overflow: "hidden",
  },
  top: {
    alignItems: "flex-start",
  },
  iconWrap: {
    width: 64,
    height: 64,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xxl,
  },
  iconHalo: {
    position: "absolute",
    width: 96,
    height: 96,
    borderRadius: 48,
    opacity: 0.18,
  },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 8,
  },
  stageText: {
    color: colors.textPrimary,
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.4,
    lineHeight: 34,
    // 한 줄 문구 기준으로만 예약해 카피와 퍼센트 사이 빈 공간을 없앤다.
    // (2줄 문구는 자연스럽게 늘어난다 — clipping 아님)
    minHeight: 34,
  },
  percentText: {
    color: accent.text,
    fontSize: 17,
    fontWeight: "800",
    marginTop: spacing.md,
  },
  percentSign: {
    color: accent.text,
    fontSize: 17,
    fontWeight: "800",
  },
});

export default AnalyzingOverlay;
