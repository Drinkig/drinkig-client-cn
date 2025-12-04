import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface TransitionStepProps {
  isNewbie: boolean;
}

const TransitionStep = ({ isNewbie }: TransitionStepProps) => {
  return (
    <View style={styles.centerContent}>
      <Text style={styles.emoji}>{isNewbie ? '🔍' : '📝'}</Text>
      <Text style={styles.title}>
        {isNewbie ? '취향을 찾아드릴게요!' : '취향을 등록해주세요!'}
      </Text>
      <Text style={styles.desc}>
        {isNewbie 
          ? '평소 식성을 바탕으로 추천해드립니다.' 
          : '선호하는 와인을 알려주시면 더 정확한 추천이 가능해요.'}
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
  emoji: {
    fontSize: 60,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
  },
  desc: {
    fontSize: 16,
    color: '#aaa',
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default TransitionStep;

