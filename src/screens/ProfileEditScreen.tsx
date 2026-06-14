import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import {
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { launchImageLibrary } from "react-native-image-picker";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/Ionicons";
import {
  checkNickname,
  deleteProfileImage,
  updateMemberInfo,
  uploadProfileImage,
} from "../api/member";
import PhotoOptionsBottomSheet from "../components/common/PhotoOptionsBottomSheet";
import { useGlobalUI } from "../context/GlobalUIContext";
import { useUser } from "../context/UserContext";
import { colors } from "../constants/colors";
import { useTranslation } from "react-i18next";
import GlassHeader from "../components/common/GlassHeader";

const ProfileEditScreen = () => {
  const navigation = useNavigation();
  const { user, refreshUserInfo } = useUser();
  const { showLoading, hideLoading, showToast } = useGlobalUI();
  const { t } = useTranslation();

  const [nickname, setNickname] = useState(user?.nickname || "");
  const [profileImage, setProfileImage] = useState<string | null>(
    user?.profileImage || null
  );
  const [selectedImageAsset, setSelectedImageAsset] = useState<any | null>(
    null
  );

  const [nicknameAvailable, setNicknameAvailable] = useState<boolean | null>(
    true
  );
  const [nicknameError, setNicknameError] = useState<string | null>(null);
  const [isCheckingNickname, setIsCheckingNickname] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isImageOptionsVisible, setIsImageOptionsVisible] = useState(false);

  const hasNicknameChanged = nickname !== user?.nickname;
  const hasImageChanged = profileImage !== (user?.profileImage || null);

  const canSave =
    (hasNicknameChanged && nicknameAvailable && !isCheckingNickname) ||
    (!hasNicknameChanged && hasImageChanged && !nicknameError);

  const handleOpenImageOptions = () => {
    setIsImageOptionsVisible(true);
  };

  const handleDeleteImage = () => {
    setProfileImage(null);
    setSelectedImageAsset(null);
  };

  const handleSelectImageLibrary = async () => {
    const result = await launchImageLibrary({
      mediaType: "photo",
      selectionLimit: 1,
      quality: 0.8,
      maxWidth: 1024,
      maxHeight: 1024,
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
        setNicknameError(t("profileEdit.nickname.errorLength"));
        setNicknameAvailable(false);
        setIsCheckingNickname(false);
        return;
      }

      if (/[ㄱ-ㅎㅏ-ㅣ]/.test(nickname)) {
        setNicknameError(t("profileEdit.nickname.errorFormat"));
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
          setNicknameError(t("profileEdit.nickname.errorDuplicate"));
        }
      } catch (e) {
        console.error(e);
        setNicknameError(t("profileEdit.nickname.errorCheck"));
        setNicknameAvailable(false);
      } finally {
        setIsCheckingNickname(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [nickname, user?.nickname]);

  const handleSave = async () => {
    if (isSaving) return;

    if (nicknameError || (nickname !== user?.nickname && !nicknameAvailable)) {
      showToast(nicknameError || t("profileEdit.alert.needCheck"), {
        type: "info",
      });
      return;
    }

    try {
      setIsSaving(true);
      showLoading();
      await new Promise((resolve) => setTimeout(() => resolve(true), 100));

      if (selectedImageAsset && selectedImageAsset.uri) {
        const uploadResponse = await uploadProfileImage(
          selectedImageAsset.uri,
          selectedImageAsset.type || "image/jpeg",
          selectedImageAsset.fileName || "profile.jpg"
        );
        if (!uploadResponse.isSuccess) throw new Error("Image upload failed");
      } else if (profileImage === null && user?.profileImage) {
        const deleteResponse = await deleteProfileImage();
        if (!deleteResponse.isSuccess) throw new Error("Image delete failed");
      }

      if (nickname !== user?.nickname) {
        const updateResponse = await updateMemberInfo(nickname);
        if (!updateResponse.isSuccess)
          throw new Error("Nickname update failed");
      }

      await refreshUserInfo();

      hideLoading();
      navigation.goBack();

      setTimeout(() => {
        showToast(t("profileEdit.alert.successMessage"), { type: "success" });
      }, 500);
    } catch (error) {
      hideLoading();
      setIsSaving(false);
      console.error("Profile update failed:", error);
      setTimeout(() => {
        showToast(t("profileEdit.alert.errorMessage"), { type: "error" });
      }, 500);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <GlassHeader
        floating={false}
        title={t("profileEdit.header")}
        left={
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon name="arrow-back" size={22} color={colors.white} />
          </TouchableOpacity>
        }
      />

      <View style={styles.content}>
        <View style={styles.imageSection}>
          <TouchableOpacity
            onPress={handleOpenImageOptions}
            style={styles.imageContainer}
          >
            <View style={styles.imageMask}>
              <Image
                source={
                  profileImage
                    ? { uri: profileImage }
                    : require("../assets/Standard_profile.png")
                }
                style={styles.profileImage}
              />
            </View>
            <View style={styles.cameraIconContainer}>
              <Icon name="camera" size={20} color={colors.white} />
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.inputSection}>
          <Text style={styles.label}>{t("profileEdit.nickname.label")}</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={[
                styles.input,
                nicknameError
                  ? styles.inputError
                  : nicknameAvailable && nickname !== user?.nickname
                  ? styles.inputSuccess
                  : null,
              ]}
              value={nickname}
              onChangeText={setNickname}
              placeholder={t("profileEdit.nickname.placeholder")}
              placeholderTextColor={colors.textTertiary}
              maxLength={10}
            />
          </View>

          <View style={styles.helperRow}>
            {isCheckingNickname ? (
              <Text style={styles.helperText}>
                {t("profileEdit.nickname.checking")}
              </Text>
            ) : nicknameError ? (
              <Text style={styles.errorText}>{nicknameError}</Text>
            ) : nicknameAvailable && nickname !== user?.nickname ? (
              <Text style={styles.successText}>
                {t("profileEdit.nickname.success")}
              </Text>
            ) : null}
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.saveButton,
            (!canSave || isSaving) && styles.saveButtonDisabled,
          ]}
          onPress={handleSave}
          disabled={!canSave || isSaving}
        >
          <Text
            style={[
              styles.saveButtonText,
              (!canSave || isSaving) && styles.saveButtonTextDisabled,
            ]}
          >
            {isSaving
              ? t("profileEdit.button.saving")
              : t("profileEdit.button.save")}
          </Text>
        </TouchableOpacity>
      </View>

      <PhotoOptionsBottomSheet
        visible={isImageOptionsVisible}
        onClose={() => setIsImageOptionsVisible(false)}
        onSelectLibrary={handleSelectImageLibrary}
        onDelete={handleDeleteImage}
        hasProfileImage={!!profileImage}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  imageSection: {
    alignItems: "center",
    marginBottom: 40,
  },
  imageContainer: {
    position: "relative",
    width: 120,
    height: 120,
  },
  imageMask: {
    width: "100%",
    height: "100%",
    borderRadius: 60,
    borderWidth: 2,
    borderColor: colors.border,
    overflow: "hidden",
  },
  profileImage: {
    width: "100%",
    height: "100%",
    transform: [{ scale: 1.3 }],
  },
  cameraIconContainer: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: colors.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.background,
  },
  inputSection: {
    marginBottom: 40,
  },
  label: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
    marginLeft: 4,
  },
  inputRow: {
    flexDirection: "row",
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: colors.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputError: {
    borderColor: colors.error,
  },
  inputSuccess: {
    borderColor: colors.success,
  },
  checkButton: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
    backgroundColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  checkButtonDisabled: {
    borderColor: colors.border,
    opacity: 0.5,
  },
  checkButtonText: {
    color: colors.primary,
    fontWeight: "bold",
  },
  helperRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
    marginTop: 6,
    marginLeft: 4,
  },
  helperText: {
    fontSize: 12,
    color: colors.textTertiary,
  },
  errorText: {
    fontSize: 12,
    color: colors.error,
  },
  successText: {
    fontSize: 12,
    color: colors.success,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  saveButtonDisabled: {
    backgroundColor: colors.border,
    borderWidth: 1,
    borderColor: colors.border,
  },
  saveButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "bold",
  },
  saveButtonTextDisabled: {
    color: colors.textTertiary,
  },
});

export default ProfileEditScreen;
