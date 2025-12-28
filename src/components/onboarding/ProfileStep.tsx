import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Image } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

interface ProfileStepProps {
  name: string;
  profileImageUri: string | null;
  onNameChange: (text: string) => void;
  onPickImage: () => void;
  errorMessage?: string | null;
  isValid?: boolean | null;
}

const ProfileStep = ({
  name,
  profileImageUri,
  onNameChange,
  onPickImage,
  errorMessage,
  isValid
}: ProfileStepProps) => {
  return (
    <View style={styles.content}>
      <Text style={styles.stepTitle}>프로필 사진과{'\n'}닉네임을 입력해주세요</Text>

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
        <TextInput
          style={[
            styles.input,
            errorMessage ? styles.inputError : (isValid ? styles.inputSuccess : null)
          ]}
          value={name}
          onChangeText={onNameChange}
          placeholder="닉네임을 입력하세요"
          placeholderTextColor="#666"
          autoCapitalize="none"
        />
        <View style={styles.helperRow}>
          {errorMessage ? (
            <Text style={styles.errorText}>{errorMessage}</Text>
          ) : isValid ? (
            <Text style={styles.successText}>사용 가능한 닉네임입니다.</Text>
          ) : (
            <Text style={styles.helperText}>2글자 이상 입력해주세요.</Text>
          )}
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
    marginBottom: 40,
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
  input: {
    height: 50,
    backgroundColor: '#1e1e1e',
    borderRadius: 8,
    paddingHorizontal: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#333',
  },
  inputError: {
    borderColor: '#e74c3c', // Red
  },
  inputSuccess: {
    borderColor: '#2ecc71', // Green
  },
  helperRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginTop: 6,
    marginLeft: 4,
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 12,
  },
  successText: {
    color: '#2ecc71',
    fontSize: 12,
  },
  helperText: {
    color: '#666',
    fontSize: 12,
  },
});

export default ProfileStep;
