import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Linking,
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
import DeviceInfo from "react-native-device-info";
import { colors } from "../constants/colors";
import { isDevAccessEnabled } from "../utils/devAccess";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTranslation } from "react-i18next";
import { ActionSheetIOS, Platform } from "react-native";
import { getSystemLanguage } from "../i18n";

const SettingScreen = () => {
  const navigation = useNavigation();
  const { logout, resetToOnboarding } = useUser();
  const { isPremium, plan, expiresAt, platform, devOverride, setDevOverride } =
    useSubscription();
  const { showAlert, showToast, showLoading, hideLoading } = useGlobalUI();
  const { i18n, t } = useTranslation();

  const [authType, setAuthType] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [currentLanguageValue, setCurrentLanguageValue] =
    useState<string>("system");

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
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Icon name="chevron-back" size={28} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("setting.header")}</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t("setting.section.account")}
          </Text>
          <View style={styles.item}>
            <Text style={styles.itemText}>
              {t("setting.account.loginMethod")}
            </Text>
            <Text style={styles.versionText}>
              {authType === "KAKAO"
                ? "카카오"
                : authType === "APPLE"
                ? "Apple"
                : authType}
            </Text>
          </View>
          <View style={styles.item}>
            <Text style={styles.itemText}>{t("setting.account.email")}</Text>
            <Text style={styles.versionText}>{userEmail}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("subscription.title")}</Text>
          <TouchableOpacity
            style={styles.item}
            onPress={() => {
              if (isPremium) {
                Linking.openURL("https://apps.apple.com/account/subscriptions");
              } else {
                navigation.navigate("Paywall" as never);
              }
            }}
          >
            <Text style={styles.itemText}>
              {isPremium ? t("subscription.premium") : t("subscription.free")}
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text style={[styles.versionText, { marginRight: 8 }]}>
                {isPremium
                  ? expiresAt
                    ? t("subscription.expiresAt", {
                        date: new Date(expiresAt).toLocaleDateString(),
                      })
                    : t("subscription.manage")
                  : t("paywall.upgrade")}
              </Text>
              <Icon name="chevron-forward" size={20} color="#666" />
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t("setting.section.appInfo")}
          </Text>
          <View style={styles.item}>
            <Text style={styles.itemText}>{t("setting.appInfo.version")}</Text>
            <Text style={styles.versionText}>{DeviceInfo.getVersion()}</Text>
          </View>
          <TouchableOpacity style={styles.item} onPress={handleChangeLanguage}>
            <Text style={styles.itemText}>{t("setting.appInfo.language")}</Text>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text style={[styles.versionText, { marginRight: 8 }]}>
                {currentLanguageValue === "ko"
                  ? t("setting.language.ko")
                  : currentLanguageValue === "en"
                  ? t("setting.language.en")
                  : t("setting.language.system")}
              </Text>
              <Icon name="chevron-forward" size={20} color="#666" />
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.item}
            onPress={() => handleLinkPress("https://web.drinkig.com/terms")}
          >
            <Text style={styles.itemText}>{t("setting.appInfo.terms")}</Text>
            <Icon name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.item}
            onPress={() => handleLinkPress("https://web.drinkig.com/privacy")}
          >
            <Text style={styles.itemText}>{t("setting.appInfo.privacy")}</Text>
            <Icon name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t("setting.section.contact")}
          </Text>
          <TouchableOpacity
            style={styles.item}
            onPress={() => handleEmailPress("REPORT")}
          >
            <Text style={styles.itemText}>
              {t("setting.contact.reportError")}
            </Text>
            <Icon name="bug-outline" size={20} color={colors.white} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.item}
            onPress={() => handleEmailPress("SUGGESTION")}
          >
            <Text style={styles.itemText}>
              {t("setting.contact.suggestFeature")}
            </Text>
            <Icon name="bulb-outline" size={20} color={colors.white} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t("setting.section.management")}
          </Text>
          <TouchableOpacity style={styles.item} onPress={handleLogout}>
            <Text style={styles.itemText}>
              {t("setting.management.logout")}
            </Text>
            <Icon name="log-out-outline" size={20} color="#ccc" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.item} onPress={handleDeleteAccount}>
            <Text style={[styles.itemText, styles.deleteText]}>
              {t("setting.management.deleteAccount")}
            </Text>
            <Icon name="trash-outline" size={20} color={colors.error} />
          </TouchableOpacity>
        </View>

        {isDevAccessEnabled && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, styles.devSectionTitle]}>
              개발자 모드 (DEV)
            </Text>
            <TouchableOpacity
              style={styles.item}
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
            >
              <Text style={[styles.itemText, styles.devItemText]}>
                온보딩 다시 보기
              </Text>
              <Icon name="refresh-outline" size={20} color={"#f5a623"} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.item}
              onPress={async () => {
                await AsyncStorage.removeItem("recommendations");
                await AsyncStorage.removeItem("flavorProfile");
                showToast("로컬 추천/취향 캐시 삭제됨", { type: "success" });
              }}
            >
              <Text style={[styles.itemText, styles.devItemText]}>
                로컬 캐시 삭제 (추천/취향)
              </Text>
              <Icon name="trash-bin-outline" size={20} color={"#f5a623"} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.item}
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
            >
              <Text style={[styles.itemText, styles.devItemText]}>
                구독 상태 오버라이드
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text
                  style={[
                    styles.versionText,
                    styles.devItemText,
                    { marginRight: 8 },
                  ]}
                >
                  {devOverride === "premium"
                    ? "강제 프리미엄"
                    : devOverride === "free"
                    ? "강제 무료"
                    : "기본"}
                </Text>
                <Icon name="chevron-forward" size={20} color={"#f5a623"} />
              </View>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.white,
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: 24,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
    paddingHorizontal: 24,
  },
  item: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  itemText: {
    fontSize: 16,
    color: colors.white,
  },
  versionText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  deleteText: {
    color: colors.error,
  },
  devSectionTitle: {
    color: "#f5a623",
  },
  devItemText: {
    color: "#f5a623",
  },
});

export default SettingScreen;
