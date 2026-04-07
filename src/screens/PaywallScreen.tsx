import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import LinearGradient from 'react-native-linear-gradient';
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
} from 'react-native-iap';
import { colors } from '../constants/colors';
import { useSubscription } from '../context/SubscriptionContext';
import { redeemPromoCode, verifyReceipt } from '../api/subscription';

const PRODUCT_IDS = Platform.select({
  ios: ['com.drinkig.premium.monthly.v2', 'com.drinkig.premium.yearly.v2'],
  default: [],
});

type PlanType = 'MONTHLY' | 'YEARLY';

const PaywallScreen = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { refreshSubscription } = useSubscription();
  const insets = useSafeAreaInsets();

  const [selectedPlan, setSelectedPlan] = useState<PlanType>('YEARLY');
  const [promoCode, setPromoCode] = useState('');
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
              const transactionId = purchase.transactionId || '';
              const originalTransactionId = purchase.originalTransactionIdentifierIOS || transactionId;
              const productId = purchase.productId;

              await verifyReceipt(transactionId, originalTransactionId, productId);
              await finishTransaction({ purchase, isConsumable: false });
              await refreshSubscription();

              setIsProcessing(false);
              Alert.alert(
                t('paywall.promoSuccess'),
                t('paywall.subscribeSuccess'),
                [{ text: 'OK', onPress: () => navigation.goBack() }],
              );
            } catch (error) {
              console.error('Purchase verification failed:', error);
              setIsProcessing(false);
              Alert.alert(t('paywall.promoError'), t('paywall.verifyFailed'));
            }
          },
        );

        purchaseErrorSubscription = purchaseErrorListener((error: PurchaseError) => {
          setIsProcessing(false);
          if (error.code !== 'E_USER_CANCELLED') {
            Alert.alert(t('paywall.promoError'), error.message || t('paywall.purchaseFailed'));
          }
        });

        const subs = await getSubscriptions({ skus: PRODUCT_IDS! });
        setProducts(subs);
      } catch (error) {
        console.warn('IAP not available (simulator or unsupported device):', error);
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
    return plan === 'YEARLY'
      ? 'com.drinkig.premium.yearly.v2'
      : 'com.drinkig.premium.monthly.v2';
  };

  const handlePurchase = async () => {
    const productId = getProductId(selectedPlan);
    const product = products.find(p => p.productId === productId);

    if (!product) {
      Alert.alert(t('paywall.promoError'), t('paywall.productNotFound'));
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
        Alert.alert(t('paywall.restoreEmpty'), t('paywall.restoreEmptyMessage'));
        setIsProcessing(false);
        return;
      }

      // Find the latest subscription purchase
      const latestPurchase = purchases
        .filter(p => PRODUCT_IDS!.includes(p.productId))
        .sort((a, b) => (b.transactionDate || 0) - (a.transactionDate || 0))[0];

      if (latestPurchase) {
        const transactionId = latestPurchase.transactionId || '';
        const originalTransactionId = latestPurchase.originalTransactionIdentifierIOS || transactionId;

        await verifyReceipt(transactionId, originalTransactionId, latestPurchase.productId);
        await refreshSubscription();

        Alert.alert(
          t('paywall.promoSuccess'),
          t('paywall.restoreSuccessMessage'),
          [{ text: 'OK', onPress: () => navigation.goBack() }],
        );
      } else {
        Alert.alert(t('paywall.restoreEmpty'), t('paywall.restoreEmptyMessage'));
      }
    } catch (error) {
      console.error('Restore failed:', error);
      Alert.alert(t('paywall.promoError'), t('paywall.restoreFailed'));
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
        Alert.alert(
          t('paywall.promoSuccess'),
          t('paywall.promoSuccessMessage'),
          [{ text: 'OK', onPress: () => navigation.goBack() }],
        );
      } else {
        Alert.alert(t('paywall.promoError'), response.message);
      }
    } catch (error: any) {
      const message = error.response?.data?.message || t('paywall.promoErrorGeneric');
      Alert.alert(t('paywall.promoError'), message);
    } finally {
      setIsRedeemingPromo(false);
    }
  };

  const getDisplayPrice = (plan: PlanType): string | null => {
    const productId = getProductId(plan);
    const product = products.find(p => p.productId === productId);
    if (!product) return null;
    return (product as any).localizedPrice ?? null;
  };

  const features = [
    { icon: 'camera-outline', text: t('paywall.feature.unlimitedScan') },
    { icon: 'heart-pulse', text: t('paywall.feature.compatibility'), isMCI: true },
    { icon: 'restaurant-outline', text: t('paywall.feature.foodPairing') },
    { icon: 'refresh-outline', text: t('paywall.feature.tasteReset') },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
          <Icon name="close" size={28} color={colors.white} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.titleSection}>
          <Text style={styles.title}>{t('paywall.title')}</Text>
          <Text style={styles.subtitle}>{t('paywall.subtitle')}</Text>
        </View>

        <View style={styles.featuresSection}>
          {features.map((feature, index) => (
            <View key={index} style={styles.featureRow}>
              <View style={styles.featureIconContainer}>
                {feature.isMCI ? (
                  <MaterialCommunityIcons name={feature.icon} size={20} color={colors.primary} />
                ) : (
                  <Icon name={feature.icon} size={20} color={colors.primary} />
                )}
              </View>
              <Text style={styles.featureText}>{feature.text}</Text>
            </View>
          ))}
        </View>

        <View style={styles.planSection}>
          <TouchableOpacity
            style={[styles.planCard, selectedPlan === 'YEARLY' && styles.planCardSelected]}
            onPress={() => setSelectedPlan('YEARLY')}
          >
            {selectedPlan === 'YEARLY' && (
              <LinearGradient
                colors={[colors.primaryDark, '#4A086B']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFillObject}
              />
            )}
            <View style={styles.planHeader}>
              <Text style={styles.planBadge}>{t('paywall.plan.bestValue')}</Text>
            </View>
            <Text style={styles.planName}>{t('paywall.plan.yearly')}</Text>
            <Text style={styles.planPrice}>
              {getDisplayPrice('YEARLY') || t('paywall.plan.yearlyPrice')}
            </Text>
            <Text style={styles.planSubPrice}>{t('paywall.plan.yearlyPerMonth')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.planCard, selectedPlan === 'MONTHLY' && styles.planCardSelected]}
            onPress={() => setSelectedPlan('MONTHLY')}
          >
            {selectedPlan === 'MONTHLY' && (
              <LinearGradient
                colors={[colors.primaryDark, '#4A086B']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFillObject}
              />
            )}
            <Text style={styles.planName}>{t('paywall.plan.monthly')}</Text>
            <Text style={styles.planPrice}>
              {getDisplayPrice('MONTHLY') || t('paywall.plan.monthlyPrice')}
            </Text>
          </TouchableOpacity>
        </View>

        {showPromoInput ? (
          <View style={styles.promoSection}>
            <View style={styles.promoInputRow}>
              <TextInput
                style={styles.promoInput}
                value={promoCode}
                onChangeText={setPromoCode}
                placeholder={t('paywall.promoPlaceholder')}
                placeholderTextColor={colors.textTertiary}
                autoCapitalize="characters"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={[styles.promoButton, isRedeemingPromo && styles.promoButtonDisabled]}
                onPress={handleRedeemPromo}
                disabled={isRedeemingPromo || !promoCode.trim()}
              >
                {isRedeemingPromo ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <Text style={styles.promoButtonText}>{t('paywall.promoApply')}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity onPress={() => setShowPromoInput(true)}>
            <Text style={styles.promoToggle}>{t('paywall.promoToggle')}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.purchaseButton, (isProcessing || isLoadingProducts) && styles.purchaseButtonDisabled]}
          onPress={handlePurchase}
          disabled={isProcessing || isLoadingProducts}
        >
          {isProcessing ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Text style={styles.purchaseButtonText}>{t('paywall.subscribe')}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={handleRestore} style={styles.restoreButton} disabled={isProcessing}>
          <Text style={styles.restoreText}>{t('paywall.restore')}</Text>
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
    flexDirection: 'row',
    justifyContent: 'flex-end',
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
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  featuresSection: {
    marginBottom: 32,
    gap: 16,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  featureIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(142, 68, 173, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
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
    padding: 20,
    borderWidth: 2,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  planCardSelected: {
    borderColor: colors.primary,
  },
  planHeader: {
    marginBottom: 8,
  },
  planBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    color: colors.white,
    fontSize: 11,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-start',
    overflow: 'hidden',
  },
  planName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 4,
  },
  planPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.white,
  },
  planSubPrice: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
  },
  promoSection: {
    marginBottom: 16,
  },
  promoInputRow: {
    flexDirection: 'row',
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  promoButtonDisabled: {
    opacity: 0.5,
  },
  promoButtonText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 14,
  },
  promoToggle: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    textDecorationLine: 'underline',
    marginBottom: 16,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 16,
    backgroundColor: colors.background,
  },
  purchaseButton: {
    backgroundColor: colors.primary,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  purchaseButtonDisabled: {
    opacity: 0.6,
  },
  purchaseButtonText: {
    color: colors.white,
    fontSize: 17,
    fontWeight: 'bold',
  },
  restoreButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  restoreText: {
    color: colors.textSecondary,
    fontSize: 13,
  },
});

export default PaywallScreen;
