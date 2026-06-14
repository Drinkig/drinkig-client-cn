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
  /**
   * `true` (default): absolute, frosted-glass header that floats over content
   * scrolling underneath — pad the scroll container by `useGlassHeaderHeight()`.
   * `false`: renders in normal layout flow (for SafeAreaView screens with a
   * plain header at the top of the tree). Same visual language, no blur, no
   * status-bar inset — drop it in place of a hand-rolled `<View>` header.
   */
  floating?: boolean;
}

export default function GlassHeader({
  title,
  left,
  right,
  floating = true,
}: GlassHeaderProps) {
  const insets = useSafeAreaInsets();
  const topPad = floating ? insets.top : 0;
  return (
    <View
      style={[
        styles.header,
        floating ? styles.floating : styles.inFlow,
        { height: topPad + HEADER_BASE_HEIGHT, paddingTop: topPad },
      ]}
    >
      {floating && (
        <BlurView
          style={StyleSheet.absoluteFill}
          blurType="dark"
          blurAmount={18}
          reducedTransparencyFallbackColor={surfaces.card}
        />
      )}
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
    overflow: "hidden",
    borderBottomWidth: 1,
    borderBottomColor: surfaces.hairline,
  },
  floating: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
  },
  inFlow: {
    backgroundColor: surfaces.base,
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
