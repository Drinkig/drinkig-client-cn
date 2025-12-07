import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';

const IntroStep = () => {
  return (
    <View style={styles.centerContent}>
      <Image 
        source={require('../../assets/user_image/Drinky_1.png')} 
        style={styles.image} 
        resizeMode="contain"
      />
      <Text style={styles.title}>안녕하세요!{'\n'}저는 소믈리에 드링키에요.</Text>
      <Text style={styles.desc}>
        몇 가지 질문을 통해{'\n'}당신의 와인 취향을 분석하고 추천해드릴게요.
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
    width: 200,
    height: 200,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 16, // 간격 조정
    lineHeight: 32, // 줄간격 추가
  },
  desc: {
    fontSize: 16,
    color: '#aaa',
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default IntroStep;
