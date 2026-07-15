import React from "react";
import {
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useTranslation } from "react-i18next";
import Ionicons from "react-native-vector-icons/Ionicons";
import { colors } from "../../constants/colors";
import { radius, accent } from "../../constants/theme";

interface WineRequestButtonProps {
  /** 이미 요청을 보낸 항목 (중복 요청 방지) */
  requested: boolean;
  /** 요청 전송 중 */
  requesting: boolean;
  onPress: () => void;
  /** true면 히어로용 큰 버튼, false면 리스트 셀용 컴팩트 버튼 */
  large?: boolean;
}

/** 미매칭 와인의 "이 와인 등록 요청하기" CTA. 성공 후엔 완료 상태로 잠긴다. */
export default function WineRequestButton({
  requested,
  requesting,
  onPress,
  large = false,
}: WineRequestButtonProps) {
  const { t } = useTranslation();

  if (requested) {
    return (
      <TouchableOpacity
        style={[styles.button, styles.buttonDone, large && styles.buttonLarge]}
        disabled
      >
        <Ionicons name="checkmark-circle" size={16} color={colors.success} />
        <Text style={[styles.textDone, large && styles.textLarge]}>
          {t("menuScanResult.request.done")}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.button, large && styles.buttonLarge]}
      onPress={onPress}
      disabled={requesting}
      activeOpacity={0.75}
    >
      {requesting ? (
        <ActivityIndicator size="small" color={accent.text} />
      ) : (
        <Ionicons name="add-circle-outline" size={16} color={accent.text} />
      )}
      <Text style={[styles.text, large && styles.textLarge]}>
        {t("menuScanResult.request.cta")}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: accent.border,
    backgroundColor: accent.soft,
  },
  buttonLarge: {
    alignSelf: "stretch",
    paddingVertical: 13,
  },
  buttonDone: {
    borderColor: colors.border,
    backgroundColor: colors.surface1,
  },
  text: {
    color: accent.text,
    fontSize: 13,
    fontWeight: "600",
  },
  textDone: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: "600",
  },
  textLarge: {
    fontSize: 15,
  },
});
