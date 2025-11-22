import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { appleAuth, AppleButton } from '@invertase/react-native-apple-authentication';
import { useNavigation } from '@react-navigation/native';

const LoginScreen = () => {
  const navigation = useNavigation();

  const onAppleButtonPress = async () => {
    try {
      const appleAuthRequestResponse = await appleAuth.performRequest({
        requestedOperation: appleAuth.Operation.LOGIN,
        requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
      });
  
      const credentialState = await appleAuth.getCredentialStateForUser(appleAuthRequestResponse.user);
  
      if (credentialState === appleAuth.State.AUTHORIZED) {
        console.log('Apple Login Success:', appleAuthRequestResponse);
        // 로그인 성공 시 메인 화면으로 이동
        navigation.reset({
          index: 0,
          routes: [{ name: 'Main' }],
        });
      }
    } catch (error) {
      console.log('Apple Login Error:', error);
    }
  };

  const handleGuestLogin = () => {
    // 둘러보기 버튼 클릭 시 메인 화면으로 이동
    navigation.reset({
      index: 0,
      routes: [{ name: 'Main' }],
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.contentContainer}>
        <View style={styles.bottomContainer}>
          {Platform.OS === 'ios' && (
            <AppleButton
              buttonStyle={AppleButton.Style.WHITE}
              buttonType={AppleButton.Type.SIGN_IN}
              style={styles.appleButton}
              onPress={onAppleButtonPress}
            />
          )}
          
          <TouchableOpacity style={styles.guestButton} onPress={handleGuestLogin}>
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
    backgroundColor: '#1a1a1a',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center', // 화면 중앙 정렬
    paddingHorizontal: 24,
  },
  bottomContainer: {
    width: '100%',
    gap: 16,
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
