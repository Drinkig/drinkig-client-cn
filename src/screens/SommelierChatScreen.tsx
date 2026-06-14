import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Animated,
  Easing,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/Ionicons";
import LinearGradient from "react-native-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import { RootStackParamList } from "../types";
import { colors } from "../constants/colors";
import {
  getFoodPairingRecommendation,
  FoodRecommendationDTO,
} from "../api/wine";
import { useUser } from "../context/UserContext";
import { useSubscription } from "../context/SubscriptionContext";
import { FlavorProfile } from "../components/onboarding/FlavorProfileStep";
import AnalyzingRadarChart from "../components/common/AnalyzingRadarChart";
import { getFoodDetail, SupportedLang } from "../data/foodDetails";

type Cuisine = { name: string; flag: string; items: string[] };

type Message =
  | { id: string; role: "sommelier"; kind: "text"; text: string }
  | { id: string; role: "user"; kind: "text"; text: string }
  | {
      id: string;
      role: "sommelier";
      kind: "wines";
      foodName: string;
      wines: FoodRecommendationDTO[];
      foodFlavor: FlavorProfile | null;
      nickname: string;
    };

type Step = "top" | "sub" | "food" | "finding" | "results" | "error" | "upsell";

type SubCategory = {
  label: string;
  flag: string;
  cuisineIndex: number; // index into foodSelection.cuisines
};

type TopCategory =
  | { kind: "leaf"; label: string; flag: string; cuisineIndex: number }
  | { kind: "group"; label: string; flag: string; subs: SubCategory[] };

const TYPING_DELAY = 700;

/** Typing indicator duration that scales with text length (feels human). */
const typingFor = (text: string, base = 700, perChar = 28, max = 2800) =>
  Math.min(max, base + text.length * perChar);

/**
 * Compute a per-axis midpoint between the user's taste profile and the food's
 * required flavor profile. This represents the wine style that bridges both.
 * Falls back gracefully if one side is missing.
 */
const computeMatchedProfile = (
  userProfile: FlavorProfile | null,
  foodProfile: FlavorProfile | null
): FlavorProfile | null => {
  if (!userProfile && !foodProfile) return null;
  if (!userProfile) return foodProfile;
  if (!foodProfile) return userProfile;
  const mid = (a: number | null | undefined, b: number | null | undefined) => {
    const av = typeof a === "number" ? a : null;
    const bv = typeof b === "number" ? b : null;
    if (av === null && bv === null) return null;
    if (av === null) return bv;
    if (bv === null) return av;
    return (av + bv) / 2;
  };
  return {
    acidity: mid(userProfile.acidity, foodProfile.acidity),
    sweetness: mid(userProfile.sweetness, foodProfile.sweetness),
    tannin: mid(userProfile.tannin, foodProfile.tannin),
    body: mid(userProfile.body, foodProfile.body),
    alcohol: mid(userProfile.alcohol, foodProfile.alcohol),
  };
};

// Index mapping into foodSelection.cuisines (order must match ko.json/en.json):
// 0=한식, 1=중식, 2=일식, 3=양식(generic), 4=스페인, 5=프랑스, 6=베트남,
// 7=태국, 8=인도, 9=멕시코, 10=남미, 11=이탈리아, 12=아메리칸 차이니즈,
// 13=간단안주/스낵, 14=디저트
const buildTopCategories = (
  cuisines: Cuisine[],
  t: (key: string) => string
): TopCategory[] => {
  const leaf = (i: number): TopCategory => ({
    kind: "leaf",
    label: cuisines[i].name,
    flag: cuisines[i].flag,
    cuisineIndex: i,
  });
  const sub = (
    i: number,
    overrideLabel?: string,
    overrideFlag?: string
  ): SubCategory => ({
    label: overrideLabel ?? cuisines[i].name,
    flag: overrideFlag ?? cuisines[i].flag,
    cuisineIndex: i,
  });
  return [
    leaf(0), // 한식
    leaf(1), // 중식
    leaf(2), // 일식
    {
      kind: "group",
      label: t("sommelierChat.groups.western"),
      flag: "🍝",
      subs: [
        sub(11), // 이탈리아
        sub(5), // 프랑스
        sub(4), // 스페인
        sub(3, t("sommelierChat.groups.westernGeneric"), "🍽️"), // 기타 양식
      ],
    },
    {
      kind: "group",
      label: t("sommelierChat.groups.other"),
      flag: "🌍",
      subs: [
        sub(6), // 베트남
        sub(7), // 태국
        sub(8), // 인도
        sub(9), // 멕시코
        sub(10), // 남미
        sub(12), // 아메리칸 차이니즈
        sub(13), // 간단안주/스낵
        sub(14), // 디저트
      ],
    },
  ];
};

