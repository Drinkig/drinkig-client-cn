import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useTranslation } from "react-i18next";
import { colors } from "../../constants/colors";
import { radius, spacing } from "../../constants/theme";

interface ListStateViewProps {
  state: "loading" | "empty" | "error";
  /** Ionicons 이름. 생략 시 error는 alert-circle-outline, empty는 wine-outline */
  icon?: string;
  title?: string;
  subtitle?: string;
  /** 버튼 라벨. error 상태에서 생략하면 "다시 시도" */
  actionLabel?: string;
  onAction?: () => void;
}

// 목록 화면의 로딩/빈/에러 상태 공용 뷰.
// 에러를 빈 상태로 위장하지 않기 위해 error 상태는 항상 재시도 버튼과 함께 쓴다.
const ListStateView = ({
  state,
  icon,
  title,
  subtitle,
  actionLabel,
  onAction,
}: ListStateViewProps) => {
  const { t } = useTranslation();

  if (state === "loading") {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const isError = state === "error";
  const resolvedIcon =
    icon ?? (isError ? "alert-circle-outline" : "wine-outline");
  const resolvedTitle = title ?? (isError ? t("common.error.loadFailed") : "");
  const resolvedActionLabel =
    actionLabel ?? (isError && onAction ? t("common.retry") : undefined);

  return (
    <View style={styles.container}>
      <Ionicons
        name={resolvedIcon}
        size={48}
        color={isError ? colors.error : colors.textTertiary}
      />
      {!!resolvedTitle && <Text style={styles.title}>{resolvedTitle}</Text>}
      {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      {!!resolvedActionLabel && !!onAction && (
        <TouchableOpacity
          style={styles.actionButton}
          onPress={onAction}
          accessibilityRole="button"
          accessibilityLabel={resolvedActionLabel}
        >
          <Text style={styles.actionText}>{resolvedActionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xxl,
    paddingVertical: 48,
    gap: spacing.md,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  actionButton: {
    marginTop: spacing.sm,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  actionText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "600",
  },
});

export default ListStateView;
