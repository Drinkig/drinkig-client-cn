import React, { useEffect, useRef } from "react";
import { Animated, Easing } from "react-native";
import Svg, {
  Rect,
  Circle,
  Line,
  Path,
  Text as SvgText,
} from "react-native-svg";
import { useTranslation } from "react-i18next";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedRect = Animated.createAnimatedComponent(Rect);

const SIZE = 260;

type IllustProps = { visible?: boolean };

// ���─ helpers ─��

function useFadeIn(visible: boolean, delay: number, duration = 500) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(10)).current;
  useEffect(() => {
    if (!visible) {
      opacity.setValue(0);
      translateY.setValue(10);
      return;
    }
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [visible]);
  return { opacity, transform: [{ translateY }] };
}

function useSlideX(
  visible: boolean,
  delay: number,
  from: number,
  duration = 400
) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(from)).current;
  useEffect(() => {
    if (!visible) {
      opacity.setValue(0);
      translateX.setValue(from);
      return;
    }
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateX, {
        toValue: 0,
        duration,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [visible]);
  return { opacity, transform: [{ translateX }] };
}

function usePopIn(visible: boolean, delay: number, stiffness = 400) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    if (!visible) {
      opacity.setValue(0);
      scale.setValue(0.5);
      return;
    }
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        delay,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        delay,
        stiffness,
        damping: 12,
        useNativeDriver: true,
      }),
    ]).start();
  }, [visible]);
  return { opacity, transform: [{ scale }] };
}

// ── 1. MatchScoreIllust ──

