import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Animated,
  Easing,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getParticle } from "../utils/textUtils";
import Ionicons from "react-native-vector-icons/Ionicons";
import GlassHeader from "../components/common/GlassHeader";
import { useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTranslation, Trans } from "react-i18next";
import { RootStackParamList } from "../types";
import {
  getFoodPairingRecommendation,
  FoodRecommendationDTO,
} from "../api/wine";
import { useUser } from "../context/UserContext";
import { FlavorProfile } from "../components/onboarding/FlavorProfileStep";
import AnalyzingRadarChart from "../components/common/AnalyzingRadarChart";
import RollingCandidates from "../components/common/RollingCandidates";
import { colors } from "../constants/colors";
import { getWineTypeColor as getWineColor } from "../constants/wineColors";

const RANK_BADGES = ["🥇", "🥈", "🥉"];

export default function FoodPairingResultScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute();
  const { t } = useTranslation();
  const { foodName } = route.params as {
    foodName?: string;
  };

  const { user, flavorProfile } = useUser();

  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState<
    FoodRecommendationDTO[]
  >([]);

  const [analysisStep, setAnalysisStep] = useState(0);
  const [showAnalysis, setShowAnalysis] = useState(true);
  const [pairingProfile, setPairingProfile] = useState<FlavorProfile | null>(
    null
  );

  // Text Animation Refs
  const fadeAnim = useRef(new Animated.Value(0)).current; // Analysis fade
  const chartOpacityAnim = useRef(new Animated.Value(0)).current;
  const progressBarAnim = useRef(new Animated.Value(0)).current;

  const heroAnim = useRef(new Animated.Value(0)).current;
  const textStep1Anim = useRef(new Animated.Value(0)).current;
  const textStep2Anim = useRef(new Animated.Value(0)).current;

  const chartAnim = useRef(new Animated.Value(0)).current;
  const listAnim = useRef(new Animated.Value(0)).current;

  const heroY = heroAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [20, 0],
  });
  const textStep1Y = textStep1Anim.interpolate({
    inputRange: [0, 1],
    outputRange: [10, 0],
  });
  const textStep2Y = textStep2Anim.interpolate({
    inputRange: [0, 1],
    outputRange: [10, 0],
  });
  const chartY = chartAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [20, 0],
  });
  const listY = listAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [20, 0],
  });

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const query = foodName;
        if (query) {
          const response = await getFoodPairingRecommendation(query);
          if (response.isSuccess) {
            const { foodFlavor, recommendWines } = response.result;
            setRecommendations(recommendWines);

            if (foodFlavor) {
              setPairingProfile(foodFlavor);
            }
          }
        }
      } catch (error) {
        console.error("Failed to fetch recommendations:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRecommendations();
  }, [foodName]);

  useEffect(() => {
    startAnalysisSequence();
  }, []);

  const startAnalysisSequence = () => {
    Animated.sequence([
      Animated.timing(progressBarAnim, {
        toValue: 0.3,
        duration: 1500,
        easing: Easing.out(Easing.ease),
        useNativeDriver: false,
      }),
      Animated.timing(progressBarAnim, {
        toValue: 0.45,
        duration: 4500,
        easing: Easing.linear,
        useNativeDriver: false,
      }),
      Animated.timing(progressBarAnim, {
        toValue: 0.85,
        duration: 3000,
        easing: Easing.in(Easing.ease),
        useNativeDriver: false,
      }),
      Animated.timing(progressBarAnim, {
        toValue: 1,
        duration: 3500,
        easing: Easing.out(Easing.ease),
        useNativeDriver: false,
      }),
    ]).start();

    animateStep(0);

    setTimeout(() => {
      setAnalysisStep(1);
      Animated.timing(chartOpacityAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start();
    }, 2000);

    setTimeout(() => {
      setAnalysisStep(2);
    }, 6000);
    setTimeout(() => {
      setAnalysisStep(3);
    }, 9000);
    setTimeout(() => {
      finishAnalysis();
    }, 12500);
  };

  const animateStep = (step: number) => {
    if (step === 0) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  };

  const startResultAnimation = () => {
    // Sequence: Hero Title -> Text 1 -> Text 2 (faster) -> Chart -> List
    Animated.sequence([
      Animated.timing(heroAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(textStep1Anim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.delay(300),
      Animated.timing(textStep2Anim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.stagger(100, [
        Animated.timing(chartAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(listAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  };

  const finishAnalysis = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start(() => {
      setShowAnalysis(false);
      setTimeout(startResultAnimation, 100);
    });
  };

  const nickname = user?.nickname || t("foodPairingResult.defaultNickname");

  const getAnalysisText = (step: number) => {
    switch (step) {
      case 0:
        return t("foodPairingResult.analysis.step0", { foodName });
      case 1:
        return t("foodPairingResult.analysis.step1", { nickname });
      case 2:
        return t("foodPairingResult.analysis.step2", { foodName, nickname });
      case 3:
        return t("foodPairingResult.analysis.step3");
      default:
        return "";
    }
  };

  // Derived values for result text
  const bestMatchSort =
    recommendations.length > 0
      ? recommendations[0].sort
      : t("foodPairingResult.defaultWine");
  const displayFoodName = foodName || t("foodPairingResult.defaultFood");
  const userNickname = nickname;

  if (showAnalysis) {
    const progressWidth = progressBarAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ["0%", "100%"],
    });

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.analysisContainer}>
          <Animated.View
            style={[styles.analysisContent, { opacity: fadeAnim }]}
          >
            <View style={styles.iconWrapper}>
              {analysisStep === 0 && <Text style={{ fontSize: 80 }}>🍽️</Text>}
              {analysisStep < 3 && analysisStep >= 1 && flavorProfile && (
                <Animated.View
                  style={{ opacity: chartOpacityAnim, alignItems: "center" }}
                >
                  <View style={styles.chartBg}>
                    <AnalyzingRadarChart
                      data={flavorProfile}
                      size={220}
                      mode={analysisStep === 1 ? "grow" : "jitter"}
                    />
                  </View>
                </Animated.View>
              )}
              {analysisStep < 3 && analysisStep >= 1 && !flavorProfile && (
                <Text style={{ fontSize: 80 }}>🍷</Text>
              )}
              {analysisStep === 3 && (
                <View style={{ height: 240, justifyContent: "center" }}>
                  <RollingCandidates />
                </View>
              )}
            </View>
            <Text style={styles.analysisText}>
              {getAnalysisText(analysisStep)}
            </Text>
          </Animated.View>
          <View style={styles.progressContainer}>
            <Animated.View
              style={[styles.progressBar, { width: progressWidth }]}
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <GlassHeader
        floating={false}
        left={
          <TouchableOpacity
            onPress={() => navigation.navigate("Main")}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={22} color={colors.white} />
          </TouchableOpacity>
        }
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.heroContainer,
            { opacity: heroAnim, transform: [{ translateY: heroY }] },
          ]}
        >
          {/* Step 1 Text */}
          <Animated.View
            style={{
              opacity: textStep1Anim,
              transform: [{ translateY: textStep1Y }],
              marginBottom: 16,
            }}
          >
            <Text style={styles.heroText}>
              <Trans
                i18nKey="foodPairingResult.heroText"
                values={{
                  foodName: displayFoodName,
                  particle: getParticle(displayFoodName, "wa"),
                  wineSort: bestMatchSort,
                }}
                components={[
                  <Text style={styles.highlight} />,
                  <Text style={styles.highlight} />,
                ]}
              />
            </Text>
          </Animated.View>

          {/* Step 2 Text */}
          <Animated.View
            style={{
              opacity: textStep2Anim,
              transform: [{ translateY: textStep2Y }],
            }}
          >
            <Text style={styles.heroSubText}>
              <Trans
                i18nKey="foodPairingResult.heroSubText"
                values={{ nickname: userNickname, foodName: displayFoodName }}
                components={[
                  <Text style={styles.boldWhite} />,
                  <Text style={styles.boldWhite} />,
                ]}
              />
            </Text>
          </Animated.View>
        </Animated.View>

        {pairingProfile && (
          <Animated.View
            style={[
              styles.chartContainer,
              { opacity: chartAnim, transform: [{ translateY: chartY }] },
            ]}
          >
            <Text style={styles.chartTitle}>
              {t("foodPairingResult.chartTitle")}
            </Text>
            <View style={styles.chartWrapper}>
              <AnalyzingRadarChart
                data={pairingProfile}
                size={160}
                mode="fixed"
              />
            </View>
            <Text style={styles.chartDescription}>
              <Trans
                i18nKey="foodPairingResult.chartDescription"
                components={[
                  <Text style={{ color: colors.white, fontWeight: "bold" }} />,
                ]}
              />
            </Text>
          </Animated.View>
        )}

        <Animated.View
          style={{ opacity: listAnim, transform: [{ translateY: listY }] }}
        >
          {recommendations.length > 0 ? (
            recommendations.map((item, index) => (
              <View key={index} style={styles.wineCard}>
                <View style={styles.wineInfo}>
                  <View style={styles.infoHeader}>
                    <View
                      style={[
                        styles.wineTypeBadge,
                        { backgroundColor: getWineColor(item.sort) },
                      ]}
                    >
                      <Text style={styles.wineTypeText}>{item.sort}</Text>
                    </View>
                    <Text style={styles.wineName}>
                      {item.variety}
                      {item.varietyEng && (
                        <Text style={styles.wineVarietySmallEng}>
                          {" "}
                          ({item.varietyEng})
                        </Text>
                      )}
                    </Text>
                  </View>

                  <View style={{ height: 4 }} />

                  <Text style={styles.wineCountry}>
                    {item.country} {item.region && `· ${item.region}`}
                  </Text>
                  {(item.countryEng || item.regionEng) && (
                    <Text style={styles.wineRegionEng}>
                      {item.countryEng || ""}
                      {item.countryEng && item.regionEng ? " · " : ""}
                      {item.regionEng || ""}
                    </Text>
                  )}
                </View>
                <View style={styles.rankBadge}>
                  {index < 3 ? (
                    <Text style={{ fontSize: 20 }}>{RANK_BADGES[index]}</Text>
                  ) : (
                    <Text style={styles.rankText}>{index + 1}</Text>
                  )}
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {t("foodPairingResult.empty")}
              </Text>
            </View>
          )}
        </Animated.View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate("Main")}
        >
          <Text style={styles.buttonText}>
            {t("foodPairingResult.backButton")}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  analysisContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  analysisContent: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    width: "100%",
  },
  iconWrapper: {
    height: 250,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 40,
    width: "100%",
  },
  chartBg: {
    width: 240,
    height: 240,
    justifyContent: "center",
    alignItems: "center",
  },
  analysisText: {
    color: colors.white,
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    lineHeight: 30,
  },

  progressContainer: {
    width: "100%",
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    marginTop: 40,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: colors.primary,
  },
  headerTitle: {
    color: colors.white,
    fontSize: 18,
    fontWeight: "bold",
  },
  headerSubtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  scrollContent: {
    padding: 20,
  },
  wineCard: {
    backgroundColor: colors.surface1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  wineInfo: {
    flex: 1,
  },
  infoHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  wineTypeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  wineTypeText: {
    fontSize: 10,
    fontWeight: "bold",
    color: colors.white,
  },
  wineName: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.white,
    flex: 1,
  },
  wineCountry: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  wineVarietySmallEng: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: "normal",
    fontStyle: "italic",
  },
  wineRegionEng: {
    fontSize: 11,
    color: colors.textTertiary,
  },
  rankBadge: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 12,
    borderRadius: 16,
    backgroundColor: colors.border,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  rankText: {
    color: colors.primary,
    fontWeight: "bold",
    fontSize: 14,
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: "#222",
  },
  button: {
    backgroundColor: colors.primary,
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: "bold",
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 16,
  },
  heroContainer: {
    marginBottom: 30,
    marginTop: 10,
  },
  heroTitle: {
    fontSize: 34,
    fontWeight: "bold",
    color: colors.white,
    marginBottom: 24,
  },
  heroText: {
    fontSize: 18,
    color: colors.textSecondary,
    lineHeight: 28,
    marginBottom: 8,
  },
  heroSubText: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  highlight: {
    color: colors.primary,
    fontWeight: "bold",
  },
  boldWhite: {
    color: colors.white,
    fontWeight: "bold",
  },
  chartContainer: {
    alignItems: "center",
    marginBottom: 30,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 16,
    padding: 20,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.white,
    marginBottom: 15,
    letterSpacing: 0.5,
  },
  chartWrapper: {
    marginVertical: 5,
  },
  chartDescription: {
    textAlign: "center",
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 10,
  },
});
