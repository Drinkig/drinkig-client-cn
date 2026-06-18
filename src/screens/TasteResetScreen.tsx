import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/Ionicons";
import LinearGradient from "react-native-linear-gradient";
import Svg, { Defs, RadialGradient, Stop, Circle } from "react-native-svg";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { MemberInitRequest, updateMemberInitInfo } from "../api/member";
import { useUser } from "../context/UserContext";
import { useGlobalUI } from "../context/GlobalUIContext";
import { FlavorProfile } from "../components/onboarding/FlavorProfileStep";
import NewbieFlavorProfileStep from "../components/onboarding/NewbieFlavorProfileStep";
import { MultiSelectionStep } from "../components/onboarding/SelectionSteps";
import { CategorizedSelectionStep } from "../components/onboarding/CategorizedSelectionStep";
import BudgetStep from "../components/onboarding/BudgetStep";
import { colors } from "../constants/colors";
import { spacing, radius, accent } from "../constants/theme";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

type Step =
  | "ALCOHOL_PREF"
  | "FOOD_PREF"
  | "FLAVOR_ACIDITY"
  | "FLAVOR_SWEETNESS"
  | "FLAVOR_TANNIN"
  | "FLAVOR_BODY"
  | "FLAVOR_ALCOHOL"
  | "WINE_INTEREST"
  | "BUDGET";

const WINE_SORTS = ["레드", "화이트", "스파클링", "로제", "주정강화", "디저트"];

const ALCOHOL_CATEGORIES = [
  {
    title: "맥주",
    data: ["라거", "에일", "IPA", "스타우트/흑맥주", "밀맥주", "사워"],
  },
  {
    title: "위스키/브랜디",
    data: ["싱글몰트", "블렌디드", "버번", "아이리시", "꼬냑/아르마냑"],
  },
  {
    title: "소주/전통주",
    data: ["소주", "증류식 소주", "약주/청주", "막걸리/탁주", "과실주"],
  },
  {
    title: "와인",
    data: [
      "레드 와인",
      "화이트 와인",
      "스파클링",
      "로제",
      "내추럴",
      "주정강화",
    ],
  },
  {
    title: "기타 주류",
    data: ["사케", "진", "보드카", "럼", "데킬라", "하이볼", "칵테일", "기타"],
  },
];

const FOOD_CATEGORIES = [
  {
    title: "국가 별",
    data: [
      "한식",
      "중식",
      "일식",
      "양식",
      "이탈리아",
      "프랑스",
      "스페인",
      "아메리칸 차이니즈",
      "베트남",
      "태국",
      "인도",
      "멕시코",
      "남미",
      "퓨전",
    ],
  },
  {
    title: "육류",
    data: [
      "돼지고기",
      "소고기",
      "닭고기",
      "양고기",
      "스테이크",
      "바베큐",
      "순대",
      "곱창",
      "족발/보쌈",
    ],
  },
  {
    title: "해산물",
    data: [
      "갑각류",
      "조개류",
      "회",
      "숙성사시미",
      "찜/탕",
      "스시",
      "장어",
      "생선구이",
    ],
  },
  {
    title: "기타",
    data: ["치즈", "샤퀴테리", "피자", "햄버거", "과일", "디저트", "스낵/과자"],
  },
];

const STEPS: Step[] = [
  "ALCOHOL_PREF",
  "FOOD_PREF",
  "FLAVOR_ACIDITY",
  "FLAVOR_SWEETNESS",
  "FLAVOR_TANNIN",
  "FLAVOR_BODY",
  "FLAVOR_ALCOHOL",
  "WINE_INTEREST",
  "BUDGET",
];

