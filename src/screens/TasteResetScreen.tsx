import React, { useEffect, useRef, useState } from 'react';
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
import { FlavorProfile } from '../components/onboarding/FlavorProfileStep';
import NewbieFlavorProfileStep from '../components/onboarding/NewbieFlavorProfileStep';
import { MultiSelectionStep } from '../components/onboarding/SelectionSteps';
import { CategorizedSelectionStep } from '../components/onboarding/CategorizedSelectionStep';
import BudgetStep from '../components/onboarding/BudgetStep';
import { colors } from '../constants/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type Step =
  | 'ALCOHOL_PREF'
  | 'FOOD_PREF'
  | 'FLAVOR_ACIDITY'
  | 'FLAVOR_SWEETNESS'
  | 'FLAVOR_TANNIN'
  | 'FLAVOR_BODY'
  | 'FLAVOR_ALCOHOL'
  | 'WINE_INTEREST'
  | 'BUDGET';

const WINE_SORTS = ['레드', '화이트', '스파클링', '로제', '주정강화', '디저트'];

const ALCOHOL_CATEGORIES = [
  {
    title: '맥주',
    data: ['라거', '에일', 'IPA', '스타우트/흑맥주', '밀맥주', '사워'],
  },
  {
    title: '위스키/브랜디',
    data: ['싱글몰트', '블렌디드', '버번', '아이리시', '꼬냑/아르마냑'],
  },
  {
    title: '소주/전통주',
    data: ['소주', '증류식 소주', '약주/청주', '막걸리/탁주', '과실주'],
  },
  {
    title: '와인',
    data: ['레드 와인', '화이트 와인', '스파클링', '로제', '내추럴', '주정강화'],
  },
  {
    title: '기타 주류',
    data: ['사케', '진', '보드카', '럼', '데킬라', '하이볼', '칵테일', '기타'],
  },
];

const FOOD_CATEGORIES = [
  {
    title: '국가 별',
    data: [
      '한식', '중식', '일식', '양식', '이탈리아', '프랑스', '스페인',
      '아메리칸 차이니즈', '베트남', '태국', '인도', '멕시코', '남미', '퓨전',
    ],
  },
  {
    title: '육류',
    data: [
      '돼지고기', '소고기', '닭고기', '양고기', '스테이크', '바베큐',
      '순대', '곱창', '족발/보쌈',
    ],
  },
  {
    title: '해산물',
    data: ['갑각류', '조개류', '회', '숙성사시미', '찜/탕', '스시', '장어', '생선구이'],
  },
  {
    title: '기타',
    data: ['치즈', '샤퀴테리', '피자', '햄버거', '과일', '디저트', '스낵/과자'],
  },
];

