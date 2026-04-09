import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Image } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import { colors } from '../../constants/colors';

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
  const { t } = useTranslation();

  return (
    <View style={styles.content}>
      <Text style={styles.stepTitle}>{t('onboarding.profile.title')}</Text>

      <TouchableOpacity style={styles.profileImageBtn} onPress={onPickImage}>
        {profileImageUri ? (
          <Image source={{ uri: profileImageUri }} style={styles.profileImage} />
        ) : (
          <View style={styles.profilePlaceholder}>
            <Icon name="camera-outline" size={32} color={colors.textSecondary} />
            <Text style={styles.profileImageText}>{t('onboarding.profile.photoBtn')}</Text>
          </View>
        )}
      </TouchableOpacity>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>{t('onboarding.profile.nicknameLabel')}</Text>
        <TextInput
          style={[
            styles.input,
            errorMessage ? styles.inputError : (isValid ? styles.inputSuccess : null)
          ]}
          value={name}
          onChangeText={onNameChange}
          placeholder={t('onboarding.profile.nicknamePlaceholder')}
          placeholderTextColor={colors.textTertiary}
          autoCapitalize="none"
        />
        <View style={styles.helperRow}>
          {errorMessage ? (
            <Text style={styles.errorText}>{errorMessage}</Text>
          ) : isValid ? (
            <Text style={styles.successText}>{t('onboarding.profile.nicknameAvailable')}</Text>
          ) : (
            <Text style={styles.helperText}>{t('onboarding.profile.nicknameHelper')}</Text>
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
    color: colors.textPrimary,
    marginBottom: 40,
  },
  stepDesc: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 24,
  },
  profileImageBtn: {
    alignSelf: 'center',
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
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
    backgroundColor: colors.surface1,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  profileImageText: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    color: colors.textPrimary,
    marginBottom: 8,
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    height: 52,
    backgroundColor: colors.surface1,
    borderRadius: 16,
    paddingHorizontal: 18,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  inputError: {
    borderColor: colors.error,
  },
  inputSuccess: {
    borderColor: '#2ecc71',
  },
  helperRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginTop: 6,
    marginLeft: 4,
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
  },
  successText: {
    color: '#2ecc71',
    fontSize: 12,
  },
  helperText: {
    color: colors.textSecondary,
    fontSize: 12,
  },
});

export default ProfileStep;