const TasteResetScreen = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { user, setFlavorProfile: saveFlavorProfile } = useUser();
  const { showToast } = useGlobalUI();

  const BUDGET_OPTIONS = [
    { label: t("onboarding.budget.under30"), value: 30000 },
    { label: t("onboarding.budget.30to50"), value: 50000 },
    { label: t("onboarding.budget.50to90"), value: 90000 },
    { label: t("onboarding.budget.90to150"), value: 150000 },
    { label: t("onboarding.budget.over150"), value: 200000 },
  ];

  const LOADING_MESSAGES = [
    t("onboarding.loading.message0"),
    t("onboarding.loading.message1"),
    t("onboarding.loading.message2"),
    t("onboarding.loading.message3"),
    t("onboarding.loading.message4", { nickname: user?.nickname }),
  ];

  const [currentStep, setCurrentStep] = useState<Step>("ALCOHOL_PREF");
  const [preferredAlcohols, setPreferredAlcohols] = useState<string[]>([]);
  const [preferredFoods, setPreferredFoods] = useState<string[]>([]);
  const [wineSort, setWineSort] = useState<string[]>([]);
  const [monthPrice, setMonthPrice] = useState(0);
  const [flavorProfile, setFlavorProfile] = useState<FlavorProfile>({
    acidity: undefined,
    sweetness: undefined,
    tannin: undefined,
    body: undefined,
    alcohol: undefined,
  });

  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  // Guards against double-advance when a flavor option is tapped twice quickly
  // (those steps auto-advance on selection, so there's no Next button to debounce).
  const advancingRef = useRef(false);
  const progressAnim = useRef(new Animated.Value(1 / STEPS.length)).current;

  const toggleAlcohol = (value: string) => {
    setPreferredAlcohols((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const toggleFood = (value: string) => {
    setPreferredFoods((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const toggleWineSort = (value: string) => {
    setWineSort((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const updateFlavorProfile = (
    key: keyof FlavorProfile,
    value: number | null
  ) => {
    setFlavorProfile((prev) => ({ ...prev, [key]: value }));
  };

  const isStepValid = (): boolean => {
    switch (currentStep) {
      case "ALCOHOL_PREF":
        return preferredAlcohols.length > 0;
      case "FOOD_PREF":
        return preferredFoods.length > 0;
      case "FLAVOR_ACIDITY":
        return flavorProfile.acidity !== undefined;
      case "FLAVOR_SWEETNESS":
        return flavorProfile.sweetness !== undefined;
      case "FLAVOR_TANNIN":
        return flavorProfile.tannin !== undefined;
      case "FLAVOR_BODY":
        return flavorProfile.body !== undefined;
      case "FLAVOR_ALCOHOL":
        return flavorProfile.alcohol !== undefined;
      case "WINE_INTEREST":
        return wineSort.length > 0;
      case "BUDGET":
        return monthPrice > 0;
      default:
        return false;
    }
  };

  const animateTransition = (
    nextStepValue: Step,
    direction: "next" | "prev"
  ) => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: direction === "next" ? -SCREEN_WIDTH : SCREEN_WIDTH,
        duration: 180,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setCurrentStep(nextStepValue);
      slideAnim.setValue(direction === "next" ? SCREEN_WIDTH : -SCREEN_WIDTH);

      const nextIndex = STEPS.indexOf(nextStepValue);
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 240,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(progressAnim, {
          toValue: (nextIndex + 1) / STEPS.length,
          duration: 280,
          useNativeDriver: false,
        }),
      ]).start();
    });
  };

  const handleFinalSubmit = async (priceOverride?: number) => {
    const finalPrice = priceOverride ?? monthPrice;
    setLoading(true);
    try {
      const requestData: MemberInitRequest = {
        name: user?.nickname || "",
        isNewbie: true,
        monthPrice: finalPrice,
        wineSort,
        acidity: flavorProfile.acidity ?? null,
        sweetness: flavorProfile.sweetness ?? null,
        tannin: flavorProfile.tannin ?? null,
        body: flavorProfile.body ?? null,
        alcohol: flavorProfile.alcohol ?? null,
        wineArea: null,
        wineVariety: null,
        preferredAlcohols,
        preferredFoods,
      };

      await updateMemberInitInfo(requestData);

      const AsyncStorage = (
        await import("@react-native-async-storage/async-storage")
      ).default;
      await AsyncStorage.setItem(
        "lastTasteResetTime",
        new Date().toISOString()
      );

      setLoading(false);
      setAnalyzing(true);

      setTimeout(() => {
        setAnalyzing(false);
        saveFlavorProfile(flavorProfile);
        (navigation as any).replace("RecommendationResult", {
          flavorProfile,
          nickname: user?.nickname,
          fromReset: true,
        });
      }, 10000);
    } catch (error) {
      console.error("Taste Reset Error:", error);
      showToast(t("tasteReset.error.message"), { type: "error" });
      setLoading(false);
    }
  };

  const nextStep = () => {
    const currentIndex = STEPS.indexOf(currentStep);
    if (currentIndex < STEPS.length - 1) {
      animateTransition(STEPS[currentIndex + 1], "next");
    } else {
      handleFinalSubmit();
    }
  };

  const prevStep = () => {
    const currentIndex = STEPS.indexOf(currentStep);
    if (currentIndex > 0) {
      animateTransition(STEPS[currentIndex - 1], "prev");
    } else {
      navigation.goBack();
    }
  };

  // Single-select steps advance on tap and have no footer button.
  const isAutoAdvanceStep =
    currentStep.startsWith("FLAVOR_") || currentStep === "BUDGET";

  // Flavor steps are single-select 5-point scales — tapping an option records it
  // and immediately moves to the next step (no Next button). Going back re-shows
  // the step with the previous choice highlighted, so it stays editable.
  const handleFlavorSelect = (key: keyof FlavorProfile, value: number) => {
    if (advancingRef.current) return;
    advancingRef.current = true;
    updateFlavorProfile(key, value);
    // Near-instant: just enough for the selected highlight to paint a frame
    // before the slide begins, so tap → motion feels like one continuous action.
    setTimeout(() => {
      nextStep();
      setTimeout(() => {
        advancingRef.current = false;
      }, 450);
    }, 50);
  };

  // Budget is the last step and also single-select — tapping an amount records it
  // and submits immediately (no Complete button). Pass the picked price straight
  // to submit so we don't read stale state before setMonthPrice settles.
  const handleBudgetSelect = (price: number) => {
    if (advancingRef.current) return;
    advancingRef.current = true;
    setMonthPrice(price);
    setTimeout(() => handleFinalSubmit(price), 120);
  };

  const renderStep = () => {
    switch (currentStep) {
      case "ALCOHOL_PREF":
        return (
          <CategorizedSelectionStep
            title={t("onboarding.alcoholPrefTitle")}
            categories={ALCOHOL_CATEGORIES}
            selected={preferredAlcohols}
            onSelect={toggleAlcohol}
            allowCustomInput
          />
        );
      case "FOOD_PREF":
        return (
          <CategorizedSelectionStep
            title={t("onboarding.foodPrefTitle")}
            categories={FOOD_CATEGORIES}
            selected={preferredFoods}
            onSelect={toggleFood}
            allowCustomInput
          />
        );
      case "FLAVOR_ACIDITY":
        return (
          <NewbieFlavorProfileStep
            attribute="acidity"
            value={flavorProfile.acidity}
            onChange={(val) => handleFlavorSelect("acidity", val)}
          />
        );
      case "FLAVOR_SWEETNESS":
        return (
          <NewbieFlavorProfileStep
            attribute="sweetness"
            value={flavorProfile.sweetness}
            onChange={(val) => handleFlavorSelect("sweetness", val)}
          />
        );
      case "FLAVOR_TANNIN":
        return (
          <NewbieFlavorProfileStep
            attribute="tannin"
            value={flavorProfile.tannin}
            onChange={(val) => handleFlavorSelect("tannin", val)}
          />
        );
      case "FLAVOR_BODY":
        return (
          <NewbieFlavorProfileStep
            attribute="body"
            value={flavorProfile.body}
            onChange={(val) => handleFlavorSelect("body", val)}
          />
        );
      case "FLAVOR_ALCOHOL":
        return (
          <NewbieFlavorProfileStep
            attribute="alcohol"
            value={flavorProfile.alcohol}
            onChange={(val) => handleFlavorSelect("alcohol", val)}
          />
        );
      case "WINE_INTEREST":
        return (
          <MultiSelectionStep
            title={t("onboarding.wineSortTitle")}
            options={WINE_SORTS}
            selected={wineSort}
            onSelect={toggleWineSort}
            multi
          />
        );
      case "BUDGET":
        return (
          <BudgetStep
            selectedPrice={monthPrice}
            onSelect={handleBudgetSelect}
            options={BUDGET_OPTIONS}
          />
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={prevStep} style={styles.backButton}>
          <Icon name="chevron-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <View style={styles.progressBarContainer}>
          <Animated.View
            style={[
              styles.progressBar,
              {
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["0%", "100%"],
                }),
              },
            ]}
          />
        </View>
      </View>

      {/* Content */}
      <Animated.View
        style={[
          styles.content,
          {
            transform: [{ translateX: slideAnim }],
            opacity: fadeAnim,
          },
        ]}
      >
        {renderStep()}
      </Animated.View>

      {/* Footer — single-select steps auto-advance on tap, so no button there */}
      {!isAutoAdvanceStep && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.nextButton,
              !isStepValid() && styles.nextButtonDisabled,
            ]}
            onPress={nextStep}
            disabled={!isStepValid()}
          >
            <Text
              style={[
                styles.nextButtonText,
                !isStepValid() && styles.nextButtonTextDisabled,
              ]}
            >
              {t("tasteReset.button.next")}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {loading && (
        <View style={[StyleSheet.absoluteFill, styles.loadingContainer]}>
          <ActivityIndicator size="large" color={accent.base} />
        </View>
      )}

      {analyzing && <AnalyzingOverlay messages={LOADING_MESSAGES} />}
    </SafeAreaView>
  );
};

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
const STAGE_THRESHOLDS = [25, 55, 80];

/**
 * Analysis screen, ported from the resume-scan flow:
 *  - rising radial glow background (no progress gauge anywhere)
 *  - a static sparkles icon with a soft halo
 *  - stage copy that swaps with an up-out / down-in transition
 *  - a plain "%" text that climbs fast → slow, stalls at 92, then jumps to 100
 * Left-aligned. Self-contained — mounts while `analyzing` is true.
 */
const AnalyzingOverlay = ({ messages }: { messages: string[] }) => {
  const [percent, setPercent] = useState(6);
  const [stage, setStage] = useState(0);
  const percentRef = useRef(6);
  const stageRef = useRef(0);

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

  // Percentage climb: fast early, slower late, stall at 92, jump to 100 near the
  // end (the parent navigates away ~10s in).
  useEffect(() => {
    const tick = setInterval(() => {
      const p = percentRef.current;
      if (p >= 92) return;
      const inc = p < 60 ? 3 : p < 85 ? 2 : 1;
      const np = Math.min(92, p + inc);
      percentRef.current = np;
      setPercent(np);
      const reached = STAGE_THRESHOLDS.filter((th) => np >= th).length;
      if (reached > stageRef.current) {
        stageRef.current = reached;
        goToStage(reached);
      }
    }, 320);

    const finish = setTimeout(() => {
      percentRef.current = 100;
      setPercent(100);
      if (stageRef.current < messages.length - 1) {
        stageRef.current = messages.length - 1;
        goToStage(messages.length - 1);
      }
    }, 9000);

    return () => {
      clearInterval(tick);
      clearTimeout(finish);
    };
    // Runs once on mount; re-running would restart the climb each render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={[StyleSheet.absoluteFill, styles.analyzingContainer]}>
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
            gradId={`glow${i}`}
          />
        ))}
      </View>

      {/* Foreground content (left-aligned) */}
      <View style={styles.analyzingTop}>
        <View style={styles.iconWrap}>
          <View style={styles.iconHalo} />
          <View style={styles.iconBox}>
            <LinearGradient
              colors={[accent.base, accent.strong]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <Icon name="sparkles" size={26} color={colors.white} />
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
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  backButton: {
    padding: spacing.xs,
  },
  progressBarContainer: {
    flex: 1,
    height: 4,
    backgroundColor: colors.surface2,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: accent.base,
    borderRadius: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xxl,
  },
  footer: {
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.lg,
    paddingTop: spacing.sm,
  },
  nextButton: {
    backgroundColor: accent.base,
    height: 56,
    borderRadius: radius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  nextButtonDisabled: {
    backgroundColor: colors.surface2,
  },
  nextButtonText: {
    color: accent.onAccent,
    fontSize: 18,
    fontWeight: "bold",
  },
  nextButtonTextDisabled: {
    color: colors.textTertiary,
  },
  loadingContainer: {
    backgroundColor: colors.background,
    zIndex: 9999,
    justifyContent: "center",
    alignItems: "center",
  },
  analyzingContainer: {
    backgroundColor: colors.background,
    zIndex: 9999,
    paddingHorizontal: 28,
    paddingTop: SCREEN_HEIGHT * 0.16,
    paddingBottom: 48,
    overflow: "hidden",
  },
  analyzingTop: {
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
    backgroundColor: accent.base,
    opacity: 0.18,
  },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    shadowColor: accent.base,
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
    minHeight: 68,
  },
  percentText: {
    color: accent.text,
    fontSize: 17,
    fontWeight: "800",
    marginTop: spacing.sm,
  },
  percentSign: {
    color: accent.text,
    fontSize: 17,
    fontWeight: "800",
  },
});

export default TasteResetScreen;
