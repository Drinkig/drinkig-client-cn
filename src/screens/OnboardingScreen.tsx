import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { launchImageLibrary } from "react-native-image-picker";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle } from "react-native-svg"; // SVG import 추가
import Icon from "react-native-vector-icons/Ionicons";
import {
  checkNickname,
  MemberInitRequest,
  updateMemberInitInfo,
  uploadProfileImage,
} from "../api/member";
import { useGlobalUI } from "../context/GlobalUIContext";
import { useUser } from "../context/UserContext";

import { logScreen } from "utils/analytics";
import BudgetStep from "../components/onboarding/BudgetStep";
import { CategorizedSelectionStep } from "../components/onboarding/CategorizedSelectionStep";
import FlavorProfileStep, {
  FlavorProfile,
} from "../components/onboarding/FlavorProfileStep";
import IntroStep from "../components/onboarding/IntroStep";
import NewbieCheckStep from "../components/onboarding/NewbieCheckStep";
import NewbieFlavorProfileStep from "../components/onboarding/NewbieFlavorProfileStep";
import ProfileStep from "../components/onboarding/ProfileStep";
import { MultiSelectionStep } from "../components/onboarding/SelectionSteps";
import TransitionStep from "../components/onboarding/TransitionStep";
import { colors } from '../constants/colors';

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type Step =
  | "INTRO"
  | "PROFILE"
  | "NEWBIE_CHECK"
  | "NEWBIE_TRANSITION"
  | "ALCOHOL_PREF"
  | "FOOD_PREF"
  | "FLAVOR_PROFILE"
  | "FLAVOR_ACIDITY"
  | "FLAVOR_SWEETNESS"
  | "FLAVOR_TANNIN"
  | "FLAVOR_BODY"
  | "FLAVOR_ALCOHOL"
  | "WINE_INTEREST"
  | "EXPERT_TRANSITION"
  | "BUDGET";

interface OnboardingData {
  name: string;
  profileImageUri: string | null;
  profileImageAsset: any | null;
  isNewbie: boolean | null;
  monthPrice: number;
  wineSort: string[];

  wineArea: string[];
  wineVariety: string[];

  preferredAlcohols: string[];
  preferredFoods: string[];
  flavorProfile: FlavorProfile;
}

const INITIAL_DATA: OnboardingData = {
  name: "",
  profileImageUri: null,
  profileImageAsset: null,
  isNewbie: null,
  monthPrice: 0,
  wineSort: [],
  wineArea: [],
  wineVariety: [],
  preferredAlcohols: [],
  preferredFoods: [],
  flavorProfile: {
    acidity: undefined,
    sweetness: undefined,
    tannin: undefined,
    body: undefined,
    alcohol: undefined,
  },
};

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

const WINE_SORTS = ["레드", "화이트", "스파클링", "로제", "주정강화", "디저트"];
const WINE_AREAS = [
  "FRANCE",
  "ITALY",
  "USA",
  "CHILE",
  "SPAIN",
  "AUSTRALIA",
  "NEW_ZEALAND",
  "ARGENTINA",
];
const WINE_VARIETIES = [
  "CABERNET_SAUVIGNON",
  "MERLOT",
  "PINOT_NOIR",
  "CHARDONNAY",
  "SAUVIGNON_BLANC",
  "SYRAH",
  "RIESLING",
];
const BUDGET_OPTIONS = [
  { label: "3만원 이하", value: 30000 },
  { label: "3~5만원", value: 50000 },
  { label: "5~9만원", value: 90000 },
  { label: "9~15만원", value: 150000 },
  { label: "15만원 이상", value: 200000 },
];

