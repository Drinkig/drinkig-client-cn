import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useGlobalUI, ToastType } from '../context/GlobalUIContext';
import { colors } from '../constants/colors';

const ICON_BY_TYPE: Record<ToastType, { name: string; color: string }> = {
  info: { name: 'information-circle', color: colors.white },
  success: { name: 'checkmark-circle', color: '#4CD964' },
  error: { name: 'alert-circle', color: '#FF6B6B' },
};

const GlobalToast = () => {
  const { toast, hideToast } = useGlobalUI();
  const anim = useRef(new Animated.Value(0)).current;
  const toastRef = useRef(toast);
  toastRef.current = toast;

  useEffect(() => {
    if (!toast) return;

    anim.setValue(0);
    const currentId = toast.id;

    Animated.sequence([
      Animated.timing(anim, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.delay(toast.duration),
      Animated.timing(anim, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start(({ finished }) => {
      if (finished && toastRef.current?.id === currentId) {
        const onHide = toastRef.current?.onHide;
        hideToast();
        onHide?.();
      }
    });
  }, [toast?.id]);

  if (!toast) return null;

  const icon = ICON_BY_TYPE[toast.type];

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.container,
        {
          opacity: anim,
          transform: [
            {
              translateY: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              }),
            },
          ],
        },
      ]}
    >
      <View style={styles.bubble}>
        <Ionicons name={icon.name} size={18} color={icon.color} style={styles.icon} />
        <Text style={styles.text} numberOfLines={3}>
          {toast.message}
        </Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 80,
    alignItems: 'center',
    zIndex: 9999,
  },
  bubble: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: '86%',
    backgroundColor: colors.surface2,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  icon: {
    marginRight: 8,
  },
  text: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
    flexShrink: 1,
  },
});

export default GlobalToast;
