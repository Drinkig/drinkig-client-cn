import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import CustomAlert from '../components/CustomAlert';

const SettingScreen = () => {
  const navigation = useNavigation();

  // 알림 상태 관리
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    title: '',
    message: '',
    onConfirm: () => {},
    singleButton: false,
    confirmText: '확인',
  });

  // 로그아웃 핸들러
  const handleLogout = () => {
    setAlertConfig({
      title: '로그아웃',
      message: '정말 로그아웃 하시겠습니까?',
      confirmText: '로그아웃',
      singleButton: false,
      onConfirm: () => {
        // TODO: 로그아웃 로직 (토큰 삭제 등)
        setAlertVisible(false);
        // 로그인 화면으로 리셋
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
      },
    });
    setAlertVisible(true);
  };

  // 회원 탈퇴 핸들러
  const handleDeleteAccount = () => {
    setAlertConfig({
      title: '회원 탈퇴',
      message: '정말로 탈퇴하시겠습니까?\n모든 데이터가 삭제되며 복구할 수 없습니다.',
      confirmText: '탈퇴하기',
      singleButton: false,
      onConfirm: () => {
        // TODO: 회원 탈퇴 API 호출
        setAlertVisible(false);
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
      },
    });
    setAlertVisible(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="chevron-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>설정</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* 섹션 1: 앱 정보 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>앱 정보</Text>
          <View style={styles.item}>
            <Text style={styles.itemText}>버전 정보</Text>
            <Text style={styles.versionText}>1.0.0</Text>
          </View>
          <TouchableOpacity style={styles.item}>
            <Text style={styles.itemText}>이용약관</Text>
            <Icon name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.item}>
            <Text style={styles.itemText}>개인정보 처리방침</Text>
            <Icon name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        {/* 섹션 2: 계정 관리 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>계정 관리</Text>
          <TouchableOpacity style={styles.item} onPress={handleLogout}>
            <Text style={styles.itemText}>로그아웃</Text>
            <Icon name="log-out-outline" size={20} color="#ccc" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.item} onPress={handleDeleteAccount}>
            <Text style={[styles.itemText, styles.deleteText]}>회원 탈퇴</Text>
            <Icon name="trash-outline" size={20} color="#e74c3c" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* 커스텀 알림 */}
      <CustomAlert
        visible={alertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={() => setAlertVisible(false)}
        onConfirm={alertConfig.onConfirm}
        confirmText={alertConfig.confirmText}
        singleButton={alertConfig.singleButton}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
    color: '#888',
    marginBottom: 8,
    paddingHorizontal: 24,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  itemText: {
    fontSize: 16,
    color: '#fff',
  },
  versionText: {
    fontSize: 16,
    color: '#888',
  },
  deleteText: {
    color: '#e74c3c', // 빨간색 경고
  },
});

export default SettingScreen;

