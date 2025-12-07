import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Dimensions,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { launchImageLibrary } from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/Ionicons';
import { useUser } from '../context/UserContext';
import {
  uploadProfileImage,
  updateMemberInitInfo,
  checkNickname,
  MemberInitRequest,
} from '../api/member';

import FlavorProfileStep, { FlavorProfile } from '../components/onboarding/FlavorProfileStep';
import IntroStep from '../components/onboarding/IntroStep';
import ProfileStep from '../components/onboarding/ProfileStep';
import NewbieCheckStep from '../components/onboarding/NewbieCheckStep';
import TransitionStep from '../components/onboarding/TransitionStep';
import { MultiSelectionStep } from '../components/onboarding/SelectionSteps';
import BudgetStep from '../components/onboarding/BudgetStep';

// ----------------------
// Constants & Types
// ----------------------

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type Step =
  | 'INTRO'
  | 'PROFILE'
  | 'NEWBIE_CHECK'
  // Newbie Flow
  | 'NEWBIE_TRANSITION'
  | 'ALCOHOL_PREF'
  | 'FOOD_PREF'
  | 'FLAVOR_PROFILE' // [NEW]
  | 'WINE_INTEREST' // Red vs White (유지: 뉴비도 wineSort 필요)
  // Expert Flow
  | 'EXPERT_TRANSITION'
  | 'WINE_SORT'
  | 'WINE_AREA'
  | 'WINE_VARIETY'
  // Shared
  | 'BUDGET';

interface OnboardingData {
  name: string;
  profileImageUri: string | null;
  isNewbie: boolean | null;
  monthPrice: number;
  wineSort: string[];
  // Expert Only
  wineArea: string[];
  wineVariety: string[];
  // Newbie Only
  preferredAlcohols: string[];
  preferredFoods: string[];
  flavorProfile: FlavorProfile;
}

const INITIAL_DATA: OnboardingData = {
  name: '',
  profileImageUri: null,
  isNewbie: null,
  monthPrice: 0,
  wineSort: [],
  wineArea: [],
  wineVariety: [],
  preferredAlcohols: [],
  preferredFoods: [],
  flavorProfile: {
    acidity: undefined,
    sweetness: undefined,
    tannin: undefined,
    body: undefined,
    alcohol: undefined,
  },
};

// Options for selections
const ALCOHOL_OPTIONS = ['소주', '맥주', '위스키', '칵테일', '막걸리', '사케', '럼', '진', '보드카', '기타'];
const FOOD_OPTIONS = ['육류', '해산물', '치즈', '디저트', '한식', '중식', '양식', '일식', '닭고기', '파스타', '피자', '바비큐', '매운 음식', '과자'];
const WINE_SORTS = ['레드', '화이트', '스파클링', '로제', '주정강화', '디저트'];
const WINE_AREAS = ['FRANCE', 'ITALY', 'USA', 'CHILE', 'SPAIN', 'AUSTRALIA', 'NEW_ZEALAND', 'ARGENTINA'];
const WINE_VARIETIES = ['CABERNET_SAUVIGNON', 'MERLOT', 'PINOT_NOIR', 'CHARDONNAY', 'SAUVIGNON_BLANC', 'SYRAH', 'RIESLING'];
const BUDGET_OPTIONS = [
  { label: '3만원 이하', value: 30000 },
  { label: '3~5만원', value: 50000 },
  { label: '5~9만원', value: 90000 },
  { label: '9~15만원', value: 150000 },
  { label: '15만원 이상', value: 200000 },
];

// ----------------------
// Component
// ----------------------

