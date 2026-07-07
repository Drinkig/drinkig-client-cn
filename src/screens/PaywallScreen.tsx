import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  TextInput,
  ActivityIndicator,
  Platform,
  Animated,
  Easing,
  Dimensions,
  Linking,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import LinearGradient from "react-native-linear-gradient";
import {
  getSubscriptions,
  requestSubscription,
  getAvailablePurchases,
  Subscription,
  PurchaseError,
} from "react-native-iap";
import {
  ensureIapConnection,
  setPurchaseUiHandlers,
} from "../utils/iapManager";
import { colors } from "../constants/colors";
import {
  MatchScoreIllust,
  ScanIllust,
  ChatbotIllust,
  ReportIllust,
  TasteResetIllust,
} from "../components/paywall/FeatureIllustrations";
import { useSubscription } from "../context/SubscriptionContext";
import { useGlobalUI } from "../context/GlobalUIContext";
import { redeemPromoCode, verifyReceipt } from "../api/subscription";

const PRODUCT_IDS = Platform.select({
  ios: ["com.drinkig.premium.monthly.v2", "com.drinkig.premium.yearly.v2"],
  default: [],
});

type PlanType = "MONTHLY" | "YEARLY";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SLIDE_WIDTH = SCREEN_WIDTH;

type ShowcaseItem = {
  key: string;
  titleKey: string;
  descKey: string;
  Illust: React.ComponentType<{ visible?: boolean }>;
};

const SHOWCASE_ITEMS: ShowcaseItem[] = [
  {
    key: "matchScore",
    titleKey: "paywall.showcase.matchScore",
    descKey: "paywall.showcase.matchScoreDesc",
    Illust: MatchScoreIllust,
  },
  {
    key: "scan",
    titleKey: "paywall.showcase.scan",
    descKey: "paywall.showcase.scanDesc",
    Illust: ScanIllust,
  },
  {
    key: "chatbot",
    titleKey: "paywall.showcase.chatbot",
    descKey: "paywall.showcase.chatbotDesc",
    Illust: ChatbotIllust,
  },
  {
    key: "report",
    titleKey: "paywall.showcase.report",
    descKey: "paywall.showcase.reportDesc",
    Illust: ReportIllust,
  },
  {
    key: "tasteReset",
    titleKey: "paywall.showcase.tasteReset",
    descKey: "paywall.showcase.tasteResetDesc",
    Illust: TasteResetIllust,
  },
];

