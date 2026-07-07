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
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { useUser } from "../context/UserContext";
import {
  getOnboardingRecommendation,
  OnboardingRecommendationDTO,
} from "../api/wine";
import PentagonRadarChart from "../components/common/PentagonRadarChart";
import { colors } from "../constants/colors";
import { spacing, radius, surfaces, accent } from "../constants/theme";
import { getWineTypeColor, WINE_TYPE_ON_COLOR } from "../constants/wineColors";

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
        <ActivityIndicator size="large" color={accent.base} />
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
                <View style={styles.rankBadge}>
                  <Text style={styles.rankBadgeText}>{index + 1}</Text>
                </View>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {t(`recommendationResult.rankTitle${index}`)}
                </Text>
                <View
                  style={[
                    styles.typeChip,
                    { backgroundColor: getWineTypeColor(item.sort) },
                  ]}
                >
                  <Text style={styles.typeChipText}>{item.sort}</Text>
                </View>
              </View>

              <View style={styles.cardBody}>
                <Text style={styles.varietyText} numberOfLines={1}>
                  {item.variety}
                </Text>
                {(item.country || item.region) && (
                  <Text style={styles.styleText} numberOfLines={1}>
                    {[item.country, item.region].filter(Boolean).join(" · ")}
                  </Text>
                )}
              </View>
            </Animated.View>
          );
        })}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.button}
          onPress={handleComplete}
          activeOpacity={0.85}
        >
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
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },
  loadingText: {
    color: colors.textSecondary,
    marginTop: spacing.lg,
    fontSize: 15,
  },
  header: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 21,
    color: colors.textSecondary,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  chartContainer: {
    alignItems: "center",
    marginBottom: spacing.xs,
    backgroundColor: surfaces.card,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxl,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: surfaces.hairline,
  },
  chartTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: "700",
    marginBottom: spacing.md,
  },
  chartHelperText: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    marginTop: spacing.md,
    textAlign: "center",
  },
  card: {
    backgroundColor: surfaces.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: surfaces.hairline,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  rankBadge: {
    width: 24,
    height: 24,
    borderRadius: radius.pill,
    backgroundColor: accent.soft,
    borderWidth: 1,
    borderColor: accent.border,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.sm,
  },
  rankBadgeText: {
    color: accent.text,
    fontSize: 12,
    fontWeight: "800",
  },
  cardTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  typeChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
    marginLeft: spacing.sm,
  },
  typeChipText: {
    color: WINE_TYPE_ON_COLOR,
    fontSize: 10,
    fontWeight: "800",
  },
  cardBody: {
    backgroundColor: surfaces.raised,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  varietyText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  styleText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  footer: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: surfaces.hairline,
  },
  button: {
    backgroundColor: accent.base,
    height: 56,
    borderRadius: radius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    color: accent.onAccent,
    fontSize: 17,
    fontWeight: "700",
  },
});

export default RecommendationResultScreen;
