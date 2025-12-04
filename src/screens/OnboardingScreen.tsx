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

// Import Step Components
import IntroStep from '../components/onboarding/IntroStep';
import ProfileStep from '../components/onboarding/ProfileStep';
import NewbieCheckStep from '../components/onboarding/NewbieCheckStep';
import TransitionStep from '../components/onboarding/TransitionStep';
import { SingleSelectionStep, MultiSelectionStep } from '../components/onboarding/SelectionSteps';
import BudgetStep from '../components/onboarding/BudgetStep';
import SummaryStep from '../components/onboarding/SummaryStep';

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
  | 'WINE_INTEREST' // Red vs White
  // Expert Flow
  | 'EXPERT_TRANSITION'
  | 'WINE_SORT'
  | 'WINE_AREA'
  | 'WINE_VARIETY'
  // Shared
  | 'BUDGET'
  | 'SUMMARY';

interface OnboardingData {
  name: string;
  profileImageUri: string | null;
  isNewbie: boolean;
  monthPrice: number;
  wineSort: string[];
  wineArea: string[];
  wineVariety: string[];
  // Local only
  preferredAlcohol?: string;
  preferredFood?: string;
}

const INITIAL_DATA: OnboardingData = {
  name: '',
  profileImageUri: null,
  isNewbie: false,
  monthPrice: 0,
  wineSort: [],
  wineArea: [],
  wineVariety: [],
};

// Options for selections
const ALCOHOL_OPTIONS = ['소주', '맥주', '위스키', '칵테일', '막걸리', '기타'];
const FOOD_OPTIONS = ['육류', '해산물', '치즈', '디저트', '한식', '양식'];
const WINE_SORTS = ['RED', 'WHITE', 'SPARKLING', 'ROSE', 'FORTIFIED'];
const WINE_AREAS = ['FRANCE', 'ITALY', 'USA', 'CHILE', 'SPAIN', 'AUSTRALIA', 'NEW_ZEALAND', 'ARGENTINA'];
const WINE_VARIETIES = ['CABERNET_SAUVIGNON', 'MERLOT', 'PINOT_NOIR', 'CHARDONNAY', 'SAUVIGNON_BLANC', 'SYRAH', 'RIESLING'];
const BUDGET_OPTIONS = [
  { label: '3만원 미만', value: 30000 },
  { label: '3~5만원', value: 50000 },
  { label: '5~10만원', value: 100000 },
  { label: '10만원 이상', value: 150000 },
];

// ----------------------
// Component
// ----------------------