const PaywallScreen = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { refreshSubscription } = useSubscription();
  const { showToast } = useGlobalUI();
  const insets = useSafeAreaInsets();

  const scrollViewRef = useRef<ScrollView>(null);
  const [showcasePage, setShowcasePage] = useState(0);
  const [footerHeight, setFooterHeight] = useState(160);
  const [selectedPlan, setSelectedPlan] = useState<PlanType>("YEARLY");
  const [promoCode, setPromoCode] = useState("");
  const [showPromoInput, setShowPromoInput] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRedeemingPromo, setIsRedeemingPromo] = useState(false);
  const [products, setProducts] = useState<Subscription[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  // 상품 로드 실패 시 "다시 시도"가 IAP 초기화 전체를 재실행하게 하는 트리거
  const [iapRetryNonce, setIapRetryNonce] = useState(0);

  // 구매 리스너는 SubscriptionContext(iapManager)에 전역 등록되어 있다.
  // 이 화면은 상품 로드와 UI 피드백(토스트/스피너 해제)만 담당한다.
  useEffect(() => {
    const loadProducts = async () => {
      setIsLoadingProducts(true);
      try {
        const ok = await ensureIapConnection();
        if (ok) {
          const subs = await getSubscriptions({ skus: PRODUCT_IDS! });
          setProducts(subs);
        }
      } catch (error) {
        console.warn(
          "IAP not available (simulator or unsupported device):",
          error
        );
      } finally {
        setIsLoadingProducts(false);
      }
    };

    loadProducts();
  }, [iapRetryNonce]);

  useEffect(() => {
    setPurchaseUiHandlers({
      onSuccess: () => {
        setIsProcessing(false);
        showToast(t("paywall.subscribeSuccess"), {
          type: "success",
          onHide: () => navigation.goBack(),
        });
      },
      onVerifyFailed: () => {
        setIsProcessing(false);
        showToast(t("paywall.verifyFailed"), { type: "error" });
      },
      onError: (error: PurchaseError) => {
        setIsProcessing(false);
        if (error.code !== "E_USER_CANCELLED") {
          showToast(error.message || t("paywall.purchaseFailed"), {
            type: "error",
          });
        }
      },
    });
    return () => setPurchaseUiHandlers(null);
  }, [navigation, showToast, t]);

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

        const verifyResult = await verifyReceipt(
          transactionId,
          originalTransactionId,
          latestPurchase.productId
        );

        if (!verifyResult?.result?.success) {
          showToast(t("paywall.restoreEmptyMessage"), { type: "info" });
          setIsProcessing(false);
          return;
        }

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
        navigation.goBack();
        setTimeout(() => {
          navigation.navigate("PremiumWelcome" as never);
        }, 100);
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

  // 스토어 상품이 없으면 null — 임의의 KRW 폴백 가격을 보여주면
  // 표시가와 실제 청구가가 달라질 수 있어(해외 스토어프론트, 심사 리젝 사유)
  // 가격 미로드 상태를 그대로 노출하고 구매를 막는다.
  const getNumericPrice = (plan: PlanType): number | null => {
    const productId = getProductId(plan);
    const product = products.find((p) => p.productId === productId);
    const priceStr = (product as any)?.price;
    const n = priceStr ? parseFloat(priceStr) : NaN;
    return !isNaN(n) && n > 0 ? n : null;
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
  const pricesAvailable = monthlyNum !== null && yearlyNum !== null;
  const yearlyOriginal = (monthlyNum ?? 0) * 12;
  const saveAmount = Math.max(0, yearlyOriginal - (yearlyNum ?? 0));
  const savePercent =
    yearlyOriginal > 0 ? Math.round((saveAmount / yearlyOriginal) * 100) : 0;
  const monthlyEquivalent = (yearlyNum ?? 0) / 12;
  const hasDiscount = savePercent > 0;

  const allFeatures = [
    { icon: "scan-outline", text: t("paywall.feature.unlimitedLabelScan") },
    { icon: "list-outline", text: t("paywall.feature.wineListScan") },
    {
      icon: "restaurant-outline",
      text: t("paywall.feature.foodPairing"),
    },
    {
      icon: "heart-circle-outline",
      text: t("paywall.feature.compatibility"),
    },
    {
      icon: "document-text-outline",
      text: t("paywall.feature.compatibilityReport"),
    },
    { icon: "refresh-outline", text: t("paywall.feature.tasteReset") },
  ];

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

  // Auto-scroll so the promo input is visible above the footer when opened
  useEffect(() => {
    if (!showPromoInput) return;
    const timer = setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 50);
    return () => clearTimeout(timer);
  }, [showPromoInput]);

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-ctaWidth * 0.6, ctaWidth],
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={[
          "rgba(142, 68, 173, 0.25)",
          "rgba(142, 68, 173, 0)",
          "transparent",
        ]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.topGlow}
        pointerEvents="none"
      />
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.closeButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel={t("common.close")}
        >
          <Icon name="close" size={28} color={colors.white} />
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: footerHeight + 24 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        <View style={styles.titleSection}>
          <View style={styles.premiumBadge}>
            <Icon name="diamond-outline" size={13} color="#c084fc" />
            <Text style={styles.premiumBadgeText}>PREMIUM</Text>
          </View>

          <Text style={styles.title}>{t("paywall.title")}</Text>
          <Text style={styles.subtitle}>{t("paywall.subtitle")}</Text>

          {/* 그라디언트 디바이더 */}
          <LinearGradient
            colors={["transparent", colors.primary, "#c084fc", "transparent"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.titleDivider}
          />
        </View>

        <View style={styles.showcaseContainer}>
          <FlatList
            data={SHOWCASE_ITEMS}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.key}
            onMomentumScrollEnd={(e) => {
              const page = Math.round(
                e.nativeEvent.contentOffset.x / SLIDE_WIDTH
              );
              setShowcasePage(page);
            }}
            renderItem={({ item, index }) => {
              const { Illust } = item;
              return (
                <View style={styles.showcaseSlide}>
                  <View style={styles.showcaseIllust}>
                    <Illust visible={index === showcasePage} />
                  </View>
                  <Text style={styles.showcaseTitle}>{t(item.titleKey)}</Text>
                  <Text style={styles.showcaseDesc}>{t(item.descKey)}</Text>
                </View>
              );
            }}
          />
          <View style={styles.showcaseDots}>
            {SHOWCASE_ITEMS.map((item, i) => (
              <View
                key={item.key}
                style={[
                  styles.showcaseDot,
                  i === showcasePage && styles.showcaseDotActive,
                ]}
              />
            ))}
          </View>
        </View>

        <View style={styles.featuresGrid}>
          {allFeatures.map((f, i) => (
            <View key={i} style={styles.featureCard}>
              <Icon name={f.icon} size={20} color={colors.primary} />
              <Text style={styles.featureCardText} numberOfLines={2}>
                {f.text}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.planSection}>
          {isLoadingProducts && (
            <View style={styles.planStateBox}>
              <ActivityIndicator color={colors.primary} />
            </View>
          )}
          {!isLoadingProducts && !pricesAvailable && (
            <View style={styles.planStateBox}>
              <Text style={styles.planStateText}>
                {t("paywall.priceLoadFailed")}
              </Text>
              <TouchableOpacity
                style={styles.planRetryButton}
                onPress={() => setIapRetryNonce((n) => n + 1)}
              >
                <Text style={styles.planRetryButtonText}>
                  {t("paywall.priceLoadRetry")}
                </Text>
              </TouchableOpacity>
            </View>
          )}
          {!isLoadingProducts && pricesAvailable && (
            <>
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
                  <Text style={styles.planBestBadge}>
                    {t("paywall.bestBadge")}
                  </Text>
                  {hasDiscount && (
                    <Text style={styles.planBadgeFloat}>
                      {t("paywall.plan.savePercent", { percent: savePercent })}
                    </Text>
                  )}
                </View>
                <View style={styles.planRow}>
                  <Text style={styles.planName}>
                    {t("paywall.plan.yearly")}
                  </Text>
                  <View style={styles.planPriceColumn}>
                    {hasDiscount && (
                      <Text style={styles.planPriceOriginal}>
                        {formatPrice(yearlyOriginal)}
                      </Text>
                    )}
                    <Text style={styles.planPrice}>
                      {formatPrice(yearlyNum ?? 0)}
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
                      {formatPrice(monthlyNum ?? 0)}
                      <Text
                        style={[
                          styles.planPriceUnit,
                          styles.planPriceUnitCompact,
                        ]}
                      >
                        {t("paywall.plan.perMonthSuffix")}
                      </Text>
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            </>
          )}
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

      <View
        style={styles.footer}
        onLayout={(e) => setFooterHeight(e.nativeEvent.layout.height)}
      >
        <TouchableOpacity
          activeOpacity={0.9}
          style={[
            styles.purchaseButton,
            (isProcessing || isLoadingProducts || !pricesAvailable) &&
              styles.purchaseButtonDisabled,
          ]}
          onPress={handlePurchase}
          disabled={isProcessing || isLoadingProducts || !pricesAvailable}
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

        <Text style={styles.renewalDisclosure}>
          {t("paywall.renewalDisclosure")}
        </Text>

        <View style={styles.legalRow}>
          <TouchableOpacity
            onPress={() => Linking.openURL("https://web.drinkig.com/terms")}
          >
            <Text style={styles.legalLink}>{t("paywall.terms")}</Text>
          </TouchableOpacity>
          <Text style={styles.legalSeparator}>·</Text>
          <TouchableOpacity
            onPress={() => Linking.openURL("https://web.drinkig.com/privacy")}
          >
            <Text style={styles.legalLink}>{t("paywall.privacy")}</Text>
          </TouchableOpacity>
          <Text style={styles.legalSeparator}>·</Text>
          <TouchableOpacity onPress={handleRestore} disabled={isProcessing}>
            <Text style={styles.legalLink}>{t("paywall.restore")}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 320,
    zIndex: 0,
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
  showcaseContainer: {
    marginHorizontal: -24,
    marginBottom: 28,
  },
  showcaseSlide: {
    width: SLIDE_WIDTH,
    alignItems: "center",
    paddingHorizontal: 32,
  },
  showcaseIllust: {
    width: 260,
    height: 260,
    marginBottom: 14,
  },
  showcaseTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.white,
    marginBottom: 6,
  },
  showcaseDesc: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  showcaseDots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: 16,
  },
  showcaseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.textTertiary,
  },
  showcaseDotActive: {
    width: 20,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 160,
  },
  titleSection: {
    alignItems: "center",
    marginBottom: 32,
    overflow: "visible",
  },
  premiumBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(142, 68, 173, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(192, 132, 252, 0.3)",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
    marginBottom: 16,
  },
  premiumBadgeText: {
    color: "#c084fc",
    fontSize: 11,
    fontWeight: "bold",
    letterSpacing: 1.5,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: colors.white,
    lineHeight: 38,
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 24,
    textAlign: "center",
  },
  titleDivider: {
    width: 160,
    height: 1.5,
    borderRadius: 1,
    marginTop: 20,
  },
  featuresGrid: {
    gap: 8,
    marginBottom: 24,
  },
  featureCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 12,
  },
  featureCardText: {
    fontSize: 14,
    color: colors.textPrimary,
    flex: 1,
  },
  planSection: {
    gap: 12,
    marginBottom: 20,
  },
  planStateBox: {
    backgroundColor: colors.surface1,
    borderRadius: 16,
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: "center",
    gap: 12,
  },
  planStateText: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: "center",
  },
  planRetryButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  planRetryButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "600",
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
  renewalDisclosure: {
    textAlign: "center",
    color: colors.textSecondary,
    fontSize: 10,
    lineHeight: 14,
    marginTop: 8,
    opacity: 0.8,
  },
  legalRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
  },
  legalLink: {
    color: colors.textSecondary,
    fontSize: 12,
    textDecorationLine: "underline",
  },
  legalSeparator: {
    color: colors.textSecondary,
    fontSize: 12,
    marginHorizontal: 8,
  },
});

export default PaywallScreen;
