import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const IntroStep = () => {
  return (
    <View style={styles.centerContent}>
      <Text style={styles.emoji}>🍷</Text>
      <Text style={styles.title}>환영합니다!</Text>
      <Text style={styles.desc}>
        몇 가지 질문을 통해{'\n'}당신의 와인 취향을 분석해드릴게요.
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

export default IntroStep;

