import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';

interface TransitionStepProps {
  isNewbie: boolean;
  name: string;
}

const TransitionStep = ({ isNewbie, name }: TransitionStepProps) => {
  return (
    <View style={styles.centerContent}>
      <Image
        source={require('../../assets/onboarding/Drinky_onboarding_3.png')}
        style={styles.image}
        resizeMode="contain"
      />
      <Text style={styles.title}>
        좋아요 {name}님{'\n'}
        {isNewbie ? '제가 취향을 찾아드릴게요!' : '취향을 등록해주세요!'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: 280,
    height: 280,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 32, // 줄바꿈 시 간격 확보
  },
});

export default TransitionStep;
