import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

const IntroStep = () => {
  const fullTitle = "안녕하세요!\n저는 소믈리에 드링키에요.";
  const fullDesc = "몇 가지 질문을 통해\n회원님의 와인 취향을 분석하고 추천해드릴게요.";

  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [startDesc, setStartDesc] = useState(false);

  useEffect(() => {
    let currentIdx = 0;
    const interval = setInterval(() => {
      currentIdx++;
      setTitle(fullTitle.slice(0, currentIdx));

      // 햅틱
      const char = fullTitle[currentIdx - 1];
      if (char && char !== ' ' && char !== '\n') {
        ReactNativeHapticFeedback.trigger("impactLight", {
          enableVibrateFallback: true,
          ignoreAndroidSystemSettings: false,
        });
      }

      if (currentIdx >= fullTitle.length) {
        clearInterval(interval);
        setStartDesc(true);
      }
    }, 50);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!startDesc) return;

    let currentIdx = 0;
    const interval = setInterval(() => {
      currentIdx++;
      setDesc(fullDesc.slice(0, currentIdx));
      if (currentIdx >= fullDesc.length) {
        clearInterval(interval);
      }
    }, 30);

    return () => clearInterval(interval);
  }, [startDesc]);

  return (
    <View style={styles.centerContent}>
      <Image
        source={require('../../assets/onboarding/Drinky_onboarding_1.png')}
        style={styles.image}
        resizeMode="contain"
      />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.desc}>{desc}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 80,
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
    marginBottom: 16,
    lineHeight: 32,

    minHeight: 64,
  },
  desc: {
    fontSize: 16,
    color: '#aaa',
    textAlign: 'center',
    lineHeight: 24,

    minHeight: 48,
  },
});

export default IntroStep;
