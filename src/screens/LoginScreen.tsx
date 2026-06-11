import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  useWindowDimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Linking,
  Animated,
  Easing,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { appleAuth } from "@invertase/react-native-apple-authentication";
import * as KakaoLogin from "@react-native-seoul/kakao-login";
import auth from "@react-native-firebase/auth";
import LinearGradient from "react-native-linear-gradient";
import Icon from "react-native-vector-icons/Ionicons";
import { useFocusEffect } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { exchangeKakaoToken, appleLogin } from "../api/member";
import { useUser } from "../context/UserContext";
import { useGlobalUI } from "../context/GlobalUIContext";
import { colors } from "../constants/colors";
import {
  spacing,
  radius,
  surfaces,
  accent,
  elevation,
} from "../constants/theme";
import KakaoIcon from "../components/common/KakaoIcon";
import {
  MatchScoreIllust,
  ScanIllust,
  ChatbotIllust,
  TastingNoteIllust,
  CellarIllust,
} from "../components/paywall/FeatureIllustrations";

type SlideItem = {
  id: string;
  titleKey: string;
  Illust: React.ComponentType<{ visible?: boolean }>;
};

const slides: SlideItem[] = [
  { id: "1", titleKey: "login.slides.0", Illust: MatchScoreIllust },
  { id: "2", titleKey: "login.slides.1", Illust: ScanIllust },
  { id: "3", titleKey: "login.slides.2", Illust: ChatbotIllust },
  { id: "4", titleKey: "login.slides.3", Illust: TastingNoteIllust },
  { id: "5", titleKey: "login.slides.4", Illust: CellarIllust },
];

// 상단 그라디언트 브리딩 애니메이션 — refined accent 기반의 차분한 웨이시
function BreathingGradient() {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration: 4000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: 4000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [anim]);

  const opacity1 = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });
  const opacity2 = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: opacity1 }]}>
        <LinearGradient
          colors={[
            "rgba(185,140,230,0.26)",
            "rgba(185,140,230,0.06)",
            "transparent",
          ]}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.8, y: 0.55 }}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: opacity2 }]}>
        <LinearGradient
          colors={[
            "rgba(203,171,236,0.22)",
            "rgba(185,140,230,0.05)",
            "transparent",
          ]}
          start={{ x: 0.85, y: 0 }}
          end={{ x: 0.15, y: 0.5 }}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>
    </View>
  );
}

