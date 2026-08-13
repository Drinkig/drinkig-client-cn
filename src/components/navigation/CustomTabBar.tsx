import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  LayoutChangeEvent,
} from "react-native";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useTranslation } from "react-i18next";
import { BlurView } from "@react-native-community/blur";
import LinearGradient from "react-native-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../../constants/colors";
import { surfaces, accent } from "../../constants/theme";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import Ionicons from "react-native-vector-icons/Ionicons";

const { width } = Dimensions.get("window");

// TAB BAR DIMENSIONS — floating glass pill
const TAB_BAR_SIDE_MARGIN = 16; // gap from each screen edge
const TAB_BAR_WIDTH = width - TAB_BAR_SIDE_MARGIN * 2;
const TAB_BAR_HEIGHT = 60;
const TAB_BAR_RADIUS = TAB_BAR_HEIGHT / 2; // full pill (30)
const TAB_BAR_BOTTOM_MIN = 12; // floor above the safe-area inset
const ACTIVE_PILL_HEIGHT = 48;
const CAMERA_BTN_SIZE = 56;
const CAMERA_BTN_OVERFLOW = 22; // how much it rises above the tab bar

// How many regular tabs on each side of the camera button
const LEFT_TABS = ["Home", "Feed"];
const RIGHT_TABS = ["MyWine", "Profile"];
const ALL_TABS = [...LEFT_TABS, ...RIGHT_TABS];

