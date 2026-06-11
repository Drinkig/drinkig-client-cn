import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { BlurView } from "@react-native-community/blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../../constants/colors";
import { surfaces } from "../../constants/theme";

export const HEADER_BASE_HEIGHT = 52;

/**
 * Shared translucent (frosted-glass) header used across screens so the
 * navigation chrome is consistent. Content is expected to scroll *underneath*
 * it — pad the scroll container's top by `useGlassHeaderHeight()`.
 */
export function useGlassHeaderHeight() {
  const insets = useSafeAreaInsets();
  return insets.top + HEADER_BASE_HEIGHT;
}

interface GlassHeaderProps {
  title?: string;
  left?: React.ReactNode;
  right?: React.ReactNode;
}

export default function GlassHeader({ title, left, right }: GlassHeaderProps) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.header,
        { height: insets.top + HEADER_BASE_HEIGHT, paddingTop: insets.top },
      ]}
    >
      <BlurView
        style={StyleSheet.absoluteFill}
        blurType="dark"
        blurAmount={18}
        reducedTransparencyFallbackColor={surfaces.card}
      />
      <View style={styles.row}>
        <View style={styles.side}>{left}</View>
        {title ? (
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
        ) : (
          <View style={styles.title} />
        )}
        <View style={[styles.side, styles.sideRight]}>{right}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    overflow: "hidden",
    borderBottomWidth: 1,
    borderBottomColor: surfaces.hairline,
  },
  row: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  side: {
    minWidth: 44,
    justifyContent: "center",
  },
  sideRight: {
    alignItems: "flex-end",
  },
  title: {
    flex: 1,
    textAlign: "center",
    fontSize: 17,
    fontWeight: "700",
    color: colors.white,
    letterSpacing: -0.2,
  },
});
