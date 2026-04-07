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
  Linking,
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
import { colors } from '../constants/colors';

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
  const { showLoading, hideLoading, showToast } = useGlobalUI();
  const [loading, setLoading] = useState(false);
  const { width } = Dimensions.get('window');



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
      const appleAuthRequestResponse = await appleAuth.performRequest({
        requestedOperation: appleAuth.Operation.LOGIN,
        requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
      });

      if (!appleAuthRequestResponse.identityToken) {
        throw new Error('Apple Identity Token is missing');
      }

      const { identityToken } = appleAuthRequestResponse;

      const response = await appleLogin(identityToken);

      if (response.isSuccess && response.result) {
        const { accessToken, refreshToken, isFirst } = response.result;
        await login(accessToken, refreshToken, isFirst);
      } else {
        throw new Error(response.message || 'Token exchange failed');
      }

    } catch (error: any) {
      if (error.code === appleAuth.Error.CANCELED) {
      } else {
        console.error('Apple Login Error:', error);
        showToast(`Apple 로그인 실패: ${error.message || error.code || '알 수 없는 오류'}`, { type: 'error' });
      }
    } finally {
      setLoading(false);
    }
  };

  const onKakaoButtonPress = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const token = await KakaoLogin.login();
      const response: any = await exchangeKakaoToken(token.accessToken);

      let customToken, accessToken, refreshToken, isFirst;

      if (response && response.accessToken) {
        ({ customToken, accessToken, refreshToken, isFirst } = response);
      } else if (response && response.result) {
        ({ customToken, accessToken, refreshToken, isFirst } = response.result);
      } else {
        ({ customToken } = response || {});
      }

      if (customToken) {
        try {
          await auth().signInWithCustomToken(customToken);
        } catch (firebaseError) {
          console.warn('Firebase login failed:', firebaseError);
        }
      }

      if (accessToken && refreshToken) {
        await login(accessToken, refreshToken, isFirst);
      } else {
        console.error('Missing backend tokens in response:', response);
        throw new Error('Failed to retrieve access tokens from server.');
      }

    } catch (error: any) {
      if (error.code === 'E_CANCELLED_OPERATION') {
        showToast('카카오 로그인이 취소되었습니다.', { type: 'info' });
      } else {
        console.error('Kakao Login Error:', error);
        showToast('카카오 로그인에 실패했습니다. 관리자에게 문의하세요.', { type: 'error' });
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
                  <Icon name="logo-apple" size={20} color={colors.black} style={styles.buttonIcon} />
                  <Text style={styles.appleButtonText}>Apple로 시작하기</Text>
                </TouchableOpacity>
              )}

              {/* Kakao Login */}
              <TouchableOpacity
                style={styles.kakaoButton}
                onPress={onKakaoButtonPress}
                disabled={loading}
              >
                <Icon name="chatbubble" size={20} color={colors.black} style={styles.buttonIcon} />
                <Text style={styles.kakaoButtonText}>카카오로 시작하기</Text>
              </TouchableOpacity>


            </View>

            {/* Terms of Service Agreement */}
            <View style={styles.agreementContainer}>
              <Text style={styles.agreementText}>
                로그인하시면{' '}
                <Text
                  style={styles.agreementLink}
                  onPress={() => Linking.openURL('https://web.drinkig.com/terms')}>
                  이용약관
                </Text>
                에 동의하는 것으로 간주됩니다
              </Text>
            </View>
          </View>
        </View>
      </SafeAreaView>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.white} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
    backgroundColor: colors.primaryDark,
    opacity: 0.15,
  },
  backgroundCircle2: {
    position: 'absolute',
    bottom: -50,
    right: -50,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: colors.primaryDark,
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
    height: '65%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  slide: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  logo: {
    width: 280,
    height: 280,
    marginBottom: 30,
  },
  sloganText: {
    color: colors.textPrimary,
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
    backgroundColor: colors.white,
    borderRadius: 4,
    opacity: 0.2,
  },
  indicatorActive: {
    width: 24,
    opacity: 1,
  },
  bottomContainer: {
    width: '100%',
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
    marginTop: 20,
  },
  appleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    paddingVertical: 16,
    borderRadius: 12,
    width: '100%',
  },
  appleButtonText: {
    color: colors.black,
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
    color: colors.black,
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
    color: colors.textSecondary,
    fontSize: 13,
    textDecorationLine: 'underline',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(25, 22, 28, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  agreementContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  agreementText: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  agreementLink: {
    textDecorationLine: 'underline',
    color: colors.textSecondary,
  },
});

export default LoginScreen;
