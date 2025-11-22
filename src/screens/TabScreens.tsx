import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';

// 공통 스타일
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
});

export const HomeScreen = () => (
  <SafeAreaView style={styles.container}>
    <Text style={styles.text}>홈 화면</Text>
    <Text style={{ color: '#888', marginTop: 10 }}>오늘의 추천 와인</Text>
  </SafeAreaView>
);

export const SearchScreen = () => (
  <SafeAreaView style={styles.container}>
    <Text style={styles.text}>검색</Text>
    <Text style={{ color: '#888', marginTop: 10 }}>와인 검색하기</Text>
  </SafeAreaView>
);

export const NoteScreen = () => (
  <SafeAreaView style={styles.container}>
    <Text style={styles.text}>테이스팅 노트</Text>
    <Text style={{ color: '#888', marginTop: 10 }}>내가 마신 와인 기록</Text>
  </SafeAreaView>
);

export const MyPageScreen = () => (
  <SafeAreaView style={styles.container}>
    <Text style={styles.text}>마이페이지</Text>
    <Text style={{ color: '#888', marginTop: 10 }}>내 정보 관리</Text>
  </SafeAreaView>
);

