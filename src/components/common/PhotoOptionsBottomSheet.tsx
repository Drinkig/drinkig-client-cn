import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { colors } from '../../constants/colors';

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
        style={[styles.sheetContainer, { transform: [{ translateY }] }]}
      >
        <View style={styles.header}>
          <Text style={styles.title}>프로필 사진 설정</Text>
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
            <Text style={styles.optionText}>라이브러리에서 선택</Text>
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
              color={hasProfileImage ? colors.error : "#666"}
              style={styles.icon}
            />
            <Text
              style={[
                styles.optionText,
                styles.deleteText,
                !hasProfileImage && styles.disabledText,
              ]}
            >
              기본 이미지로 변경
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
          <Text style={styles.cancelButtonText}>취소</Text>
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
    color: "#666",
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
