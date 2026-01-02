import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  FlatList,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { appleAuth } from '@invertase/react-native-apple-authentication';
import * as KakaoLogin from '@react-native-seoul/kakao-login';
import auth from '@react-native-firebase/auth';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { exchangeKakaoToken, appleLogin } from '../api/member';
import { useUser } from '../context/UserContext';
import { useGlobalUI } from '../context/GlobalUIContext';

const width = Dimensions.get('window').width;

const slides = [
  {
    id: '1',
    image: require('../assets/onboarding/Drinky_onboarding_2.png'),
    title: '몰랐던 와인 취향을\n가장 쉽게 발견해보세요',
  },
  {
    id: '2',
    image: require('../assets/onboarding/Drinky_onboarding_3.png'),
    title: '나만의 와인 기록을\n남겨보세요',
  },
  {
    id: '3',
    image: require('../assets/onboarding/Drinky_smart_organize.png'),
    title: '보유한 와인을\n똑똑하게 관리하세요',
  },
  {
    id: '4',
    image: require('../assets/onboarding/Drinky-search.png'),
    title: '궁금한 와인을\n검색해보세요',
  },
];

const Slide = ({ item }: { item: typeof slides[0] }) => {
  return (
    <View style={[styles.slide, { width }]}>
      <Image
        source={item.image}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.sloganText}>{item.title}</Text>
    </View>
  );
};

