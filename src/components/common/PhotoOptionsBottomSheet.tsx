import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import Ionicons from "react-native-vector-icons/Ionicons";
import { colors } from "../../constants/colors";

interface PhotoOptionsBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelectLibrary: () => void;
  onDelete: () => void;
  hasProfileImage: boolean;
}

const PhotoOptionsBottomSheet = ({
  visible,
  onClose,
  onSelectLibrary,
  onDelete,
  hasProfileImage,
}: PhotoOptionsBottomSheetProps) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [isVisible, setIsVisible] = useState(visible);
  const animation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setIsVisible(true);
      Animated.timing(animation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(animation, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        setIsVisible(false);
      });
    }
  }, [visible, animation]);

  if (!isVisible) return null;

  const backdropOpacity = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.5],
  });

  const translateY = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [300, 0],
  });

  return (
    <View style={styles.overlay}>
      <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      <Animated.View
        style={[
          styles.sheetContainer,
          // 홈 인디케이터/제스처 영역과 겹치지 않게 하단 inset 반영
          { paddingBottom: 20 + insets.bottom },
          { transform: [{ translateY }] },
        ]}
      >
        <View style={styles.header}>
          <Text style={styles.title}>{t("photoOptions.title")}</Text>
        </View>

        <View style={styles.optionsContainer}>
          <TouchableOpacity
            style={styles.optionButton}
            onPress={() => {
              onClose();
              setTimeout(() => {
                onSelectLibrary();
              }, 300);
            }}
          >
            <Ionicons
              name="images-outline"
              size={24}
              color={colors.white}
              style={styles.icon}
            />
            <Text style={styles.optionText}>
              {t("photoOptions.selectLibrary")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.optionButton,
              !hasProfileImage && styles.disabledButton,
            ]}
            onPress={() => {
              if (hasProfileImage) {
                onDelete();
                onClose();
              }
            }}
            disabled={!hasProfileImage}
          >
            <Ionicons
              name="trash-outline"
              size={24}
              color={hasProfileImage ? colors.error : colors.textTertiary}
              style={styles.icon}
            />
            <Text
              style={[
                styles.optionText,
                styles.deleteText,
                !hasProfileImage && styles.disabledText,
              ]}
            >
              {t("photoOptions.resetToDefault")}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
          <Text style={styles.cancelButtonText}>{t("common.cancel")}</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "flex-end",
  },
  backdrop: {
    flex: 1,
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.black,
  },
  sheetContainer: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.white,
  },
  optionsContainer: {
    marginBottom: 20,
  },
  optionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  disabledButton: {
    opacity: 0.5,
  },
  icon: {
    marginRight: 16,
  },
  optionText: {
    fontSize: 16,
    color: colors.white,
    fontWeight: "500",
  },
  deleteText: {
    color: colors.error,
  },
  disabledText: {
    color: colors.textTertiary,
  },
  cancelButton: {
    backgroundColor: colors.border,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 10,
  },
  cancelButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default PhotoOptionsBottomSheet;
