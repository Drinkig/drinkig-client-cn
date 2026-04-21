import React, { useState, useEffect, useRef } from "react";
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
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { exchangeKakaoToken, appleLogin } from "../api/member";
import { useUser } from "../context/UserContext";
import { useGlobalUI } from "../context/GlobalUIContext";
import { colors } from "../constants/colors";
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

// 상단 그라디언트 브리딩 애니메이션
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
  }, []);

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
            "rgba(142,68,173,0.35)",
            "rgba(126,19,177,0.10)",
            "transparent",
          ]}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.8, y: 0.6 }}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: opacity2 }]}>
        <LinearGradient
          colors={[
            "rgba(192,132,252,0.30)",
            "rgba(142,68,173,0.08)",
            "transparent",
          ]}
          start={{ x: 0.8, y: 0 }}
          end={{ x: 0.2, y: 0.55 }}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>
    </View>
  );
}

const LoginScreen = () => {
  const navigation = useNavigation();
  const { login } = useUser();
  const { showLoading, hideLoading, showToast } = useGlobalUI();
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

  const updateCurrentSlideIndex = (
    e: NativeSyntheticEvent<NativeScrollEvent>
  ) => {
    const contentOffsetX = e.nativeEvent.contentOffset.x;
    const currentIndex = Math.round(contentOffsetX / width);
    setCurrentSlideIndex(currentIndex);
  };

  return (
    <View style={styles.container}>
      <BreathingGradient />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.contentContainer}>
          <View style={styles.carouselContainer}>
            <FlatList
              data={slides}
              contentContainerStyle={{ flexGrow: 1 }}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              renderItem={({ item, index }) => {
                const { Illust } = item;
                return (
                  <View style={[styles.slide, { width }]}>
                    <View style={styles.illustContainer}>
                      <Illust visible={index === currentSlideIndex} />
                    </View>
                    <Text style={styles.sloganText}>{t(item.titleKey)}</Text>
                  </View>
                );
              }}
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
                >
                  <Icon
                    name="logo-apple"
                    size={20}
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
              >
                <Icon
                  name="chatbubble"
                  size={20}
                  color={colors.black}
                  style={styles.buttonIcon}
                />
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
          <ActivityIndicator size="large" color={colors.white} />
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
    paddingVertical: 20,
  },
  carouselContainer: {
    flex: 3,
    justifyContent: "center",
    alignItems: "center",
  },
  slide: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  illustContainer: {
    width: 260,
    height: 260,
    marginBottom: 12,
  },
  sloganText: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 34,
  },
  indicatorContainer: {
    position: "absolute",
    bottom: 30,
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  indicator: {
    height: 8,
    width: 8,
    backgroundColor: colors.white,
    borderRadius: 4,
    opacity: 0.2,
  },
  indicatorActive: {
    width: 24,
    opacity: 1,
  },
  bottomContainer: {
    flex: 1,
    width: "100%",
    paddingHorizontal: 24,
    paddingBottom: 20,
    justifyContent: "flex-end",
  },
  buttonContainer: {
    width: "100%",
    gap: 12,
    marginTop: 20,
  },
  appleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
    paddingVertical: 16,
    borderRadius: 12,
    width: "100%",
  },
  appleButtonText: {
    color: colors.black,
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  kakaoButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEE500",
    paddingVertical: 16,
    borderRadius: 12,
    width: "100%",
  },
  kakaoButtonText: {
    color: colors.black,
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  buttonIcon: {
    marginRight: 4,
  },
  emailLoginLink: {
    paddingVertical: 10,
    alignItems: "center",
    marginTop: 0,
  },
  emailLoginLinkText: {
    color: colors.textSecondary,
    fontSize: 13,
    textDecorationLine: "underline",
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(25, 22, 28, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  agreementContainer: {
    marginTop: 16,
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
