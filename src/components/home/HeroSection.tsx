import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import Icon from "react-native-vector-icons/Ionicons";
import { colors } from "../../constants/colors";
import { spacing, radius, surfaces, accent } from "../../constants/theme";

import { useTranslation } from "react-i18next";

interface HeroSectionProps {
  onPress: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onPress }) => {
  const { t } = useTranslation();

  return (
    <View style={styles.card}>
      {/* A single soft accent wash for depth — the only gradient on the card. */}
      <LinearGradient
        colors={[accent.soft, "transparent"]}
        start={{ x: 1, y: 0 }}
        end={{ x: 0.1, y: 0.9 }}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />

      <Image
        source={require("../../assets/onboarding/Drinky_onboarding_3.png")}
        style={styles.image}
        resizeMode="contain"
      />

      <View style={styles.textContainer}>
        <Text
          style={styles.title}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.75}
        >
          {t("home.hero.title")}
        </Text>
        <Text style={styles.subtitle} numberOfLines={2}>
          {t("home.hero.subtitle")}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={onPress}
        activeOpacity={0.85}
      >
        <Icon name="chatbubble-ellipses" size={16} color={accent.onAccent} />
        <Text style={styles.buttonText}>{t("home.hero.button")}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
    borderRadius: radius.xl,
    padding: spacing.xxl,
    height: 196,
    overflow: "hidden",
    backgroundColor: surfaces.card,
    borderWidth: 1,
    borderColor: surfaces.hairline,
    justifyContent: "space-between",
  },
  textContainer: {
    zIndex: 2,
    paddingRight: 100,
  },
  title: {
    fontSize: 23,
    fontWeight: "700",
    color: colors.textPrimary,
    letterSpacing: -0.4,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 19,
    fontWeight: "500",
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: accent.base,
    paddingVertical: 11,
    paddingHorizontal: 20,
    borderRadius: radius.pill,
    zIndex: 2,
    gap: 7,
  },
  buttonText: {
    color: accent.onAccent,
    fontWeight: "700",
    fontSize: 14,
    letterSpacing: 0.2,
  },
  image: {
    position: "absolute",
    right: -14,
    bottom: -16,
    width: 184,
    height: 184,
    opacity: 0.95,
    zIndex: 1,
  },
});
