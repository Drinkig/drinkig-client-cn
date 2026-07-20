import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActionSheetIOS,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import { launchCamera, launchImageLibrary } from "react-native-image-picker";
import { useTranslation } from "react-i18next";
import { colors } from "../constants/colors";
import {
  getWineTypeColor as getTypeColor,
  WINE_TYPE_ON_COLOR,
} from "../constants/wineColors";
import GlassHeader from "../components/common/GlassHeader";
import { submitWineRequest } from "../api/wine";
import { useGlobalUI } from "../context/GlobalUIContext";

const WINE_TYPES = ["Red", "White", "Sparkling", "Rose", "Dessert"] as const;

const WineRegisterScreen = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { showToast } = useGlobalUI();

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [nameEng, setNameEng] = useState("");
  const [sort, setSort] = useState("");
  const [country, setCountry] = useState("");
  const [region, setRegion] = useState("");
  const [variety, setVariety] = useState("");
  const [vintage, setVintage] = useState("");
  const [memo, setMemo] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePickImage = () => {
    const cameraOption = t("wineRegister.image.camera");
    const galleryOption = t("wineRegister.image.gallery");

    const openCamera = () => {
      launchCamera(
        { mediaType: "photo", maxWidth: 1024, maxHeight: 1024, quality: 0.8 },
        (response) => {
          if (
            !response.didCancel &&
            !response.errorCode &&
            response.assets?.[0]?.uri
          ) {
            setImageUri(response.assets[0].uri);
          }
        }
      );
    };

    const openGallery = () => {
      launchImageLibrary(
        { mediaType: "photo", maxWidth: 1024, maxHeight: 1024, quality: 0.8 },
        (response) => {
          if (
            !response.didCancel &&
            !response.errorCode &&
            response.assets?.[0]?.uri
          ) {
            setImageUri(response.assets[0].uri);
          }
        }
      );
    };

    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [t("common.cancel"), cameraOption, galleryOption],
          cancelButtonIndex: 0,
        },
        (idx) => {
          if (idx === 1) openCamera();
          else if (idx === 2) openGallery();
        }
      );
    } else {
      Alert.alert(t("wineRegister.image.label"), undefined, [
        { text: cameraOption, onPress: openCamera },
        { text: galleryOption, onPress: openGallery },
        { text: t("common.cancel"), style: "cancel" },
      ]);
    }
  };

  const isFormValid = () => {
    return (
      name.trim().length > 0 && sort.length > 0 && country.trim().length > 0
    );
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      showToast(t("wineRegister.alert.nameRequired"), { type: "error" });
      return;
    }
    if (!sort) {
      showToast(t("wineRegister.alert.sortRequired"), { type: "error" });
      return;
    }
    if (!country.trim()) {
      showToast(t("wineRegister.alert.countryRequired"), { type: "error" });
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();

      const requestData = {
        name: name.trim(),
        // 영문명은 선택 입력이므로 비어 있으면 한글명으로 대체해 보낸다.
        nameEng: nameEng.trim() || name.trim(),
        sort,
        country: country.trim(),
        region: region.trim(),
        variety: variety.trim(),
        vintageYear: vintage ? parseInt(vintage, 10) : 0,
        memo: memo.trim(),
      };
      formData.append("wineRegisterRequest", JSON.stringify(requestData));

      if (imageUri) {
        const ext = imageUri.split(".").pop() || "jpg";
        formData.append("wineImage", {
          uri: imageUri,
          type: `image/${ext === "png" ? "png" : "jpeg"}`,
          name: `wine_request.${ext}`,
        } as any);
      }

      const response = await submitWineRequest(formData);

      if (response.isSuccess) {
        Alert.alert(
          t("wineRegister.alert.success"),
          t("wineRegister.alert.successMsg"),
          [
            {
              text: t("common.confirm"),
              onPress: () => {
                navigation.goBack();
              },
            },
          ]
        );
      } else {
        showToast(response.message || t("wineRegister.alert.errorMsg"), {
          type: "error",
        });
      }
    } catch (error) {
      console.error("Wine register request failed:", error);
      showToast(t("wineRegister.alert.errorMsg"), { type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <GlassHeader
        floating={false}
        title={t("wineRegister.header")}
        left={
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon name="arrow-back" size={22} color={colors.white} />
          </TouchableOpacity>
        }
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={styles.body}
          contentContainerStyle={styles.bodyContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.subtitle}>{t("wineRegister.subtitle")}</Text>

          {/* Image Picker */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t("wineRegister.image.label")}</Text>
            <TouchableOpacity
              style={styles.imagePicker}
              onPress={handlePickImage}
            >
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.imagePreview} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Icon
                    name="camera-outline"
                    size={32}
                    color={colors.textSecondary}
                  />
                  <Text style={styles.imageAddText}>
                    {t("wineRegister.image.add")}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Wine Name (Korean) */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              {t("wineRegister.name")} <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.textInput}
                placeholder={t("wineRegister.namePlaceholder")}
                placeholderTextColor={colors.textTertiary}
                value={name}
                onChangeText={setName}
              />
            </View>
          </View>

          {/* Wine Name (English) */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t("wineRegister.nameEng")}</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.textInput}
                placeholder={t("wineRegister.nameEngPlaceholder")}
                placeholderTextColor={colors.textTertiary}
                value={nameEng}
                onChangeText={setNameEng}
              />
            </View>
          </View>

          {/* Wine Type */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              {t("wineRegister.sort")} <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.typeContainer}>
              {WINE_TYPES.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.typeChip,
                    sort === type && {
                      backgroundColor: getTypeColor(type),
                      borderColor: getTypeColor(type),
                    },
                  ]}
                  onPress={() => setSort(sort === type ? "" : type)}
                >
                  <Text
                    style={[
                      styles.typeChipText,
                      sort === type && styles.typeChipTextActive,
                    ]}
                  >
                    {t(`wineRegister.types.${type}`)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Country */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              {t("wineRegister.country")} <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.textInput}
                placeholder={t("wineRegister.countryPlaceholder")}
                placeholderTextColor={colors.textTertiary}
                value={country}
                onChangeText={setCountry}
              />
            </View>
          </View>

          {/* Region */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t("wineRegister.region")}</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.textInput}
                placeholder={t("wineRegister.regionPlaceholder")}
                placeholderTextColor={colors.textTertiary}
                value={region}
                onChangeText={setRegion}
              />
            </View>
          </View>

          {/* Variety */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t("wineRegister.variety")}</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.textInput}
                placeholder={t("wineRegister.varietyPlaceholder")}
                placeholderTextColor={colors.textTertiary}
                value={variety}
                onChangeText={setVariety}
              />
            </View>
          </View>

          {/* Vintage */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t("wineRegister.vintage")}</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.textInput}
                placeholder={t("wineRegister.vintagePlaceholder")}
                placeholderTextColor={colors.textTertiary}
                value={vintage}
                onChangeText={(text) => setVintage(text.replace(/[^0-9]/g, ""))}
                keyboardType="numeric"
                maxLength={4}
              />
            </View>
          </View>

          {/* Memo */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t("wineRegister.memo")}</Text>
            <View style={[styles.inputWrapper, { minHeight: 80 }]}>
              <TextInput
                style={[
                  styles.textInput,
                  { textAlignVertical: "top", minHeight: 60 },
                ]}
                placeholder={t("wineRegister.memoPlaceholder")}
                placeholderTextColor={colors.textTertiary}
                value={memo}
                onChangeText={setMemo}
                multiline
              />
            </View>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.submitButton,
            (!isFormValid() || isSubmitting) && styles.disabledButton,
          ]}
          onPress={handleSubmit}
          disabled={!isFormValid() || isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Text style={styles.submitButtonText}>
              {t("wineRegister.button.submit")}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  body: {
    flex: 1,
    paddingHorizontal: 24,
  },
  bodyContent: {
    paddingTop: 24,
    paddingBottom: 24,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 24,
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  required: {
    color: colors.primary,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
  },
  textInput: {
    flex: 1,
    paddingVertical: 12,
    color: colors.white,
    fontSize: 16,
  },
  imagePicker: {
    width: 120,
    height: 160,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: "dashed",
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.surface1,
    gap: 8,
  },
  imageAddText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  imagePreview: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  typeContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  typeChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface1,
  },
  typeChipText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  typeChipTextActive: {
    color: WINE_TYPE_ON_COLOR,
    fontWeight: "600",
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  submitButton: {
    width: "100%",
    height: 56,
    backgroundColor: colors.primary,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  disabledButton: {
    opacity: 0.3,
  },
  submitButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default WineRegisterScreen;