const STEPS: Step[] = [
  'ALCOHOL_PREF',
  'FOOD_PREF',
  'FLAVOR_ACIDITY',
  'FLAVOR_SWEETNESS',
  'FLAVOR_TANNIN',
  'FLAVOR_BODY',
  'FLAVOR_ALCOHOL',
  'WINE_INTEREST',
  'BUDGET',
];

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
    t('onboarding.loading.message0'),
    t('onboarding.loading.message1'),
    t('onboarding.loading.message2'),
    t('onboarding.loading.message3'),
    t('onboarding.loading.message4', { nickname: user?.nickname }),
  ];

  const [currentStep, setCurrentStep] = useState<Step>('ALCOHOL_PREF');
  const [preferredAlcohols, setPreferredAlcohols] = useState<string[]>([]);
  const [preferredFoods, setPreferredFoods] = useState<string[]>([]);
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
  const [analyzingIndex, setAnalyzingIndex] = useState(0);

  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(1 / STEPS.length)).current;
  const loadingBarAnim = useRef(new Animated.Value(0)).current;

  const CIRCLE_SIZE = 120;
  const STROKE_WIDTH = 8;
  const RADIUS = (CIRCLE_SIZE - STROKE_WIDTH) / 2;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

  const strokeDashoffset = loadingBarAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [CIRCUMFERENCE, 0],
  });

  useEffect(() => {
    if (analyzing) {
      setAnalyzingIndex(0);
      loadingBarAnim.setValue(0);

      const times = [2000, 3000, 5000, 8000];

      const timeout1 = setTimeout(() => setAnalyzingIndex(1), times[0]);
      const timeout2 = setTimeout(() => setAnalyzingIndex(2), times[1]);
      const timeout3 = setTimeout(() => setAnalyzingIndex(3), times[2]);
      const timeout4 = setTimeout(() => setAnalyzingIndex(4), times[3]);

      Animated.sequence([
        Animated.timing(loadingBarAnim, {
          toValue: 0.3,
          duration: 2000,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(loadingBarAnim, {
          toValue: 0.6,
          duration: 4000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(loadingBarAnim, {
          toValue: 0.85,
          duration: 2000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(loadingBarAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();

      return () => {
        clearTimeout(timeout1);
        clearTimeout(timeout2);
        clearTimeout(timeout3);
        clearTimeout(timeout4);
        loadingBarAnim.stopAnimation();
      };
    }
  }, [analyzing]);

  const toggleAlcohol = (value: string) => {
    setPreferredAlcohols((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const toggleFood = (value: string) => {
    setPreferredFoods((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

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
      case 'ALCOHOL_PREF':
        return preferredAlcohols.length > 0;
      case 'FOOD_PREF':
        return preferredFoods.length > 0;
      case 'FLAVOR_ACIDITY':
        return flavorProfile.acidity !== undefined;
      case 'FLAVOR_SWEETNESS':
        return flavorProfile.sweetness !== undefined;
      case 'FLAVOR_TANNIN':
        return flavorProfile.tannin !== undefined;
      case 'FLAVOR_BODY':
        return flavorProfile.body !== undefined;
      case 'FLAVOR_ALCOHOL':
        return flavorProfile.alcohol !== undefined;
      case 'WINE_INTEREST':
        return wineSort.length > 0;
      case 'BUDGET':
        return monthPrice > 0;
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
        isNewbie: true,
        monthPrice,
        wineSort,
        acidity: flavorProfile.acidity ?? null,
        sweetness: flavorProfile.sweetness ?? null,
        tannin: flavorProfile.tannin ?? null,
        body: flavorProfile.body ?? null,
        alcohol: flavorProfile.alcohol ?? null,
        wineArea: null,
        wineVariety: null,
        preferredAlcohols,
        preferredFoods,
      };

      await updateMemberInitInfo(requestData);

      setLoading(false);
      setAnalyzing(true);

      setTimeout(() => {
        setAnalyzing(false);
        saveFlavorProfile(flavorProfile);
        (navigation as any).replace('RecommendationResult', {
          flavorProfile,
          nickname: user?.nickname,
          fromReset: true,
        });
      }, 10000);
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
      case 'ALCOHOL_PREF':
        return (
          <CategorizedSelectionStep
            title={t('onboarding.alcoholPrefTitle')}
            categories={ALCOHOL_CATEGORIES}
            selected={preferredAlcohols}
            onSelect={toggleAlcohol}
            allowCustomInput
          />
        );
      case 'FOOD_PREF':
        return (
          <CategorizedSelectionStep
            title={t('onboarding.foodPrefTitle')}
            categories={FOOD_CATEGORIES}
            selected={preferredFoods}
            onSelect={toggleFood}
            allowCustomInput
          />
        );
      case 'FLAVOR_ACIDITY':
        return (
          <NewbieFlavorProfileStep
            attribute="acidity"
            value={flavorProfile.acidity}
            onChange={(val) => updateFlavorProfile('acidity', val)}
          />
        );
      case 'FLAVOR_SWEETNESS':
        return (
          <NewbieFlavorProfileStep
            attribute="sweetness"
            value={flavorProfile.sweetness}
            onChange={(val) => updateFlavorProfile('sweetness', val)}
          />
        );
      case 'FLAVOR_TANNIN':
        return (
          <NewbieFlavorProfileStep
            attribute="tannin"
            value={flavorProfile.tannin}
            onChange={(val) => updateFlavorProfile('tannin', val)}
          />
        );
      case 'FLAVOR_BODY':
        return (
          <NewbieFlavorProfileStep
            attribute="body"
            value={flavorProfile.body}
            onChange={(val) => updateFlavorProfile('body', val)}
          />
        );
      case 'FLAVOR_ALCOHOL':
        return (
          <NewbieFlavorProfileStep
            attribute="alcohol"
            value={flavorProfile.alcohol}
            onChange={(val) => updateFlavorProfile('alcohol', val)}
          />
        );
      case 'WINE_INTEREST':
        return (
          <MultiSelectionStep
            title={t('onboarding.wineSortTitle')}
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
      default:
        return null;
    }
  };

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
            {currentStep === 'BUDGET' ? t('tasteReset.button.complete') : t('tasteReset.button.next')}
          </Text>
        </TouchableOpacity>
      </View>

      {loading && (
        <View style={[StyleSheet.absoluteFill, styles.loadingContainer]}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}

      {analyzing && (
        <View style={[StyleSheet.absoluteFill, styles.analyzingContainer]}>
          <View
            style={{
              width: CIRCLE_SIZE,
              height: CIRCLE_SIZE,
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 10,
            }}
          >
            <Svg width={CIRCLE_SIZE} height={CIRCLE_SIZE}>
              <Circle
                cx={CIRCLE_SIZE / 2}
                cy={CIRCLE_SIZE / 2}
                r={RADIUS}
                stroke={colors.border}
                strokeWidth={STROKE_WIDTH}
                fill="transparent"
              />
              <AnimatedCircle
                cx={CIRCLE_SIZE / 2}
                cy={CIRCLE_SIZE / 2}
                r={RADIUS}
                stroke={colors.primary}
                strokeWidth={STROKE_WIDTH}
                fill="transparent"
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                rotation="-90"
                origin={`${CIRCLE_SIZE / 2}, ${CIRCLE_SIZE / 2}`}
              />
            </Svg>
          </View>

          <Text style={styles.analyzingText}>
            {analyzingIndex === 4
              ? t('onboarding.loading.message4', { nickname: user?.nickname })
              : LOADING_MESSAGES[analyzingIndex]}
          </Text>
        </View>
      )}
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
    backgroundColor: '#121212',
    zIndex: 9999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  analyzingContainer: {
    backgroundColor: '#121212',
    zIndex: 9999,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  analyzingText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '500',
    marginTop: 20,
    marginBottom: 0,
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.9,
  },
});

export default TasteResetScreen;
