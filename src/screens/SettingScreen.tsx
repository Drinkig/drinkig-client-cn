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


  const [authType, setAuthType] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');
  const [username, setUsername] = useState<string>('');

  useEffect(() => {
    const fetchMemberInfo = async () => {
      try {
        const response: MemberInfoResponse = await getMemberInfo();
        if (response.isSuccess) {
          setAuthType(response.result.authType);
          setUserEmail(response.result.email);
          setUsername(response.result.username);
        }
      } catch (error) {
        console.error('Failed to fetch member info:', error);
      }
    };
    fetchMemberInfo();
  }, []);


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


  const handleEmailPress = async (type: 'REPORT' | 'SUGGESTION') => {
    const email = 'drinkeasyy@gmail.com';
    let subject = '';
    let body = '';

    const deviceInfo = `
-------------------
Device: ${DeviceInfo.getModel()}
User ID: ${username}
OS: ${DeviceInfo.getSystemName()} ${DeviceInfo.getSystemVersion()}
App Version: ${DeviceInfo.getVersion()}
-------------------
`;

    if (type === 'REPORT') {
      subject = '[오류 제보] ';
      body = `오류를 제보해주셔서 감사합니다.
발생한 문제에 대해 자세히 설명해 주세요. 관련 사진이나 스크린샷을 첨부해 주시면 문제 해결에 큰 도움이 됩니다.

(여기에 내용을 작성해 주세요)

${deviceInfo}`;
    } else {
      subject = '[기능 제안] ';
      body = `기능을 제안해주셔서 감사합니다.
제안하고 싶은 기능에 대해 자세히 설명해 주세요.

(여기에 내용을 작성해 주세요)

${deviceInfo}`;
    }

    const url = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    try {
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


  const handleLogout = () => {
    showAlert({
      title: '로그아웃',
      message: '정말 로그아웃 하시겠습니까?',
      confirmText: '로그아웃',
      singleButton: false,
      onConfirm: async () => {
        showLoading();
        try {
          await logout();
        } finally {
          hideLoading();
        }
      },
    });
  };

  const handleDeleteAccount = () => {
    showAlert({
      title: '회원 탈퇴',
      message: '정말 탈퇴하시겠습니까?\n탈퇴 시 모든 데이터가 삭제됩니다.',
      confirmText: '탈퇴하기',
      singleButton: false,
      onConfirm: async () => {
        if (authType === 'APPLE') {
          try {
            const appleAuthRequestResponse = await appleAuth.performRequest({
              requestedOperation: appleAuth.Operation.REFRESH,
            });

            const authCode = appleAuthRequestResponse.authorizationCode;

            if (!authCode) {
              throw new Error('Failed to get authorization code');
            }

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
              return;
            }
            console.error('Apple delete member error:', error);
            showAlert({
              title: '오류',
              message: `Apple 인증/탈퇴 실패: ${error.message || '알 수 없는 오류'}`,
              singleButton: true,
            });
          }
        } else {
          // General withdrawal (Email/Kakao)
          navigation.navigate('WithdrawRetention', { authType: authType || 'EMAIL' });
        }
      },
    });
  };

  return (
    <SafeAreaView style={styles.container}>

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="chevron-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>설정</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

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


        <View style={styles.section}>
          <Text style={styles.sectionTitle}>문의하기</Text>
          <TouchableOpacity
            style={styles.item}
            onPress={() => handleEmailPress('REPORT')}
          >
            <Text style={styles.itemText}>오류 제보</Text>
            <Icon name="bug-outline" size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.item}
            onPress={() => handleEmailPress('SUGGESTION')}
          >
            <Text style={styles.itemText}>기능 제안</Text>
            <Icon name="bulb-outline" size={20} color="#fff" />
          </TouchableOpacity>
        </View>


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
    color: '#e74c3c',
  },
});

export default SettingScreen;
