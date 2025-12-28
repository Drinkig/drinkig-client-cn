import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { launchImageLibrary } from 'react-native-image-picker';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '../context/UserContext';
import { useGlobalUI } from '../context/GlobalUIContext';
import { updateMemberInfo, uploadProfileImage, checkNickname } from '../api/member';

const ProfileEditScreen = () => {
  const navigation = useNavigation();
  const { user, refreshUserInfo } = useUser();
  const { showAlert, showLoading, hideLoading, closeAlert } = useGlobalUI();


  const [nickname, setNickname] = useState(user?.nickname || '');
  const [profileImage, setProfileImage] = useState<string | null>(user?.profileImage || null);
  const [selectedImageAsset, setSelectedImageAsset] = useState<any | null>(null);

  const [nicknameAvailable, setNicknameAvailable] = useState<boolean | null>(true);
  const [nicknameError, setNicknameError] = useState<string | null>(null);
  const [isCheckingNickname, setIsCheckingNickname] = useState(false);




  const hasNicknameChanged = nickname !== user?.nickname;
  const hasImageChanged = selectedImageAsset !== null;

  const canSave = (hasNicknameChanged && nicknameAvailable && !isCheckingNickname) || (!hasNicknameChanged && hasImageChanged && !nicknameError);

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


  useEffect(() => {
    if (nickname === user?.nickname) {
      setNicknameAvailable(true);
      setNicknameError(null);
      setIsCheckingNickname(false);
      return;
    }

    if (!nickname) {
      setNicknameError(null);
      setNicknameAvailable(null);
      return;
    }

    setNicknameAvailable(null);
    setNicknameError(null);
    setIsCheckingNickname(true);

    const timer = setTimeout(async () => {
      if (nickname.length < 2) {
        setNicknameError('닉네임은 2글자 이상이어야 해요.');
        setNicknameAvailable(false);
        setIsCheckingNickname(false);
        return;
      }

      if (/[ㄱ-ㅎㅏ-ㅣ]/.test(nickname)) {
        setNicknameError('올바른 닉네임 형식이 아니에요 (자음/모음 단독 사용 불가).');
        setNicknameAvailable(false);
        setIsCheckingNickname(false);
        return;
      }

      try {
        const res = await checkNickname(nickname);
        if (res.result) {
          setNicknameAvailable(true);
          setNicknameError(null);
        } else {
          setNicknameAvailable(false);
          setNicknameError('이미 사용 중인 닉네임이에요');
        }
      } catch (e) {
        console.error(e);
        setNicknameError('닉네임 확인 중 오류가 발생했습니다.');
        setNicknameAvailable(false);
      } finally {
        setIsCheckingNickname(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [nickname, user?.nickname]);


  const handleSave = async () => {
    if (nicknameError || (nickname !== user?.nickname && !nicknameAvailable)) {
      showAlert({
        title: '알림',
        message: nicknameError || '닉네임 확인이 필요해요.',
        singleButton: true
      });
      return;
    }

    try {
      showLoading();
      await new Promise(resolve => setTimeout(() => resolve(true), 100));


      if (selectedImageAsset && selectedImageAsset.uri) {
        const uploadResponse = await uploadProfileImage(
          selectedImageAsset.uri,
          selectedImageAsset.type || 'image/jpeg',
          selectedImageAsset.fileName || 'profile.jpg'
        );
        if (!uploadResponse.isSuccess) throw new Error('Image upload failed');
      }


      if (nickname !== user?.nickname) {
        const updateResponse = await updateMemberInfo(nickname);
        if (!updateResponse.isSuccess) throw new Error('Nickname update failed');
      }


      await refreshUserInfo();

      hideLoading();
      navigation.goBack();

      setTimeout(() => {
        showAlert({
          title: '성공',
          message: '프로필이 수정되었습니다.',
          singleButton: true,
        });
      }, 500);

    } catch (error) {
      hideLoading();
      console.error('Profile update failed:', error);
      setTimeout(() => {
        showAlert({
          title: '오류',
          message: '프로필 수정 중 문제가 발생했습니다.',
          singleButton: true,
        });
      }, 500);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="chevron-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>프로필 수정</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.imageSection}>
          <TouchableOpacity onPress={handleSelectImage} style={styles.imageContainer}>
            <View style={styles.imageMask}>
              <Image
                source={profileImage ? { uri: profileImage } : require('../assets/Standard_profile.png')}
                style={styles.profileImage}
              />
            </View>
            <View style={styles.cameraIconContainer}>
              <Icon name="camera" size={20} color="#fff" />
            </View>
          </TouchableOpacity>
        </View>


        <View style={styles.inputSection}>
          <Text style={styles.label}>닉네임</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={[
                styles.input,
                nicknameError
                  ? styles.inputError
                  : (nicknameAvailable && nickname !== user?.nickname ? styles.inputSuccess : null)
              ]}
              value={nickname}
              onChangeText={setNickname}
              placeholder="닉네임을 입력하세요"
              placeholderTextColor="#666"
              maxLength={10}
            />
          </View>

          <View style={styles.helperRow}>
            {isCheckingNickname ? (
              <Text style={styles.helperText}>확인 중...</Text>
            ) : nicknameError ? (
              <Text style={styles.errorText}>{nicknameError}</Text>
            ) : nicknameAvailable && nickname !== user?.nickname ? (
              <Text style={styles.successText}>사용 가능한 닉네임입니다.</Text>
            ) : null}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.saveButton, (!canSave) && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={!canSave}
        >
          <Text style={[styles.saveButtonText, !canSave && styles.saveButtonTextDisabled]}>
            저장하기
          </Text>
        </TouchableOpacity>
      </View>
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
    width: 120,
    height: 120,
  },
  imageMask: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
    borderWidth: 2,
    borderColor: '#444',
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
    transform: [{ scale: 1.3 }],
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
  inputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#333',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#444',
  },
  inputError: {
    borderColor: '#e74c3c',
  },
  inputSuccess: {
    borderColor: '#2ecc71',
  },
  checkButton: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: '#333',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#8e44ad',
  },
  checkButtonDisabled: {
    borderColor: '#444',
    opacity: 0.5,
  },
  checkButtonText: {
    color: '#8e44ad',
    fontWeight: 'bold',
  },
  helperRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginTop: 6,
    marginLeft: 4,
  },
  helperText: {
    fontSize: 12,
    color: '#666',
  },
  errorText: {
    fontSize: 12,
    color: '#e74c3c',
  },
  successText: {
    fontSize: 12,
    color: '#2ecc71',
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