export function MatchScoreIllust({ visible = true }: IllustProps) {
  const bottle = useFadeIn(visible, 0, 600);
  const score = usePopIn(visible, 300);
  const heart = usePopIn(visible, 1200);

  // Gauge fill: strokeDashoffset 201 → 41  (fills ~80%)
  const dashOffset = useRef(new Animated.Value(201)).current;
  useEffect(() => {
    if (!visible) {
      dashOffset.setValue(201);
      return;
    }
    Animated.timing(dashOffset, {
      toValue: 41,
      duration: 1200,
      delay: 500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [visible]);

  return (
    <Svg width={SIZE} height={SIZE} viewBox="0 0 240 240" fill="none">
      {/* 와인 병 실루엣 */}
      <Animated.View style={bottle}>
        <Svg width={SIZE} height={SIZE} viewBox="0 0 240 240" fill="none">
          <Rect
            x="95"
            y="60"
            width="50"
            height="120"
            rx="8"
            fill="#1a1a2e"
            stroke="#a78bfa"
            strokeWidth="1.5"
          />
          <Rect
            x="105"
            y="40"
            width="30"
            height="24"
            rx="4"
            fill="#1a1a2e"
            stroke="#a78bfa"
            strokeWidth="1.5"
          />
          <Rect
            x="110"
            y="32"
            width="20"
            height="12"
            rx="3"
            fill="#1a1a2e"
            stroke="#a78bfa"
            strokeWidth="1.5"
          />
          <Rect
            x="101"
            y="100"
            width="38"
            height="30"
            rx="4"
            fill="#a78bfa"
            opacity={0.15}
            stroke="#a78bfa"
            strokeWidth="1"
          />
        </Svg>
      </Animated.View>

      {/* 매칭 점수 원형 게이지 */}
      <Animated.View style={[score, { position: "absolute", top: 0, left: 0 }]}>
        <Svg width={SIZE} height={SIZE} viewBox="0 0 240 240" fill="none">
          <Circle
            cx="170"
            cy="80"
            r="32"
            fill="#1a1a2e"
            stroke="#a78bfa"
            strokeWidth="2"
          />
          <AnimatedCircle
            cx="170"
            cy="80"
            r="32"
            fill="none"
            stroke="#c084fc"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="201"
            strokeDashoffset={dashOffset}
            rotation={-90}
            origin="170, 80"
          />
          <SvgText
            x="170"
            y="76"
            textAnchor="middle"
            fill="#e9d5ff"
            fontSize="16"
            fontWeight="bold"
          >
            92
          </SvgText>
          <SvgText
            x="170"
            y="92"
            textAnchor="middle"
            fill="#a78bfa"
            fontSize="8"
          >
            MATCH
          </SvgText>
        </Svg>
      </Animated.View>

      {/* 하트 */}
      <Animated.View style={[heart, { position: "absolute", top: 0, left: 0 }]}>
        <Svg width={SIZE} height={SIZE} viewBox="0 0 240 240" fill="none">
          <Path
            d="M168 60 l4-4 a3 3 0 0 1 5 0 l0 0 a3 3 0 0 1 0 5 l-5 5 l-5-5 a3 3 0 0 1 0-5 l0 0 a3 3 0 0 1 5 0 z"
            fill="#f472b6"
            opacity={0.6}
          />
        </Svg>
      </Animated.View>
    </Svg>
  );
}

// ── 2. ScanIllust ──

export function ScanIllust({ visible = true }: IllustProps) {
  const phone = useFadeIn(visible, 0, 500);
  const viewfinder = useFadeIn(visible, 300, 300);
  const label = useFadeIn(visible, 500, 400);
  const scores1 = useFadeIn(visible, 800, 300);
  const scores2 = useFadeIn(visible, 1000, 300);
  const scores3 = useFadeIn(visible, 1200, 300);

  // Scan line loop
  const scanY = useRef(new Animated.Value(0)).current;
  const scanLoopRef = useRef<Animated.CompositeAnimation | null>(null);
  useEffect(() => {
    if (!visible) {
      scanLoopRef.current?.stop();
      scanY.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scanY, {
          toValue: 75,
          duration: 1250,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(scanY, {
          toValue: 0,
          duration: 1250,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    scanLoopRef.current = loop;
    loop.start();
    return () => loop.stop();
  }, [visible]);

  return (
    <Svg width={SIZE} height={SIZE} viewBox="0 0 240 240" fill="none">
      {/* 폰 프레임 */}
      <Animated.View style={phone}>
        <Svg width={SIZE} height={SIZE} viewBox="0 0 240 240" fill="none">
          <Rect
            x="70"
            y="40"
            width="100"
            height="170"
            rx="16"
            fill="#1a1a2e"
            stroke="#a78bfa"
            strokeWidth="1.5"
          />
          <Rect x="78" y="56" width="84" height="138" rx="4" fill="#0f0f1a" />
        </Svg>
      </Animated.View>

      {/* 뷰파인더 코너 */}
      <Animated.View
        style={[viewfinder, { position: "absolute", top: 0, left: 0 }]}
      >
        <Svg width={SIZE} height={SIZE} viewBox="0 0 240 240" fill="none">
          <Path
            d="M88 70 h12"
            stroke="#c084fc"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <Path
            d="M88 70 v12"
            stroke="#c084fc"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <Path
            d="M152 70 h-12"
            stroke="#c084fc"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <Path
            d="M152 70 v12"
            stroke="#c084fc"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <Path
            d="M88 160 v-12"
            stroke="#c084fc"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <Path
            d="M88 160 h12"
            stroke="#c084fc"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <Path
            d="M152 160 h-12"
            stroke="#c084fc"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <Path
            d="M152 160 v-12"
            stroke="#c084fc"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </Svg>
      </Animated.View>

      {/* 스캔 라인 */}
      <Animated.View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          transform: [{ translateY: scanY }],
        }}
      >
        <Svg width={SIZE} height={SIZE} viewBox="0 0 240 240" fill="none">
          <Line
            x1="92"
            y1="80"
            x2="148"
            y2="80"
            stroke="#a78bfa"
            strokeWidth="2"
            opacity={0.7}
          />
        </Svg>
      </Animated.View>

      {/* 와인 라벨 */}
      <Animated.View style={[label, { position: "absolute", top: 0, left: 0 }]}>
        <Svg width={SIZE} height={SIZE} viewBox="0 0 240 240" fill="none">
          <Rect
            x="100"
            y="85"
            width="40"
            height="56"
            rx="4"
            fill="#a78bfa"
            opacity={0.1}
            stroke="#a78bfa"
            strokeWidth="1"
          />
          <Line
            x1="108"
            y1="96"
            x2="132"
            y2="96"
            stroke="#a78bfa"
            strokeWidth="1"
            opacity={0.4}
          />
          <Line
            x1="108"
            y1="103"
            x2="128"
            y2="103"
            stroke="#a78bfa"
            strokeWidth="1"
            opacity={0.3}
          />
          <Line
            x1="108"
            y1="110"
            x2="124"
            y2="110"
            stroke="#a78bfa"
            strokeWidth="1"
            opacity={0.3}
          />
        </Svg>
      </Animated.View>

      {/* 결과 점수들 */}
      <Animated.View
        style={[scores1, { position: "absolute", top: 0, left: 0 }]}
      >
        <Svg width={SIZE} height={SIZE} viewBox="0 0 240 240" fill="none">
          <Circle cx="108" cy="176" r="6" fill="#c084fc" opacity={0.3} />
          <SvgText
            x="108"
            y="179"
            textAnchor="middle"
            fill="#e9d5ff"
            fontSize="6"
          >
            95
          </SvgText>
        </Svg>
      </Animated.View>
      <Animated.View
        style={[scores2, { position: "absolute", top: 0, left: 0 }]}
      >
        <Svg width={SIZE} height={SIZE} viewBox="0 0 240 240" fill="none">
          <Circle cx="124" cy="176" r="6" fill="#c084fc" opacity={0.2} />
          <SvgText
            x="124"
            y="179"
            textAnchor="middle"
            fill="#e9d5ff"
            fontSize="6"
          >
            87
          </SvgText>
        </Svg>
      </Animated.View>
      <Animated.View
        style={[scores3, { position: "absolute", top: 0, left: 0 }]}
      >
        <Svg width={SIZE} height={SIZE} viewBox="0 0 240 240" fill="none">
          <Circle cx="140" cy="176" r="6" fill="#c084fc" opacity={0.15} />
          <SvgText
            x="140"
            y="179"
            textAnchor="middle"
            fill="#e9d5ff"
            fontSize="6"
          >
            72
          </SvgText>
        </Svg>
      </Animated.View>
    </Svg>
  );
}

// ── 3. ChatbotIllust ──

export function ChatbotIllust({ visible = true }: IllustProps) {
  const { t } = useTranslation();
  const chatText = t("paywall.illust.chatQuestion");

  const userBubble = useSlideX(visible, 200, 20);
  const aiBubble = useSlideX(visible, 700, -20);
  const rec1 = useSlideX(visible, 1000, -8, 300);
  const rec2 = useSlideX(visible, 1300, -8, 300);
  const foodIcon = usePopIn(visible, 400, 300);
  const wineIcon = usePopIn(visible, 1500, 300);

  return (
    <Svg width={SIZE} height={SIZE} viewBox="0 0 240 240" fill="none">
      {/* 유저 채팅 버블 */}
      <Animated.View style={userBubble}>
        <Svg width={SIZE} height={SIZE} viewBox="0 0 240 240" fill="none">
          <Rect
            x="100"
            y="50"
            width="110"
            height="36"
            rx="12"
            fill="#a78bfa"
            opacity={0.15}
            stroke="#a78bfa"
            strokeWidth="1"
          />
          <SvgText x="115" y="73" fill="#e9d5ff" fontSize="11">
            {chatText}
          </SvgText>
          <Path d="M200 86 l8 -6 l-2 10 z" fill="#a78bfa" opacity={0.15} />
        </Svg>
      </Animated.View>

      {/* AI 응답 버블 */}
      <Animated.View
        style={[aiBubble, { position: "absolute", top: 0, left: 0 }]}
      >
        <Svg width={SIZE} height={SIZE} viewBox="0 0 240 240" fill="none">
          <Rect
            x="30"
            y="100"
            width="140"
            height="50"
            rx="12"
            fill="#1a1a2e"
            stroke="#a78bfa"
            strokeWidth="1"
          />
          <Path
            d="M40 150 l-8 6 l2-10 z"
            fill="#1a1a2e"
            stroke="#a78bfa"
            strokeWidth="1"
          />
        </Svg>
      </Animated.View>

      {/* 추천 결과 1 */}
      <Animated.View style={[rec1, { position: "absolute", top: 0, left: 0 }]}>
        <Svg width={SIZE} height={SIZE} viewBox="0 0 240 240" fill="none">
          <Circle cx="52" cy="118" r="8" fill="#a78bfa" opacity={0.2} />
          <SvgText
            x="52"
            y="121"
            textAnchor="middle"
            fill="#c084fc"
            fontSize="8"
          >
            1
          </SvgText>
          <SvgText x="66" y="121" fill="#d4d4d8" fontSize="10">
            Cabernet Sauvignon
          </SvgText>
        </Svg>
      </Animated.View>

      {/* 추천 결과 2 */}
      <Animated.View style={[rec2, { position: "absolute", top: 0, left: 0 }]}>
        <Svg width={SIZE} height={SIZE} viewBox="0 0 240 240" fill="none">
          <Circle cx="52" cy="137" r="8" fill="#a78bfa" opacity={0.15} />
          <SvgText
            x="52"
            y="140"
            textAnchor="middle"
            fill="#c084fc"
            fontSize="8"
          >
            2
          </SvgText>
          <SvgText x="66" y="140" fill="#d4d4d8" fontSize="10">
            Malbec Reserve
          </SvgText>
        </Svg>
      </Animated.View>

      {/* 음식 아이콘 */}
      <Animated.View
        style={[foodIcon, { position: "absolute", top: 0, left: 0 }]}
      >
        <Svg width={SIZE} height={SIZE} viewBox="0 0 240 240" fill="none">
          <Circle
            cx="188"
            cy="170"
            r="24"
            fill="#1a1a2e"
            stroke="#a78bfa"
            strokeWidth="1"
            opacity={0.5}
          />
          <SvgText x="188" y="175" textAnchor="middle" fontSize="20">
            🥩
          </SvgText>
        </Svg>
      </Animated.View>

      {/* 와인 아이콘 */}
      <Animated.View
        style={[wineIcon, { position: "absolute", top: 0, left: 0 }]}
      >
        <Svg width={SIZE} height={SIZE} viewBox="0 0 240 240" fill="none">
          <Circle
            cx="52"
            cy="188"
            r="18"
            fill="#1a1a2e"
            stroke="#c084fc"
            strokeWidth="1"
            opacity={0.4}
          />
          <SvgText x="52" y="193" textAnchor="middle" fontSize="14">
            🍷
          </SvgText>
        </Svg>
      </Animated.View>
    </Svg>
  );
}

// ── 4. ReportIllust — 궁합 분석 리포트 ──

export function ReportIllust({ visible = true }: IllustProps) {
  const { t } = useTranslation();

  const card = useFadeIn(visible, 0, 500);
  const header = useFadeIn(visible, 200, 400);
  const bar1 = useFadeIn(visible, 500, 300);
  const bar2 = useFadeIn(visible, 650, 300);
  const bar3 = useFadeIn(visible, 800, 300);
  const bar4 = useFadeIn(visible, 950, 300);
  const badge = usePopIn(visible, 1200);

  // Bar fill animations
  const bw1 = useRef(new Animated.Value(0)).current;
  const bw2 = useRef(new Animated.Value(0)).current;
  const bw3 = useRef(new Animated.Value(0)).current;
  const bw4 = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!visible) {
      bw1.setValue(0);
      bw2.setValue(0);
      bw3.setValue(0);
      bw4.setValue(0);
      return;
    }
    Animated.stagger(150, [
      Animated.timing(bw1, {
        toValue: 72,
        duration: 700,
        delay: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(bw2, {
        toValue: 56,
        duration: 700,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(bw3, {
        toValue: 84,
        duration: 700,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(bw4, {
        toValue: 48,
        duration: 700,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
    ]).start();
  }, [visible]);

  const labels = [
    t("flavorAxes.sweetness"),
    t("flavorAxes.acidity"),
    t("flavorAxes.body"),
    t("flavorAxes.tannin"),
  ];

  return (
    <Svg width={SIZE} height={SIZE} viewBox="0 0 240 240" fill="none">
      {/* 리포트 카드 */}
      <Animated.View style={card}>
        <Svg width={SIZE} height={SIZE} viewBox="0 0 240 240" fill="none">
          <Rect
            x="40"
            y="30"
            width="160"
            height="185"
            rx="14"
            fill="#1a1a2e"
            stroke="#a78bfa"
            strokeWidth="1.5"
          />
        </Svg>
      </Animated.View>

      {/* 헤더: 와인 아이콘 + 제목 라인 */}
      <Animated.View
        style={[header, { position: "absolute", top: 0, left: 0 }]}
      >
        <Svg width={SIZE} height={SIZE} viewBox="0 0 240 240" fill="none">
          <Circle cx="68" cy="56" r="12" fill="#a78bfa" opacity={0.15} />
          <SvgText x="68" y="61" textAnchor="middle" fontSize="12">
            🍷
          </SvgText>
          <Line
            x1="86"
            y1="50"
            x2="176"
            y2="50"
            stroke="#a78bfa"
            strokeWidth="1"
            opacity={0.3}
          />
          <Line
            x1="86"
            y1="60"
            x2="148"
            y2="60"
            stroke="#a78bfa"
            strokeWidth="1"
            opacity={0.2}
          />
          <Line
            x1="56"
            y1="78"
            x2="184"
            y2="78"
            stroke="#a78bfa"
            strokeWidth="0.5"
            opacity={0.2}
          />
        </Svg>
      </Animated.View>

      {/* 바 차트 - 4개 축 */}
      <Animated.View style={[bar1, { position: "absolute", top: 0, left: 0 }]}>
        <Svg width={SIZE} height={SIZE} viewBox="0 0 240 240" fill="none">
          <SvgText x="56" y="100" fill="#d4d4d8" fontSize="8">
            {labels[0]}
          </SvgText>
          <Rect
            x="100"
            y="92"
            width="84"
            height="10"
            rx="5"
            fill="#a78bfa"
            opacity={0.1}
          />
          <AnimatedRect
            x="100"
            y="92"
            height="10"
            rx="5"
            fill="#a78bfa"
            opacity={0.5}
            width={bw1}
          />
        </Svg>
      </Animated.View>

      <Animated.View style={[bar2, { position: "absolute", top: 0, left: 0 }]}>
        <Svg width={SIZE} height={SIZE} viewBox="0 0 240 240" fill="none">
          <SvgText x="56" y="124" fill="#d4d4d8" fontSize="8">
            {labels[1]}
          </SvgText>
          <Rect
            x="100"
            y="116"
            width="84"
            height="10"
            rx="5"
            fill="#c084fc"
            opacity={0.1}
          />
          <AnimatedRect
            x="100"
            y="116"
            height="10"
            rx="5"
            fill="#c084fc"
            opacity={0.5}
            width={bw2}
          />
        </Svg>
      </Animated.View>

      <Animated.View style={[bar3, { position: "absolute", top: 0, left: 0 }]}>
        <Svg width={SIZE} height={SIZE} viewBox="0 0 240 240" fill="none">
          <SvgText x="56" y="148" fill="#d4d4d8" fontSize="8">
            {labels[2]}
          </SvgText>
          <Rect
            x="100"
            y="140"
            width="84"
            height="10"
            rx="5"
            fill="#f472b6"
            opacity={0.1}
          />
          <AnimatedRect
            x="100"
            y="140"
            height="10"
            rx="5"
            fill="#f472b6"
            opacity={0.5}
            width={bw3}
          />
        </Svg>
      </Animated.View>

      <Animated.View style={[bar4, { position: "absolute", top: 0, left: 0 }]}>
        <Svg width={SIZE} height={SIZE} viewBox="0 0 240 240" fill="none">
          <SvgText x="56" y="172" fill="#d4d4d8" fontSize="8">
            {labels[3]}
          </SvgText>
          <Rect
            x="100"
            y="164"
            width="84"
            height="10"
            rx="5"
            fill="#fbbf24"
            opacity={0.1}
          />
          <AnimatedRect
            x="100"
            y="164"
            height="10"
            rx="5"
            fill="#fbbf24"
            opacity={0.5}
            width={bw4}
          />
        </Svg>
      </Animated.View>

      {/* 궁합 점수 배지 */}
      <Animated.View style={[badge, { position: "absolute", top: 0, left: 0 }]}>
        <Svg width={SIZE} height={SIZE} viewBox="0 0 240 240" fill="none">
          <Rect
            x="68"
            y="190"
            width="104"
            height="28"
            rx="14"
            fill="#a78bfa"
            opacity={0.15}
            stroke="#c084fc"
            strokeWidth="1"
          />
          <SvgText
            x="120"
            y="208"
            textAnchor="middle"
            fill="#e9d5ff"
            fontSize="11"
            fontWeight="bold"
          >
            92% MATCH
          </SvgText>
        </Svg>
      </Animated.View>
    </Svg>
  );
}

// ── 5. TasteResetIllust — 취향 재설정 ──

export function TasteResetIllust({ visible = true }: IllustProps) {
  const card = useFadeIn(visible, 0, 500);
  const oldProfile = useFadeIn(visible, 300, 400);
  const arrow = usePopIn(visible, 800);
  const newProfile = useFadeIn(visible, 1000, 500);
  const refreshIcon = usePopIn(visible, 1400, 300);

  // Old profile axes (short bars — muted)
  const oldBars = [40, 60, 30, 50, 45];
  // New profile axes (different pattern — vibrant)
  const newWidths = [0, 0, 0, 0, 0].map(
    () => useRef(new Animated.Value(0)).current
  );
  const newTargets = [70, 35, 80, 55, 65];

  useEffect(() => {
    if (!visible) {
      newWidths.forEach((w) => w.setValue(0));
      return;
    }
    Animated.stagger(
      100,
      newWidths.map((w, i) =>
        Animated.timing(w, {
          toValue: newTargets[i],
          duration: 600,
          delay: 1000,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        })
      )
    ).start();
  }, [visible]);

  const barY = (i: number) => 62 + i * 18;

  return (
    <Svg width={SIZE} height={SIZE} viewBox="0 0 240 240" fill="none">
      {/* 배경 카드 */}
      <Animated.View style={card}>
        <Svg width={SIZE} height={SIZE} viewBox="0 0 240 240" fill="none">
          <Rect
            x="20"
            y="40"
            width="200"
            height="170"
            rx="14"
            fill="#1a1a2e"
            stroke="#a78bfa"
            strokeWidth="1.5"
          />
          {/* 구분선 */}
          <Line
            x1="120"
            y1="52"
            x2="120"
            y2="200"
            stroke="#a78bfa"
            strokeWidth="0.5"
            opacity={0.15}
            strokeDasharray="4 4"
          />
        </Svg>
      </Animated.View>

      {/* 왼쪽: 이전 프로필 (뮤트된 바) */}
      <Animated.View
        style={[oldProfile, { position: "absolute", top: 0, left: 0 }]}
      >
        <Svg width={SIZE} height={SIZE} viewBox="0 0 240 240" fill="none">
          <SvgText
            x="66"
            y="56"
            textAnchor="middle"
            fill="#a78bfa"
            fontSize="8"
            opacity={0.5}
          >
            BEFORE
          </SvgText>
          {oldBars.map((w, i) => (
            <React.Fragment key={`old-${i}`}>
              <Rect
                x="34"
                y={barY(i)}
                width="72"
                height="10"
                rx="5"
                fill="#a78bfa"
                opacity={0.06}
              />
              <Rect
                x="34"
                y={barY(i)}
                width={w}
                height="10"
                rx="5"
                fill="#a78bfa"
                opacity={0.2}
              />
            </React.Fragment>
          ))}
        </Svg>
      </Animated.View>

      {/* 중앙 화살표 */}
      <Animated.View style={[arrow, { position: "absolute", top: 0, left: 0 }]}>
        <Svg width={SIZE} height={SIZE} viewBox="0 0 240 240" fill="none">
          <Path
            d="M114 115 l6 -8 l6 8"
            stroke="#c084fc"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <Line
            x1="120"
            y1="107"
            x2="120"
            y2="140"
            stroke="#c084fc"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <Path
            d="M114 140 l6 8 l6 -8"
            stroke="#c084fc"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </Svg>
      </Animated.View>

      {/* 오른쪽: 새 프로필 (밝은 바 — 채워지는 애니메이션) */}
      <Animated.View
        style={[newProfile, { position: "absolute", top: 0, left: 0 }]}
      >
        <Svg width={SIZE} height={SIZE} viewBox="0 0 240 240" fill="none">
          <SvgText
            x="166"
            y="56"
            textAnchor="middle"
            fill="#c084fc"
            fontSize="8"
            fontWeight="bold"
          >
            AFTER
          </SvgText>
          {newWidths.map((_, i) => (
            <Rect
              key={`bg-${i}`}
              x="134"
              y={barY(i)}
              width="72"
              height="10"
              rx="5"
              fill="#c084fc"
              opacity={0.06}
            />
          ))}
          {newWidths.map((w, i) => {
            const barColors = [
              "#a78bfa",
              "#c084fc",
              "#f472b6",
              "#fbbf24",
              "#34d399",
            ];
            return (
              <AnimatedRect
                key={`new-${i}`}
                x="134"
                y={barY(i)}
                height="10"
                rx="5"
                fill={barColors[i]}
                opacity={0.6}
                width={w}
              />
            );
          })}
        </Svg>
      </Animated.View>

      {/* 리프레시 아이콘 */}
      <Animated.View
        style={[refreshIcon, { position: "absolute", top: 0, left: 0 }]}
      >
        <Svg width={SIZE} height={SIZE} viewBox="0 0 240 240" fill="none">
          <Circle
            cx="120"
            cy="186"
            r="16"
            fill="#c084fc"
            opacity={0.12}
            stroke="#c084fc"
            strokeWidth="1"
          />
          {/* Refresh arrow (clockwise) */}
          <Path
            d="M113 182 a8 8 0 1 1 1 8"
            stroke="#e9d5ff"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
          <Path
            d="M114 190 l-4 -3 l4 -2"
            stroke="#e9d5ff"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </Svg>
      </Animated.View>
    </Svg>
  );
}

// ── 6. TastingNoteIllust — 테이스팅 노트 ──

export function TastingNoteIllust({ visible = true }: IllustProps) {
  const { t } = useTranslation();
  const tags = [
    t("login.illust.tagSweet"),
    t("login.illust.tagCherry"),
    t("login.illust.tagSmooth"),
    t("login.illust.tagMedium"),
  ];

  const card = useFadeIn(visible, 0, 500);
  const tag1 = usePopIn(visible, 400);
  const tag2 = usePopIn(visible, 600);
  const tag3 = usePopIn(visible, 800);
  const tag4 = usePopIn(visible, 1000);
  const slider = useFadeIn(visible, 1200, 300);

  const sliderWidth = useRef(new Animated.Value(0)).current;
  const sliderCx = useRef(new Animated.Value(66)).current;
  useEffect(() => {
    if (!visible) {
      sliderWidth.setValue(0);
      sliderCx.setValue(66);
      return;
    }
    Animated.parallel([
      Animated.timing(sliderWidth, {
        toValue: 75,
        duration: 800,
        delay: 1300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(sliderCx, {
        toValue: 141,
        duration: 800,
        delay: 1300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
    ]).start();
  }, [visible]);

  return (
    <Svg width={SIZE} height={SIZE} viewBox="0 0 240 240" fill="none">
      <Animated.View style={card}>
        <Svg width={SIZE} height={SIZE} viewBox="0 0 240 240" fill="none">
          <Rect
            x="50"
            y="45"
            width="140"
            height="160"
            rx="12"
            fill="#1a1a2e"
            stroke="#a78bfa"
            strokeWidth="1.5"
          />
          <Rect
            x="66"
            y="60"
            width="24"
            height="32"
            rx="4"
            fill="#a78bfa"
            opacity={0.15}
          />
          <SvgText x="78" y="80" textAnchor="middle" fontSize="14">
            🍷
          </SvgText>
          <Line
            x1="100"
            y1="68"
            x2="170"
            y2="68"
            stroke="#a78bfa"
            strokeWidth="1"
            opacity={0.3}
          />
          <Line
            x1="100"
            y1="78"
            x2="150"
            y2="78"
            stroke="#a78bfa"
            strokeWidth="1"
            opacity={0.2}
          />
          <Line
            x1="100"
            y1="88"
            x2="135"
            y2="88"
            stroke="#a78bfa"
            strokeWidth="1"
            opacity={0.15}
          />
          <Line
            x1="66"
            y1="105"
            x2="174"
            y2="105"
            stroke="#a78bfa"
            strokeWidth="0.5"
            opacity={0.2}
          />
        </Svg>
      </Animated.View>

      <Animated.View style={[tag1, { position: "absolute", top: 0, left: 0 }]}>
        <Svg width={SIZE} height={SIZE} viewBox="0 0 240 240" fill="none">
          <Rect
            x="66"
            y="115"
            width="42"
            height="22"
            rx="11"
            fill="#a78bfa"
            opacity={0.15}
            stroke="#a78bfa"
            strokeWidth="0.5"
          />
          <SvgText
            x="87"
            y="130"
            textAnchor="middle"
            fill="#c084fc"
            fontSize="9"
          >
            {tags[0]}
          </SvgText>
        </Svg>
      </Animated.View>

      <Animated.View style={[tag2, { position: "absolute", top: 0, left: 0 }]}>
        <Svg width={SIZE} height={SIZE} viewBox="0 0 240 240" fill="none">
          <Rect
            x="114"
            y="115"
            width="50"
            height="22"
            rx="11"
            fill="#f472b6"
            opacity={0.1}
            stroke="#f472b6"
            strokeWidth="0.5"
          />
          <SvgText
            x="139"
            y="130"
            textAnchor="middle"
            fill="#f9a8d4"
            fontSize="9"
          >
            {tags[1]}
          </SvgText>
        </Svg>
      </Animated.View>

      <Animated.View style={[tag3, { position: "absolute", top: 0, left: 0 }]}>
        <Svg width={SIZE} height={SIZE} viewBox="0 0 240 240" fill="none">
          <Rect
            x="66"
            y="143"
            width="46"
            height="22"
            rx="11"
            fill="#fbbf24"
            opacity={0.1}
            stroke="#fbbf24"
            strokeWidth="0.5"
          />
          <SvgText
            x="89"
            y="158"
            textAnchor="middle"
            fill="#fcd34d"
            fontSize="9"
          >
            {tags[2]}
          </SvgText>
        </Svg>
      </Animated.View>

      <Animated.View style={[tag4, { position: "absolute", top: 0, left: 0 }]}>
        <Svg width={SIZE} height={SIZE} viewBox="0 0 240 240" fill="none">
          <Rect
            x="118"
            y="143"
            width="52"
            height="22"
            rx="11"
            fill="#34d399"
            opacity={0.1}
            stroke="#34d399"
            strokeWidth="0.5"
          />
          <SvgText
            x="144"
            y="158"
            textAnchor="middle"
            fill="#6ee7b7"
            fontSize="9"
          >
            {tags[3]}
          </SvgText>
        </Svg>
      </Animated.View>

      <Animated.View
        style={[slider, { position: "absolute", top: 0, left: 0 }]}
      >
        <Svg width={SIZE} height={SIZE} viewBox="0 0 240 240" fill="none">
          <Rect
            x="66"
            y="178"
            width="108"
            height="4"
            rx="2"
            fill="#a78bfa"
            opacity={0.1}
          />
          <AnimatedRect
            x="66"
            y="178"
            height="4"
            rx="2"
            fill="#a78bfa"
            opacity={0.4}
            width={sliderWidth}
          />
          <AnimatedCircle cy="180" r="5" fill="#c084fc" cx={sliderCx} />
        </Svg>
      </Animated.View>
    </Svg>
  );
}

// ── 7. CellarIllust — 마이 셀러 ──

export function CellarIllust({ visible = true }: IllustProps) {
  const { t } = useTranslation();
  const ownedText = t("login.illust.ownCount");
  const drankText = t("login.illust.drankCount");

  const shelves = useFadeIn(visible, 0, 400);
  const b1 = useFadeIn(visible, 200, 350);
  const b2 = useFadeIn(visible, 350, 350);
  const b3 = useFadeIn(visible, 500, 350);
  const b4 = useFadeIn(visible, 650, 350);
  const b5 = useFadeIn(visible, 800, 350);
  const b6 = useFadeIn(visible, 950, 350);
  const counts = useFadeIn(visible, 1100, 400);

  return (
    <Svg width={SIZE} height={SIZE} viewBox="0 0 240 240" fill="none">
      <Animated.View style={shelves}>
        <Svg width={SIZE} height={SIZE} viewBox="0 0 240 240" fill="none">
          <Line
            x1="40"
            y1="90"
            x2="200"
            y2="90"
            stroke="#ddd6fe"
            strokeWidth="1.5"
            opacity={0.5}
          />
          <Line
            x1="40"
            y1="150"
            x2="200"
            y2="150"
            stroke="#ddd6fe"
            strokeWidth="1.5"
            opacity={0.5}
          />
          <Line
            x1="40"
            y1="210"
            x2="200"
            y2="210"
            stroke="#ddd6fe"
            strokeWidth="1.5"
            opacity={0.5}
          />
        </Svg>
      </Animated.View>

      <Animated.View style={[b1, { position: "absolute", top: 0, left: 0 }]}>
        <Svg width={SIZE} height={SIZE} viewBox="0 0 240 240" fill="none">
          <Rect
            x="55"
            y="55"
            width="20"
            height="35"
            rx="4"
            fill="#c084fc"
            opacity={0.6}
            stroke="#d8b4fe"
            strokeWidth="1.2"
          />
          <Rect
            x="60"
            y="45"
            width="10"
            height="12"
            rx="2"
            fill="#c084fc"
            opacity={0.5}
          />
          <Rect
            x="59"
            y="65"
            width="12"
            height="10"
            rx="2"
            fill="#e9d5ff"
            opacity={0.25}
          />
        </Svg>
      </Animated.View>

      <Animated.View style={[b2, { position: "absolute", top: 0, left: 0 }]}>
        <Svg width={SIZE} height={SIZE} viewBox="0 0 240 240" fill="none">
          <Rect
            x="85"
            y="60"
            width="20"
            height="30"
            rx="4"
            fill="#f472b6"
            opacity={0.55}
            stroke="#f9a8d4"
            strokeWidth="1.2"
          />
          <Rect
            x="90"
            y="50"
            width="10"
            height="12"
            rx="2"
            fill="#f472b6"
            opacity={0.45}
          />
          <Rect
            x="89"
            y="68"
            width="12"
            height="10"
            rx="2"
            fill="#fce7f3"
            opacity={0.2}
          />
        </Svg>
      </Animated.View>

      <Animated.View style={[b3, { position: "absolute", top: 0, left: 0 }]}>
        <Svg width={SIZE} height={SIZE} viewBox="0 0 240 240" fill="none">
          <Rect
            x="115"
            y="52"
            width="20"
            height="38"
            rx="4"
            fill="#fb7185"
            opacity={0.55}
            stroke="#fda4af"
            strokeWidth="1.2"
          />
          <Rect
            x="120"
            y="42"
            width="10"
            height="12"
            rx="2"
            fill="#fb7185"
            opacity={0.45}
          />
          <Rect
            x="119"
            y="62"
            width="12"
            height="12"
            rx="2"
            fill="#ffe4e6"
            opacity={0.2}
          />
        </Svg>
      </Animated.View>

      <Animated.View style={[b4, { position: "absolute", top: 0, left: 0 }]}>
        <Svg width={SIZE} height={SIZE} viewBox="0 0 240 240" fill="none">
          <Rect
            x="145"
            y="58"
            width="20"
            height="32"
            rx="4"
            fill="#fbbf24"
            opacity={0.55}
            stroke="#fcd34d"
            strokeWidth="1.2"
          />
          <Rect
            x="150"
            y="48"
            width="10"
            height="12"
            rx="2"
            fill="#fbbf24"
            opacity={0.45}
          />
          <Rect
            x="149"
            y="66"
            width="12"
            height="10"
            rx="2"
            fill="#fef9c3"
            opacity={0.25}
          />
        </Svg>
      </Animated.View>

      <Animated.View style={[b5, { position: "absolute", top: 0, left: 0 }]}>
        <Svg width={SIZE} height={SIZE} viewBox="0 0 240 240" fill="none">
          <Rect
            x="55"
            y="115"
            width="20"
            height="35"
            rx="4"
            fill="#34d399"
            opacity={0.55}
            stroke="#6ee7b7"
            strokeWidth="1.2"
          />
          <Rect
            x="60"
            y="105"
            width="10"
            height="12"
            rx="2"
            fill="#34d399"
            opacity={0.45}
          />
          <Rect
            x="59"
            y="125"
            width="12"
            height="10"
            rx="2"
            fill="#d1fae5"
            opacity={0.2}
          />
        </Svg>
      </Animated.View>

      <Animated.View style={[b6, { position: "absolute", top: 0, left: 0 }]}>
        <Svg width={SIZE} height={SIZE} viewBox="0 0 240 240" fill="none">
          <Rect
            x="85"
            y="118"
            width="20"
            height="32"
            rx="4"
            fill="#a78bfa"
            opacity={0.55}
            stroke="#c4b5fd"
            strokeWidth="1.2"
          />
          <Rect
            x="90"
            y="108"
            width="10"
            height="12"
            rx="2"
            fill="#a78bfa"
            opacity={0.45}
          />
          <Rect
            x="89"
            y="126"
            width="12"
            height="10"
            rx="2"
            fill="#ede9fe"
            opacity={0.2}
          />
        </Svg>
      </Animated.View>

      <Animated.View
        style={[counts, { position: "absolute", top: 0, left: 0 }]}
      >
        <Svg width={SIZE} height={SIZE} viewBox="0 0 240 240" fill="none">
          <Rect
            x="55"
            y="170"
            width="60"
            height="24"
            rx="12"
            fill="#c084fc"
            opacity={0.15}
            stroke="#d8b4fe"
            strokeWidth="0.8"
          />
          <SvgText
            x="85"
            y="186"
            textAnchor="middle"
            fill="#e9d5ff"
            fontSize="10"
            fontWeight="bold"
          >
            {ownedText}
          </SvgText>
          <Rect
            x="122"
            y="170"
            width="72"
            height="24"
            rx="12"
            fill="#a78bfa"
            opacity={0.08}
            stroke="#c4b5fd"
            strokeWidth="0.8"
          />
          <SvgText
            x="158"
            y="186"
            textAnchor="middle"
            fill="#c4b5fd"
            fontSize="10"
          >
            {drankText}
          </SvgText>
        </Svg>
      </Animated.View>
    </Svg>
  );
}
