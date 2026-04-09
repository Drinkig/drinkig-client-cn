import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Platform,
  Animated,
  Easing,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/Ionicons";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import LinearGradient from "react-native-linear-gradient";
import {
  initConnection,
  getSubscriptions,
  requestSubscription,
  getAvailablePurchases,
  finishTransaction,
  Subscription,
  SubscriptionPurchase,
  purchaseUpdatedListener,
  purchaseErrorListener,
  PurchaseError,
} from "react-native-iap";
import { colors } from "../constants/colors";
import { useSubscription } from "../context/SubscriptionContext";
import { useGlobalUI } from "../context/GlobalUIContext";
import { redeemPromoCode, verifyReceipt } from "../api/subscription";

const PRODUCT_IDS = Platform.select({
  ios: ["com.drinkig.premium.monthly.v2", "com.drinkig.premium.yearly.v2"],
  default: [],
});

type PlanType = "MONTHLY" | "YEARLY";

const PaywallScreen = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { refreshSubscription } = useSubscription();
  const { showToast } = useGlobalUI();
  const insets = useSafeAreaInsets();

  const [selectedPlan, setSelectedPlan] = useState<PlanType>("YEARLY");
  const [promoCode, setPromoCode] = useState("");
  const [showPromoInput, setShowPromoInput] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRedeemingPromo, setIsRedeemingPromo] = useState(false);
  const [products, setProducts] = useState<Subscription[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);

  useEffect(() => {
    let purchaseUpdateSubscription: any;
    let purchaseErrorSubscription: any;
    let iapAvailable = false;

    const init = async () => {
      try {
        await initConnection();
        iapAvailable = true;

        // Only register listeners after successful connection
        purchaseUpdateSubscription = purchaseUpdatedListener(
          async (purchase: SubscriptionPurchase) => {
            try {
              const transactionId = purchase.transactionId || "";
              const originalTransactionId =
                purchase.originalTransactionIdentifierIOS || transactionId;
              const productId = purchase.productId;

              await verifyReceipt(
                transactionId,
                originalTransactionId,
                productId
              );
              await finishTransaction({ purchase, isConsumable: false });
              await refreshSubscription();

              setIsProcessing(false);
              showToast(t("paywall.subscribeSuccess"), {
                type: "success",
                onHide: () => navigation.goBack(),
              });
            } catch (error) {
              console.error("Purchase verification failed:", error);
              setIsProcessing(false);
              showToast(t("paywall.verifyFailed"), { type: "error" });
            }
          }
        );

        purchaseErrorSubscription = purchaseErrorListener(
          (error: PurchaseError) => {
            setIsProcessing(false);
            if (error.code !== "E_USER_CANCELLED") {
              showToast(error.message || t("paywall.purchaseFailed"), {
                type: "error",
              });
            }
          }
        );

        const subs = await getSubscriptions({ skus: PRODUCT_IDS! });
        setProducts(subs);
      } catch (error) {
        console.warn(
          "IAP not available (simulator or unsupported device):",
          error
        );
      } finally {
        setIsLoadingProducts(false);
      }
    };

    init();

    return () => {
      purchaseUpdateSubscription?.remove();
      purchaseErrorSubscription?.remove();
    };
  }, []);

  const getProductId = (plan: PlanType): string => {
    return plan === "YEARLY"
      ? "com.drinkig.premium.yearly.v2"
      : "com.drinkig.premium.monthly.v2";
  };

  const handlePurchase = async () => {
    const productId = getProductId(selectedPlan);
    const product = products.find((p) => p.productId === productId);

    if (!product) {
      showToast(t("paywall.productNotFound"), { type: "error" });
      return;
    }

    setIsProcessing(true);
    try {
      await requestSubscription({ sku: productId });
      // Result handled in purchaseUpdatedListener
    } catch (error) {
      setIsProcessing(false);
    }
  };

  const handleRestore = async () => {
    setIsProcessing(true);
    try {
      const purchases = await getAvailablePurchases();
      if (purchases.length === 0) {
        showToast(t("paywall.restoreEmptyMessage"), { type: "info" });
        setIsProcessing(false);
        return;
      }

      // Find the latest subscription purchase
      const latestPurchase = purchases
        .filter((p) => PRODUCT_IDS!.includes(p.productId))
        .sort((a, b) => (b.transactionDate || 0) - (a.transactionDate || 0))[0];

      if (latestPurchase) {
        const transactionId = latestPurchase.transactionId || "";
        const originalTransactionId =
          latestPurchase.originalTransactionIdentifierIOS || transactionId;

        await verifyReceipt(
          transactionId,
          originalTransactionId,
          latestPurchase.productId
        );
        await refreshSubscription();

        showToast(t("paywall.restoreSuccessMessage"), {
          type: "success",
          onHide: () => navigation.goBack(),
        });
      } else {
        showToast(t("paywall.restoreEmptyMessage"), { type: "info" });
      }
    } catch (error) {
      console.error("Restore failed:", error);
      showToast(t("paywall.restoreFailed"), { type: "error" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRedeemPromo = async () => {
    if (!promoCode.trim()) return;

    setIsRedeemingPromo(true);
    try {
      const response = await redeemPromoCode(promoCode.trim());
      if (response.isSuccess && response.result.success) {
        await refreshSubscription();
        showToast(t("paywall.promoSuccessMessage"), {
          type: "success",
          onHide: () => navigation.goBack(),
        });
      } else {
        showToast(response.message, { type: "error" });
      }
    } catch (error: any) {
      const message =
        error.response?.data?.message || t("paywall.promoErrorGeneric");
      showToast(message, { type: "error" });
    } finally {
      setIsRedeemingPromo(false);
    }
  };

  const getDisplayPrice = (plan: PlanType): string | null => {
    const productId = getProductId(plan);
    const product = products.find((p) => p.productId === productId);
    if (!product) return null;
    return (product as any).localizedPrice ?? null;
  };

  // Fallback prices (KRW) matching the i18n defaults
  const MONTHLY_FALLBACK_PRICE = 5900;
  const YEARLY_FALLBACK_PRICE = 39000;

  const getNumericPrice = (plan: PlanType): number => {
    const productId = getProductId(plan);
    const product = products.find((p) => p.productId === productId);
    const priceStr = (product as any)?.price;
    const n = priceStr ? parseFloat(priceStr) : NaN;
    if (!isNaN(n) && n > 0) return n;
    return plan === "YEARLY" ? YEARLY_FALLBACK_PRICE : MONTHLY_FALLBACK_PRICE;
  };

  const getCurrencyCode = (): string => {
    const product =
      products.find((p) => p.productId === getProductId("YEARLY")) ||
      products.find((p) => p.productId === getProductId("MONTHLY"));
    return (product as any)?.currency || "KRW";
  };

  const formatPrice = (amount: number): string => {
    const currency = getCurrencyCode();
    try {
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
      }).format(amount);
    } catch {
      return `₩${Math.round(amount).toLocaleString("ko-KR")}`;
    }
  };

  const monthlyNum = getNumericPrice("MONTHLY");
  const yearlyNum = getNumericPrice("YEARLY");
  const yearlyOriginal = monthlyNum * 12;
  const saveAmount = Math.max(0, yearlyOriginal - yearlyNum);
  const savePercent =
    yearlyOriginal > 0 ? Math.round((saveAmount / yearlyOriginal) * 100) : 0;
  const monthlyEquivalent = yearlyNum / 12;
  const hasDiscount = savePercent > 0;

  const coreFeatures = [
    { icon: "scan-outline", text: t("paywall.feature.unlimitedLabelScan") },
    { icon: "list-outline", text: t("paywall.feature.wineListScan") },
    { icon: "restaurant-outline", text: t("paywall.feature.foodPairing") },
    {
      icon: "heart-pulse",
      text: t("paywall.feature.compatibility"),
      isMCI: true,
    },
  ];

  const extraFeatures = [
    {
      icon: "document-text-outline",
      text: t("paywall.feature.compatibilityReport"),
    },
    { icon: "refresh-outline", text: t("paywall.feature.tasteReset") },
  ];

  // Sequential fade-in animations for feature rows (100ms stagger)
  const featureAnimsRef = useRef(
    [...coreFeatures, ...extraFeatures].map(() => new Animated.Value(0))
  );
  useEffect(() => {
    const anims = featureAnimsRef.current.map((v, i) =>
      Animated.timing(v, {
        toValue: 1,
        duration: 320,
        delay: 120 + i * 100,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      })
    );
    Animated.stagger(0, anims).start();
  }, []);

  // Diagonal shimmer sweep across CTA button
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const [ctaWidth, setCtaWidth] = useState(0);
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1400,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.delay(1600),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [shimmerAnim]);

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-ctaWidth * 0.6, ctaWidth],
  });

  const renderFeatureRow = (
    feature: { icon: string; text: string; isMCI?: boolean },
    index: number
  ) => {
    const anim = featureAnimsRef.current[index];
    const translateY = anim.interpolate({
      inputRange: [0, 1],
      outputRange: [8, 0],
    });
    return (
      <Animated.View
        key={index}
        style={[
          styles.featureRow,
          { opacity: anim, transform: [{ translateY }] },
        ]}
      >
        <View style={styles.featureIconContainer}>
          {feature.isMCI ? (
            <MaterialCommunityIcons
              name={feature.icon}
              size={20}
              color={colors.primary}
            />
          ) : (
            <Icon name={feature.icon} size={20} color={colors.primary} />
          )}
        </View>
        <Text style={styles.featureText}>{feature.text}</Text>
      </Animated.View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.closeButton}
        >
          <Icon name="close" size={28} color={colors.white} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleSection}>
          <Text style={styles.title}>{t("paywall.title")}</Text>
          <Text style={styles.subtitle}>{t("paywall.subtitle")}</Text>
        </View>

        <View style={styles.featuresSection}>
          {coreFeatures.map((feature, index) =>
            renderFeatureRow(feature, index)
          )}
        </View>

        <View style={styles.extraFeaturesSection}>
          <Text style={styles.extraFeaturesTitle}>
            {t("paywall.moreBenefitsTitle")}
          </Text>
          {extraFeatures.map((feature, index) =>
            renderFeatureRow(feature, coreFeatures.length + index)
          )}
        </View>

        <View style={styles.planSection}>
          <TouchableOpacity
            style={[
              styles.planCard,
              selectedPlan === "YEARLY" && styles.planCardSelected,
            ]}
            onPress={() => setSelectedPlan("YEARLY")}
          >
            {selectedPlan === "YEARLY" && (
              <LinearGradient
                colors={[colors.primaryDark, "#4A086B"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFillObject}
              />
            )}
            <View style={styles.planBadgeRow}>
              <Text style={styles.planBestBadge}>{t("paywall.bestBadge")}</Text>
              {hasDiscount && (
                <Text style={styles.planBadgeFloat}>
                  {t("paywall.plan.savePercent", { percent: savePercent })}
                </Text>
              )}
            </View>
            <View style={styles.planRow}>
              <Text style={styles.planName}>{t("paywall.plan.yearly")}</Text>
              <View style={styles.planPriceColumn}>
                {hasDiscount && (
                  <Text style={styles.planPriceOriginal}>
                    {formatPrice(yearlyOriginal)}
                  </Text>
                )}
                <Text style={styles.planPrice}>
                  {formatPrice(yearlyNum)}
                  <Text style={styles.planPriceUnit}>
                    {t("paywall.plan.perYearSuffix")}
                  </Text>
                </Text>
                <Text style={styles.planMonthlyEquivalent}>
                  {t("paywall.monthlyEquivalent", {
                    amount: formatPrice(monthlyEquivalent),
                  })}
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.planCard,
              styles.planCardCompact,
              selectedPlan === "MONTHLY" && styles.planCardSelected,
            ]}
            onPress={() => setSelectedPlan("MONTHLY")}
          >
            {selectedPlan === "MONTHLY" && (
              <LinearGradient
                colors={[colors.primaryDark, "#4A086B"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFillObject}
              />
            )}
            <View style={styles.planRow}>
              <Text style={[styles.planName, styles.planNameCompact]}>
                {t("paywall.plan.monthly")}
              </Text>
              <View style={styles.planPriceCluster}>
                <Text style={[styles.planPrice, styles.planPriceCompact]}>
                  {formatPrice(monthlyNum)}
                  <Text
                    style={[styles.planPriceUnit, styles.planPriceUnitCompact]}
                  >
                    {t("paywall.plan.perMonthSuffix")}
                  </Text>
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {showPromoInput ? (
          <View style={styles.promoSection}>
            <View style={styles.promoInputRow}>
              <TextInput
                style={styles.promoInput}
                value={promoCode}
                onChangeText={setPromoCode}
                placeholder={t("paywall.promoPlaceholder")}
                placeholderTextColor={colors.textTertiary}
                autoCapitalize="characters"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={[
                  styles.promoButton,
                  isRedeemingPromo && styles.promoButtonDisabled,
                ]}
                onPress={handleRedeemPromo}
                disabled={isRedeemingPromo || !promoCode.trim()}
              >
                {isRedeemingPromo ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <Text style={styles.promoButtonText}>
                    {t("paywall.promoApply")}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity onPress={() => setShowPromoInput(true)}>
            <Text style={styles.promoToggle}>{t("paywall.promoToggle")}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          activeOpacity={0.9}
          style={[
            styles.purchaseButton,
            (isProcessing || isLoadingProducts) &&
              styles.purchaseButtonDisabled,
          ]}
          onPress={handlePurchase}
          disabled={isProcessing || isLoadingProducts}
          onLayout={(e) => setCtaWidth(e.nativeEvent.layout.width)}
        >
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
          {ctaWidth > 0 && !isProcessing && (
            <Animated.View
              pointerEvents="none"
              style={[
                styles.ctaShimmer,
                {
                  width: ctaWidth * 0.35,
                  transform: [
                    { translateX: shimmerTranslate },
                    { rotate: "18deg" },
                  ],
                },
              ]}
            >
              <LinearGradient
                colors={[
                  "rgba(255,255,255,0)",
                  "rgba(255,255,255,0.28)",
                  "rgba(255,255,255,0)",
                ]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={StyleSheet.absoluteFillObject}
              />
            </Animated.View>
          )}
          {isProcessing ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Text style={styles.purchaseButtonText}>
              {t("paywall.subscribe")}
            </Text>
          )}
        </TouchableOpacity>
        <Text style={styles.ctaMicrocopy}>{t("paywall.ctaMicrocopy")}</Text>

        <TouchableOpacity
          onPress={handleRestore}
          style={styles.restoreButton}
          disabled={isProcessing}
        >
          <Text style={styles.restoreText}>{t("paywall.restore")}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  closeButton: {
    padding: 4,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 160,
  },
  titleSection: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: colors.white,
    lineHeight: 38,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  featuresSection: {
    marginBottom: 20,
    gap: 16,
  },
  extraFeaturesSection: {
    marginBottom: 32,
    paddingTop: 18,
    gap: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  extraFeaturesTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  featureIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(142, 68, 173, 0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  featureText: {
    fontSize: 16,
    color: colors.white,
    flex: 1,
  },
  planSection: {
    gap: 12,
    marginBottom: 20,
  },
  planCard: {
    backgroundColor: colors.surface1,
    borderRadius: 16,
    paddingVertical: 28,
    paddingHorizontal: 22,
    borderWidth: 2,
    borderColor: colors.border,
    overflow: "hidden",
  },
  planCardSelected: {
    borderColor: colors.primary,
  },
  planCardCompact: {
    paddingVertical: 18,
    paddingHorizontal: 20,
  },
  planNameCompact: {
    fontSize: 16,
  },
  planPriceCompact: {
    fontSize: 20,
  },
  planPriceUnitCompact: {
    fontSize: 13,
  },
  planBadgeRow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  planBestBadge: {
    backgroundColor: colors.primary,
    color: colors.white,
    fontSize: 11,
    fontWeight: "bold",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    overflow: "hidden",
    letterSpacing: 0.3,
  },
  planBadgeFloat: {
    backgroundColor: "rgba(255,255,255,0.14)",
    color: colors.white,
    fontSize: 11,
    fontWeight: "bold",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    overflow: "hidden",
  },
  planMonthlyEquivalent: {
    marginTop: 4,
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
    fontWeight: "500",
  },
  planRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  planName: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.white,
  },
  planPriceCluster: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 10,
    flexShrink: 1,
  },
  planPriceColumn: {
    alignItems: "flex-end",
    flexShrink: 1,
  },
  planPriceOriginal: {
    fontSize: 14,
    color: "rgba(255,255,255,0.5)",
    textDecorationLine: "line-through",
    fontWeight: "500",
    marginBottom: 2,
  },
  planPrice: {
    fontSize: 26,
    fontWeight: "bold",
    color: colors.white,
  },
  planPriceUnit: {
    fontSize: 15,
    fontWeight: "600",
    color: "rgba(255,255,255,0.7)",
  },
  promoSection: {
    marginBottom: 16,
  },
  promoInputRow: {
    flexDirection: "row",
    gap: 8,
  },
  promoInput: {
    flex: 1,
    backgroundColor: colors.surface1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  promoButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  promoButtonDisabled: {
    opacity: 0.5,
  },
  promoButtonText: {
    color: colors.white,
    fontWeight: "bold",
    fontSize: 14,
  },
  promoToggle: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: "center",
    textDecorationLine: "underline",
    marginBottom: 16,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 16,
    backgroundColor: colors.background,
  },
  purchaseButton: {
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    backgroundColor: colors.primary,
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
  },
  ctaMicrocopy: {
    textAlign: "center",
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 10,
  },
  purchaseButtonDisabled: {
    opacity: 0.6,
  },
  purchaseButtonText: {
    color: colors.white,
    fontSize: 17,
    fontWeight: "bold",
  },
  restoreButton: {
    paddingVertical: 12,
    alignItems: "center",
  },
  restoreText: {
    color: colors.textSecondary,
    fontSize: 13,
  },
});

export default PaywallScreen;
