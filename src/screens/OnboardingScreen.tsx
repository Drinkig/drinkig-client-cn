import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '../context/UserContext';

const OnboardingScreen = () => {
  const navigation = useNavigation();
  const { completeOnboarding } = useUser();

  const handleComplete = () => {
    // 온보딩 완료 처리 (UserContext 상태 업데이트 -> RootNavigator가 Main으로 전환)
    completeOnboarding();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>환영합니다! 🎉</Text>
        <Text style={styles.subtitle}>
          회원가입이 완료되었습니다.{'\n'}
          추가 정보를 입력하고{'\n'}
          나만의 와인 취향을 찾아보세요.
        </Text>
        
        <View style={styles.placeholderBox}>
          <Text style={styles.placeholderText}>(여기에 온보딩 UI가 들어갈 예정입니다)</Text>
        </View>

        <TouchableOpacity style={styles.button} onPress={handleComplete}>
          <Text style={styles.buttonText}>시작하기</Text>
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
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  placeholderBox: {
    width: '100%',
    height: 200,
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    borderWidth: 1,
    borderColor: '#333',
  },
  placeholderText: {
    color: '#666',
  },
  button: {
    width: '100%',
    height: 56,
    backgroundColor: '#8e44ad',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default OnboardingScreen;