const LoginScreen = () => {
  const navigation = useNavigation();
  const { login } = useUser();
  const { showLoading, hideLoading, showAlert } = useGlobalUI();
  const [loading, setLoading] = useState(false);
  const { width } = Dimensions.get('window');

  const onEmailLoginLinkPress = () => {
    if (loading) return;
    navigation.navigate('EmailLogin'); // Assuming you have an 'EmailLogin' screen in your navigator
  };

  useFocusEffect(
    React.useCallback(() => {
      hideLoading();
      setLoading(false);
    }, [hideLoading])
  );



  const onAppleButtonPress = async () => {
    if (loading) return;
    setLoading(true);
    try {
      // 1. Start the Apple login process
      const appleAuthRequestResponse = await appleAuth.performRequest({
        requestedOperation: appleAuth.Operation.LOGIN,
        requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
      });

      if (!appleAuthRequestResponse.identityToken) {
        throw new Error('Apple Identity Token is missing');
      }

      const { identityToken } = appleAuthRequestResponse;

      // 2. Exchange Identity Token for Backend Access Token
      const response = await appleLogin(identityToken);

      if (response.isSuccess && response.result) {
        const { accessToken, refreshToken } = response.result;
        // 3. Login via UserContext (Saves tokens and updates state)
        await login(accessToken, refreshToken);
      } else {
        throw new Error(response.message || 'Token exchange failed');
      }

    } catch (error: any) {
      if (error.code === appleAuth.Error.CANCELED) {
        // User canceled Apple Sign In - do nothing
      } else {
        console.error('Apple Login Error:', error);
        showAlert({
          title: '로그인 오류',
          message: `Apple 로그인 실패: ${error.message || error.code || '알 수 없는 오류'}`,
          singleButton: true,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const onKakaoButtonPress = async () => {
    if (loading) return;
    setLoading(true);
    try {
      // 1. Get Access Token from Kakao SDK
      const token = await KakaoLogin.login();

      // 2. Exchange Kakao Token for Firebase Custom Token via Backend
      const { customToken } = await exchangeKakaoToken(token.accessToken);

      if (!customToken) {
        throw new Error('Failed to get custom token from server');
      }

      // 3. Sign In with Firebase Custom Token
      await auth().signInWithCustomToken(customToken);

      // UserContext will handle navigation

    } catch (error: any) {
      if (error.code === 'E_CANCELLED_OPERATION') {
        // Login Cancelled
      } else {
        console.error('Kakao Login Error:', error);
        showAlert({
          title: '오류',
          message: '카카오 로그인에 실패했습니다. 관리자에게 문의하세요.',
          singleButton: true,
        });
      }
    } finally {
      setLoading(false);
    }
  };



  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  const floatAnim1 = React.useRef(new Animated.Value(0)).current;
  const floatAnim2 = React.useRef(new Animated.Value(0)).current;
  const floatAnim3 = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim1, {
          toValue: -20,
          duration: 4000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim1, {
          toValue: 0,
          duration: 4000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim2, {
          toValue: 15,
          duration: 5000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim2, {
          toValue: 0,
          duration: 5000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(floatAnim3, {
            toValue: -10,
            duration: 3500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(floatAnim3, {
            toValue: 0,
            duration: 3500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();
  }, []);

  const updateCurrentSlideIndex = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffsetX = e.nativeEvent.contentOffset.x;
    const currentIndex = Math.round(contentOffsetX / width);
    setCurrentSlideIndex(currentIndex);
  };

  return (
    <View style={styles.container}>

      <Animated.View style={[styles.backgroundCircle1, { transform: [{ translateY: floatAnim1 }] }]} />
      <Animated.View style={[styles.backgroundCircle2, { transform: [{ translateY: floatAnim2 }] }]} />
      <Animated.View style={[styles.backgroundCircle3, { transform: [{ translateY: floatAnim3 }] }]} />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.contentContainer}>
          <View style={styles.carouselContainer}>
            <FlatList
              data={slides}
              contentContainerStyle={{ height: '100%' }}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              renderItem={({ item }) => <Slide item={item} />}
              onMomentumScrollEnd={updateCurrentSlideIndex}
              keyExtractor={(item) => item.id}
            />
            <View style={styles.indicatorContainer}>
              {slides.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.indicator,
                    currentSlideIndex === index && styles.indicatorActive,
                  ]}
                />
              ))}
            </View>
          </View>

          <View style={styles.bottomContainer}>
            {/* Social Login Buttons */}
            <View style={styles.buttonContainer}>
              {/* Apple Login */}
              {Platform.OS === 'ios' && (
                <TouchableOpacity
                  style={styles.appleButton}
                  onPress={onAppleButtonPress}
                  disabled={loading}
                >
                  <Icon name="logo-apple" size={20} color="#000" style={styles.buttonIcon} />
                  <Text style={styles.appleButtonText}>Apple로 시작하기</Text>
                </TouchableOpacity>
              )}

              {/* Kakao Login */}
              <TouchableOpacity
                style={styles.kakaoButton}
                onPress={onKakaoButtonPress}
                disabled={loading}
              >
                <Icon name="chatbubble" size={20} color="#000" style={styles.buttonIcon} />
                <Text style={styles.kakaoButtonText}>카카오로 시작하기</Text>
              </TouchableOpacity>

              {/* Email Login Link */}
              <TouchableOpacity
                style={styles.emailLoginLink}
                onPress={onEmailLoginLinkPress}
                disabled={loading}
              >
                <Text style={styles.emailLoginLinkText}>이메일로 로그인</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </SafeAreaView>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#FFF" />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  safeArea: {
    flex: 1,
  },
  backgroundCircle1: {
    position: 'absolute',
    top: -100,
    left: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#7E13B1',
    opacity: 0.15,
  },
  backgroundCircle2: {
    position: 'absolute',
    bottom: -50,
    right: -50,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: '#7E13B1',
    opacity: 0.15,
  },
  backgroundCircle3: {
    position: 'absolute',
    top: '40%',
    left: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#9b59b6',
    opacity: 0.1,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 40,
  },
  carouselContainer: {
    flex: 1,
    height: '65%', // Adjust based on your design needs relative to buttons
    justifyContent: 'center',
    alignItems: 'center',
  },
  slide: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  logo: {
    width: 280, // Slightly improved size for carousel
    height: 280,
    marginBottom: 30,
  },
  sloganText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 34,
  },
  indicatorContainer: {
    position: 'absolute',
    bottom: 30,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  indicator: {
    height: 8,
    width: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
    opacity: 0.2,
  },
  indicatorActive: {
    width: 24, // Elongated active dot
    opacity: 1,
  },
  bottomContainer: {
    width: '100%',
    paddingHorizontal: 24,
    paddingBottom: 20, // Reduced padding bottom slightly
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
    marginTop: 20, // Add some spacing from carousel
  },
  appleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderRadius: 12,
    width: '100%',
  },
  appleButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  kakaoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE500',
    paddingVertical: 16,
    borderRadius: 12,
    width: '100%',
  },
  kakaoButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  buttonIcon: {
    marginRight: 4,
  },
  emailLoginLink: {
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 0,
  },
  emailLoginLinkText: {
    color: '#999',
    fontSize: 13,
    textDecorationLine: 'underline',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default LoginScreen;
