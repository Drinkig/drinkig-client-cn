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

export interface MenuOption {
  label: string;
  icon?: string;
  onPress: () => void;
  isDestructive?: boolean;
}

interface MenuBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  options: MenuOption[];
}

const MenuBottomSheet = ({
  visible,
  onClose,
  title,
  options,
}: MenuBottomSheetProps) => {
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
          { paddingBottom: 16 + insets.bottom },
          { transform: [{ translateY }] },
        ]}
      >
        {title && (
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
          </View>
        )}

        <View style={styles.optionsContainer}>
          {options.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={styles.optionButton}
              onPress={() => {
                onClose();
                // Close animation takes some time, but we might want to trigger action immediately or after close
                // Usually better to trigger after close or concurrently
                setTimeout(() => {
                  option.onPress();
                }, 200);
              }}
            >
              <Ionicons
                name={option.icon || "ellipse-outline"}
                size={24}
                color={option.isDestructive ? colors.error : colors.white}
                style={styles.icon}
              />
              <Text
                style={[
                  styles.optionText,
                  option.isDestructive && styles.deleteText,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
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
    zIndex: 1000,
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

export default MenuBottomSheet;
