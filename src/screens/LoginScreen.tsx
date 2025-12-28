import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Platform,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { appleAuth, AppleButton } from '@invertase/react-native-apple-authentication';
import * as KakaoLogin from '@react-native-seoul/kakao-login';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { loginWithApple, loginWithKakao } from '../api/member';
import { useUser } from '../context/UserContext';
import { useGlobalUI } from '../context/GlobalUIContext';

const LoginScreen = () => {
  const navigation = useNavigation();
  const { login } = useUser();
  const { showLoading, hideLoading, showAlert } = useGlobalUI();
  const [loading, setLoading] = useState(false);


  useFocusEffect(
    React.useCallback(() => {
      hideLoading();
      setLoading(false);
    }, [hideLoading])
  );


  const parseJwt = (token: string) => {
    try {
      const base64Url = token.split('.')[1];
      // @ts-ignore
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      // @ts-ignore
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c: string) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (e) {
      console.error('Token decode failed:', e);
      return null;
    }
  };

  const onAppleButtonPress = async () => {
    if (loading) return;
    setLoading(true);
    try {
      console.log('1. Starting Apple Auth Request');

      const appleAuthRequestResponse = await appleAuth.performRequest({
        requestedOperation: appleAuth.Operation.LOGIN,
        requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
      });

      console.log('2. Apple Auth Completed');


      if (!appleAuthRequestResponse.identityToken) {
        throw new Error('Apple Identity Token is missing');
      }



      console.log('4. Sending Token to Server...');

      const response = await loginWithApple(appleAuthRequestResponse.identityToken);
      console.log('5. Server Response:', JSON.stringify(response));

      if (response.isSuccess) {

        const { accessToken, refreshToken, isFirst } = response.result;
        console.log('6. Tokens received:', { hasAccess: !!accessToken, hasRefresh: !!refreshToken, isFirst });

        if (accessToken) {
          await login(accessToken, refreshToken, isFirst);
          console.log('7. Login Context Updated');


        } else {
          console.error('Token missing in result:', response.result);
          showAlert({
            title: '로그인 실패',
            message: '서버로부터 토큰을 받지 못했습니다.',
            singleButton: true,
          });
        }
      } else {
        console.error('Server returned fail:', response);
        showAlert({
          title: '로그인 실패',
          message: response.message || '로그인 중 오류가 발생했습니다.',
          singleButton: true,
        });
      }
      // }
    } catch (error: any) {
      if (error.code === appleAuth.Error.CANCELED) {
        console.log('User canceled Apple Sign In');
      } else {
        console.error('Apple Login Error Full:', error);
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

      const token = await KakaoLogin.login();


      const profile = await KakaoLogin.getProfile();

      console.log('Kakao Profile:', profile);


      const response = await loginWithKakao(
        profile.nickname,
        profile.email,
        profile.id.toString()
      );


      if (response.isSuccess) {
        const { accessToken, refreshToken, isFirst } = response.result;

        if (accessToken) {
          await login(accessToken, refreshToken, isFirst);
        } else {
          showAlert({
            title: '로그인 실패',
            message: '서버로부터 토큰을 받지 못했습니다.',
            singleButton: true,
          });
        }
      } else {
        showAlert({
          title: '로그인 실패',
          message: response.message,
          singleButton: true,
        });
      }
    } catch (error: any) {
      if (error.code === 'E_CANCELLED_OPERATION') {
        console.log('Login Cancelled');
      } else {
        console.error('Kakao Login Error:', error);
        showAlert({
          title: '오류',
          message: '카카오 로그인에 실패했습니다.',
          singleButton: true,
        });
      }
    } finally {
      setLoading(false);
    }
  };



  return (
    <View style={styles.container}>

      <View style={styles.backgroundCircle1} />
      <View style={styles.backgroundCircle2} />
      <View style={styles.backgroundCircle3} />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.contentContainer}>
          <View style={styles.logoContainer}>
            <Image
              source={require('../assets/Standard_profile.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.sloganText}>와인이 쉬워진다, 드링키지</Text>
          </View>

          <View style={styles.bottomContainer}>
            {loading ? (
              <ActivityIndicator size="large" color="#fff" style={{ marginBottom: 20 }} />
            ) : (
              Platform.OS === 'ios' && (
                <TouchableOpacity
                  style={styles.appleCustomButton}
                  onPress={onAppleButtonPress}
                >
                  <View style={styles.buttonContent}>
                    <Icon name="logo-apple" size={20} color="#000" />
                    <Text style={styles.appleButtonText}>Apple로 시작하기</Text>
                  </View>
                </TouchableOpacity>
              )
            )}

            {!loading && (
              <TouchableOpacity
                style={styles.kakaoButton}
                onPress={onKakaoButtonPress}
              >
                <View style={styles.buttonContent}>
                  <Icon name="chatbubble-sharp" size={20} color="#000" />
                  <Text style={styles.kakaoButtonText}>카카오로 시작하기</Text>
                </View>
              </TouchableOpacity>
            )}


          </View>
        </View>
      </SafeAreaView>
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
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  logoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 350,
    height: 350,
  },
  sloganText: {
    color: '#FFFFFF',
    fontSize: 22,
    marginTop: 20,
    fontWeight: '600',
    opacity: 0.9,
  },
  bottomContainer: {
    width: '100%',
    gap: 10,
    paddingBottom: 40,
  },
  appleCustomButton: {
    width: '100%',
    height: 50,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appleButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
  kakaoButton: {
    width: '100%',
    height: 50,
    backgroundColor: '#FEE500',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  kakaoButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
  guestButton: {
    width: '100%',
    padding: 16,
    alignItems: 'center',
  },
  guestButtonText: {
    color: '#888',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});

export default LoginScreen;
