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
import { useNavigation } from '@react-navigation/native';
import { loginWithApple, loginWithKakao } from '../api/member';
import { useUser } from '../context/UserContext';

const LoginScreen = () => {
  const navigation = useNavigation();
  const { login } = useUser();
  const [loading, setLoading] = useState(false);

  // JWT 디코딩 함수 (Payload 확인용 - 순수 JS 구현)
  const parseJwt = (token: string) => {
    try {
      const base64Url = token.split('.')[1];
      // @ts-ignore
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      // @ts-ignore
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c: string) {
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
      // 1. 애플 로그인 요청
      const appleAuthRequestResponse = await appleAuth.performRequest({
        requestedOperation: appleAuth.Operation.LOGIN,
        requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
      });
      
      console.log('2. Apple Auth Completed');
      
      // 2. identityToken이 있는지 확인
      if (!appleAuthRequestResponse.identityToken) {
        throw new Error('Apple Identity Token is missing');
      }

      // [DEBUG] 토큰 내용 확인 (Bundle ID 검증)
      const decodedToken = parseJwt(appleAuthRequestResponse.identityToken);
      console.log('--------------------------------------------------');
      console.log('[DEBUG] Decoded Token Payload:', JSON.stringify(decodedToken, null, 2));
      console.log('[DEBUG] Token Audience (Bundle ID):', decodedToken?.aud);
      console.log('--------------------------------------------------');

      console.log('4. Sending Token to Server...');
        // 3. 서버로 로그인 요청
        const response = await loginWithApple(appleAuthRequestResponse.identityToken);
        console.log('5. Server Response:', JSON.stringify(response));

        if (response.isSuccess) {   
          // 4. 서버로부터 받은 토큰으로 로그인 처리 (UserContext)
          const { accessToken, refreshToken, isFirst } = response.result;
          console.log('6. Tokens received:', { hasAccess: !!accessToken, hasRefresh: !!refreshToken, isFirst });
          
          if (accessToken) {
            await login(accessToken, refreshToken, isFirst);
            console.log('7. Login Context Updated');
            
            // RootNavigator에서 상태(isLoggedIn, isNewUser)에 따라 화면을 전환하므로
            // 여기서 별도의 네비게이션 코드는 필요하지 않음.
          } else {
            console.error('Token missing in result:', response.result);
            Alert.alert('로그인 실패', '서버로부터 토큰을 받지 못했습니다.');
          }
        } else {
           console.error('Server returned fail:', response);
           Alert.alert('로그인 실패', response.message || '로그인 중 오류가 발생했습니다.');
        }
      // }
    } catch (error: any) {
      if (error.code === appleAuth.Error.CANCELED) {
        console.log('User canceled Apple Sign In');
      } else {
        console.error('Apple Login Error Full:', error);
        Alert.alert('로그인 오류', `Apple 로그인 실패: ${error.message || error.code || '알 수 없는 오류'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const onKakaoButtonPress = async () => {
    if (loading) return;
    setLoading(true);
    try {
      // 1. 카카오 로그인 시도
      const token = await KakaoLogin.login();
      
      // 2. 프로필 정보 가져오기
      const profile = await KakaoLogin.getProfile();
      
      console.log('Kakao Profile:', profile);

      // 3. 서버로 전송
      const response = await loginWithKakao(
        profile.nickname, 
        profile.email
      );

      // 4. 로그인 성공 처리
      if (response.isSuccess) {
        const { accessToken, refreshToken, isFirst } = response.result;
        
        if (accessToken) {
          await login(accessToken, refreshToken, isFirst);
        } else {
          Alert.alert('로그인 실패', '서버로부터 토큰을 받지 못했습니다.');
        }
      } else {
        Alert.alert('로그인 실패', response.message);
      }
    } catch (error: any) {
      if (error.code === 'E_CANCELLED_OPERATION') {
        console.log('Login Cancelled');
      } else {
        console.error('Kakao Login Error:', error);
        Alert.alert('오류', '카카오 로그인에 실패했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  // const handleGuestLogin = () => {
  //   loginGuest();
  //   // 강제 이동 처리
  //   navigation.reset({
  //     index: 0,
  //     routes: [{ name: 'Main' }],
  //   });
  // };

  return (
    <View style={styles.container}>
      {/* 배경 장식 요소 */}
      <View style={styles.backgroundCircle1} />
      <View style={styles.backgroundCircle2} />
      <View style={styles.backgroundCircle3} />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.contentContainer}>
          <View style={styles.logoContainer}>
            <Image 
              source={require('../assets/user_image/Drinky_3.png')} 
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
            
            {/* <TouchableOpacity 
              style={styles.guestButton}  
              onPress={handleGuestLogin}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.guestButtonText}>로그인 없이 둘러보기</Text>
            </TouchableOpacity> */}
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
    justifyContent: 'space-between', // 중앙 정렬에서 변경하여 로고와 버튼 영역 분리
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  logoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 250,
    height: 250,
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
    paddingBottom: 40, // 하단 여백 추가
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
    backgroundColor: '#FEE500', // 카카오 노란색
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
