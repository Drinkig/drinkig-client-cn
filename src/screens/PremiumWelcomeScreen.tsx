import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Easing,
  Image,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/Ionicons";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import LinearGradient from "react-native-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { colors } from "../constants/colors";
import { useSubscription } from "../context/SubscriptionContext";

const PARTICLE_COUNT = 18;
const PARTICLE_COLORS = [
  "#FFD700",
  "#FF6B9D",
  colors.primary,
  "#A78BFA",
  "#34D399",
  "#F472B6",
  "#FBBF24",
  "#818CF8",
];

interface Particle {
  x: Animated.Value;
  y: Animated.Value;
  opacity: Animated.Value;
  scale: Animated.Value;
  rotate: Animated.Value;
  color: string;
  size: number;
  startX: number;
  isCircle: boolean;
}

const PremiumWelcomeScreen = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { expiresAt } = useSubscription();
  const { width: SCREEN_W, height: SCREEN_H } = useWindowDimensions();

  const features = [
    { icon: "scan-outline", label: t("premiumWelcome.feature.scan") },
    { icon: "list-outline", label: t("premiumWelcome.feature.menuScan") },
    { icon: "restaurant-outline", label: t("premiumWelcome.feature.pairing") },
    {
      icon: "heart-pulse",
      label: t("premiumWelcome.feature.compat"),
      isMCI: true,
    },
    {
      icon: "document-text-outline",
      label: t("premiumWelcome.feature.report"),
    },
    { icon: "refresh-outline", label: t("premiumWelcome.feature.reset") },
  ];

  // -- Animations --
  const heroScale = useRef(new Animated.Value(0)).current;
  const heroOpacity = useRef(new Animated.Value(0)).current;
  const badgeAnim = useRef(new Animated.Value(0)).current;
  const titleAnim = useRef(new Animated.Value(0)).current;
  const gridAnims = useRef(features.map(() => new Animated.Value(0))).current;
  const ctaAnim = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  // Confetti particles
  const particles = useRef<Particle[]>(
    Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
      x: new Animated.Value(0),
      y: new Animated.Value(0),
      opacity: new Animated.Value(0),
      scale: new Animated.Value(0),
      rotate: new Animated.Value(0),
      color: PARTICLE_COLORS[i % PARTICLE_COLORS.length],
      size: 6 + Math.random() * 8,
      startX: Math.random() * SCREEN_W,
      isCircle: Math.random() > 0.5,
    }))
  ).current;

  useEffect(() => {
    // 1) Hero entrance
    Animated.parallel([
      Animated.spring(heroScale, {
        toValue: 1,
        tension: 60,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(heroOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();

    // 2) Badge slide-in
    Animated.timing(badgeAnim, {
      toValue: 1,
      duration: 500,
      delay: 300,
      easing: Easing.out(Easing.back(1.4)),
      useNativeDriver: true,
    }).start();

    // 3) Title
    Animated.timing(titleAnim, {
      toValue: 1,
      duration: 400,
      delay: 500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    // 4) Grid items pop in
    Animated.stagger(
      70,
      gridAnims.map((anim, i) =>
        Animated.spring(anim, {
          toValue: 1,
          tension: 80,
          friction: 8,
          delay: 650 + i * 30,
          useNativeDriver: true,
        })
      )
    ).start();

    // 5) CTA
    Animated.timing(ctaAnim, {
      toValue: 1,
      duration: 400,
      delay: 1000,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    // 6) CTA shimmer
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1400,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.delay(2000),
      ])
    ).start();

    // 8) Confetti burst
    particles.forEach((p, i) => {
      const delay = 200 + Math.random() * 400;
      const duration = 2000 + Math.random() * 1500;
      const spreadX = (Math.random() - 0.5) * SCREEN_W * 0.8;

      Animated.parallel([
        Animated.timing(p.y, {
          toValue: SCREEN_H * 0.7,
          duration,
          delay,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(p.x, {
          toValue: spreadX,
          duration,
          delay,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(p.opacity, {
            toValue: 1,
            duration: 200,
            delay,
            useNativeDriver: true,
          }),
          Animated.timing(p.opacity, {
            toValue: 0,
            duration: duration * 0.4,
            delay: delay + duration * 0.5,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(p.scale, {
          toValue: 1,
          duration: 300,
          delay,
          easing: Easing.out(Easing.back(2)),
          useNativeDriver: true,
        }),
        Animated.timing(p.rotate, {
          toValue: Math.random() * 4 - 2,
          duration,
          delay,
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, []);

  const formatExpiryDate = (): string => {
    if (!expiresAt) return "";
    try {
      const date = new Date(expiresAt);
      return t("premiumWelcome.expiresAt", {
        date: date.toLocaleDateString(),
      });
    } catch {
      return "";
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#1A0A2E", colors.primaryDark, "#2D0845", colors.background]}
        locations={[0, 0.25, 0.5, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Confetti particles */}
      {particles.map((p, i) => (
        <Animated.View
          key={i}
          pointerEvents="none"
          style={[
            styles.particle,
            {
              left: p.startX,
              top: -20,
              width: p.size,
              height: p.isCircle ? p.size : p.size * 1.6,
              borderRadius: p.isCircle ? p.size / 2 : 2,
              backgroundColor: p.color,
              opacity: p.opacity,
              transform: [
                { translateX: p.x },
                { translateY: p.y },
                { scale: p.scale },
                {
                  rotate: p.rotate.interpolate({
                    inputRange: [-2, 2],
                    outputRange: ["-720deg", "720deg"],
                  }),
                },
              ],
            },
          ]}
        />
      ))}

      <ScrollView
        style={[styles.content, { paddingTop: insets.top + 16 }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          {/* Character */}
          <Animated.View
            style={[
              styles.characterWrap,
              {
                opacity: heroOpacity,
                transform: [{ scale: heroScale }],
              },
            ]}
          >
            <Image
              source={require("../assets/wish_list.png")}
              style={styles.characterImage}
              resizeMode="contain"
            />
          </Animated.View>

          {/* PREMIUM badge */}
          <Animated.View
            style={[
              styles.premiumBadge,
              {
                opacity: badgeAnim,
                transform: [
                  {
                    translateY: badgeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [12, 0],
                    }),
                  },
                  {
                    scale: badgeAnim,
                  },
                ],
              },
            ]}
          >
            <LinearGradient
              colors={[colors.primary, colors.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFillObject}
            />
            <Text style={styles.premiumBadgeText}>PREMIUM</Text>
          </Animated.View>

          {/* Title & subtitle */}
          <Animated.View
            style={[
              styles.titleBlock,
              {
                opacity: titleAnim,
                transform: [
                  {
                    translateY: titleAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [16, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <Text style={styles.title}>{t("premiumWelcome.title")}</Text>
            <Text style={styles.subtitle}>{t("premiumWelcome.subtitle")}</Text>
          </Animated.View>
        </View>

        {/* Feature Grid 2x3 */}
        <View style={styles.gridContainer}>
          <View style={styles.grid}>
            {features.map((f, i) => {
              const scale = gridAnims[i].interpolate({
                inputRange: [0, 1],
                outputRange: [0.5, 1],
              });
              return (
                <Animated.View
                  key={i}
                  style={[
                    styles.gridItem,
                    {
                      opacity: gridAnims[i],
                      transform: [{ scale }],
                    },
                  ]}
                >
                  <LinearGradient
                    colors={[colors.surface1, colors.surface2]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFillObject}
                  />
                  <View style={styles.gridIconWrap}>
                    {f.isMCI ? (
                      <MaterialCommunityIcons
                        name={f.icon}
                        size={24}
                        color={colors.primary}
                      />
                    ) : (
                      <Icon name={f.icon} size={24} color={colors.primary} />
                    )}
                  </View>
                  <Text style={styles.gridLabel} numberOfLines={1}>
                    {f.label}
                  </Text>
                </Animated.View>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* CTA — 하단 고정 */}
      <Animated.View
        style={[
          styles.ctaSection,
          {
            paddingBottom: insets.bottom + 16,
            opacity: ctaAnim,
            transform: [
              {
                translateY: ctaAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [30, 0],
                }),
              },
            ],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
          {/* Shimmer */}
          <Animated.View
            pointerEvents="none"
            style={[
              styles.ctaShimmer,
              {
                transform: [
                  {
                    translateX: shimmerAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-SCREEN_W * 0.5, SCREEN_W],
                    }),
                  },
                  { rotate: "18deg" },
                ],
              },
            ]}
          >
            <LinearGradient
              colors={[
                "rgba(255,255,255,0)",
                "rgba(255,255,255,0.25)",
                "rgba(255,255,255,0)",
              ]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={StyleSheet.absoluteFillObject}
            />
          </Animated.View>
          <Text style={styles.ctaText}>{t("premiumWelcome.cta")}</Text>
        </TouchableOpacity>
        {expiresAt && (
          <Text style={styles.expiryText}>{formatExpiryDate()}</Text>
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  particle: {
    position: "absolute",
    zIndex: 10,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 140,
  },
  // -- Hero --
  heroSection: {
    alignItems: "center",
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  characterWrap: {
    width: 160,
    height: 160,
    justifyContent: "center",
    alignItems: "center",
  },
  characterImage: {
    width: 160,
    height: 160,
  },
  premiumBadge: {
    marginTop: 10,
    paddingHorizontal: 20,
    paddingVertical: 5,
    borderRadius: 20,
    overflow: "hidden",
  },
  premiumBadgeText: {
    fontSize: 14,
    fontWeight: "900",
    color: colors.white,
    letterSpacing: 3,
  },
  titleBlock: {
    alignItems: "center",
    marginTop: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.white,
    textAlign: "center",
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginTop: 6,
  },
  expiryText: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 12,
    marginBottom: 4,
  },
  // -- Grid --
  gridContainer: {
    paddingHorizontal: 20,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 10,
  },
  gridItem: {
    width: "48%",
    alignItems: "center",
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
  },
  gridIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(142, 68, 173, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
    marginBottom: 8,
  },
  gridLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textSecondary,
    textAlign: "center",
  },
  // -- CTA --
  ctaSection: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  ctaButton: {
    height: 56,
    borderRadius: 28,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 12,
  },
  ctaShimmer: {
    position: "absolute",
    top: -20,
    bottom: -20,
    width: "35%",
  },
  ctaText: {
    fontSize: 17,
    fontWeight: "800",
    color: colors.white,
    letterSpacing: 0.5,
  },
});

export default PremiumWelcomeScreen;
