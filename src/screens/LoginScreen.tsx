import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Platform,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { appleAuth, AppleButton } from '@invertase/react-native-apple-authentication';
import { useNavigation } from '@react-navigation/native';
import { loginWithApple } from '../api/member';
import { useUser } from '../context/UserContext';

const LoginScreen = () => {
  const navigation = useNavigation();
  const { login, loginGuest } = useUser();

  const onAppleButtonPress = async () => {
    try {
      // 1. 애플 로그인 요청
      const appleAuthRequestResponse = await appleAuth.performRequest({
        requestedOperation: appleAuth.Operation.LOGIN,
        requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
      });
      
      const credentialState = await appleAuth.getCredentialStateForUser(appleAuthRequestResponse.user);

      if (credentialState === appleAuth.State.AUTHORIZED) {
        console.log('Apple Login Success:', appleAuthRequestResponse);
        console.log('Apple Login Success:', appleAuthRequestResponse);
        
        // 2. identityToken이 있는지 확인
        if (!appleAuthRequestResponse.identityToken) {
          throw new Error('Apple Identity Token is missing');
        }

        // 3. 서버로 로그인 요청
        const response = await loginWithApple(appleAuthRequestResponse.identityToken);

        if (response.isSuccess) {
          // 4. 서버로부터 받은 토큰으로 로그인 처리 (UserContext)
          const { accessToken, refreshToken } = response.result;
          
          if (accessToken) {
            await login(accessToken, refreshToken);
            
            // 로그인 성공 시 메인 화면으로 이동 (네비게이션 구조에 따라 자동 처리될 수 있음)
            // UserContext의 isLoggedIn 상태 변경으로 인해 RootNavigator에서 화면 전환이 일어날 수 있음.
            // 만약 수동 이동이 필요하다면:
            // navigation.reset({
            //   index: 0,
            //   routes: [{ name: 'Main' }],
            // });
          } else {
            Alert.alert('로그인 실패', '서버로부터 토큰을 받지 못했습니다.');
          }
        } else {
           Alert.alert('로그인 실패', response.message || '로그인 중 오류가 발생했습니다.');
        }
      }
    } catch (error: any) {
      console.error('Apple Login Error Full:', error);
      Alert.alert('로그인 오류', `Apple 로그인 실패: ${error.message || error.code || '알 수 없는 오류'}`);
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
          {Platform.OS === 'ios' && (
            <AppleButton
              buttonStyle={AppleButton.Style.WHITE}
              buttonType={AppleButton.Type.SIGN_IN}
              style={styles.appleButton}
              onPress={onAppleButtonPress}
            />
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
