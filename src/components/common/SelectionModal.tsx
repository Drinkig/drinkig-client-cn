import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useTranslation } from "react-i18next";
import { colors } from "../../constants/colors";
import { spacing, radius, surfaces, accent } from "../../constants/theme";

interface SelectionModalProps {
  visible: boolean;
  title: string;
  message: string;
  onClose: () => void;
  onSelectOption1: () => void;
  option1Text: string;
  option1Icon?: string;
  onSelectOption2: () => void;
  option2Text: string;
  option2Icon?: string;
  cancelText?: string;
}

const SelectionModal = ({
  visible,
  title,
  message,
  onClose,
  onSelectOption1,
  option1Text,
  option1Icon = "create-outline",
  onSelectOption2,
  option2Text,
  option2Icon = "trash-outline",
  cancelText,
}: SelectionModalProps) => {
  const { t } = useTranslation();

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.alertBox}>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.message}>{message}</Text>

              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={styles.optionButton1}
                  onPress={onSelectOption1}
                  activeOpacity={0.85}
                >
                  <Ionicons
                    name={option1Icon}
                    size={18}
                    color={accent.onAccent}
                    style={styles.optionIcon}
                  />
                  <Text style={styles.optionText1}>{option1Text}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.optionButton2}
                  onPress={onSelectOption2}
                  activeOpacity={0.85}
                >
                  <Ionicons
                    name={option2Icon}
                    size={18}
                    color={colors.error}
                    style={styles.optionIcon}
                  />
                  <Text style={styles.optionText2}>{option2Text}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={onClose}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cancelText}>
                    {cancelText ?? t("common.cancel")}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.xxl,
  },
  alertBox: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: surfaces.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: surfaces.hairline,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.white,
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  message: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: spacing.xl,
    lineHeight: 20,
  },
  buttonContainer: {
    width: "100%",
    gap: spacing.sm,
  },
  optionButton1: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: radius.md,
    backgroundColor: accent.base,
  },
  optionText1: {
    color: accent.onAccent,
    fontSize: 15,
    fontWeight: "bold",
  },
  optionButton2: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: radius.md,
    backgroundColor: surfaces.raised,
    borderWidth: 1,
    borderColor: "rgba(231, 76, 60, 0.4)",
  },
  optionText2: {
    color: colors.error,
    fontSize: 15,
    fontWeight: "bold",
  },
  optionIcon: {
    marginRight: spacing.sm,
  },
  cancelButton: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: radius.md,
    alignItems: "center",
  },
  cancelText: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: "600",
  },
});

export default SelectionModal;
