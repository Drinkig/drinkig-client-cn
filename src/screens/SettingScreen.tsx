import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Linking,
  Modal,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import appleAuth from "@invertase/react-native-apple-authentication";
import { useUser } from "../context/UserContext";
import { useSubscription } from "../context/SubscriptionContext";
import { useGlobalUI } from "../context/GlobalUIContext";
import {
  deleteMember,
  deleteAppleMember,
  getMemberInfo,
  MemberInfoResponse,
} from "../api/member";
import { redeemPromoCode } from "../api/subscription";
import DeviceInfo from "react-native-device-info";
import { colors } from "../constants/colors";
import { spacing, radius, surfaces, accent } from "../constants/theme";
import { isDevAccessEnabled } from "../utils/devAccess";
import GlassHeader from "../components/common/GlassHeader";

type RowTone = "default" | "danger" | "dev";

const SettingRow = ({
  icon,
  label,
  value,
  onPress,
  showChevron,
  trailing,
  tone = "default",
  first = false,
}: {
  icon: string;
  label: string;
  value?: string;
  onPress?: () => void;
  showChevron?: boolean;
  trailing?: React.ReactNode;
  tone?: RowTone;
  first?: boolean;
}) => {
  const chevron = showChevron ?? !!onPress;
  const chipStyle =
    tone === "danger"
      ? styles.chipDanger
      : tone === "dev"
      ? styles.chipDev
      : styles.chipDefault;
  const iconColor =
    tone === "danger"
      ? colors.error
      : tone === "dev"
      ? colors.warning
      : accent.text;
  const labelStyle =
    tone === "danger"
      ? styles.labelDanger
      : tone === "dev"
      ? styles.labelDev
      : styles.label;

  const RowWrap: any = onPress ? TouchableOpacity : View;

  return (
    <RowWrap
      style={[styles.row, !first && styles.rowBorder]}
      onPress={onPress}
      activeOpacity={0.6}
    >
      <View style={[styles.chip, chipStyle]}>
        <Icon name={icon} size={18} color={iconColor} />
      </View>
      <Text style={labelStyle} numberOfLines={1}>
        {label}
      </Text>
      {trailing ?? (
        <View style={styles.trailing}>
          {value ? (
            <Text style={styles.value} numberOfLines={1}>
              {value}
            </Text>
          ) : null}
          {chevron ? (
            <Icon
              name="chevron-forward"
              size={18}
              color={colors.textTertiary}
            />
          ) : null}
        </View>
      )}
    </RowWrap>
  );
};

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTranslation } from "react-i18next";
import { ActionSheetIOS, Platform } from "react-native";
import { getSystemLanguage } from "../i18n";