const LoginScreen = () => {
  const { login } = useUser();
  const { hideLoading, showToast } = useGlobalUI();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const { width } = useWindowDimensions();

  useFocusEffect(
    React.useCallback(() => {
      hideLoading();
      setLoading(false);
    }, [hideLoading])
  );

  const onAppleButtonPress = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const appleAuthRequestResponse = await appleAuth.performRequest({
        requestedOperation: appleAuth.Operation.LOGIN,
        requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
      });

      if (!appleAuthRequestResponse.identityToken) {
        throw new Error("Apple Identity Token is missing");
      }

      const { identityToken } = appleAuthRequestResponse;

      const response = await appleLogin(identityToken);

      if (response.isSuccess && response.result) {
        const { accessToken, refreshToken, isFirst } = response.result;
        await login(accessToken, refreshToken, isFirst);
      } else {
        throw new Error(response.message || "Token exchange failed");
      }
    } catch (error: any) {
      if (error.code === appleAuth.Error.CANCELED) {
      } else {
        console.error("Apple Login Error:", error);
        showToast(
          t("login.toast.appleFailed", {
            reason:
              error.message || error.code || t("login.toast.appleUnknownError"),
          }),
          { type: "error" }
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const onKakaoButtonPress = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const token = await KakaoLogin.login();
      const response: any = await exchangeKakaoToken(token.accessToken);

      let customToken, accessToken, refreshToken, isFirst;

      if (response && response.accessToken) {
        ({ customToken, accessToken, refreshToken, isFirst } = response);
      } else if (response && response.result) {
        ({ customToken, accessToken, refreshToken, isFirst } = response.result);
      } else {
        ({ customToken } = response || {});
      }

      if (customToken) {
        try {
          await auth().signInWithCustomToken(customToken);
        } catch (firebaseError) {
          console.warn("Firebase login failed:", firebaseError);
        }
      }

      if (accessToken && refreshToken) {
        await login(accessToken, refreshToken, isFirst);
      } else {
        console.error("Missing backend tokens in response:", response);
        throw new Error("Failed to retrieve access tokens from server.");
      }
    } catch (error: any) {
      if (error.code === "E_CANCELLED_OPERATION") {
        showToast(t("login.toast.kakaoCancelled"), { type: "info" });
      } else {
        console.error("Kakao Login Error:", error);
        showToast(t("login.toast.kakaoFailed"), {
          type: "error",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const flatListRef = useRef<FlatList<SlideItem>>(null);

  // 무한 루프 캐러셀: 양 끝에 클론 슬라이드를 덧붙이고, 끝에 닿으면
  // 애니메이션 없이 반대편 실제 슬라이드로 점프시킨다.
  const loopSlides = useMemo<SlideItem[]>(() => {
    if (slides.length === 0) return [];
    const first = { ...slides[0], id: "clone-first" };
    const last = { ...slides[slides.length - 1], id: "clone-last" };
    return [last, ...slides, first];
  }, []);

  const getRealIndex = (loopIndex: number) =>
    (loopIndex - 1 + slides.length) % slides.length;

  // 스와이프 도중 실시간으로 인디케이터를 갱신해 손가락을 바로 따라오게 한다.
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const loopIndex = Math.round(e.nativeEvent.contentOffset.x / width);
    const real = getRealIndex(loopIndex);
    setCurrentSlideIndex((prev) => (prev === real ? prev : real));
  };

  const updateCurrentSlideIndex = (
    e: NativeSyntheticEvent<NativeScrollEvent>
  ) => {
    const contentOffsetX = e.nativeEvent.contentOffset.x;
    const loopIndex = Math.round(contentOffsetX / width);
    setCurrentSlideIndex(getRealIndex(loopIndex));

    if (loopIndex === 0) {
      // 맨 앞 클론(실제 마지막) → 실제 마지막 슬라이드로 점프
      flatListRef.current?.scrollToOffset({
        offset: width * slides.length,
        animated: false,
      });
    } else if (loopIndex === loopSlides.length - 1) {
      // 맨 뒤 클론(실제 첫번째) → 실제 첫 슬라이드로 점프
      flatListRef.current?.scrollToOffset({
        offset: width,
        animated: false,
      });
    }
  };

  return (
    <View style={styles.container}>
      <BreathingGradient />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.contentContainer}>
          <View style={styles.carouselContainer}>
            <FlatList
              ref={flatListRef}
              data={loopSlides}
              contentContainerStyle={styles.carouselContent}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              initialScrollIndex={1}
              getItemLayout={(_, index) => ({
                length: width,
                offset: width * index,
                index,
              })}
              renderItem={({ item, index }) => {
                const { Illust } = item;
                return (
                  <View style={[styles.slide, { width }]}>
                    <View style={styles.illustContainer}>
                      <Illust
                        visible={getRealIndex(index) === currentSlideIndex}
                      />
                    </View>
                    <Text style={styles.sloganText}>{t(item.titleKey)}</Text>
                  </View>
                );
              }}
              onScroll={onScroll}
              scrollEventThrottle={16}
              onMomentumScrollEnd={updateCurrentSlideIndex}
              keyExtractor={(item) => item.id}
            />
            <View style={styles.indicatorContainer}>
              {slides.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.indicator,
                    currentSlideIndex === index && styles.indicatorActive,
                  ]}
                />
              ))}
            </View>
          </View>

          <View style={styles.bottomContainer}>
            {/* Social Login Buttons */}
            <View style={styles.buttonContainer}>
              {/* Apple Login */}
              {Platform.OS === "ios" && (
                <TouchableOpacity
                  style={styles.appleButton}
                  onPress={onAppleButtonPress}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  <Icon
                    name="logo-apple"
                    size={19}
                    color={colors.black}
                    style={styles.buttonIcon}
                  />
                  <Text style={styles.appleButtonText}>
                    {t("login.buttons.apple")}
                  </Text>
                </TouchableOpacity>
              )}

              {/* Kakao Login */}
              <TouchableOpacity
                style={styles.kakaoButton}
                onPress={onKakaoButtonPress}
                disabled={loading}
                activeOpacity={0.85}
              >
                <KakaoIcon size={19} color="#191600" />
                <Text style={styles.kakaoButtonText}>
                  {t("login.buttons.kakao")}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Terms of Service Agreement */}
            <View style={styles.agreementContainer}>
              <Text style={styles.agreementText}>
                {t("login.agreement.prefix")}
                <Text
                  style={styles.agreementLink}
                  onPress={() =>
                    Linking.openURL("https://web.drinkig.com/terms")
                  }
                >
                  {t("login.agreement.link")}
                </Text>
                {t("login.agreement.suffix")}
              </Text>
            </View>
          </View>
        </View>
      </SafeAreaView>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={accent.base} />
        </View>
      )}
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
  contentContainer: {
    flex: 1,
    justifyContent: "space-between",
    paddingVertical: spacing.xl,
  },
  carouselContainer: {
    flex: 3,
    justifyContent: "center",
    alignItems: "center",
  },
  carouselContent: {
    flexGrow: 1,
  },
  slide: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxxl,
  },
  illustContainer: {
    width: 260,
    height: 260,
    marginBottom: spacing.md,
  },
  sloganText: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 34,
    letterSpacing: -0.3,
  },
  indicatorContainer: {
    position: "absolute",
    bottom: spacing.xxl,
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.sm,
  },
  indicator: {
    height: 7,
    width: 7,
    backgroundColor: surfaces.hairlineStrong,
    borderRadius: radius.pill,
  },
  indicatorActive: {
    width: 22,
    backgroundColor: accent.base,
  },
  bottomContainer: {
    flex: 1,
    width: "100%",
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.xl,
    justifyContent: "flex-end",
  },
  buttonContainer: {
    width: "100%",
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  appleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
    paddingVertical: spacing.lg,
    borderRadius: radius.md,
    width: "100%",
    ...elevation.soft,
  },
  appleButtonText: {
    color: colors.black,
    fontSize: 16,
    fontWeight: "600",
    marginLeft: spacing.sm,
  },
  kakaoButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEE500",
    paddingVertical: spacing.lg,
    borderRadius: radius.md,
    width: "100%",
    ...elevation.soft,
  },
  kakaoButtonText: {
    color: "#191600",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: spacing.sm,
  },
  buttonIcon: {
    marginRight: 0,
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(20, 18, 22, 0.72)",
    justifyContent: "center",
    alignItems: "center",
  },
  agreementContainer: {
    marginTop: spacing.lg,
    alignItems: "center",
  },
  agreementText: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: "center",
  },
  agreementLink: {
    textDecorationLine: "underline",
    color: colors.textSecondary,
  },
});

export default LoginScreen;