const LOADING_MESSAGES = [
  "작성해주신 취향을 분석하고 있어요...",
  "좋아하는 맛과 향을 꼼꼼히 확인 중이에요...",
  "입맛에 딱 맞는 품종을 찾는 중이에요...",
  "전 세계 와인 품종 데이터를 매칭하고 있어요...",
  "{nickname}님에게 가장 잘 어울리는 품종을 찾았어요!",
];

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const OnboardingScreen = () => {
  const navigation = useNavigation();
  const { completeOnboarding } = useUser();
  const { showAlert } = useGlobalUI();

  const [step, setStep] = useState<Step>("INTRO");
  const [formData, setFormData] = useState<OnboardingData>(INITIAL_DATA);
  const [loading, setLoading] = useState(false);
  const [nicknameAvailable, setNicknameAvailable] = useState<boolean | null>(
    null
  );
  const [nicknameError, setNicknameError] = useState<string | null>(null);
  const [isCheckingNickname, setIsCheckingNickname] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzingIndex, setAnalyzingIndex] = useState(0);

  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const loadingBarAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const logScreenName: Record<Step, string> = {
      INTRO: "onboarding_intro",
      PROFILE: "onboarding_profile",
      NEWBIE_CHECK: "onboarding_newbie_check",
      NEWBIE_TRANSITION: "onboarding_newbie_transition",
      EXPERT_TRANSITION: "onboarding_expert_transition",
      ALCOHOL_PREF: "onboarding_alcohol_preference",
      FOOD_PREF: "onboarding_food_preference",
      FLAVOR_PROFILE: "onboarding_flavor_profile",
      FLAVOR_ACIDITY: "onboarding_flavor_acidity",
      FLAVOR_SWEETNESS: "onboarding_flavor_sweetness",
      FLAVOR_TANNIN: "onboarding_flavor_tannin",
      FLAVOR_BODY: "onboarding_flavor_body",
      FLAVOR_ALCOHOL: "onboarding_flavor_alcohol",
      WINE_INTEREST: "onboarding_wine_interest",
      BUDGET: "onboarding_budget",
    };

    logScreen(logScreenName[step], "Onboarding");
  }, [step]);

  const isStepValid = () => {
    switch (step) {
      case "INTRO":
        return true;
      case "PROFILE":
        return !!formData.name && nicknameAvailable === true;
      case "NEWBIE_CHECK":
        return formData.isNewbie !== null;
      case "NEWBIE_TRANSITION":
      case "EXPERT_TRANSITION":
        return true;
      case "ALCOHOL_PREF":
        return formData.preferredAlcohols.length > 0;
      case "FOOD_PREF":
        return formData.preferredFoods.length > 0;
      case "FLAVOR_PROFILE":
        const { acidity, sweetness, tannin, body, alcohol } =
          formData.flavorProfile;
        return (
          acidity !== undefined &&
          sweetness !== undefined &&
          tannin !== undefined &&
          body !== undefined &&
          alcohol !== undefined
        );
      case "FLAVOR_ACIDITY":
        return formData.flavorProfile.acidity !== undefined;
      case "FLAVOR_SWEETNESS":
        return formData.flavorProfile.sweetness !== undefined;
      case "FLAVOR_TANNIN":
        return formData.flavorProfile.tannin !== undefined;
      case "FLAVOR_BODY":
        return formData.flavorProfile.body !== undefined;
      case "FLAVOR_ALCOHOL":
        return formData.flavorProfile.alcohol !== undefined;
      case "WINE_INTEREST":
        return formData.wineSort.length > 0;
      case "BUDGET":
        return formData.monthPrice !== 0;
      default:
        return false;
    }
  };

  const updateData = (key: keyof OnboardingData, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const toggleSelection = (
    key:
      | "wineSort"
      | "wineArea"
      | "wineVariety"
      | "preferredAlcohols"
      | "preferredFoods",
    value: string
  ) => {
    setFormData((prev) => {
      const current = prev[key] as string[];
      if (current.includes(value)) {
        return { ...prev, [key]: current.filter((item) => item !== value) };
      } else {
        return { ...prev, [key]: [...current, value] };
      }
    });
  };

  const updateFlavorProfile = (
    key: keyof FlavorProfile,
    value: number | null
  ) => {
    setFormData((prev) => ({
      ...prev,
      flavorProfile: {
        ...prev.flavorProfile,
        [key]: value,
      },
    }));
  };

  const handlePickImage = async () => {
    const result = await launchImageLibrary({
      mediaType: "photo",
      quality: 0.8,
      maxWidth: 1024,
      maxHeight: 1024,
    });

    if (result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      updateData("profileImageUri", asset.uri);
      updateData("profileImageAsset", asset);
    }
  };

  useEffect(() => {
    if (!formData.name) {
      setNicknameError(null);
      setNicknameAvailable(null);
      return;
    }

    setNicknameAvailable(null);
    setNicknameError(null);
    setIsCheckingNickname(true);

    const timer = setTimeout(async () => {
      if (formData.name.length < 2) {
        setNicknameError("닉네임은 2글자 이상이어야 해요.");
        setNicknameAvailable(false);
        setIsCheckingNickname(false);
        return;
      }

      if (/[ㄱ-ㅎㅏ-ㅣ]/.test(formData.name)) {
        setNicknameError(
          "올바른 닉네임 형식이 아니에요 (자음/모음 단독 사용 불가)."
        );
        setNicknameAvailable(false);
        setIsCheckingNickname(false);
        return;
      }

      try {
        const res = await checkNickname(formData.name);
        if (res.result) {
          setNicknameAvailable(true);
          setNicknameError(null);
        } else {
          setNicknameAvailable(false);
          setNicknameError("이미 사용 중인 닉네임이에요");
        }
      } catch (e) {
        setNicknameError("닉네임 확인 중 오류가 발생했습니다.");
        setNicknameAvailable(false);
      } finally {
        setIsCheckingNickname(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.name]);

  useEffect(() => {
    if (analyzing) {
      setAnalyzingIndex(0);
      loadingBarAnim.setValue(0);

      const times = [2000, 3000, 5000, 8000];

      const timeout1 = setTimeout(() => setAnalyzingIndex(1), times[0]);
      const timeout2 = setTimeout(() => setAnalyzingIndex(2), times[1]);
      const timeout3 = setTimeout(() => setAnalyzingIndex(3), times[2]);
      const timeout4 = setTimeout(() => setAnalyzingIndex(4), times[3]);

      Animated.sequence([
        Animated.timing(loadingBarAnim, {
          toValue: 0.3,
          duration: 2000,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),

        Animated.timing(loadingBarAnim, {
          toValue: 0.6,
          duration: 4000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),

        Animated.timing(loadingBarAnim, {
          toValue: 0.85,
          duration: 2000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),

        Animated.timing(loadingBarAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();

      return () => {
        clearTimeout(timeout1);
        clearTimeout(timeout2);
        clearTimeout(timeout3);
        clearTimeout(timeout4);
        loadingBarAnim.stopAnimation();
      };
    }
  }, [analyzing]);

  const CIRCLE_SIZE = 120;
  const STROKE_WIDTH = 8;
  const RADIUS = (CIRCLE_SIZE - STROKE_WIDTH) / 2;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

  const strokeDashoffset = loadingBarAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [CIRCUMFERENCE, 0],
  });

  const handleFinalSubmit = async () => {
    setLoading(true);
    try {
      if (formData.profileImageUri && formData.profileImageAsset) {
        console.log("📸 Starting profile image upload...");
        try {
          await uploadProfileImage(
            formData.profileImageAsset.uri,
            formData.profileImageAsset.type,
            formData.profileImageAsset.fileName
          );
          console.log("✅ Profile image upload successful");
        } catch (e) {
          console.error("❌ Profile image upload failed:", e);
          throw e;
        }
      }

      const requestData: MemberInitRequest = {
        name: formData.name,
        isNewbie: formData.isNewbie as boolean,
        monthPrice: formData.monthPrice,
        wineSort: formData.wineSort,
      };

      requestData.preferredAlcohols = formData.preferredAlcohols;
      requestData.preferredFoods = formData.preferredFoods;
      requestData.acidity = formData.flavorProfile.acidity ?? null;
      requestData.sweetness = formData.flavorProfile.sweetness ?? null;
      requestData.tannin = formData.flavorProfile.tannin ?? null;
      requestData.body = formData.flavorProfile.body ?? null;
      requestData.alcohol = formData.flavorProfile.alcohol ?? null;

      requestData.wineArea = null;
      requestData.wineVariety = null;

      console.log(
        "🔍 Onboarding Request Payload:",
        JSON.stringify(requestData, null, 2)
      );

      await updateMemberInitInfo(requestData);
      console.log("✅ Member info update successful");

      setLoading(false);
      setAnalyzing(true);

      setTimeout(() => {
        setAnalyzing(false);
        (navigation as any).navigate("RecommendationResult", {
          flavorProfile: formData.flavorProfile,
          nickname: formData.name,
        });
      }, 10000);
    } catch (error) {
      console.error("Onboarding Error:", error);
      showAlert({
        title: "오류",
        message: "정보 저장 중 문제가 발생했습니다.",
        singleButton: true,
      });
      setLoading(false);
    }
  };

  const animateTransition = (
    nextStepValue: Step,
    direction: "next" | "prev"
  ) => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: direction === "next" ? -SCREEN_WIDTH : SCREEN_WIDTH,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setStep(nextStepValue);
      slideAnim.setValue(direction === "next" ? SCREEN_WIDTH : -SCREEN_WIDTH);

      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const nextStep = () => {
    let next: Step | null = null;

    switch (step) {
      case "INTRO":
        next = "PROFILE";
        break;
      case "PROFILE":
        next = "NEWBIE_CHECK";
        break;
      case "NEWBIE_CHECK":
        next = formData.isNewbie ? "NEWBIE_TRANSITION" : "EXPERT_TRANSITION";
        break;

      case "NEWBIE_TRANSITION":
        next = "ALCOHOL_PREF";
        break;

      case "EXPERT_TRANSITION":
        next = "ALCOHOL_PREF";
        break;

      case "ALCOHOL_PREF":
        next = "FOOD_PREF";
        break;
      case "FOOD_PREF":
        if (formData.isNewbie) {
          next = "FLAVOR_ACIDITY";
        } else {
          next = "FLAVOR_PROFILE";
        }
        break;

      case "FLAVOR_PROFILE":
        next = "WINE_INTEREST";
        break;

      case "FLAVOR_ACIDITY":
        next = "FLAVOR_SWEETNESS";
        break;
      case "FLAVOR_SWEETNESS":
        next = "FLAVOR_TANNIN";
        break;
      case "FLAVOR_TANNIN":
        next = "FLAVOR_BODY";
        break;
      case "FLAVOR_BODY":
        next = "FLAVOR_ALCOHOL";
        break;
      case "FLAVOR_ALCOHOL":
        next = "WINE_INTEREST";
        break;
      case "WINE_INTEREST":
        next = "BUDGET";
        break;
      case "BUDGET":
        handleFinalSubmit();
        return;
    }

    if (next) {
      animateTransition(next, "next");
    }
  };

  const prevStep = () => {
    let prev: Step | null = null;

    if (step === "PROFILE") prev = "INTRO";
    if (step === "NEWBIE_CHECK") prev = "PROFILE";

    if (step === "NEWBIE_TRANSITION") prev = "NEWBIE_CHECK";
    if (step === "ALCOHOL_PREF") {
      prev = formData.isNewbie ? "NEWBIE_TRANSITION" : "EXPERT_TRANSITION";
    }
    if (step === "FOOD_PREF") prev = "ALCOHOL_PREF";

    if (step === "FLAVOR_PROFILE") prev = "FOOD_PREF";

    if (step === "FLAVOR_ACIDITY") prev = "FOOD_PREF";
    if (step === "FLAVOR_SWEETNESS") prev = "FLAVOR_ACIDITY";
    if (step === "FLAVOR_TANNIN") prev = "FLAVOR_SWEETNESS";
    if (step === "FLAVOR_BODY") prev = "FLAVOR_TANNIN";
    if (step === "FLAVOR_ALCOHOL") prev = "FLAVOR_BODY";

    if (step === "WINE_INTEREST") {
      prev = formData.isNewbie ? "FLAVOR_ALCOHOL" : "FLAVOR_PROFILE";
    }

    if (step === "EXPERT_TRANSITION") prev = "NEWBIE_CHECK";
    if (step === "BUDGET") prev = "WINE_INTEREST";

    if (prev) {
      animateTransition(prev, "prev");
    }
  };

  const getProgress = () => {
    if (step === "PROFILE") return 0.15;
    if (step === "NEWBIE_CHECK") return 0.3;

    const isNewbieMode = formData.isNewbie;

    if (step === "NEWBIE_TRANSITION" || step === "EXPERT_TRANSITION")
      return 0.4;

    if (step === "ALCOHOL_PREF") return 0.5;
    if (step === "FOOD_PREF") return 0.6;

    if (isNewbieMode) {
      if (step === "FLAVOR_ACIDITY") return 0.65;
      if (step === "FLAVOR_SWEETNESS") return 0.7;
      if (step === "FLAVOR_TANNIN") return 0.75;
      if (step === "FLAVOR_BODY") return 0.8;
      if (step === "FLAVOR_ALCOHOL") return 0.85;
      if (step === "WINE_INTEREST") return 0.9;
      if (step === "BUDGET") return 0.95;
    } else {
      if (step === "FLAVOR_PROFILE") return 0.75;
      if (step === "WINE_INTEREST") return 0.85;
      if (step === "BUDGET") return 0.95;
    }

    return 0;
  };

  useEffect(() => {
    if (step === "INTRO") {
      progressAnim.setValue(0);
      return;
    }

    const targetProgress = getProgress();
    Animated.timing(progressAnim, {
      toValue: targetProgress,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [step, formData.isNewbie]);

  const renderProgressBar = () => {
    if (step === "INTRO") return null;

    const widthInterpolation = progressAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ["0%", "100%"],
    });

    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressBarBackground}>
          <Animated.View
            style={[styles.progressBarFill, { width: widthInterpolation }]}
          />
        </View>
      </View>
    );
  };

  const renderContent = () => {
    switch (step) {
      case "INTRO":
        return <IntroStep />;
      case "PROFILE":
        return (
          <ProfileStep
            name={formData.name}
            profileImageUri={formData.profileImageUri}
            onNameChange={(t: string) => updateData("name", t)}
            onPickImage={handlePickImage}
            errorMessage={nicknameError}
            isValid={nicknameAvailable}
          />
        );
      case "NEWBIE_CHECK":
        return (
          <NewbieCheckStep
            isNewbie={formData.isNewbie}
            onSelect={(val: boolean) => updateData("isNewbie", val)}
            name={formData.name}
          />
        );
      case "NEWBIE_TRANSITION":
        return <TransitionStep isNewbie={true} name={formData.name} />;
      case "EXPERT_TRANSITION":
        return <TransitionStep isNewbie={false} name={formData.name} />;
      case "ALCOHOL_PREF":
        return (
          <CategorizedSelectionStep
            title="평소에 어떤 술을 즐기시나요?"
            categories={ALCOHOL_CATEGORIES}
            selected={formData.preferredAlcohols}
            onSelect={(v: string) => toggleSelection("preferredAlcohols", v)}
            allowCustomInput
          />
        );
      case "FOOD_PREF":
        return (
          <CategorizedSelectionStep
            title="어떤 음식과 함께 즐기고 싶나요?"
            categories={FOOD_CATEGORIES}
            selected={formData.preferredFoods}
            onSelect={(v: string) => toggleSelection("preferredFoods", v)}
            allowCustomInput
          />
        );
      case "FLAVOR_PROFILE":
        return (
          <FlavorProfileStep
            data={formData.flavorProfile}
            onChange={updateFlavorProfile}
          />
        );
      case "FLAVOR_ACIDITY":
        return (
          <NewbieFlavorProfileStep
            attribute="acidity"
            value={formData.flavorProfile.acidity}
            onChange={(val) => updateFlavorProfile("acidity", val)}
          />
        );
      case "FLAVOR_SWEETNESS":
        return (
          <NewbieFlavorProfileStep
            attribute="sweetness"
            value={formData.flavorProfile.sweetness}
            onChange={(val) => updateFlavorProfile("sweetness", val)}
          />
        );
      case "FLAVOR_TANNIN":
        return (
          <NewbieFlavorProfileStep
            attribute="tannin"
            value={formData.flavorProfile.tannin}
            onChange={(val) => updateFlavorProfile("tannin", val)}
          />
        );
      case "FLAVOR_BODY":
        return (
          <NewbieFlavorProfileStep
            attribute="body"
            value={formData.flavorProfile.body}
            onChange={(val) => updateFlavorProfile("body", val)}
          />
        );
      case "FLAVOR_ALCOHOL":
        return (
          <NewbieFlavorProfileStep
            attribute="alcohol"
            value={formData.flavorProfile.alcohol}
            onChange={(val) => updateFlavorProfile("alcohol", val)}
          />
        );
      case "WINE_INTEREST":
        return (
          <MultiSelectionStep
            title="추천 받고 싶은 와인 종류는?"
            options={WINE_SORTS}
            selected={formData.wineSort}
            onSelect={(v: string) => toggleSelection("wineSort", v)}
            multi
          />
        );
      case "BUDGET":
        return (
          <BudgetStep
            selectedPrice={formData.monthPrice}
            onSelect={(v: number) => updateData("monthPrice", v)}
            options={BUDGET_OPTIONS}
          />
        );
      default:
        return null;
    }
  };

  const getButtonText = () => {
    if (loading) return "저장 중...";

    switch (step) {
      case "INTRO":
        return "좋아요";
      case "PROFILE":
        return "다음";
      case "NEWBIE_CHECK":
        return "선택 완료";
      case "NEWBIE_TRANSITION":
        return "취향 찾으러 가기";
      case "EXPERT_TRANSITION":
        return "취향 등록하러 가기";
      case "BUDGET":
        return "결과 보기";
      default:
        return "다음";
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        {step !== "INTRO" && (
          <TouchableOpacity onPress={prevStep} style={styles.backButton}>
            <Icon name="arrow-back" size={24} color={colors.white} />
          </TouchableOpacity>
        )}
      </View>

      {renderProgressBar()}

      <Animated.View
        style={[
          styles.body,
          {
            transform: [{ translateX: slideAnim }],
            opacity: fadeAnim,
          },
        ]}
      >
        {renderContent()}
      </Animated.View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.nextButton,
            (loading || !isStepValid()) && styles.disabledButton,
          ]}
          onPress={nextStep}
          disabled={loading || !isStepValid()}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.nextButtonText}>{getButtonText()}</Text>
          )}
        </TouchableOpacity>
      </View>

      {analyzing && (
        <View style={[StyleSheet.absoluteFill, styles.analyzingContainer]}>
          {/* 원형 프로그레스 바 */}
          <View
            style={{
              width: CIRCLE_SIZE,
              height: CIRCLE_SIZE,
              justifyContent: "center",
              alignItems: "center",
              marginBottom: 10,
            }}
          >
            <Svg width={CIRCLE_SIZE} height={CIRCLE_SIZE}>
              <Circle
                cx={CIRCLE_SIZE / 2}
                cy={CIRCLE_SIZE / 2}
                r={RADIUS}
                stroke={colors.border}
                strokeWidth={STROKE_WIDTH}
                fill="transparent"
              />

              <AnimatedCircle
                cx={CIRCLE_SIZE / 2}
                cy={CIRCLE_SIZE / 2}
                r={RADIUS}
                stroke={colors.primary}
                strokeWidth={STROKE_WIDTH}
                fill="transparent"
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                rotation="-90"
                origin={`${CIRCLE_SIZE / 2}, ${CIRCLE_SIZE / 2}`}
              />
            </Svg>
          </View>

          <Text style={styles.analyzingText}>
            {LOADING_MESSAGES[analyzingIndex].replace(
              "{nickname}",
              formData.name
            )}
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
  header: {
    height: 50,
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  backButton: {
    padding: 8,
  },
  progressContainer: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  body: {
    flex: 1,
    paddingHorizontal: 24,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#222",
  },
  nextButton: {
    width: "100%",
    height: 56,
    backgroundColor: colors.primary,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  disabledButton: {
    opacity: 0.3,
  },
  nextButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: "bold",
  },
  analyzingContainer: {
    backgroundColor: "#121212",
    zIndex: 9999,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  analyzingText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "500",
    marginTop: 20,
    marginBottom: 0,
    textAlign: "center",
    lineHeight: 24,
    opacity: 0.9,
  },
});

export default OnboardingScreen;
