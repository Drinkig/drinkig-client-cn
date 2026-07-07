import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import Icon from "react-native-vector-icons/Ionicons";
import { useUser } from "../context/UserContext";
import { useSubscription } from "../context/SubscriptionContext";
import { useGlobalUI } from "../context/GlobalUIContext";
import { deleteMember, deleteAppleMember } from "../api/member";
import appleAuth from "@invertase/react-native-apple-authentication";
import { colors } from "../constants/colors";
import GlassHeader from "../components/common/GlassHeader";

type WithdrawReasonRouteProp = RouteProp<
  {
    WithdrawReason: { authType: string };
  },
  "WithdrawReason"
>;

const WithdrawReasonScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<WithdrawReasonRouteProp>();
  const { authType } = route.params;
  const { t } = useTranslation();
  const { logout } = useUser();
  const { isPremium } = useSubscription();
  const { showLoading, hideLoading, showAlert, showToast, closeAlert } =
    useGlobalUI();

  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [otherReason, setOtherReason] = useState<string>("");

  // value는 서버로 전송되는 원문(한국어) — 변경 금지. 화면 표시는 labelKey로 번역.
  const reasons = [
    {
      value: "앱을 자주 사용하지 않아요",
      labelKey: "withdraw.reason.reasons.notOften",
    },
    {
      value: "원하는 정보가 부족해요",
      labelKey: "withdraw.reason.reasons.lackOfInfo",
    },
    {
      value: "오류가 잦아요",
      labelKey: "withdraw.reason.reasons.frequentBugs",
    },
    {
      value: "다른 서비스를 이용할래요",
      labelKey: "withdraw.reason.reasons.otherService",
    },
    {
      value: "새 계정을 만들고 싶어요",
      labelKey: "withdraw.reason.reasons.newAccount",
    },
    { value: "기타", labelKey: "withdraw.reason.reasons.other" },
  ];

  const toggleReason = (reason: string) => {
    setSelectedReasons((prev) => {
      if (prev.includes(reason)) {
        return prev.filter((r) => r !== reason);
      } else {
        return [...prev, reason];
      }
    });
  };

  const handleWithdraw = () => {
    // 탈퇴 사유는 선택 사항 — 미선택도 진행 가능 (Apple 5.1.1(v) 관점)
    if (selectedReasons.includes("기타") && !otherReason.trim()) {
      showToast(t("withdraw.reason.toastEnterOtherReason"), { type: "info" });
      return;
    }

    const confirmWithdrawal = () => {
      showAlert({
        title: t("withdraw.reason.confirmTitle"),
        message: t("withdraw.reason.confirmMessage"),
        confirmText: t("withdraw.reason.confirmButton"),
        singleButton: false,
        onConfirm: () => {
          closeAlert();
          processWithdrawal();
        },
      });
    };

    // 계정을 삭제해도 Apple 자동갱신 구독은 해지되지 않으므로,
    // 구독 중이라면 먼저 App Store 해지 안내를 거치게 한다.
    if (isPremium) {
      showAlert({
        title: t("withdraw.subscriptionNoticeTitle"),
        message: t("withdraw.subscriptionNoticeMessage"),
        confirmText: t("withdraw.subscriptionNoticeContinue"),
        cancelText: t("withdraw.subscriptionNoticeManage"),
        singleButton: false,
        onConfirm: () => {
          closeAlert();
          setTimeout(confirmWithdrawal, 300);
        },
        onCancel: () => {
          closeAlert();
          Linking.openURL("https://apps.apple.com/account/subscriptions");
        },
      });
    } else {
      confirmWithdrawal();
    }
  };

  const processWithdrawal = async () => {
    showLoading();
    try {
      if (authType === "APPLE") {
        await handleAppleDelete();
      } else {
        let fullReason = selectedReasons.filter((r) => r !== "기타").join(", ");
        if (selectedReasons.includes("기타") && otherReason.trim()) {
          fullReason = fullReason
            ? `${fullReason}, ${otherReason.trim()}`
            : otherReason.trim();
        }

        const response = await deleteMember(fullReason);
        hideLoading();

        if (response.isSuccess) {
          logout(true);
        } else {
          showToast(
            t("withdraw.reason.toastWithdrawFailed", {
              message: response.message,
            }),
            { type: "error" }
          );
        }
      }
    } catch (error: any) {
      hideLoading();
      console.error("Delete member error:", error);
      showToast(t("withdraw.reason.toastWithdrawError"), { type: "error" });
    }
  };

  const handleAppleDelete = async () => {
    try {
      const appleAuthRequestResponse = await appleAuth.performRequest({
        requestedOperation: appleAuth.Operation.REFRESH,
      });

      const authCode = appleAuthRequestResponse.authorizationCode;
      if (!authCode) throw new Error("Failed to get authorization code");

      const response = await deleteAppleMember(authCode);
      hideLoading();

      if (response.isSuccess) {
        logout(true);
      } else {
        showToast(
          t("withdraw.reason.toastWithdrawFailed", {
            message: response.message,
          }),
          { type: "error" }
        );
      }
    } catch (error: any) {
      hideLoading();
      if (error.code === appleAuth.Error.CANCELED) return;
      console.error("Apple delete member error:", error);
      showToast(
        t("withdraw.reason.toastAppleFailed", {
          message: error.message || t("withdraw.reason.unknownError"),
        }),
        { type: "error" }
      );
      throw error;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <GlassHeader
        floating={false}
        title={t("withdraw.reason.headerTitle")}
        left={
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon name="arrow-back" size={22} color={colors.white} />
          </TouchableOpacity>
        }
      />

      <KeyboardAvoidingView
        style={styles.keyboardAvoiding}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.questionText}>
            {t("withdraw.reason.question")}
          </Text>

          <Text style={styles.subQuestionText}>
            {t("withdraw.reason.multiSelectHint")}
          </Text>

          <View style={styles.reasonsContainer}>
            {reasons.map((reason, index) => {
              const isSelected = selectedReasons.includes(reason.value);
              return (
                <View key={index}>
                  <TouchableOpacity
                    style={styles.reasonItem}
                    onPress={() => toggleReason(reason.value)}
                  >
                    <View
                      style={[
                        styles.checkbox,
                        isSelected && styles.checkboxSelected,
                      ]}
                    >
                      {isSelected && (
                        <Icon name="checkmark" size={16} color={colors.white} />
                      )}
                    </View>
                    <Text style={styles.reasonText}>{t(reason.labelKey)}</Text>
                  </TouchableOpacity>
                  {reason.value === "기타" && isSelected && (
                    <TextInput
                      style={styles.otherInput}
                      placeholder={t("withdraw.reason.otherPlaceholder")}
                      placeholderTextColor={colors.textTertiary}
                      multiline
                      value={otherReason}
                      onChangeText={setOtherReason}
                    />
                  )}
                </View>
              );
            })}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.withdrawButton,
              selectedReasons.includes("기타") &&
                !otherReason.trim() &&
                styles.withdrawButtonDisabled,
            ]}
            onPress={handleWithdraw}
            disabled={selectedReasons.includes("기타") && !otherReason.trim()}
          >
            <Text style={styles.withdrawButtonText}>
              {t("withdraw.reason.withdrawButton")}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardAvoiding: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  questionText: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.white,
    lineHeight: 30,
    marginBottom: 32,
  },
  subQuestionText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 24,
    marginTop: -20,
  },
  reasonsContainer: {
    gap: 8,
  },
  reasonItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.textTertiary,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  reasonText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  otherInput: {
    backgroundColor: colors.surface1,
    borderRadius: 8,
    padding: 12,
    color: colors.white,
    fontSize: 14,
    marginTop: 4,
    marginLeft: 36,
    minHeight: 80,
    textAlignVertical: "top",
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  withdrawButton: {
    backgroundColor: colors.error,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  withdrawButtonDisabled: {
    backgroundColor: colors.textTertiary,
  },
  withdrawButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default WithdrawReasonScreen;
