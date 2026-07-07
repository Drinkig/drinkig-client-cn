import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import Icon from "react-native-vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useUser } from "../context/UserContext";
import { useSubscription } from "../context/SubscriptionContext";
import { colors } from "../constants/colors";
import { useTranslation } from "react-i18next";
import GlassHeader from "../components/common/GlassHeader";
import { getWineTypeColor, WINE_TYPE_ON_COLOR } from "../constants/wineColors";

const COOLDOWN_DAYS = 7;
const RANK_BADGES = ["🥇", "🥈", "🥉"];

const RecommendationListScreen = () => {
  const navigation = useNavigation();
  const { recommendations, user } = useUser();
  const { checkFeature } = useSubscription();
  const { t, i18n } = useTranslation();
  const [cooldownRemaining, setCooldownRemaining] = useState<string | null>(
    null
  );

  const isPremium = checkFeature("tasteReset");

  const checkCooldown = useCallback(async () => {
    // Premium users have no cooldown
    if (isPremium) {
      setCooldownRemaining(null);
      return;
    }
    const lastReset = await AsyncStorage.getItem("lastTasteResetTime");
    if (!lastReset) {
      setCooldownRemaining(null);
      return;
    }
    const elapsed = Date.now() - new Date(lastReset).getTime();
    const cooldownMs = COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
    const remaining = cooldownMs - elapsed;
    if (remaining <= 0) {
      setCooldownRemaining(null);
    } else {
      const days = Math.floor(remaining / (24 * 60 * 60 * 1000));
      const hours = Math.floor(
        (remaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000)
      );
      if (days > 0) {
        setCooldownRemaining(t("recommendationList.cooldown", { days, hours }));
      } else {
        setCooldownRemaining(t("recommendationList.cooldownHours", { hours }));
      }
    }
  }, [t, isPremium]);

  useFocusEffect(
    useCallback(() => {
      checkCooldown();
      const interval = setInterval(checkCooldown, 60 * 1000);
      return () => clearInterval(interval);
    }, [checkCooldown])
  );

  const getWineTypeLabel = (type: string, lang: string) => {
    if (lang !== "en") return type;
    switch (type) {
      case "레드":
        return "Red";
      case "화이트":
        return "White";
      case "스파클링":
        return "Sparkling";
      case "로제":
        return "Rosé";
      case "디저트":
        return "Dessert";
      case "주정강화":
        return "Fortified";
      default:
        return type;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <GlassHeader
        floating={false}
        title={t("recommendationList.header")}
        left={
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon name="arrow-back" size={22} color={colors.white} />
          </TouchableOpacity>
        }
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.introContainer}>
          <Text style={styles.introTitle}>
            {t("recommendationList.title", {
              name: user?.nickname || t("recommendationList.defaultName"),
            })}
          </Text>
        </View>

        {recommendations && recommendations.length > 0 ? (
          <View style={styles.listContainer}>
            {recommendations.map((item, index) => (
              <View key={index} style={styles.recommendationCard}>
                <View style={styles.rankSection}>
                  {index < 3 ? (
                    <Text style={styles.rankEmoji}>{RANK_BADGES[index]}</Text>
                  ) : (
                    <Text style={styles.rankNumber}>{index + 1}</Text>
                  )}
                </View>

                <View style={styles.infoSection}>
                  <View style={styles.infoHeader}>
                    <View
                      style={[
                        styles.typeBadge,
                        { backgroundColor: getWineTypeColor(item.sort) },
                      ]}
                    >
                      <Text style={styles.typeText}>
                        {getWineTypeLabel(item.sort, i18n.language)}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.wineVariety}>
                    {i18n.language === "en"
                      ? item.varietyEng || item.variety
                      : item.variety}
                  </Text>
                  {item.varietyEng && i18n.language !== "en" && (
                    <Text style={styles.wineVarietyEng}>{item.varietyEng}</Text>
                  )}

                  <View style={{ height: 4 }} />

                  {i18n.language === "en" ? (
                    <Text style={styles.wineRegionEng}>
                      {item.countryEng || item.country}
                      {(item.countryEng || item.country) &&
                      (item.regionEng || item.region)
                        ? " · "
                        : ""}
                      {item.regionEng || item.region}
                    </Text>
                  ) : (
                    <>
                      <Text style={styles.wineRegion}>
                        {item.country} · {item.region}
                      </Text>
                      {(item.countryEng || item.regionEng) && (
                        <Text style={styles.wineRegionEng}>
                          {item.countryEng || ""}
                          {item.countryEng && item.regionEng ? " · " : ""}
                          {item.regionEng || ""}
                        </Text>
                      )}
                    </>
                  )}
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {t("recommendationList.empty")}
            </Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.resetCtaButton,
            isPremium && cooldownRemaining && styles.resetCtaButtonDisabled,
          ]}
          onPress={() => {
            if (isPremium) {
              navigation.navigate("TasteReset" as never);
            } else {
              navigation.navigate("Paywall" as never);
            }
          }}
          disabled={isPremium && !!cooldownRemaining}
        >
          <Text
            style={[
              styles.resetCtaText,
              isPremium && cooldownRemaining && styles.resetCtaTextDisabled,
            ]}
          >
            {isPremium && cooldownRemaining
              ? cooldownRemaining
              : t("recommendationList.resetButton")}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 90,
  },
  introContainer: {
    marginBottom: 32,
  },
  introTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.white,
    lineHeight: 34,
  },
  listContainer: {
    gap: 16,
  },
  recommendationCard: {
    flexDirection: "row",
    backgroundColor: "#1e1e1e",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
  },
  rankSection: {
    width: 50,
    alignItems: "center",
    justifyContent: "center",
    borderRightWidth: 1,
    borderRightColor: colors.border,
    marginRight: 16,
    paddingRight: 16,
  },
  rankEmoji: {
    fontSize: 28,
  },
  rankNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.textTertiary,
  },
  infoSection: {
    flex: 1,
  },
  infoHeader: {
    flexDirection: "row",
    marginBottom: 6,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  typeText: {
    color: WINE_TYPE_ON_COLOR,
    fontSize: 11,
    fontWeight: "bold",
  },
  wineVariety: {
    fontSize: 17,
    fontWeight: "bold",
    color: colors.white,
    marginBottom: 4,
  },
  wineRegion: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  wineVarietyEng: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
    fontStyle: "italic",
  },
  wineRegionEng: {
    fontSize: 12,
    color: colors.textTertiary,
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 16,
  },
  footer: {
    position: "absolute",
    bottom: 40,
    left: 24,
    right: 24,
  },
  resetCtaButton: {
    backgroundColor: colors.primary,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  resetCtaText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "bold",
  },
  resetCtaButtonDisabled: {
    backgroundColor: colors.surface2,
  },
  resetCtaTextDisabled: {
    color: colors.textSecondary,
    fontSize: 14,
  },
});

export default RecommendationListScreen;
