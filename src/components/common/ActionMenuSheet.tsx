import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { colors } from "../../constants/colors";
import { spacing, radius, surfaces } from "../../constants/theme";

export interface MenuAction {
  label: string;
  icon?: string;
  destructive?: boolean;
  onPress: () => void;
}

interface ActionMenuSheetProps {
  visible: boolean;
  onClose: () => void;
  actions: MenuAction[];
  cancelLabel: string;
}

/**
 * Lightweight bottom action sheet — a list of actions plus a cancel button.
 * Used for the "···" overflow menu (e.g. tasting note delete/edit).
 */
const ActionMenuSheet = ({
  visible,
  onClose,
  actions,
  cancelLabel,
}: ActionMenuSheetProps) => {
  const [isVisible, setIsVisible] = useState(visible);
  const animation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setIsVisible(true);
      Animated.timing(animation, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(animation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => setIsVisible(false));
    }
  }, [visible, animation]);

  if (!isVisible) return null;

  const backdropOpacity = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.5],
  });
  const translateY = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [320, 0],
  });

  return (
    <View style={styles.overlay}>
      <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
        <View style={styles.actions}>
          {actions.map((action, index) => (
            <TouchableOpacity
              key={action.label}
              style={[styles.actionButton, index > 0 && styles.actionDivider]}
              onPress={() => {
                onClose();
                setTimeout(action.onPress, 250);
              }}
            >
              {action.icon ? (
                <Ionicons
                  name={action.icon}
                  size={22}
                  color={action.destructive ? colors.error : colors.textPrimary}
                  style={styles.actionIcon}
                />
              ) : null}
              <Text
                style={[
                  styles.actionText,
                  action.destructive && styles.destructiveText,
                ]}
              >
                {action.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
          <Text style={styles.cancelText}>{cancelLabel}</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
    zIndex: 1000,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.black,
  },
  sheet: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    paddingTop: spacing.sm,
  },
  actions: {
    backgroundColor: surfaces.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: surfaces.hairline,
    overflow: "hidden",
    marginBottom: spacing.md,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  actionDivider: {
    borderTopWidth: 1,
    borderTopColor: surfaces.hairline,
  },
  actionIcon: {
    marginRight: spacing.md,
  },
  actionText: {
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: "500",
  },
  destructiveText: {
    color: colors.error,
  },
  cancelButton: {
    backgroundColor: surfaces.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: surfaces.hairline,
    paddingVertical: spacing.lg,
    alignItems: "center",
  },
  cancelText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "700",
  },
});

export default ActionMenuSheet;
