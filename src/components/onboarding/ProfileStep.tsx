import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Image } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

interface ProfileStepProps {
  name: string;
  profileImageUri: string | null;
  onNameChange: (text: string) => void;
  onPickImage: () => void;
  onCheckNickname: () => void;
}

const ProfileStep = ({ name, profileImageUri, onNameChange, onPickImage, onCheckNickname }: ProfileStepProps) => {
  return (
    <View style={styles.content}>
      <Text style={styles.stepTitle}>프로필 설정</Text>
      <Text style={styles.stepDesc}>다른 분들에게 보여질 모습이에요.</Text>

      <TouchableOpacity style={styles.profileImageBtn} onPress={onPickImage}>
        {profileImageUri ? (
          <Image source={{ uri: profileImageUri }} style={styles.profileImage} />
        ) : (
          <View style={styles.profilePlaceholder}>
             <Icon name="camera-outline" size={32} color="#666" />
             <Text style={styles.profileImageText}>사진 선택</Text>
          </View>
        )}
      </TouchableOpacity>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>닉네임</Text>
        <View style={styles.row}>
            <TextInput 
                style={styles.input} 
                value={name}
                onChangeText={onNameChange}
                placeholder="닉네임을 입력하세요"
                placeholderTextColor="#666"
            />
            <TouchableOpacity style={styles.checkBtn} onPress={onCheckNickname}>
                <Text style={styles.checkBtnText}>중복확인</Text>
            </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingTop: 20,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  stepDesc: {
    fontSize: 14,
    color: '#888',
    marginBottom: 24,
  },
  profileImageBtn: {
    alignSelf: 'center',
    marginBottom: 30,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  profilePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#444',
  },
  profileImageText: {
    color: '#666',
    fontSize: 12,
    marginTop: 4,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    color: '#fff',
    marginBottom: 8,
    fontSize: 14,
  },
  row: {
    flexDirection: 'row',
  },
  input: {
    flex: 1,
    height: 50,
    backgroundColor: '#1e1e1e',
    borderRadius: 8,
    paddingHorizontal: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#333',
    marginRight: 10,
  },
  checkBtn: {
    backgroundColor: '#333',
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#444',
  },
  checkBtnText: {
    color: '#fff',
    fontSize: 14,
  },
});

export default ProfileStep;