const SettingScreen = () => {
  const navigation = useNavigation();
  const { logout, resetToOnboarding } = useUser();
  const {
    isPremium,
    plan,
    expiresAt,
    platform,
    devOverride,
    setDevOverride,
    refreshSubscription,
  } = useSubscription();
  const { showAlert, showToast, showLoading, hideLoading } = useGlobalUI();
  const { i18n, t } = useTranslation();

  const [authType, setAuthType] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [currentLanguageValue, setCurrentLanguageValue] =
    useState<string>("system");
  const [promoModalVisible, setPromoModalVisible] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [isRedeemingPromo, setIsRedeemingPromo] = useState(false);
  const [promoError, setPromoError] = useState("");

  useEffect(() => {
    const loadLang = async () => {
      const saved = await AsyncStorage.getItem("@app_language");
      if (saved) {
        setCurrentLanguageValue(saved);
      }
    };
    loadLang();
  }, []);

  const changeAppLanguage = async (val: string) => {
    setCurrentLanguageValue(val);
    await AsyncStorage.setItem("@app_language", val);

    if (val === "system") {
      i18n.changeLanguage(getSystemLanguage());
    } else {
      i18n.changeLanguage(val);
    }
  };

  const handleChangeLanguage = () => {
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [
            t("setting.language.cancel"),
            t("setting.language.system"),
            t("setting.language.ko"),
            t("setting.language.en"),
          ],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            changeAppLanguage("system");
          } else if (buttonIndex === 2) {
            changeAppLanguage("ko");
          } else if (buttonIndex === 3) {
            changeAppLanguage("en");
          }
        }
      );
    } else {
      Alert.alert(t("setting.language.title"), t("setting.language.message"), [
        {
          text: t("setting.language.system"),
          onPress: () => changeAppLanguage("system"),
        },
        {
          text: t("setting.language.ko"),
          onPress: () => changeAppLanguage("ko"),
        },
        {
          text: t("setting.language.en"),
          onPress: () => changeAppLanguage("en"),
        },
        { text: t("setting.language.cancel"), style: "cancel" },
      ]);
    }
  };

  useEffect(() => {
    const fetchMemberInfo = async () => {
      try {
        const response: MemberInfoResponse = await getMemberInfo();
        if (response.isSuccess) {
          setAuthType(response.result.authType);
          setUserEmail(response.result.email);
          setUsername(response.result.username);
        }
      } catch (error) {
        console.error("Failed to fetch member info:", error);
      }
    };
    fetchMemberInfo();
  }, []);

  const handleLinkPress = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        showToast(t("setting.alert.errorLink"), { type: "error" });
      }
    } catch (error) {
      console.error("An error occurred", error);
      showToast(t("setting.alert.errorLinkOpen"), { type: "error" });
    }
  };

  const handleEmailPress = async (type: "REPORT" | "SUGGESTION") => {
    const email = "drinkeasyy@gmail.com";
    let subject = "";
    let body = "";

    const deviceInfo = `
-------------------
Device: ${DeviceInfo.getModel()}
User ID: ${username}
OS: ${DeviceInfo.getSystemName()} ${DeviceInfo.getSystemVersion()}
App Version: ${DeviceInfo.getVersion()}
-------------------
`;

    subject =
      type === "REPORT"
        ? t("setting.mail.reportSubject")
        : t("setting.mail.suggestSubject");
    body = `${
      type === "REPORT"
        ? t("setting.mail.reportBody")
        : t("setting.mail.suggestBody")
    }${deviceInfo}`;

    const url = `mailto:${email}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;

    try {
      await Linking.openURL(url);
    } catch (error) {
      console.error("An error occurred", error);
      showToast(t("setting.alert.mailErrorMessage"), { type: "error" });
    }
  };

  const handleRedeemPromo = async () => {
    const code = promoCode.trim();
    if (!code || isRedeemingPromo) return;

    setIsRedeemingPromo(true);
    try {
      const response = await redeemPromoCode(code);
      if (response.isSuccess && response.result.success) {
        await refreshSubscription();
        setPromoModalVisible(false);
        setPromoCode("");
        navigation.navigate("PremiumWelcome" as never);
      } else {
        setPromoError(response.message || t("paywall.promoErrorGeneric"));
      }
    } catch (error: any) {
      const message =
        error?.response?.data?.message || t("paywall.promoErrorGeneric");
      setPromoError(message);
    } finally {
      setIsRedeemingPromo(false);
    }
  };

  const closePromoModal = () => {
    if (isRedeemingPromo) return;
    setPromoModalVisible(false);
    setPromoCode("");
    setPromoError("");
  };

  const handleLogout = () => {
    showAlert({
      title: t("setting.alert.logoutTitle"),
      message: t("setting.alert.logoutMessage"),
      confirmText: t("setting.alert.logoutConfirm"),
      singleButton: false,
      onConfirm: async () => {
        showLoading();
        try {
          await logout();
        } finally {
          hideLoading();
        }
      },
    });
  };

  const handleDeleteAccount = () => {
    showAlert({
      title: t("setting.alert.deleteTitle"),
      message: t("setting.alert.deleteMessage"),
      confirmText: t("setting.alert.deleteConfirm"),
      singleButton: false,
      onConfirm: async () => {
        if (authType === "APPLE") {
          try {
            const appleAuthRequestResponse = await appleAuth.performRequest({
              requestedOperation: appleAuth.Operation.REFRESH,
            });

            const authCode = appleAuthRequestResponse.authorizationCode;

            if (!authCode) {
              throw new Error("Failed to get authorization code");
            }

            const response = await deleteAppleMember(authCode);

            if (response.isSuccess) {
              await logout();
            } else {
              console.error("Apple delete member failed:", response.message);
              showToast(
                `${t("setting.alert.deleteError")} ${response.message}`,
                { type: "error" }
              );
            }
          } catch (error: any) {
            if (error.code === appleAuth.Error.CANCELED) {
              return;
            }
            console.error("Apple delete member error:", error);
            showToast(
              `${t("setting.alert.deleteError")} ${error.message || "Error"}`,
              { type: "error" }
            );
          }
        } else {
          // General withdrawal (Email/Kakao)
          navigation.navigate("WithdrawRetention", {
            authType: authType || "EMAIL",
          });
        }
      },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <GlassHeader
        floating={false}
        title={t("setting.header")}
        left={
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon name="arrow-back" size={22} color={colors.white} />
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>{t("setting.section.account")}</Text>
        <View style={styles.card}>
          <SettingRow
            first
            icon="finger-print-outline"
            label={t("setting.account.loginMethod")}
            value={
              authType === "KAKAO"
                ? "카카오"
                : authType === "APPLE"
                ? "Apple"
                : authType ?? undefined
            }
          />
          <SettingRow
            icon="mail-outline"
            label={t("setting.account.email")}
            value={userEmail}
          />
        </View>

        <Text style={styles.sectionTitle}>{t("subscription.title")}</Text>
        <View style={styles.card}>
          <SettingRow
            first
            icon="diamond-outline"
            label={
              isPremium ? t("subscription.premium") : t("subscription.free")
            }
            value={
              isPremium
                ? expiresAt
                  ? t("subscription.expiresAt", {
                      date: new Date(expiresAt).toLocaleDateString(),
                    })
                  : t("subscription.manage")
                : t("paywall.upgrade")
            }
            onPress={() => {
              if (isPremium) {
                Linking.openURL("https://apps.apple.com/account/subscriptions");
              } else {
                navigation.navigate("Paywall" as never);
              }
            }}
          />
          <SettingRow
            icon="gift-outline"
            label={t("subscription.enterPromo")}
            onPress={() => setPromoModalVisible(true)}
          />
        </View>

        <Text style={styles.sectionTitle}>{t("setting.section.appInfo")}</Text>
        <View style={styles.card}>
          <SettingRow
            first
            icon="phone-portrait-outline"
            label={t("setting.appInfo.version")}
            value={DeviceInfo.getVersion()}
          />
          <SettingRow
            icon="language-outline"
            label={t("setting.appInfo.language")}
            value={
              currentLanguageValue === "ko"
                ? t("setting.language.ko")
                : currentLanguageValue === "en"
                ? t("setting.language.en")
                : t("setting.language.system")
            }
            onPress={handleChangeLanguage}
          />
          <SettingRow
            icon="document-text-outline"
            label={t("setting.appInfo.terms")}
            onPress={() => handleLinkPress("https://web.drinkig.com/terms")}
          />
          <SettingRow
            icon="shield-checkmark-outline"
            label={t("setting.appInfo.privacy")}
            onPress={() => handleLinkPress("https://web.drinkig.com/privacy")}
          />
        </View>

        <Text style={styles.sectionTitle}>{t("setting.section.contact")}</Text>
        <View style={styles.card}>
          <SettingRow
            first
            icon="bug-outline"
            label={t("setting.contact.reportError")}
            onPress={() => handleEmailPress("REPORT")}
          />
          <SettingRow
            icon="bulb-outline"
            label={t("setting.contact.suggestFeature")}
            onPress={() => handleEmailPress("SUGGESTION")}
          />
        </View>

        <Text style={styles.sectionTitle}>
          {t("setting.section.management")}
        </Text>
        <View style={styles.card}>
          <SettingRow
            first
            icon="log-out-outline"
            label={t("setting.management.logout")}
            onPress={handleLogout}
            showChevron={false}
          />
          <SettingRow
            tone="danger"
            icon="trash-outline"
            label={t("setting.management.deleteAccount")}
            onPress={handleDeleteAccount}
            showChevron={false}
          />
        </View>

        {isDevAccessEnabled && (
          <>
            <Text style={[styles.sectionTitle, styles.devSectionTitle]}>
              개발자 모드 (DEV)
            </Text>
            <View style={[styles.card, styles.devCard]}>
              <SettingRow
                first
                tone="dev"
                icon="refresh-outline"
                label="온보딩 다시 보기"
                onPress={() => {
                  showAlert({
                    title: "온보딩 다시 보기",
                    message: "온보딩 화면으로 이동합니다. 계정은 유지돼요.",
                    confirmText: "이동",
                    singleButton: false,
                    onConfirm: async () => {
                      await resetToOnboarding();
                    },
                  });
                }}
              />
              <SettingRow
                tone="dev"
                icon="trash-bin-outline"
                label="로컬 캐시 삭제 (추천/취향)"
                onPress={async () => {
                  await AsyncStorage.removeItem("recommendations");
                  await AsyncStorage.removeItem("flavorProfile");
                  showToast("로컬 추천/취향 캐시 삭제됨", { type: "success" });
                }}
              />
              <SettingRow
                tone="dev"
                icon="card-outline"
                label="구독 상태 오버라이드"
                value={
                  devOverride === "premium"
                    ? "강제 프리미엄"
                    : devOverride === "free"
                    ? "강제 무료"
                    : "기본"
                }
                onPress={() => {
                  const options = [
                    "취소",
                    "서버 값 사용 (기본)",
                    "강제 프리미엄",
                    "강제 무료",
                  ];
                  const apply = async (idx: number) => {
                    if (idx === 1) {
                      await setDevOverride("none");
                      showToast("구독 오버라이드 해제", { type: "success" });
                    } else if (idx === 2) {
                      await setDevOverride("premium");
                      showToast("강제 프리미엄 적용", { type: "success" });
                    } else if (idx === 3) {
                      await setDevOverride("free");
                      showToast("강제 무료 적용", { type: "success" });
                    }
                  };
                  if (Platform.OS === "ios") {
                    ActionSheetIOS.showActionSheetWithOptions(
                      { options, cancelButtonIndex: 0 },
                      apply
                    );
                  } else {
                    Alert.alert("구독 상태 오버라이드", undefined, [
                      { text: options[1], onPress: () => apply(1) },
                      { text: options[2], onPress: () => apply(2) },
                      { text: options[3], onPress: () => apply(3) },
                      { text: options[0], style: "cancel" },
                    ]);
                  }
                }}
              />
              <SettingRow
                tone="dev"
                icon="gift-outline"
                label="프리미엄 환영 화면 미리보기"
                onPress={() => navigation.navigate("PremiumWelcome" as never)}
              />
              <SettingRow
                tone="dev"
                icon="wine-outline"
                label="와인 등록 신청 관리"
                onPress={() =>
                  navigation.navigate("AdminWineApproval" as never)
                }
              />
              <SettingRow
                tone="dev"
                icon="time-outline"
                label="만료 배너 테스트"
                onPress={() => {
                  const options = [
                    "취소",
                    "3일 남음",
                    "1일 남음 (내일 만료)",
                    "만료됨",
                    "초기화 (서버 값)",
                  ];
                  const apply = async (idx: number) => {
                    if (idx === 0) return;
                    let fakeExpiry: string | null = null;
                    if (idx === 1) {
                      const d = new Date();
                      d.setDate(d.getDate() + 3);
                      fakeExpiry = d.toISOString();
                    } else if (idx === 2) {
                      const d = new Date();
                      d.setDate(d.getDate() + 1);
                      fakeExpiry = d.toISOString();
                    } else if (idx === 3) {
                      const d = new Date();
                      d.setDate(d.getDate() - 1);
                      fakeExpiry = d.toISOString();
                    } else if (idx === 4) {
                      await AsyncStorage.removeItem("@dev_expiry_override");
                      await refreshSubscription();
                      showToast("만료일 오버라이드 초기화", {
                        type: "success",
                      });
                      return;
                    }
                    if (fakeExpiry) {
                      await AsyncStorage.setItem(
                        "@dev_expiry_override",
                        fakeExpiry
                      );
                      await refreshSubscription();
                      showToast(
                        `만료일 오버라이드: ${fakeExpiry.slice(0, 10)}`,
                        {
                          type: "success",
                        }
                      );
                    }
                  };
                  if (Platform.OS === "ios") {
                    ActionSheetIOS.showActionSheetWithOptions(
                      { options, cancelButtonIndex: 0 },
                      apply
                    );
                  } else {
                    Alert.alert("만료일 오버라이드", undefined, [
                      { text: options[1], onPress: () => apply(1) },
                      { text: options[2], onPress: () => apply(2) },
                      { text: options[3], onPress: () => apply(3) },
                      { text: options[4], onPress: () => apply(4) },
                      { text: options[0], style: "cancel" },
                    ]);
                  }
                }}
              />
            </View>
          </>
        )}
      </ScrollView>

      <Modal
        visible={promoModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closePromoModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.promoModalOverlay}
        >
          <View style={styles.promoModalCard}>
            <Text style={styles.promoModalTitle}>
              {t("subscription.enterPromo")}
            </Text>
            <Text style={styles.promoModalDescription}>
              {t("subscription.promoDescription")}
            </Text>
            <TextInput
              style={styles.promoModalInput}
              value={promoCode}
              onChangeText={(text) => {
                setPromoCode(text);
                if (promoError) setPromoError("");
              }}
              placeholder={t("paywall.promoPlaceholder")}
              placeholderTextColor={colors.textTertiary}
              autoCapitalize="characters"
              autoCorrect={false}
              editable={!isRedeemingPromo}
            />
            {promoError ? (
              <Text style={styles.promoModalError}>{promoError}</Text>
            ) : null}
            <View style={styles.promoModalButtonRow}>
              <TouchableOpacity
                style={[
                  styles.promoModalButton,
                  styles.promoModalButtonSecondary,
                ]}
                onPress={closePromoModal}
                disabled={isRedeemingPromo}
              >
                <Text style={styles.promoModalButtonSecondaryText}>
                  {t("subscription.cancel")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.promoModalButton,
                  styles.promoModalButtonPrimary,
                  (!promoCode.trim() || isRedeemingPromo) &&
                    styles.promoModalButtonDisabled,
                ]}
                onPress={handleRedeemPromo}
                disabled={!promoCode.trim() || isRedeemingPromo}
              >
                {isRedeemingPromo ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <Text style={styles.promoModalButtonPrimaryText}>
                    {t("paywall.promoApply")}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
    letterSpacing: 0.3,
    marginTop: spacing.xxl,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  devSectionTitle: {
    color: colors.warning,
  },
  card: {
    backgroundColor: surfaces.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: surfaces.hairline,
    overflow: "hidden",
  },
  devCard: {
    borderColor: "rgba(245,166,35,0.25)",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    minHeight: 56,
  },
  rowBorder: {
    borderTopWidth: 1,
    borderTopColor: surfaces.hairline,
  },
  chip: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  chipDefault: {
    backgroundColor: accent.soft,
  },
  chipDanger: {
    backgroundColor: "rgba(231,76,60,0.15)",
  },
  chipDev: {
    backgroundColor: "rgba(245,166,35,0.15)",
  },
  label: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
  },
  labelDanger: {
    flex: 1,
    fontSize: 15,
    color: colors.error,
  },
  labelDev: {
    flex: 1,
    fontSize: 15,
    color: colors.warning,
  },
  trailing: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: spacing.sm,
    flexShrink: 1,
  },
  value: {
    fontSize: 14,
    color: colors.textSecondary,
    marginRight: spacing.xs,
    flexShrink: 1,
  },
  promoModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  promoModalCard: {
    backgroundColor: surfaces.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: surfaces.hairline,
    padding: 24,
  },
  promoModalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.white,
    marginBottom: 8,
    textAlign: "center",
  },
  promoModalDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: 16,
  },
  promoModalInput: {
    borderWidth: 1,
    borderColor: surfaces.hairlineStrong,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.white,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: surfaces.raised,
  },
  promoModalError: {
    color: colors.error,
    fontSize: 13,
    marginTop: -10,
    marginBottom: 12,
  },
  promoModalButtonRow: {
    flexDirection: "row",
  },
  promoModalButton: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  promoModalButtonPrimary: {
    backgroundColor: accent.base,
    marginLeft: 8,
  },
  promoModalButtonSecondary: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: surfaces.hairlineStrong,
    marginRight: 8,
  },
  promoModalButtonDisabled: {
    opacity: 0.5,
  },
  promoModalButtonPrimaryText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "600",
  },
  promoModalButtonSecondaryText: {
    color: colors.white,
    fontSize: 16,
  },
});

export default SettingScreen;
