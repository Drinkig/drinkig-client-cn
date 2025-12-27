import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
  Linking,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import appleAuth from '@invertase/react-native-apple-authentication';
import { useUser } from '../context/UserContext';
import { useGlobalUI } from '../context/GlobalUIContext';
import {
  deleteMember,
  deleteAppleMember,
  getMemberInfo,
  MemberInfoResponse
} from '../api/member';
import DeviceInfo from 'react-native-device-info';

const SettingScreen = () => {
  const navigation = useNavigation();
  const { logout } = useUser();
  const { showAlert, showLoading, hideLoading } = useGlobalUI();

  // 사용자 정보 상태 (authType 확인용)
  const [authType, setAuthType] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');

  useEffect(() => {
    const fetchMemberInfo = async () => {
      try {
        const response: MemberInfoResponse = await getMemberInfo();
        if (response.isSuccess) {
          setAuthType(response.result.authType);
          setUserEmail(response.result.email);
        }
      } catch (error) {
        console.error('Failed to fetch member info:', error);
      }
    };
    fetchMemberInfo();
  }, []);

  // 링크 이동 핸들러
  const handleLinkPress = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        showAlert({
          title: '오류',
          message: '링크를 열 수 없습니다.',
          singleButton: true,
        });
      }
    } catch (error) {
      console.error('An error occurred', error);
      showAlert({
        title: '오류',
        message: '링크를 여는 중 문제가 발생했습니다.',
        singleButton: true,
      });
    }
  };

  // 이메일 연결 핸들러
  const handleEmailPress = async (subject: string, body: string = '') => {
    const email = 'drinkeasyy@gmail.com';
    const url = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    try {
      // mailto 스키마 처리
      await Linking.openURL(url);
    } catch (error) {
      console.error('An error occurred', error);
      showAlert({
        title: '오류',
        message: '메일 앱을 열 수 없습니다.',
        singleButton: true,
      });
    }
  };

  // 로그아웃 핸들러
  const handleLogout = () => {
    showAlert({
      title: '로그아웃',
      message: '정말 로그아웃 하시겠습니까?',
      confirmText: '로그아웃',
      singleButton: false,
      onConfirm: async () => {
        showLoading();
        try {
          // Context의 logout 함수 호출 (내부적으로 API 호출 및 토큰 삭제, 상태 초기화)
          await logout();
        } finally {
          hideLoading();
        }
      },
    });
  };

  // 회원 탈퇴 핸들러
  const handleDeleteAccount = () => {
    // 바로 탈퇴 확인창을 띄우지 않고, 탈퇴 방어(유지) 화면으로 이동
    navigation.navigate('WithdrawRetention', { authType: authType || 'EMAIL' }); // authType이 null일 경우 대비
  };

  // 애플 회원 탈퇴 프로세스
  const handleAppleDelete = async () => {
    try {
      // 1. 애플 재인증 요청 (Authorization Code 받기 위함)
      const appleAuthRequestResponse = await appleAuth.performRequest({
        requestedOperation: appleAuth.Operation.REFRESH, // 민감한 작업 전 재인증
      });

      const authCode = appleAuthRequestResponse.authorizationCode;

      if (!authCode) {
        throw new Error('Failed to get authorization code');
      }

      // 2. 애플 탈퇴 API 호출
      const response = await deleteAppleMember(authCode);

      if (response.isSuccess) {
        await logout();
      } else {
        console.error('Apple delete member failed:', response.message);
        showAlert({
          title: '오류',
          message: `회원 탈퇴 실패: ${response.message}`,
          singleButton: true,
        });
      }
    } catch (error: any) {
      if (error.code === appleAuth.Error.CANCELED) {
        // 유저가 취소함 -> 아무것도 안 함
        return;
      }
      console.error('Apple delete member error:', error);
      showAlert({
        title: '오류',
        message: `Apple 인증/탈퇴 실패: ${error.message || '알 수 없는 오류'}`,
        singleButton: true,
      });
      throw error; // 상위 catch로 전달
    }
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
        {/* 섹션 1: 내 계정 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>내 계정</Text>
          <View style={styles.item}>
            <Text style={styles.itemText}>로그인 수단</Text>
            <Text style={styles.versionText}>
              {authType === 'KAKAO' ? '카카오' : authType === 'APPLE' ? 'Apple' : authType}
            </Text>
          </View>
          <View style={styles.item}>
            <Text style={styles.itemText}>이메일</Text>
            <Text style={styles.versionText}>{userEmail}</Text>
          </View>
        </View>

        {/* 섹션 2: 앱 정보 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>앱 정보</Text>
          <View style={styles.item}>
            <Text style={styles.itemText}>버전 정보</Text>
            <Text style={styles.versionText}>{DeviceInfo.getVersion()}</Text>
          </View>
          <TouchableOpacity
            style={styles.item}
            onPress={() => handleLinkPress('https://web.drinkig.com/terms')}
          >
            <Text style={styles.itemText}>이용약관</Text>
            <Icon name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.item}
            onPress={() => handleLinkPress('https://web.drinkig.com/privacy')}
          >
            <Text style={styles.itemText}>개인정보 처리방침</Text>
            <Icon name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        {/* 섹션 3: 문의하기 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>문의하기</Text>
          <TouchableOpacity
            style={styles.item}
            onPress={() => handleEmailPress('[오류 제보] ')}
          >
            <Text style={styles.itemText}>오류 제보</Text>
            <Icon name="bug-outline" size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.item}
            onPress={() => handleEmailPress('[기능 제안] ')}
          >
            <Text style={styles.itemText}>기능 제안</Text>
            <Icon name="bulb-outline" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* 섹션 4: 계정 관리 */}
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