export default function SommelierChatScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { t, i18n } = useTranslation();
  const { user, flavorProfile } = useUser();
  const { checkFeature } = useSubscription();
  const hasFoodPairing = checkFeature("foodPairing");
  const nickname = user?.nickname || t("foodPairingResult.defaultNickname");
  const currentLang: SupportedLang = i18n.language?.startsWith("en")
    ? "en"
    : "ko";

  const cuisines = t("foodSelection.cuisines", {
    returnObjects: true,
  }) as Cuisine[];

  // Korean cuisines used as canonical lookup for API calls (backend expects KO).
  const koCuisines = t("foodSelection.cuisines", {
    returnObjects: true,
    lng: "ko",
  }) as Cuisine[];

  const topCategories = React.useMemo(
    () => buildTopCategories(cuisines, t),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cuisines.length]
  );

  const [messages, setMessages] = useState<Message[]>([]);
  const [step, setStep] = useState<Step>("top");
  const [selectedTop, setSelectedTop] = useState<TopCategory | null>(null);
  const [selectedSub, setSelectedSub] = useState<SubCategory | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [thinkingLabel, setThinkingLabel] = useState<string | null>(null);
  const [lastFood, setLastFood] = useState<string | null>(null);
  const [choicesVisible, setChoicesVisible] = useState(false);
  const choicesOpacity = useRef(new Animated.Value(0)).current;
  const choicesTranslateY = useRef(new Animated.Value(8)).current;
  // Upsell sheet slide-up animation (free-user paywall card at screen bottom).
  const upsellOpacity = useRef(new Animated.Value(0)).current;
  const upsellTranslateY = useRef(new Animated.Value(40)).current;

  const scrollRef = useRef<ScrollView>(null);
  const idCounter = useRef(0);
  const nextId = () => `m${idCounter.current++}`;

  // Initial greeting. For free users, Drinky greets and then explains the
  // premium subscription instead of starting the food-pairing flow.
  useEffect(() => {
    setIsTyping(true);
    const timer = setTimeout(() => {
      setIsTyping(false);
      setMessages([
        {
          id: nextId(),
          role: "sommelier",
          kind: "text",
          text: t("sommelierChat.greeting", { nickname }),
        },
      ]);

      if (!hasFoodPairing) {
        // Follow-up: explain the premium subscription as a sequence of short
        // chat messages, then push an inline upsell card with the CTA.
        // Keep delays short so free users aren't stuck waiting.
        const lines = [
          t("sommelierChat.upsell.intro"),
          t("sommelierChat.upsell.benefitsIntro"),
        ];
        const sayLine = (text: string, after: () => void) => {
          setIsTyping(true);
          setTimeout(() => {
            setIsTyping(false);
            pushMessage({
              id: nextId(),
              role: "sommelier",
              kind: "text",
              text,
            });
            setTimeout(after, 350);
          }, 600);
        };
        setTimeout(() => {
          sayLine(lines[0], () => {
            sayLine(lines[1], () => {
              setStep("upsell");
            });
          });
        }, 400);
      }
    }, TYPING_DELAY);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Auto-scroll to bottom on new content or when the choices area expands
    // (so the last message isn't covered by newly appearing chips).
    const timer = setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 80);
    return () => clearTimeout(timer);
  }, [messages, isTyping, thinkingLabel, choicesVisible, step]);

  // Animate the upsell sheet in when the user reaches the upsell step.
  useEffect(() => {
    if (step !== "upsell") return;
    Animated.parallel([
      Animated.timing(upsellOpacity, {
        toValue: 1,
        duration: 420,
        useNativeDriver: true,
      }),
      Animated.timing(upsellTranslateY, {
        toValue: 0,
        duration: 420,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  }, [step]);

  // Reveal choices shortly after sommelier finishes typing,
  // so it feels like they said something and then offered options.
  useEffect(() => {
    if (isTyping || step === "finding") {
      setChoicesVisible(false);
      choicesOpacity.setValue(0);
      choicesTranslateY.setValue(8);
      return;
    }
    const timer = setTimeout(() => {
      setChoicesVisible(true);
      Animated.parallel([
        Animated.timing(choicesOpacity, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(choicesTranslateY, {
          toValue: 0,
          duration: 350,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
    }, 800);
    return () => clearTimeout(timer);
  }, [isTyping, step]);

  const pushMessage = (msg: Message) => {
    setMessages((prev) => [...prev, msg]);
  };

  const updateMessage = (id: string, updater: (m: Message) => Message) => {
    setMessages((prev) => prev.map((m) => (m.id === id ? updater(m) : m)));
  };

  const sommelierReply = (text: string, afterMs = TYPING_DELAY) => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      pushMessage({ id: nextId(), role: "sommelier", kind: "text", text });
    }, afterMs);
  };

  const handleTopPick = (top: TopCategory) => {
    const userMsgKey =
      top.kind === "leaf"
        ? "sommelierChat.userPickedCuisine"
        : "sommelierChat.userPickedGroup";
    pushMessage({
      id: nextId(),
      role: "user",
      kind: "text",
      text: t(userMsgKey, {
        cuisine: `${top.flag} ${top.label}`,
      }),
    });
    setSelectedTop(top);
    setSelectedSub(null);
    if (top.kind === "leaf") {
      setStep("food");
      sommelierReply(t("sommelierChat.askFood", { cuisine: top.label }));
    } else {
      setStep("sub");
      sommelierReply(t("sommelierChat.askSub"));
    }
  };

  const handleSubPick = (sub: SubCategory) => {
    pushMessage({
      id: nextId(),
      role: "user",
      kind: "text",
      text: t("sommelierChat.userPickedFood", {
        food: `${sub.flag} ${sub.label}`,
      }),
    });
    setSelectedSub(sub);
    setStep("food");
    sommelierReply(t("sommelierChat.askFood", { cuisine: sub.label }));
  };

  // Fetch + show wine result card. Coordinates with the thinking-steps bubble:
  // marks all steps as done once the API resolves and the minimum think time
  // has elapsed, then pushes the wines card.
  // `apiFood` is sent to the API (always Korean canonical).
  // `displayFood` is what shows on UI / messages (localized).
  const fetchAndShowResults = async (
    apiFood: string,
    displayFood: string = apiFood,
    minThinkMs = 3400
  ) => {
    const startedAt = Date.now();
    try {
      const response = await getFoodPairingRecommendation(apiFood);
      if (!response.isSuccess || !response.result) {
        throw new Error("Failed");
      }
      const wines = response.result.recommendWines ?? [];
      const rawFoodFlavor = response.result.foodFlavor ?? null;
      // Chart should represent the taste-match — midpoint of the user's
      // profile and the food's required profile.
      const matchedProfile = computeMatchedProfile(
        flavorProfile,
        rawFoodFlavor
      );

      const elapsed = Date.now() - startedAt;
      const wait = Math.max(0, minThinkMs - elapsed);
      await new Promise<void>((resolve) => setTimeout(() => resolve(), wait));

      // Clear thinking status, then show typing indicator briefly
      // before revealing the wine result.
      setThinkingLabel(null);
      setIsTyping(true);
      await new Promise<void>((resolve) => setTimeout(() => resolve(), 1100));
      setIsTyping(false);
      pushMessage({
        id: nextId(),
        role: "sommelier",
        kind: "wines",
        foodName: displayFood,
        wines,
        foodFlavor: matchedProfile,
        nickname,
      });

      // Outro message after a short beat
      const outroText = t("sommelierChat.resultOutro");
      setTimeout(() => {
        setIsTyping(true);
        setTimeout(() => {
          setIsTyping(false);
          pushMessage({
            id: nextId(),
            role: "sommelier",
            kind: "text",
            text: outroText,
          });
          setStep("results");
        }, typingFor(outroText));
      }, 1200);
    } catch (error) {
      console.error("Failed to fetch recommendations:", error);
      const elapsed = Date.now() - startedAt;
      const wait = Math.max(0, 800 - elapsed);
      await new Promise<void>((resolve) => setTimeout(() => resolve(), wait));
      setThinkingLabel(null);
      setIsTyping(false);
      setTimeout(() => {
        pushMessage({
          id: nextId(),
          role: "sommelier",
          kind: "text",
          text: t("sommelierChat.errorFetch"),
        });
        setStep("error");
      }, 300);
    }
  };

  const handleFoodPick = (food: string, foodIdx: number) => {
    if (currentCuisineIndex === undefined) return;

    // Backend only knows Korean food names — resolve the canonical KO name
    // by index, regardless of current UI language.
    const canonicalFood =
      koCuisines[currentCuisineIndex]?.items?.[foodIdx] ?? food;

    // 1) User picks the food — show the localized name as-is (some items
    //    contain slashes like "스시/초밥" which read awkwardly with a suffix).
    pushMessage({
      id: nextId(),
      role: "user",
      kind: "text",
      text: food,
    });
    setLastFood(canonicalFood);
    setStep("finding");

    // 2) Sommelier reacts with a food-specific line
    const detailLine = getFoodDetail(
      currentCuisineIndex,
      foodIdx,
      currentLang,
      food
    );

    const bridgeText = t("sommelierChat.tasteBridge", { nickname });

    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      pushMessage({
        id: nextId(),
        role: "sommelier",
        kind: "text",
        text: detailLine,
      });

      // 3) Bridge message — fixed text, so use a short typing delay regardless of length
      setTimeout(() => {
        setIsTyping(true);
        setTimeout(() => {
          setIsTyping(false);
          pushMessage({
            id: nextId(),
            role: "sommelier",
            kind: "text",
            text: bridgeText,
          });

          // 4) Thinking — subtle status line (not a chat bubble) whose text
          //    cycles through the analysis steps. Each step has its own
          //    duration so it feels more natural.
          setTimeout(() => {
            const steps: { label: string; duration: number }[] = [
              {
                label: t("sommelierChat.thinking.checkingTaste", { nickname }),
                duration: 1600,
              },
              {
                label: t("sommelierChat.thinking.analyzingFood", { food }),
                duration: 2600,
              },
              {
                label: t("sommelierChat.thinking.comparing"),
                duration: 2100,
              },
              {
                label: t("sommelierChat.thinking.organizing"),
                duration: 2400,
              },
            ];
            const totalThinkMs = steps.reduce((sum, s) => sum + s.duration, 0);

            setThinkingLabel(steps[0].label);

            // Swap label at cumulative offsets
            let cumulative = 0;
            for (let i = 0; i < steps.length - 1; i++) {
              cumulative += steps[i].duration;
              const nextLabel = steps[i + 1].label;
              setTimeout(() => {
                setThinkingLabel(nextLabel);
              }, cumulative);
            }

            fetchAndShowResults(canonicalFood, food, totalThinkMs);
          }, 600);
        }, 700); // fixed short typing for the bridge message
      }, 1200);
    }, typingFor(detailLine));
  };

  const handleReset = () => {
    setSelectedTop(null);
    setSelectedSub(null);
    setLastFood(null);
    // Reset choices animation so the top chips fade in like they did
    // initially, instead of popping into view.
    setChoicesVisible(false);
    choicesOpacity.setValue(0);
    choicesTranslateY.setValue(8);
    setStep("top");
  };

  const handleRetry = () => {
    if (!lastFood) {
      handleReset();
      return;
    }
    setStep("finding");
    sommelierReply(
      t("sommelierChat.finding", { food: lastFood }),
      TYPING_DELAY
    );
    setTimeout(() => {
      fetchAndShowResults(lastFood);
    }, TYPING_DELAY + 900);
  };

  const handleBackOne = () => {
    // food → sub (if we came via sub) or top; sub → top
    if (step === "food") {
      if (selectedSub && selectedTop?.kind === "group") {
        setSelectedSub(null);
        setStep("sub");
        return;
      }
    }
    setSelectedTop(null);
    setSelectedSub(null);
    setStep("top");
  };

  // Determine current cuisine index for the food step
  const currentCuisineIndex =
    selectedSub?.cuisineIndex ??
    (selectedTop?.kind === "leaf" ? selectedTop.cuisineIndex : undefined);
  const currentCuisine =
    currentCuisineIndex !== undefined ? cuisines[currentCuisineIndex] : null;

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={colors.primaryDark}
      />
      <LinearGradient
        colors={[colors.primaryDark, "#4A086B", colors.background]}
        locations={[0, 0.35, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon name="arrow-back" size={22} color={colors.white} />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <View style={styles.avatarOuter}>
              <View style={styles.avatarWrapper}>
                <Image
                  source={SOMMELIER_AVATAR}
                  style={styles.avatarImage}
                  resizeMode="contain"
                />
              </View>
              <View style={styles.onlineDot} />
            </View>
            <View>
              <Text style={styles.headerTitle}>
                {t("sommelierChat.headerTitle")}
              </Text>
              <Text style={styles.headerSubtitle}>
                {t("sommelierChat.headerSubtitle")}
              </Text>
            </View>
          </View>
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((m) => (
            <MessageBubble key={m.id} message={m} />
          ))}
          {isTyping && <TypingBubble />}
          {thinkingLabel && (
            <View style={styles.thinkingStatusContainer}>
              <ThinkingStatus label={thinkingLabel} />
            </View>
          )}
        </ScrollView>

        {/* Choice chips */}
        <Animated.View
          style={[
            styles.choicesContainer,
            {
              opacity: choicesOpacity,
              transform: [{ translateY: choicesTranslateY }],
            },
          ]}
          pointerEvents={choicesVisible ? "auto" : "none"}
        >
          {step === "top" &&
            hasFoodPairing &&
            choicesVisible &&
            messages.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipsRow}
              >
                {topCategories.map((top) => (
                  <TouchableOpacity
                    key={top.label}
                    style={styles.chip}
                    onPress={() => handleTopPick(top)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.chipText}>
                      {top.flag} {top.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

          {step === "sub" &&
            selectedTop?.kind === "group" &&
            choicesVisible && (
              <View>
                <TouchableOpacity
                  onPress={handleBackOne}
                  style={styles.changeCuisineBtn}
                >
                  <Text style={styles.changeCuisineText}>
                    {t("sommelierChat.changeCuisine")}
                  </Text>
                </TouchableOpacity>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.chipsRow}
                >
                  {selectedTop.subs.map((s) => (
                    <TouchableOpacity
                      key={`${s.cuisineIndex}-${s.label}`}
                      style={styles.chip}
                      onPress={() => handleSubPick(s)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.chipText}>
                        {s.flag} {s.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

          {step === "food" && currentCuisine && choicesVisible && (
            <View>
              <TouchableOpacity
                onPress={handleBackOne}
                style={styles.changeCuisineBtn}
              >
                <Text style={styles.changeCuisineText}>
                  {selectedSub
                    ? t("sommelierChat.backOneStep")
                    : t("sommelierChat.changeCuisine")}
                </Text>
              </TouchableOpacity>
              <ScrollView
                showsVerticalScrollIndicator={false}
                style={styles.foodScroll}
              >
                <View style={styles.foodGrid}>
                  {currentCuisine.items.map((food, foodIdx) => (
                    <TouchableOpacity
                      key={food}
                      style={styles.foodChip}
                      onPress={() => handleFoodPick(food, foodIdx)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.foodChipText}>{food}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}

          {step === "results" && choicesVisible && (
            <View style={styles.resetRow}>
              <TouchableOpacity
                style={styles.resetChip}
                onPress={handleReset}
                activeOpacity={0.85}
              >
                <Text style={styles.resetChipText}>
                  {t("sommelierChat.resetButton")}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {step === "error" && choicesVisible && (
            <View style={styles.resetRow}>
              <TouchableOpacity
                style={[styles.resetChip, { marginRight: 8 }]}
                onPress={handleRetry}
                activeOpacity={0.85}
              >
                <Text style={styles.resetChipText}>
                  {t("sommelierChat.retryButton")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.resetChip}
                onPress={handleReset}
                activeOpacity={0.85}
              >
                <Text style={styles.resetChipText}>
                  {t("sommelierChat.resetButton")}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>

        {step === "upsell" && (
          <Animated.View
            style={[
              styles.upsellSheet,
              {
                opacity: upsellOpacity,
                transform: [{ translateY: upsellTranslateY }],
              },
            ]}
          >
            <LinearGradient
              colors={["#8e44ad", "#4A086B"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFillObject}
            />
            <View style={styles.upsellSheetHeader}>
              <Text style={styles.upsellSheetBadge}>
                {t("sommelierChat.upsell.badge")}
              </Text>
              <Text style={styles.upsellSheetTitle}>
                {t("sommelierChat.upsell.cardTitle")}
              </Text>
            </View>
            <View style={styles.upsellBenefitsList}>
              {(
                t("sommelierChat.upsell.benefits", {
                  returnObjects: true,
                }) as string[]
              ).map((b, i) => (
                <View key={i} style={styles.upsellBenefitRow}>
                  <Icon
                    name="checkmark-circle"
                    size={18}
                    color={colors.white}
                    style={styles.upsellBenefitIcon}
                  />
                  <Text style={styles.upsellBenefitText}>{b}</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity
              style={styles.upsellSheetCta}
              onPress={() => navigation.navigate("Paywall" as never)}
              activeOpacity={0.9}
            >
              <Text style={styles.upsellSheetCtaText}>
                {t("sommelierChat.upsell.cta")}
              </Text>
              <Icon name="arrow-forward" size={18} color={colors.primaryDark} />
            </TouchableOpacity>
          </Animated.View>
        )}
      </SafeAreaView>
    </View>
  );
}

const SOMMELIER_AVATAR = require("../assets/onboarding/Drinky_onboarding_2.png");

const SommelierAvatar: React.FC = () => (
  <View style={styles.chatAvatar}>
    <Image
      source={SOMMELIER_AVATAR}
      style={styles.chatAvatarImage}
      resizeMode="contain"
    />
  </View>
);

const getWineColor = (type: string) => {
  if (type.includes("레드") || type.toUpperCase().includes("RED"))
    return colors.error;
  if (type.includes("화이트") || type.toUpperCase().includes("WHITE"))
    return "#f1c40f";
  if (type.includes("스파클링") || type.toUpperCase().includes("SPARKLING"))
    return "#3498db";
  if (type.includes("로제") || type.toUpperCase().includes("ROSE"))
    return "#e91e63";
  return colors.textSecondary;
};

const localizeSort = (sort: string, lang: "ko" | "en") => {
  if (lang !== "en") return sort;
  if (sort.includes("레드")) return "Red";
  if (sort.includes("화이트")) return "White";
  if (sort.includes("스파클링")) return "Sparkling";
  if (sort.includes("로제")) return "Rosé";
  if (sort.includes("디저트")) return "Dessert";
  if (sort.includes("주정강화")) return "Fortified";
  return sort;
};

const useBubbleEnter = () => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(10)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);
  return { opacity, translateY };
};

// Inline subtle status line shown while the sommelier is "thinking".
// Not a chat bubble — just a small italic text that swaps over time.
const ThinkingStatus: React.FC<{ label: string }> = ({ label }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translate = useRef(new Animated.Value(4)).current;
  const prevRef = useRef(label);

  const animateIn = () => {
    opacity.setValue(0);
    translate.setValue(4);
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(translate, {
        toValue: 0,
        duration: 300,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  };

  useEffect(() => {
    animateIn();
  }, []);

  useEffect(() => {
    if (prevRef.current === label) return;
    prevRef.current = label;
    animateIn();
  }, [label]);

  return (
    <Animated.Text
      style={[
        styles.thinkingStatusText,
        { opacity, transform: [{ translateY: translate }] },
      ]}
    >
      {label}
    </Animated.Text>
  );
};

const MessageBubble: React.FC<{ message: Message }> = ({ message }) => {
  const { opacity, translateY } = useBubbleEnter();
  const { t, i18n } = useTranslation();
  const lang: "ko" | "en" = i18n.language?.startsWith("en") ? "en" : "ko";

  if (message.kind === "wines") {
    const { wines, foodFlavor, foodName, nickname: msgNickname } = message;
    return (
      <Animated.View
        style={[
          styles.bubbleRow,
          styles.bubbleRowLeft,
          { opacity, transform: [{ translateY }] },
        ]}
      >
        <SommelierAvatar />
        <View style={styles.winesBubble}>
          {foodFlavor && (
            <View style={styles.winesChartSection}>
              <Text style={styles.winesChartTitle}>
                {t("sommelierChat.resultChartTitle", {
                  food: foodName,
                  nickname: msgNickname,
                })}
              </Text>
              <AnalyzingRadarChart data={foodFlavor} size={170} mode="fixed" />
            </View>
          )}

          <Text style={styles.winesMatchText}>
            {t("sommelierChat.resultMatch", { nickname: msgNickname })}
          </Text>

          {wines.length > 0 ? (
            <View style={styles.wineList}>
              {wines.map((w, idx) => {
                const variety =
                  lang === "en" && w.varietyEng ? w.varietyEng : w.variety;
                const country =
                  lang === "en" && w.countryEng ? w.countryEng : w.country;
                const region =
                  lang === "en" && w.regionEng ? w.regionEng : w.region;
                const sortLabel = localizeSort(w.sort, lang);
                return (
                  <View
                    key={`${variety}-${idx}`}
                    style={[
                      styles.wineRow,
                      idx === wines.length - 1 && styles.wineRowLast,
                    ]}
                  >
                    <View style={styles.wineInfo}>
                      <View style={styles.wineHeaderRow}>
                        <View
                          style={[
                            styles.wineSortBadge,
                            { backgroundColor: getWineColor(w.sort) },
                          ]}
                        >
                          <Text style={styles.wineSortText}>{sortLabel}</Text>
                        </View>
                        <Text style={styles.wineVariety} numberOfLines={1}>
                          {variety}
                        </Text>
                      </View>
                      {(country || region) && (
                        <Text style={styles.wineRegion} numberOfLines={1}>
                          {country}
                          {region ? ` · ${region}` : ""}
                        </Text>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <Text style={styles.winesEmpty}>추천 결과가 없어요 😢</Text>
          )}
        </View>
      </Animated.View>
    );
  }

  const isSommelier = message.role === "sommelier";

  return (
    <Animated.View
      style={[
        styles.bubbleRow,
        isSommelier ? styles.bubbleRowLeft : styles.bubbleRowRight,
        { opacity, transform: [{ translateY }] },
      ]}
    >
      {isSommelier && <SommelierAvatar />}
      <View
        style={[
          styles.bubble,
          isSommelier ? styles.bubbleSommelier : styles.bubbleUser,
        ]}
      >
        <Text
          style={[
            styles.bubbleText,
            isSommelier ? styles.bubbleTextSommelier : styles.bubbleTextUser,
          ]}
        >
          {message.text}
        </Text>
      </View>
    </Animated.View>
  );
};

const TypingBubble: React.FC = () => {
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animateDot = (anim: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: 350,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0.3,
            duration: 350,
            useNativeDriver: true,
          }),
        ])
      );
    const a = animateDot(dot1, 0);
    const b = animateDot(dot2, 150);
    const c = animateDot(dot3, 300);
    a.start();
    b.start();
    c.start();
    return () => {
      a.stop();
      b.stop();
      c.stop();
    };
  }, []);

  return (
    <View style={[styles.bubbleRow, styles.bubbleRowLeft]}>
      <SommelierAvatar />
      <View
        style={[styles.bubble, styles.bubbleSommelier, styles.typingBubble]}
      >
        <Animated.View style={[styles.typingDot, { opacity: dot1 }]} />
        <Animated.View style={[styles.typingDot, { opacity: dot2 }]} />
        <Animated.View style={[styles.typingDot, { opacity: dot3 }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "flex-start",
    marginRight: 6,
  },
  headerInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarOuter: {
    marginRight: 10,
    position: "relative",
  },
  avatarWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    overflow: "hidden",
  },
  avatarImage: {
    width: 60,
    height: 60,
    position: "absolute",
    left: -10,
    top: -11,
  },
  onlineDot: {
    position: "absolute",
    right: -1,
    bottom: -1,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#2ecc71",
    borderWidth: 2,
    borderColor: colors.primaryDark,
  },
  headerTitle: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "bold",
  },
  headerSubtitle: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 11,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  bubbleRow: {
    flexDirection: "row",
    marginBottom: 10,
    alignItems: "flex-end",
  },
  bubbleRowLeft: {
    justifyContent: "flex-start",
  },
  bubbleRowRight: {
    justifyContent: "flex-end",
  },
  chatAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.12)",
    marginRight: 8,
    marginBottom: 2,
    overflow: "hidden",
  },
  chatAvatarImage: {
    width: 54,
    height: 54,
    position: "absolute",
    left: -9,
    top: -10,
  },
  bubble: {
    maxWidth: "72%",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  bubbleSommelier: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderBottomLeftRadius: 4,
  },
  bubbleUser: {
    backgroundColor: colors.white,
    borderBottomRightRadius: 4,
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 21,
  },
  bubbleTextSommelier: {
    color: colors.white,
  },
  bubbleTextUser: {
    color: colors.primaryDark,
    fontWeight: "600",
  },
  typingBubble: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 4,
  },
  typingDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: colors.white,
  },
  choicesContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    maxHeight: 280,
  },
  chipsRow: {
    paddingVertical: 4,
    gap: 4,
  },
  chip: {
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 18,
    marginRight: 4,
  },
  chipText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "600",
  },
  changeCuisineBtn: {
    alignSelf: "flex-start",
    paddingVertical: 6,
    paddingHorizontal: 4,
    marginBottom: 6,
  },
  changeCuisineText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
  },
  foodScroll: {
    maxHeight: 220,
  },
  foodGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
    paddingBottom: 8,
  },
  foodChip: {
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 14,
  },
  foodChipText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "500",
  },
  thinkingStatusContainer: {
    // Indent past the avatar column (36 width + 8 marginRight = 44)
    // so the status text sits visually under the bubble.
    paddingLeft: 44 + 6,
    paddingRight: 16,
    paddingTop: 2,
    paddingBottom: 8,
    alignItems: "flex-start",
  },
  thinkingStatusText: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 13,
    fontStyle: "italic",
    lineHeight: 18,
  },
  winesBubble: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 20,
    borderBottomLeftRadius: 4,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  winesChartSection: {
    alignItems: "center",
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.15)",
    marginBottom: 10,
  },
  winesChartTitle: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 6,
    opacity: 0.85,
  },
  winesMatchText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 10,
    lineHeight: 19,
  },
  wineList: {},
  wineRow: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.12)",
  },
  wineRowLast: {
    borderBottomWidth: 0,
    paddingBottom: 2,
  },
  wineInfo: {
    flex: 1,
  },
  wineHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  wineSortBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    marginRight: 6,
  },
  wineSortText: {
    fontSize: 9,
    fontWeight: "bold",
    color: colors.white,
  },
  wineVariety: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
  },
  wineRegion: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 11,
  },
  winesEmpty: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    paddingVertical: 12,
    textAlign: "center",
  },
  resetRow: {
    flexDirection: "row",
    justifyContent: "center",
    paddingVertical: 4,
  },
  resetChip: {
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 20,
  },
  resetChipText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "600",
  },
  upsellSheet: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 22,
    overflow: "hidden",
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 14,
  },
  upsellSheetHeader: {
    marginBottom: 14,
  },
  upsellSheetBadge: {
    alignSelf: "flex-start",
    color: "#FFD86B",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  upsellSheetTitle: {
    color: colors.white,
    fontSize: 20,
    fontWeight: "800",
    lineHeight: 26,
  },
  upsellBenefitsList: {
    marginBottom: 14,
  },
  upsellBenefitRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  upsellBenefitIcon: {
    marginRight: 8,
    marginTop: 1,
  },
  upsellBenefitText: {
    color: "rgba(255,255,255,0.95)",
    fontSize: 13.5,
    lineHeight: 19,
    flex: 1,
  },
  upsellSheetCta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
    paddingVertical: 14,
    borderRadius: 16,
  },
  upsellSheetCtaText: {
    color: colors.primaryDark,
    fontSize: 15,
    fontWeight: "700",
    marginRight: 6,
  },
});