const OnboardingScreen = () => {
  const { completeOnboarding } = useUser();
  
  const [step, setStep] = useState<Step>('INTRO');
  const [formData, setFormData] = useState<OnboardingData>(INITIAL_DATA);
  const [loading, setLoading] = useState(false);
  const [nicknameAvailable, setNicknameAvailable] = useState<boolean | null>(null);

  // Animation State
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  // --- Helpers ---

  const updateData = (key: keyof OnboardingData, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const toggleSelection = (key: 'wineSort' | 'wineArea' | 'wineVariety', value: string) => {
    setFormData((prev) => {
      const current = prev[key];
      if (current.includes(value)) {
        return { ...prev, [key]: current.filter((item) => item !== value) };
      } else {
        return { ...prev, [key]: [...current, value] };
      }
    });
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

  const handleCheckNickname = async () => {
    if (!formData.name) return;
    try {
      const res = await checkNickname(formData.name);
      setNicknameAvailable(res.result);
      if (res.result) {
        Alert.alert('확인', '사용 가능한 닉네임입니다.');
      } else {
        Alert.alert('중복', '이미 사용 중인 닉네임입니다.');
      }
    } catch (e) {
      console.error(e);
      Alert.alert('오류', '닉네임 확인 중 오류가 발생했습니다.');
    }
  };

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
        isNewbie: formData.isNewbie,
        monthPrice: formData.monthPrice,
        wineSort: formData.wineSort,
        wineArea: formData.wineArea,
        wineVariety: formData.wineVariety,
      };

      await updateMemberInitInfo(requestData);

      // 3. Complete locally
      completeOnboarding();
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
        if (!formData.name) {
          Alert.alert('알림', '닉네임을 입력해주세요.');
          return;
        }
        if (nicknameAvailable === false) {
           Alert.alert('알림', '닉네임 중복 확인을 해주세요.');
        }
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
        next = formData.isNewbie ? 'SUMMARY' : 'WINE_SORT';
        break;
      case 'WINE_SORT':
        next = 'WINE_AREA';
        break;
      case 'WINE_AREA':
        next = 'WINE_VARIETY';
        break;
      case 'WINE_VARIETY':
        next = 'SUMMARY';
        break;
      
      case 'SUMMARY':
        handleFinalSubmit();
        return; // No animation for submit
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
    if (step === 'WINE_INTEREST') prev = 'FOOD_PREF';
    
    if (step === 'EXPERT_TRANSITION') prev = 'NEWBIE_CHECK';
    if (step === 'BUDGET') {
        if (formData.isNewbie) prev = 'WINE_INTEREST';
        else prev = 'EXPERT_TRANSITION';
    }

    if (step === 'WINE_SORT') prev = 'BUDGET';
    if (step === 'WINE_AREA') prev = 'WINE_SORT';
    if (step === 'WINE_VARIETY') prev = 'WINE_AREA';

    if (step === 'SUMMARY') {
        if (formData.isNewbie) prev = 'BUDGET';
        else prev = 'WINE_VARIETY';
    }

    if (prev) {
      animateTransition(prev, 'prev');
    }
  };

  // --- Render Steps ---

  const getProgress = () => {
    if (step === 'INTRO') return 0;
    
    // 총 8단계 (PROFILE ~ SUMMARY)
    const totalSteps = 8;
    let currentStep = 0;

    switch (step) {
      case 'PROFILE': currentStep = 1; break;
      case 'NEWBIE_CHECK': currentStep = 2; break;
      
      case 'NEWBIE_TRANSITION':
      case 'EXPERT_TRANSITION': 
        currentStep = 3; break;

      case 'ALCOHOL_PREF': currentStep = 4; break;
      case 'BUDGET':
         // Expert일 때 BUDGET은 4번째, Newbie일 때 BUDGET은 7번째
         currentStep = formData.isNewbie ? 7 : 4;
         break;
      
      case 'FOOD_PREF': currentStep = 5; break;
      case 'WINE_SORT': currentStep = 5; break;
      
      case 'WINE_INTEREST': currentStep = 6; break;
      case 'WINE_AREA': currentStep = 6; break;
      
      case 'WINE_VARIETY': currentStep = 7; break;

      case 'SUMMARY': currentStep = 8; break;
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
            onNameChange={(t) => updateData('name', t)}
            onPickImage={handlePickImage}
            onCheckNickname={handleCheckNickname}
          />
        );
      case 'NEWBIE_CHECK': 
        return (
          <NewbieCheckStep 
            isNewbie={formData.isNewbie}
            onSelect={(val) => updateData('isNewbie', val)}
          />
        );
      case 'NEWBIE_TRANSITION': 
        return <TransitionStep isNewbie={true} />;
      case 'EXPERT_TRANSITION': 
        return <TransitionStep isNewbie={false} />;
      case 'ALCOHOL_PREF': 
        return (
          <SingleSelectionStep
            title="평소에 어떤 술을 즐기시나요?"
            options={ALCOHOL_OPTIONS}
            selected={formData.preferredAlcohol}
            onSelect={(v) => updateData('preferredAlcohol', v)}
          />
        );
      case 'FOOD_PREF': 
        return (
          <SingleSelectionStep
            title="어떤 음식과 함께 즐기고 싶나요?"
            options={FOOD_OPTIONS}
            selected={formData.preferredFood}
            onSelect={(v) => updateData('preferredFood', v)}
          />
        );
      case 'WINE_INTEREST':
        return (
          <MultiSelectionStep
            title="관심 있는 와인 종류는?"
            options={['RED', 'WHITE']}
            selected={formData.wineSort}
            onSelect={(v) => toggleSelection('wineSort', v)}
            multi
          />
        );
      case 'BUDGET': 
        return (
          <BudgetStep 
            selectedPrice={formData.monthPrice}
            onSelect={(v) => updateData('monthPrice', v)}
            options={BUDGET_OPTIONS}
          />
        );
      case 'WINE_SORT': 
        return (
           <MultiSelectionStep
            title="선호하는 와인 종류"
            options={WINE_SORTS}
            selected={formData.wineSort}
            onSelect={(v) => toggleSelection('wineSort', v)}
            multi
          />
        );
      case 'WINE_AREA': 
        return (
          <MultiSelectionStep
            title="선호하는 와인 생산지"
            options={WINE_AREAS}
            selected={formData.wineArea}
            onSelect={(v) => toggleSelection('wineArea', v)}
            multi
          />
        );
      case 'WINE_VARIETY': 
        return (
          <MultiSelectionStep
            title="선호하는 포도 품종"
            options={WINE_VARIETIES}
            selected={formData.wineVariety}
            onSelect={(v) => toggleSelection('wineVariety', v)}
            multi
          />
        );
      case 'SUMMARY': 
        return <SummaryStep data={formData} />;
      default: return null;
    }
  };

  const getButtonText = () => {
    if (step === 'INTRO') return '시작하기';
    if (step === 'SUMMARY') return loading ? '저장 중...' : '완료';
    return '다음';
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
                style={[styles.nextButton, loading && styles.disabledButton]} 
                onPress={nextStep}
                disabled={loading}
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
