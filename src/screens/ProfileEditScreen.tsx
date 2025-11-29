import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { launchImageLibrary } from 'react-native-image-picker';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '../context/UserContext';
import CustomAlert from '../components/CustomAlert';
import { updateMemberInfo, uploadProfileImage } from '../api/member';

const ProfileEditScreen = () => {
  const navigation = useNavigation();
  const { user, refreshUserInfo } = useUser();
  
  // 상태 관리
  const [nickname, setNickname] = useState(user?.nickname || '');
  const [profileImage, setProfileImage] = useState<string | null>(user?.profileImage || null);
  const [selectedImageAsset, setSelectedImageAsset] = useState<any | null>(null); // 실제 업로드용 에셋
  const [isLoading, setIsLoading] = useState(false);
  
  // 변경사항 여부 확인
  const hasChanges = nickname !== user?.nickname || selectedImageAsset !== null;
  
  // 알림 상태 관리
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    title: '',
    message: '',
    onConfirm: () => {},
    singleButton: true,
  });

  // 이미지 선택 핸들러
  const handleSelectImage = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      selectionLimit: 1,
      quality: 0.8,
    });

    if (result.didCancel) return;
    
    if (result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      setProfileImage(asset.uri || null);
      setSelectedImageAsset(asset);
    }
  };

  // 저장 핸들러
  const handleSave = async () => {
    if (nickname.trim().length === 0) {
      setAlertConfig({
        title: '알림',
        message: '닉네임을 입력해주세요.',
        onConfirm: () => setAlertVisible(false),
        singleButton: true,
      });
      setAlertVisible(true);
      return;
    }

    try {
      setIsLoading(true);

      // 1. 프로필 이미지 업로드 (변경된 경우)
      if (selectedImageAsset && selectedImageAsset.uri) {
        const uploadResponse = await uploadProfileImage(
          selectedImageAsset.uri,
          selectedImageAsset.type,
          selectedImageAsset.fileName
        );
        if (!uploadResponse.isSuccess) {
          throw new Error('Image upload failed');
        }
      }

      // 2. 닉네임 변경 (변경된 경우)
      if (nickname !== user?.nickname) {
        const updateResponse = await updateMemberInfo(nickname);
        if (!updateResponse.isSuccess) {
          throw new Error('Nickname update failed');
        }
      }

      // 3. 유저 정보 갱신
      await refreshUserInfo();

      setAlertConfig({
        title: '성공',
        message: '프로필이 수정되었습니다.',
        onConfirm: () => {
          setAlertVisible(false);
          navigation.goBack();
        },
        singleButton: true,
      });
      setAlertVisible(true);

    } catch (error) {
      console.error('Profile update failed:', error);
      setAlertConfig({
        title: '오류',
        message: '프로필 수정 중 문제가 발생했습니다.',
        onConfirm: () => setAlertVisible(false),
        singleButton: true,
      });
      setAlertVisible(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 상단 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="chevron-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>프로필 수정</Text>
        <View style={{ width: 28 }} /> 
      </View>

      <View style={styles.content}>
        {/* 프로필 사진 변경 */}
        <View style={styles.imageSection}>
          <TouchableOpacity onPress={handleSelectImage} style={styles.imageContainer}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.profileImage} />
            ) : (
              <View style={styles.placeholderImage}>
                <Icon name="person" size={60} color="#ccc" />
              </View>
            )}
            <View style={styles.cameraIconContainer}>
              <Icon name="camera" size={20} color="#fff" />
            </View>
          </TouchableOpacity>
        </View>

        {/* 닉네임 변경 */}
        <View style={styles.inputSection}>
          <Text style={styles.label}>닉네임</Text>
          <TextInput
            style={styles.input}
            value={nickname}
            onChangeText={setNickname}
            placeholder="닉네임을 입력하세요"
            placeholderTextColor="#666"
            maxLength={10}
          />
          <Text style={styles.helperText}>{nickname.length}/10</Text>
        </View>

        {/* 저장 버튼 */}
        <TouchableOpacity 
          style={[styles.saveButton, (!hasChanges || isLoading) && styles.saveButtonDisabled]} 
          onPress={handleSave}
          disabled={!hasChanges || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={[styles.saveButtonText, !hasChanges && styles.saveButtonTextDisabled]}>
              저장하기
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* 커스텀 알림 */}
      <CustomAlert
        visible={alertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={() => setAlertVisible(false)}
        onConfirm={alertConfig.onConfirm}
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
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  imageSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  imageContainer: {
    position: 'relative',
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: '#444',
  },
  placeholderImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#444',
  },
  cameraIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#8e44ad',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1a1a1a',
  },
  inputSection: {
    marginBottom: 40,
  },
  label: {
    fontSize: 14,
    color: '#888',
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    backgroundColor: '#333',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#444',
  },
  helperText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    marginTop: 6,
    marginRight: 4,
  },
  saveButton: {
    backgroundColor: '#8e44ad',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#333',
    borderWidth: 1,
    borderColor: '#444',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  saveButtonTextDisabled: {
    color: '#666',
  },
});

export default ProfileEditScreen;
