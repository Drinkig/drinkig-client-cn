import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import LinearGradient from "react-native-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import { colors } from "../../constants/colors";
import { useSubscription } from "../../context/SubscriptionContext";
import { RootStackParamList } from "../../types";

const EXPIRY_WARNING_DAYS = 3;

export const SubscriptionExpiryBanner = () => {
  const { t } = useTranslation();
  const { isPremium, expiresAt, status } = useSubscription();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const getDaysUntilExpiry = (): number | null => {
    if (!expiresAt) return null;
    try {
      const now = new Date();
      const expiry = new Date(expiresAt);
      const diffMs = expiry.getTime() - now.getTime();
      return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    } catch {
      return null;
    }
  };

  const daysLeft = getDaysUntilExpiry();

  // Show banner if: premium + expiring within 3 days, OR already expired
  const isExpiringSoon =
    isPremium &&
    daysLeft !== null &&
    daysLeft <= EXPIRY_WARNING_DAYS &&
    daysLeft > 0;
  const isExpired =
    status === "EXPIRED" || (daysLeft !== null && daysLeft <= 0);

  if (!isExpiringSoon && !isExpired) return null;

  const getMessage = (): string => {
    if (isExpired) {
      return t("home.expiryBanner.expired");
    }
    if (daysLeft === 1) {
      return t("home.expiryBanner.tomorrow");
    }
    return t("home.expiryBanner.daysLeft", { days: daysLeft });
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.banner}
        onPress={() => navigation.navigate("Paywall" as never)}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={isExpired ? ["#8B1A1A", "#4A0E0E"] : ["#B45309", "#78350F"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.iconContainer}>
          <Icon
            name={isExpired ? "alert-circle" : "time-outline"}
            size={22}
            color={colors.white}
          />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.message}>{getMessage()}</Text>
          <Text style={styles.cta}>{t("home.expiryBanner.cta")}</Text>
        </View>
        <Icon name="chevron-forward" size={18} color="rgba(255,255,255,0.6)" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    padding: 14,
    overflow: "hidden",
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  message: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.white,
    marginBottom: 2,
  },
  cta: {
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
    fontWeight: "500",
  },
});
