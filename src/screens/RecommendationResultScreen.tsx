import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { useUser } from "../context/UserContext";
import {
  getOnboardingRecommendation,
  OnboardingRecommendationDTO,
} from "../api/wine";
import PentagonRadarChart from "../components/common/PentagonRadarChart";
import ListStateView from "../components/common/ListStateView";
import AnalyzingOverlay from "../components/common/AnalyzingOverlay";
import { getErrorMessageKey } from "../utils/apiError";
import { formatOrigin } from "../utils/wineUtils";
import { colors } from "../constants/colors";
import { spacing, radius, surfaces, accent } from "../constants/theme";
import {
  getWineTypeColor,
  getWineTypeLabel,
  WINE_TYPE_ON_COLOR,
} from "../constants/wineColors";

const RecommendationResultScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const {
    user,
    completeOnboarding,
    setRecommendations: saveRecommendations,
    setFlavorProfile: saveFlavorProfile,
  } = useUser();
  const [loading, setLoading] = useState(true);
  // 분석 연출이 100%에 도달한 뒤에만 결과를 보여준다 — 데이터가 먼저 와도
  // 퍼센트가 순간이동하지 않고 빠르게 램프업 후 자연스럽게 전환된다.
  const [introDone, setIntroDone] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);
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
    // 오버레이가 걷힌 뒤에 스태거 페이드인이 보이도록 introDone 기준으로 시작
    if (introDone && recommendations.length > 0) {
      const totalItems = (flavorProfile ? 1 : 0) + recommendations.length;
      const anims = Array.from(
        { length: totalItems },
        () => new Animated.Value(0)
      );
      setAnimations(anims);
    }
  }, [introDone, recommendations.length, flavorProfile]);

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
    setLoading(true);
    setErrorKey(null);
    try {
      const response = await getOnboardingRecommendation();
      if (response.isSuccess) {
        setRecommendations(response.result);
        // 빈 배열로는 저장하지 않는다 — 재설정 직후 서버가 0건을 주면
        // 기존에 저장된 멀쩡한 추천(홈 개인화 섹션의 원천)이 지워진다.
        if (response.result.length > 0) {
          saveRecommendations(response.result);
        }
      } else {
        setErrorKey("common.error.generic");
      }
    } catch (error) {
      console.error(error);
      setErrorKey(getErrorMessageKey(error));
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

  if (!introDone) {
    return (
      <View style={styles.loadingContainer}>
        <AnalyzingOverlay
          messages={[
            t("recommendationResult.analyzing0"),
            t("recommendationResult.analyzing1"),
            t("recommendationResult.analyzing2"),
          ]}
          complete={!loading}
          onDone={() => setIntroDone(true)}
        />
      </View>
    );
  }

  // NativeSafeAreaView는 인셋을 네이티브 패딩으로 늦게 적용해, 분석 연출 이후
  // 조건부로 늦게 마운트되면 첫 프레임이 인셋 0으로 깨졌다가 다음 리렌더에야
  // 보정된다. JS 컨텍스트를 동기로 읽는 useSafeAreaInsets로 첫 프레임을 맞춘다.
  const safeAreaPad = {
    paddingTop: insets.top,
    paddingBottom: insets.bottom,
    paddingLeft: insets.left,
    paddingRight: insets.right,
  };

  // 에러 후 "다시 시도" 재요청 중 — 연출 없이 스켈레톤 로딩만
  if (loading) {
    return (
      <View style={[styles.container, safeAreaPad]}>
        <ListStateView state="loading" />
      </View>
    );
  }

  return (
    <View style={[styles.container, safeAreaPad]}>
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

        {/* 에러/빈 결과를 빈 화면으로 위장하지 않는다 (dead-end 방지) */}
        {errorKey && (
          <ListStateView
            state="error"
            subtitle={t(errorKey)}
            onAction={fetchRecommendations}
          />
        )}
        {!errorKey && recommendations.length === 0 && (
          <ListStateView
            state="empty"
            title={t("recommendationResult.emptyTitle")}
            subtitle={t("recommendationResult.emptySubtitle")}
          />
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
                  <Text style={styles.typeChipText}>
                    {getWineTypeLabel(item.sort, t)}
                  </Text>
                </View>
              </View>

              <View style={styles.cardBody}>
                <Text style={styles.varietyText} numberOfLines={1}>
                  {item.variety}
                </Text>
                {(item.country || item.region) && (
                  <Text style={styles.styleText} numberOfLines={1}>
                    {formatOrigin(item.country, item.region)}
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
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