export const CustomTabBar = ({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [containerWidth, setContainerWidth] = useState(0);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const cameraScale = useRef(new Animated.Value(1)).current;

  const numRegularTabs = ALL_TABS.length; // 4
  const tabWidth =
    containerWidth > 0
      ? (containerWidth - CAMERA_BTN_SIZE) / numRegularTabs
      : 0;

  // Map route name to its visual position index (0-based among regular tabs)
  const getTabVisualIndex = (routeName: string) => {
    const idx = ALL_TABS.indexOf(routeName);
    return idx;
  };

  // Calculate slide target: left side tabs (0,1) sit in first half, right side tabs (2,3) after camera gap
  const getSlideTarget = (routeName: string) => {
    const idx = getTabVisualIndex(routeName);
    if (idx < LEFT_TABS.length) {
      return idx * tabWidth;
    } else {
      const rightIdx = idx - LEFT_TABS.length;
      return (
        LEFT_TABS.length * tabWidth + CAMERA_BTN_SIZE + rightIdx * tabWidth
      );
    }
  };

  useEffect(() => {
    if (tabWidth > 0) {
      const currentRoute = state.routes[state.index]?.name;
      const target = getSlideTarget(currentRoute);
      Animated.spring(slideAnim, {
        toValue: target,
        useNativeDriver: true,
        damping: 18,
        stiffness: 200,
        mass: 0.7,
      }).start();
    }
  }, [state.index, tabWidth]);

  const handleLayout = (e: LayoutChangeEvent) => {
    setContainerWidth(e.nativeEvent.layout.width);
  };

  // Camera FAB press animation
  const handleCameraPress = () => {
    Animated.sequence([
      Animated.timing(cameraScale, {
        toValue: 0.88,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(cameraScale, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start();
    (navigation as any).navigate("Camera");
  };

  const renderTab = (routeName: string) => {
    const route = state.routes.find((r) => r.name === routeName);
    if (!route) return null;
    const { options } = descriptors[route.key];
    const isFocused = state.routes[state.index]?.name === routeName;

    const label =
      typeof options.tabBarLabel === "string" ? options.tabBarLabel : routeName;

    const onPress = () => {
      const event = navigation.emit({
        type: "tabPress",
        target: route.key,
        canPreventDefault: true,
      });
      if (!isFocused && !event.defaultPrevented) {
        navigation.navigate(routeName);
      }
    };

    let iconName = "";
    let IconComponent: any = Ionicons;

    if (routeName === "Home") {
      iconName = isFocused ? "home" : "home-outline";
    } else if (routeName === "Feed") {
      iconName = isFocused ? "people" : "people-outline";
    } else if (routeName === "MyWine") {
      IconComponent = MaterialCommunityIcons;
      iconName = isFocused ? "bottle-wine" : "bottle-wine-outline";
    } else if (routeName === "Profile") {
      iconName = isFocused ? "person" : "person-outline";
    }

    const tint = isFocused ? accent.text : "#8A8F98";

    return (
      <TouchableOpacity
        key={route.key}
        accessibilityRole="button"
        accessibilityState={isFocused ? { selected: true } : {}}
        accessibilityLabel={options.tabBarAccessibilityLabel ?? label}
        onPress={onPress}
        style={styles.tabButton}
        activeOpacity={0.8}
      >
        <IconComponent name={iconName} size={23} color={tint} />
        <Text
          style={[styles.tabLabel, { color: tint }]}
          numberOfLines={1}
          allowFontScaling={false}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  const bottomOffset = Math.max(insets.bottom, TAB_BAR_BOTTOM_MIN);

  return (
    <View style={[styles.container, { bottom: bottomOffset }]}>
      {/* Bottom scrim: content scrolling behind the floating pill fades into the
          background instead of hard-stopping at the screen edge. */}
      <LinearGradient
        colors={["rgba(26,25,27,0)", "rgba(26,25,27,0.85)", colors.background]}
        locations={[0, 0.45, 1]}
        style={[styles.bottomScrim, { bottom: -bottomOffset }]}
        pointerEvents="none"
      />

      {/* Main tab bar */}
      <View style={styles.tabBarContainer}>
        <View style={styles.glassContainer}>
          <BlurView
            style={StyleSheet.absoluteFillObject}
            blurType="dark"
            blurAmount={32}
            reducedTransparencyFallbackColor={surfaces.card}
          />

          {/* Frosted-glass sheen: brighter at the top edge, fading down */}
          <LinearGradient
            colors={[
              "rgba(255,255,255,0.14)",
              "rgba(255,255,255,0.04)",
              "rgba(255,255,255,0.01)",
            ]}
            locations={[0, 0.5, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFillObject}
            pointerEvents="none"
          />

          {/* Tab buttons row with camera gap in center */}
          <View style={styles.tabButtonsContainer} onLayout={handleLayout}>
            {/* Sliding active highlight */}
            {tabWidth > 0 && (
              <Animated.View
                style={[
                  styles.activeBackground,
                  { width: tabWidth, transform: [{ translateX: slideAnim }] },
                ]}
              >
                <View style={styles.activePill} />
              </Animated.View>
            )}

            {/* Left tabs */}
            {LEFT_TABS.map(renderTab)}

            {/* Camera button placeholder gap */}
            <View style={styles.cameraGap} />

            {/* Right tabs */}
            {RIGHT_TABS.map(renderTab)}
          </View>
        </View>
      </View>

      {/* Floating camera button (raised above the tab bar) */}
      <Animated.View
        style={[
          styles.cameraButtonWrapper,
          { transform: [{ scale: cameraScale }] },
        ]}
      >
        <TouchableOpacity
          onPress={handleCameraPress}
          activeOpacity={0.85}
          style={styles.cameraButton}
          accessibilityRole="button"
          accessibilityLabel={t("tab.scan")}
        >
          <LinearGradient
            colors={["#CBABEC", accent.base, "#9B6FD4"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cameraGradient}
          >
            <Ionicons name="scan-outline" size={28} color={colors.white} />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
  },
  bottomScrim: {
    position: "absolute",
    left: 0,
    right: 0,
    top: -28,
  },
  tabBarContainer: {
    width: TAB_BAR_WIDTH,
    height: TAB_BAR_HEIGHT,
    borderRadius: TAB_BAR_RADIUS,
    alignItems: "center",
    justifyContent: "center",
    // Floating-pill shadow per spec: soft, lifts the bar off the screen.
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 10,
  },
  glassContainer: {
    width: "100%",
    height: "100%",
    borderRadius: TAB_BAR_RADIUS,
    overflow: "hidden",
    // Lighter translucent fill so the blur reads as frosted glass, not a dark box.
    backgroundColor: "rgba(58, 56, 64, 0.42)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },
  tabButtonsContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    gap: 2,
  },
  tabLabel: {
    fontSize: 10.5,
    fontWeight: "600",
    letterSpacing: -0.2,
  },
  cameraGap: {
    width: CAMERA_BTN_SIZE,
  },
  activeBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  activePill: {
    width: "84%",
    height: ACTIVE_PILL_HEIGHT,
    borderRadius: ACTIVE_PILL_HEIGHT / 2,
    // Soft purple tint per spec — reads as a frosted highlight on the glass.
    backgroundColor: "rgba(185,140,230,0.12)",
    borderWidth: 1,
    borderColor: "rgba(185,140,230,0.20)",
  },
  // Floating camera button
  cameraButtonWrapper: {
    position: "absolute",
    bottom: CAMERA_BTN_OVERFLOW,
    alignSelf: "center",
    shadowColor: accent.base,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
  },
  cameraButton: {
    width: CAMERA_BTN_SIZE,
    height: CAMERA_BTN_SIZE,
    borderRadius: CAMERA_BTN_SIZE / 2,
    overflow: "hidden",
  },
  cameraGradient: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