const OnboardingScreen = () => {
  const navigation = useNavigation();
  const { completeOnboarding } = useUser();
  
  const [step, setStep] = useState<Step>('INTRO');
  const [formData, setFormData] = useState<OnboardingData>(INITIAL_DATA);
  const [loading, setLoading] = useState(false);
  const [nicknameAvailable, setNicknameAvailable] = useState<boolean | null>(null);
  const [nicknameError, setNicknameError] = useState<string | null>(null);
  const [isCheckingNickname, setIsCheckingNickname] = useState(false);

  // Animation State
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  // --- Helpers ---

  const isStepValid = () => {
    switch (step) {
      case 'INTRO':
        return true;
      case 'PROFILE':
        return !!formData.name && nicknameAvailable === true;
      case 'NEWBIE_CHECK':
        return formData.isNewbie !== null;
      case 'NEWBIE_TRANSITION':
      case 'EXPERT_TRANSITION':
        return true;
      case 'ALCOHOL_PREF':
        return formData.preferredAlcohols.length > 0;
      case 'FOOD_PREF':
        return formData.preferredFoods.length > 0;
      case 'FLAVOR_PROFILE':
        const { acidity, sweetness, tannin, body, alcohol } = formData.flavorProfile;
        return (
          acidity !== undefined &&
          sweetness !== undefined &&
          tannin !== undefined &&
          body !== undefined &&
          alcohol !== undefined
        );
      case 'WINE_INTEREST':
        return formData.wineSort.length > 0;
      case 'BUDGET':
        return formData.monthPrice !== 0;
      case 'WINE_SORT':
        return formData.wineSort.length > 0;
      case 'WINE_AREA':
        return formData.wineArea.length > 0;
      case 'WINE_VARIETY':
        return formData.wineVariety.length > 0;
      default:
        return false;
    }
  };

  const updateData = (key: keyof OnboardingData, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const toggleSelection = (key: 'wineSort' | 'wineArea' | 'wineVariety' | 'preferredAlcohols' | 'preferredFoods', value: string) => {
    setFormData((prev) => {
      const current = prev[key] as string[]; // Type assertion since we know these keys are string[]
      if (current.includes(value)) {
        return { ...prev, [key]: current.filter((item) => item !== value) };
      } else {
        return { ...prev, [key]: [...current, value] };
      }
    });
  };

  const updateFlavorProfile = (key: keyof FlavorProfile, value: number | null) => {
    setFormData((prev) => ({
      ...prev,
      flavorProfile: {
        ...prev.flavorProfile,
        [key]: value,
      },
    }));
  };

  const handlePickImage = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.8,
    });

    if (result.assets && result.assets.length > 0) {
      updateData('profileImageUri', result.assets[0].uri);
    }
  };

  // Debounce check for nickname
  useEffect(() => {
    if (!formData.name) {
      setNicknameError(null);
      setNicknameAvailable(null);
      return;
    }

    // 초기화 및 로딩 상태
    setNicknameAvailable(null);
    setNicknameError(null);
    setIsCheckingNickname(true);

    const timer = setTimeout(async () => {
      // 1. Validation (2글자 이상, 자음/모음 단독 사용 금지)
      if (formData.name.length < 2) {
        setNicknameError('닉네임은 2글자 이상이어야 해요.');
        setNicknameAvailable(false);
        setIsCheckingNickname(false);
        return;
      }
      
      // 한글 자음/모음만 있는 경우 체크 (ㄱ-ㅎ, ㅏ-ㅣ)
      // 완성형 한글(가-힣), 영문, 숫자 등은 허용
      if (/[ㄱ-ㅎㅏ-ㅣ]/.test(formData.name)) {
        setNicknameError('올바른 닉네임 형식이 아니에요 (자음/모음 단독 사용 불가).');
        setNicknameAvailable(false);
        setIsCheckingNickname(false);
        return;
      }

      try {
        const res = await checkNickname(formData.name);
        if (res.result) {
          setNicknameAvailable(true);
          setNicknameError(null);
        } else {
          setNicknameAvailable(false);
          setNicknameError('이미 사용 중인 닉네임이에요');
        }
      } catch (e) {
        setNicknameError('닉네임 확인 중 오류가 발생했습니다.');
        setNicknameAvailable(false);
      } finally {
        setIsCheckingNickname(false);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [formData.name]);

  const handleFinalSubmit = async () => {
    setLoading(true);
    try {
      // 1. Upload Image if exists
      if (formData.profileImageUri) {
        await uploadProfileImage(formData.profileImageUri);
      }

      // 2. Send Init Info
      const requestData: MemberInitRequest = {
        name: formData.name,
        isNewbie: formData.isNewbie as boolean, // 유효성 검사 통과했으므로 null 아님
        monthPrice: formData.monthPrice,
        wineSort: formData.wineSort,
      };

      if (formData.isNewbie) {
        requestData.preferredAlcohols = formData.preferredAlcohols;
        requestData.preferredFoods = formData.preferredFoods;
        requestData.acidity = formData.flavorProfile.acidity ?? null;
        requestData.sweetness = formData.flavorProfile.sweetness ?? null;
        requestData.tannin = formData.flavorProfile.tannin ?? null;
        requestData.body = formData.flavorProfile.body ?? null;
        requestData.alcohol = formData.flavorProfile.alcohol ?? null;

        // Expert fields -> null
        requestData.wineArea = null;
        requestData.wineVariety = null;
      } else {
        requestData.wineArea = formData.wineArea;
        requestData.wineVariety = formData.wineVariety;

        // Newbie fields -> null
        requestData.preferredAlcohols = null;
        requestData.preferredFoods = null;
        requestData.acidity = null;
        requestData.sweetness = null;
        requestData.tannin = null;
        requestData.body = null;
        requestData.alcohol = null;
      }

      console.log('🔍 Onboarding Request Payload:', JSON.stringify(requestData, null, 2));

      await updateMemberInitInfo(requestData);

      // 3. Move to Recommendation Result (Do NOT complete onboarding yet)
      (navigation as any).navigate('RecommendationResult', { 
        flavorProfile: formData.flavorProfile,
        nickname: formData.name
      });
    } catch (error) {
      console.error('Onboarding Error:', error);
      Alert.alert('오류', '정보 저장 중 문제가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // --- Navigation Logic ---

  const animateTransition = (nextStepValue: Step, direction: 'next' | 'prev') => {
    // 1. Slide out current content
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: direction === 'next' ? -SCREEN_WIDTH : SCREEN_WIDTH,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // 2. Change Step & Reset position instantly for incoming
      setStep(nextStepValue);
      slideAnim.setValue(direction === 'next' ? SCREEN_WIDTH : -SCREEN_WIDTH);
      
      // 3. Slide in new content
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const nextStep = () => {
    let next: Step | null = null;

    switch (step) {
      case 'INTRO':
        next = 'PROFILE';
        break;
      case 'PROFILE':
        // 버튼이 비활성화되므로 별도 Alert 필요 없음
        next = 'NEWBIE_CHECK';
        break;
      case 'NEWBIE_CHECK':
        next = formData.isNewbie ? 'NEWBIE_TRANSITION' : 'EXPERT_TRANSITION';
        break;
      
      // Newbie Path
      case 'NEWBIE_TRANSITION':
        next = 'ALCOHOL_PREF';
        break;
      case 'ALCOHOL_PREF':
        next = 'FOOD_PREF';
        break;
      case 'FOOD_PREF':
        next = 'FLAVOR_PROFILE';
        break;
      case 'FLAVOR_PROFILE':
        next = 'WINE_INTEREST';
        break;
      case 'WINE_INTEREST':
        next = 'BUDGET';
        break;

      // Expert Path
      case 'EXPERT_TRANSITION':
        next = 'BUDGET';
        break;
      case 'BUDGET':
        // 뉴비는 BUDGET이 마지막 단계
        if (formData.isNewbie) {
          handleFinalSubmit();
          return;
        }
        next = 'WINE_SORT';
        break;
      case 'WINE_SORT':
        next = 'WINE_AREA';
        break;
      case 'WINE_AREA':
        next = 'WINE_VARIETY';
        break;
      case 'WINE_VARIETY':
        // 전문가는 WINE_VARIETY가 마지막 단계
        handleFinalSubmit();
        return;
    }

    if (next) {
      animateTransition(next, 'next');
    }
  };

  const prevStep = () => {
    let prev: Step | null = null;

    if (step === 'PROFILE') prev = 'INTRO';
    if (step === 'NEWBIE_CHECK') prev = 'PROFILE';
    
    if (step === 'NEWBIE_TRANSITION') prev = 'NEWBIE_CHECK';
    if (step === 'ALCOHOL_PREF') prev = 'NEWBIE_TRANSITION';
    if (step === 'FOOD_PREF') prev = 'ALCOHOL_PREF';
    if (step === 'FLAVOR_PROFILE') prev = 'FOOD_PREF';
    if (step === 'WINE_INTEREST') prev = 'FLAVOR_PROFILE';
    
    if (step === 'EXPERT_TRANSITION') prev = 'NEWBIE_CHECK';
    if (step === 'BUDGET') {
        if (formData.isNewbie) prev = 'WINE_INTEREST';
        else prev = 'EXPERT_TRANSITION';
    }

    if (step === 'WINE_SORT') prev = 'BUDGET';
    if (step === 'WINE_AREA') prev = 'WINE_SORT';
    if (step === 'WINE_VARIETY') prev = 'WINE_AREA';

    if (prev) {
      animateTransition(prev, 'prev');
    }
  };

  // --- Render Steps ---

  const getProgress = () => {
    if (step === 'INTRO') return 0;
    
    // Newbie: 8 steps, Expert: 7 steps
    // 아직 isNewbie가 결정되지 않았거나(null) true이면 8단계로 가정
    const totalSteps = formData.isNewbie === false ? 7 : 8;
    let currentStep = 0;

    switch (step) {
      case 'PROFILE': currentStep = 1; break;
      case 'NEWBIE_CHECK': currentStep = 2; break;
      
      case 'NEWBIE_TRANSITION':
      case 'EXPERT_TRANSITION': 
        currentStep = 3; break;

      case 'ALCOHOL_PREF': currentStep = 4; break;
      case 'FOOD_PREF': currentStep = 5; break;
      case 'FLAVOR_PROFILE': currentStep = 6; break;
      case 'WINE_INTEREST': currentStep = 7; break;
      
      case 'BUDGET':
         // Newbie: 8th step (Last)
         // Expert: 4th step
         currentStep = formData.isNewbie ? 8 : 4;
         break;
      
      case 'WINE_SORT': currentStep = 5; break;
      case 'WINE_AREA': currentStep = 6; break;
      case 'WINE_VARIETY': currentStep = 7; break;
    }
    
    return currentStep / totalSteps;
  };

  // --- Effects ---

  // Animate progress bar whenever step changes
  useEffect(() => {
    if (step === 'INTRO') {
       progressAnim.setValue(0);
       return;
    }

    const targetProgress = getProgress();
    Animated.timing(progressAnim, {
      toValue: targetProgress,
      duration: 300,
      useNativeDriver: false, 
    }).start();
  }, [step, formData.isNewbie]);

  const renderProgressBar = () => {
    if (step === 'INTRO') return null;

    const widthInterpolation = progressAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['0%', '100%'],
    });

    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressBarBackground}>
          <Animated.View 
            style={[
              styles.progressBarFill, 
              { width: widthInterpolation }
            ]} 
          />
        </View>
      </View>
    );
  };

  const renderContent = () => {
    switch (step) {
      case 'INTRO': 
        return <IntroStep />;
      case 'PROFILE': 
        return (
          <ProfileStep 
            name={formData.name}
            profileImageUri={formData.profileImageUri}
            onNameChange={(t: string) => updateData('name', t)}
            onPickImage={handlePickImage}
            errorMessage={nicknameError}
            isValid={nicknameAvailable}
          />
        );
      case 'NEWBIE_CHECK': 
        return (
          <NewbieCheckStep 
            isNewbie={formData.isNewbie}
            onSelect={(val: boolean) => updateData('isNewbie', val)}
            name={formData.name}
          />
        );
      case 'NEWBIE_TRANSITION': 
        return <TransitionStep isNewbie={true} name={formData.name} />;
      case 'EXPERT_TRANSITION': 
        return <TransitionStep isNewbie={false} name={formData.name} />;
      case 'ALCOHOL_PREF': 
        return (
          <MultiSelectionStep
            title="평소에 어떤 술을 즐기시나요?"
            options={ALCOHOL_OPTIONS}
            selected={formData.preferredAlcohols}
            onSelect={(v: string) => toggleSelection('preferredAlcohols', v)}
            multi
            allowCustomInput
          />
        );
      case 'FOOD_PREF': 
        return (
          <MultiSelectionStep
            title="어떤 음식과 함께 즐기고 싶나요?"
            options={FOOD_OPTIONS}
            selected={formData.preferredFoods}
            onSelect={(v: string) => toggleSelection('preferredFoods', v)}
            multi
          />
        );
      case 'FLAVOR_PROFILE':
        return (
          <FlavorProfileStep
            data={formData.flavorProfile}
            onChange={updateFlavorProfile}
          />
        );
      case 'WINE_INTEREST':
        return (
          <MultiSelectionStep
            title="관심 있는 와인 종류는?"
            options={WINE_SORTS} // 6개 항목 모두 포함된 상수 사용
            selected={formData.wineSort}
            onSelect={(v: string) => toggleSelection('wineSort', v)}
            multi
          />
        );
      case 'BUDGET': 
        return (
          <BudgetStep 
            selectedPrice={formData.monthPrice}
            onSelect={(v: number) => updateData('monthPrice', v)}
            options={BUDGET_OPTIONS}
          />
        );
      case 'WINE_SORT': 
        return (
          <MultiSelectionStep
            title="선호하는 와인 종류"
            options={WINE_SORTS}
            selected={formData.wineSort}
            onSelect={(v: string) => toggleSelection('wineSort', v)}
            multi
          />
        );
      case 'WINE_AREA': 
        return (
          <MultiSelectionStep
            title="선호하는 와인 생산지"
            options={WINE_AREAS}
            selected={formData.wineArea}
            onSelect={(v: string) => toggleSelection('wineArea', v)}
            multi
          />
        );
      case 'WINE_VARIETY': 
        return (
          <MultiSelectionStep
            title="선호하는 포도 품종"
            options={WINE_VARIETIES}
            selected={formData.wineVariety}
            onSelect={(v: string) => toggleSelection('wineVariety', v)}
            multi
          />
        );
      default: return null;
    }
  };

  const getButtonText = () => {
    if (loading) return '저장 중...';

    switch (step) {
      case 'INTRO':
        return '좋아요';
      case 'PROFILE':
        return '다음';
      case 'NEWBIE_CHECK':
        return '선택 완료';
      case 'NEWBIE_TRANSITION':
        return '취향 찾으러 가기';
      case 'EXPERT_TRANSITION':
        return '취향 등록하러 가기';
      case 'BUDGET':
        return formData.isNewbie ? '결과 보기' : '다음';
      case 'WINE_VARIETY':
        return '결과 보기';
      default:
        return '다음';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
        <View style={styles.header}>
            {step !== 'INTRO' && (
                <TouchableOpacity onPress={prevStep} style={styles.backButton}>
                    <Icon name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
            )}
        </View>
        
        {renderProgressBar()}

        <Animated.View 
          style={[
            styles.body, 
            { 
              transform: [{ translateX: slideAnim }],
              opacity: fadeAnim
            }
          ]}
        >
            {renderContent()}
        </Animated.View>

        <View style={styles.footer}>
            <TouchableOpacity 
                style={[
                  styles.nextButton, 
                  (loading || !isStepValid()) && styles.disabledButton
                ]} 
                onPress={nextStep}
                disabled={loading || !isStepValid()}
            >
                {loading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.nextButtonText}>{getButtonText()}</Text>
                )}
            </TouchableOpacity>
        </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    height: 50,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  backButton: {
    padding: 8,
  },
  progressContainer: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: '#333',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#8e44ad',
    borderRadius: 3,
  },
  body: {
    flex: 1,
    paddingHorizontal: 24,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#222',
  },
  nextButton: {
    width: '100%',
    height: 56,
    backgroundColor: '#8e44ad',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default OnboardingScreen;
