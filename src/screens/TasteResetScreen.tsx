import React, { useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import Svg, { Circle } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { MemberInitRequest, updateMemberInitInfo } from '../api/member';
import { useUser } from '../context/UserContext';
import { useGlobalUI } from '../context/GlobalUIContext';
import FlavorProfileStep, { FlavorProfile } from '../components/onboarding/FlavorProfileStep';
import { MultiSelectionStep } from '../components/onboarding/SelectionSteps';
import BudgetStep from '../components/onboarding/BudgetStep';
import { colors } from '../constants/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type Step = 'WINE_SORT' | 'BUDGET' | 'FLAVOR_PROFILE';

const WINE_SORTS = ['레드', '화이트', '스파클링', '로제', '주정강화', '디저트'];

const STEPS: Step[] = ['WINE_SORT', 'BUDGET', 'FLAVOR_PROFILE'];


const TasteResetScreen = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { user, setFlavorProfile: saveFlavorProfile } = useUser();
  const { showAlert } = useGlobalUI();

  const BUDGET_OPTIONS = [
    { label: t('onboarding.budget.under30'), value: 30000 },
    { label: t('onboarding.budget.30to50'), value: 50000 },
    { label: t('onboarding.budget.50to90'), value: 90000 },
    { label: t('onboarding.budget.90to150'), value: 150000 },
    { label: t('onboarding.budget.over150'), value: 200000 },
  ];

  const LOADING_MESSAGES = [
    t('tasteReset.analyzing.message1'),
    t('tasteReset.analyzing.message2'),
    t('tasteReset.analyzing.message3'),
  ];

  const [currentStep, setCurrentStep] = useState<Step>('WINE_SORT');
  const [wineSort, setWineSort] = useState<string[]>([]);
  const [monthPrice, setMonthPrice] = useState(0);
  const [flavorProfile, setFlavorProfile] = useState<FlavorProfile>({
    acidity: undefined,
    sweetness: undefined,
    tannin: undefined,
    body: undefined,
    alcohol: undefined,
  });

  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);

  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(1 / STEPS.length)).current;
  const circleProgress = useRef(new Animated.Value(0)).current;

  const toggleWineSort = (value: string) => {
    setWineSort((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const updateFlavorProfile = (key: keyof FlavorProfile, value: number | null) => {
    setFlavorProfile((prev) => ({ ...prev, [key]: value }));
  };

  const isStepValid = (): boolean => {
    switch (currentStep) {
      case 'WINE_SORT':
        return wineSort.length > 0;
      case 'BUDGET':
        return monthPrice > 0;
      case 'FLAVOR_PROFILE':
        return (
          flavorProfile.acidity !== undefined &&
          flavorProfile.sweetness !== undefined &&
          flavorProfile.tannin !== undefined &&
          flavorProfile.body !== undefined &&
          flavorProfile.alcohol !== undefined
        );
      default:
        return false;
    }
  };

  const animateTransition = (nextStepValue: Step, direction: 'next' | 'prev') => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: direction === 'next' ? -SCREEN_WIDTH : SCREEN_WIDTH,
        duration: 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setCurrentStep(nextStepValue);
      slideAnim.setValue(direction === 'next' ? SCREEN_WIDTH : -SCREEN_WIDTH);

      const nextIndex = STEPS.indexOf(nextStepValue);
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 250,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(progressAnim, {
          toValue: (nextIndex + 1) / STEPS.length,
          duration: 300,
          useNativeDriver: false,
        }),
      ]).start();
    });
  };

  const handleFinalSubmit = async () => {
    setLoading(true);
    try {
      const requestData: MemberInitRequest = {
        name: user?.nickname || '',
        isNewbie: false,
        monthPrice,
        wineSort,
        acidity: flavorProfile.acidity ?? null,
        sweetness: flavorProfile.sweetness ?? null,
        tannin: flavorProfile.tannin ?? null,
        body: flavorProfile.body ?? null,
        alcohol: flavorProfile.alcohol ?? null,
        wineArea: null,
        wineVariety: null,
        preferredAlcohols: null,
        preferredFoods: null,
      };

      await updateMemberInitInfo(requestData);

      setLoading(false);
      setAnalyzing(true);
      setLoadingMessageIndex(0);

      const messageInterval = setInterval(() => {
        setLoadingMessageIndex((prev) => {
          if (prev >= LOADING_MESSAGES.length - 1) {
            return prev;
          }
          return prev + 1;
        });
      }, 3000);

      Animated.timing(circleProgress, {
        toValue: 1,
        duration: 8000,
        easing: Easing.linear,
        useNativeDriver: false,
      }).start();

      setTimeout(() => {
        clearInterval(messageInterval);
        saveFlavorProfile(flavorProfile);
        (navigation as any).replace('RecommendationResult', {
          flavorProfile,
          nickname: user?.nickname,
          fromReset: true,
        });
      }, 8000);
    } catch (error) {
      console.error('Taste Reset Error:', error);
      showAlert({
        title: t('tasteReset.error.title'),
        message: t('tasteReset.error.message'),
        singleButton: true,
      });
      setLoading(false);
    }
  };

  const nextStep = () => {
    const currentIndex = STEPS.indexOf(currentStep);
    if (currentIndex < STEPS.length - 1) {
      animateTransition(STEPS[currentIndex + 1], 'next');
    } else {
      handleFinalSubmit();
    }
  };

  const prevStep = () => {
    const currentIndex = STEPS.indexOf(currentStep);
    if (currentIndex > 0) {
      animateTransition(STEPS[currentIndex - 1], 'prev');
    } else {
      navigation.goBack();
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'WINE_SORT':
        return (
          <MultiSelectionStep
            title={t('tasteReset.wineSortTitle')}
            options={WINE_SORTS}
            selected={wineSort}
            onSelect={toggleWineSort}
            multi
          />
        );
      case 'BUDGET':
        return (
          <BudgetStep
            selectedPrice={monthPrice}
            onSelect={setMonthPrice}
            options={BUDGET_OPTIONS}
          />
        );
      case 'FLAVOR_PROFILE':
        return (
          <FlavorProfileStep
            data={flavorProfile}
            onChange={updateFlavorProfile}
          />
        );
      default:
        return null;
    }
  };

  if (analyzing) {
    const size = 120;
    const strokeWidth = 4;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;

    return (
      <SafeAreaView style={styles.analyzingContainer}>
        <View style={styles.analyzingContent}>
          <View style={styles.circleContainer}>
            <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
              <Circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke="#333"
                strokeWidth={strokeWidth}
                fill="none"
              />
              <AnimatedCircle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={colors.primary}
                strokeWidth={strokeWidth}
                fill="none"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={circleProgress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [circumference, 0],
                })}
              />
            </Svg>
            <Text style={styles.circleEmoji}>🍷</Text>
          </View>
          <Text style={styles.analyzingTitle}>{t('tasteReset.analyzing.title')}</Text>
          <Text style={styles.analyzingMessage}>
            {LOADING_MESSAGES[loadingMessageIndex]}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={prevStep} style={styles.backButton}>
          <Icon name="chevron-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <View style={styles.progressBarContainer}>
          <Animated.View
            style={[
              styles.progressBar,
              {
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>
      </View>

      {/* Content */}
      <Animated.View
        style={[
          styles.content,
          {
            transform: [{ translateX: slideAnim }],
            opacity: fadeAnim,
          },
        ]}
      >
        {renderStep()}
      </Animated.View>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.nextButton, !isStepValid() && styles.nextButtonDisabled]}
          onPress={nextStep}
          disabled={!isStepValid()}
        >
          <Text style={[styles.nextButtonText, !isStepValid() && styles.nextButtonTextDisabled]}>
            {currentStep === 'FLAVOR_PROFILE' ? t('tasteReset.button.complete') : t('tasteReset.button.next')}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  backButton: {
    padding: 4,
  },
  progressBarContainer: {
    flex: 1,
    height: 4,
    backgroundColor: '#333',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    paddingTop: 8,
  },
  nextButton: {
    backgroundColor: colors.primary,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButtonDisabled: {
    backgroundColor: '#333',
  },
  nextButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  nextButtonTextDisabled: {
    color: '#666',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  analyzingContainer: {
    flex: 1,
    backgroundColor: '#121212',
  },
  analyzingContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  circleContainer: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  circleEmoji: {
    position: 'absolute',
    fontSize: 40,
  },
  analyzingTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 12,
  },
  analyzingMessage: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default TasteResetScreen;
