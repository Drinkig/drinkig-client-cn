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
import { useNavigation } from '@react-navigation/native';
import { loginWithApple } from '../api/member';
import { useUser } from '../context/UserContext';

const LoginScreen = () => {
  const navigation = useNavigation();
  const { login, loginGuest } = useUser();
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

  const handleGuestLogin = () => {
    loginGuest();
    // 강제 이동 처리
    navigation.reset({
      index: 0,
      routes: [{ name: 'Main' }],
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.contentContainer}>
        <View style={styles.logoContainer}>
          <Image 
            source={require('../assets/Logo Icon.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        
          <View style={styles.bottomContainer}>
          {loading ? (
            <ActivityIndicator size="large" color="#fff" style={{ marginBottom: 20 }} />
          ) : (
            Platform.OS === 'ios' && (
              <AppleButton
                buttonStyle={AppleButton.Style.WHITE}
                buttonType={AppleButton.Type.SIGN_IN}
                style={styles.appleButton}
                onPress={onAppleButtonPress}
              />
            )
          )}
          
          <TouchableOpacity 
            style={styles.guestButton} 
            onPress={handleGuestLogin}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.guestButtonText}>로그인 없이 둘러보기</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#7E13B1',
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
    width: 150,
    height: 150,
  },
  bottomContainer: {
    width: '100%',
    gap: 16,
    paddingBottom: 40, // 하단 여백 추가
  },
  appleButton: {
    width: '100%',
    height: 50,
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
