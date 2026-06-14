import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { useUser } from "../context/UserContext";
import {
  getOnboardingRecommendation,
  OnboardingRecommendationDTO,
} from "../api/wine";
import PentagonRadarChart from "../components/common/PentagonRadarChart";
import { colors } from "../constants/colors";
import { getWineTypeColor } from "../constants/wineColors";

const RecommendationResultScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { t } = useTranslation();
  const {
    user,
    completeOnboarding,
    setRecommendations: saveRecommendations,
    setFlavorProfile: saveFlavorProfile,
  } = useUser();
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState<
    OnboardingRecommendationDTO[]
  >([]);

  const flavorProfile = (route.params as any)?.flavorProfile;
  const nickname = (route.params as any)?.nickname;
  const fromReset = (route.params as any)?.fromReset ?? false;

  const [animations, setAnimations] = useState<Animated.Value[]>([]);

  useEffect(() => {
    if (flavorProfile) {
      saveFlavorProfile(flavorProfile);
    }
  }, [flavorProfile]);

  useEffect(() => {
    if (!loading && recommendations.length > 0) {
      const totalItems = (flavorProfile ? 1 : 0) + recommendations.length;
      const anims = Array.from(
        { length: totalItems },
        () => new Animated.Value(0)
      );
      setAnimations(anims);
    }
  }, [loading, recommendations.length, flavorProfile]);

  useEffect(() => {
    if (animations.length > 0) {
      Animated.stagger(
        200,
        animations.map((anim) =>
          Animated.timing(anim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          })
        )
      ).start();
    }
  }, [animations]);

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      const response = await getOnboardingRecommendation();
      if (response.isSuccess) {
        setRecommendations(response.result);
        saveRecommendations(response.result);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = () => {
    if (fromReset) {
      navigation.goBack();
      return;
    }
    completeOnboarding();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>
          {t("recommendationResult.loading")}
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t("recommendationResult.header")}</Text>
        <Text style={styles.subtitle}>
          {t("recommendationResult.subtitle")}
        </Text>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {flavorProfile && (
          <Animated.View
            style={[
              styles.chartContainer,
              animations[0] && {
                opacity: animations[0],
                transform: [
                  {
                    translateY: animations[0].interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <Text style={styles.chartTitle}>
              {t("recommendationResult.chartTitle", {
                nickname: nickname || user?.nickname,
              })}
            </Text>
            <PentagonRadarChart data={flavorProfile} size={220} />
            <Text style={styles.chartHelperText}>
              {t("recommendationResult.chartHelper")}
            </Text>
          </Animated.View>
        )}

        {recommendations.map((item, index) => {
          const animIndex = (flavorProfile ? 1 : 0) + index;
          const anim = animations[animIndex];

          return (
            <Animated.View
              key={index}
              style={[
                styles.card,
                anim && {
                  opacity: anim,
                  transform: [
                    {
                      translateY: anim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [20, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <View style={styles.cardHeader}>
                <View style={styles.headerTitleContainer}>
                  <Text style={styles.cardTitle}>
                    {t(`recommendationResult.rankTitle${index}`)}
                  </Text>
                </View>
              </View>

              <View style={styles.cardBody}>
                <View style={styles.textContainer}>
                  <Text style={styles.styleText}>
                    {item.country} {item.region}
                  </Text>
                  <Text style={styles.varietyText}>{item.variety}</Text>
                </View>
                <View
                  style={[
                    styles.typeChip,
                    { backgroundColor: getWineTypeColor(item.sort) },
                  ]}
                >
                  <Text style={styles.typeChipText}>{item.sort}</Text>
                </View>
              </View>
            </Animated.View>
          );
        })}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.button} onPress={handleComplete}>
          <Text style={styles.buttonText}>
            {fromReset
              ? t("recommendationResult.buttonReset")
              : t("recommendationResult.button")}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#121212",
  },
  loadingText: {
    color: colors.white,
    marginTop: 16,
    fontSize: 16,
  },
  header: {
    padding: 24,
    paddingTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: colors.white,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#aaa",
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 0,
    gap: 12,
  },
  chartContainer: {
    alignItems: "center",
    marginBottom: 10,
    backgroundColor: colors.background,
    paddingTop: 24,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chartTitle: {
    color: colors.white,
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  chartHelperText: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 4,
    marginBottom: 8,
    textAlign: "center",
    fontWeight: "500",
  },
  card: {
    backgroundColor: "#1e1e1e",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 15,
    paddingBottom: 15,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  typeChip: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 12,
  },
  typeChipText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: "bold",
  },
  headerTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  rankBadge: {
    fontSize: 20,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: colors.white,
    marginLeft: 10,
  },
  cardBody: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginBottom: 0,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.border,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  styleText: {
    fontSize: 13,
    color: "#aaa",
    marginBottom: 6,
  },
  varietyText: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.white,
  },
  tagContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tag: {
    backgroundColor: colors.border,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  tagText: {
    fontSize: 13,
    color: "#ccc",
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: "#222",
  },
  button: {
    backgroundColor: colors.primary,
    height: 56,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default RecommendationResultScreen;
