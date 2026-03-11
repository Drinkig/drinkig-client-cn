import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  LayoutAnimation,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  UIManager,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/Ionicons";
import { logEvent, logScreen } from "utils/analytics";
import {
  createTastingNote,
  searchWinesPublic,
  TastingNoteRequest,
  WineUserDTO,
} from "../api/wine";
import CalendarModal from "../components/tasting_note/CalendarModal";
import ColorSelector from "../components/tasting_note/ColorSelector";
import HelpModal from "../components/tasting_note/HelpModal";
import StarRating from "../components/tasting_note/StarRating";
import TasteLevelSelector from "../components/tasting_note/TasteLevelSelector";
import { TASTE_TIPS } from "../components/tasting_note/constants";
import { useGlobalUI } from "../context/GlobalUIContext";
import { RootStackParamList } from "../types";
import { colors } from '../constants/colors';
import { useTranslation } from "react-i18next";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type TastingNoteWriteScreenRouteProp = RouteProp<
  RootStackParamList,
  "TastingNoteWrite"
>;

export default function TastingNoteWriteScreen() {
  const navigation = useNavigation();
  const route = useRoute<TastingNoteWriteScreenRouteProp>();
  const { showAlert } = useGlobalUI();
  const { t, i18n } = useTranslation();

  const params = route.params || {};
  const [selectedWine, setSelectedWine] = useState<{
    wineId?: number;
    wineName?: string;
    wineNameEng?: string;
    wineImage?: string;
    wineType?: string;
  }>({
    wineId: params.wineId,
    wineName: params.wineName,
    wineImage: params.wineImage,
    wineType: params.wineType,
  });

  const [searchText, setSearchText] = useState("");
  const [searchResults, setSearchResults] = useState<WineUserDTO[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  useEffect(() => {
    logScreen("tasting_note_write");
  }, []);

  useEffect(() => {
    if (route.params?.wineId) {
      let imageUrl = route.params.wineImage;
      if (!imageUrl && route.params.wineId) {
        imageUrl = `https://drinkeg-bucket-1.s3.ap-northeast-2.amazonaws.com/wine/${route.params.wineId}.png`;
      }

      setSelectedWine({
        wineId: route.params.wineId,
        wineName: route.params.wineName,
        wineImage: imageUrl,
        wineType: route.params.wineType,
      });

      setColor("");
    }
  }, [route.params]);

  const getWineTypeColor = (type: string) => {
    switch (type) {
      case "레드":
      case "Red":
        return "#EF5350";
      case "화이트":
      case "White":
        return "#F4D03F";
      case "스파클링":
      case "Sparkling":
        return "#5DADE2";
      case "로제":
      case "Rose":
        return "#F1948A";
      case "디저트":
      case "Dessert":
        return "#F5B041";
      default:
        return "#95A5A6";
    }
  };

  const [vintageYear, setVintageYear] = useState("");
  const [color, setColor] = useState("");
  const [tasteDate, setTasteDate] = useState(
    new Date().toISOString().split("T")[0],
  );

  const [sweetness, setSweetness] = useState(0);
  const [acidity, setAcidity] = useState(0);
  const [tannin, setTannin] = useState(0);
  const [body, setBody] = useState(0);
  const [alcohol, setAlcohol] = useState(0);

  const [nose, setNose] = useState("");
  const [finish, setFinish] = useState("");
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [tipModalVisible, setTipModalVisible] = useState(false);
  const [currentTip, setCurrentTip] = useState<{
    title: string;
    description: string;
  } | null>(null);
  const [calendarVisible, setCalendarVisible] = useState(false);

  const isFormValid =
    selectedWine.wineId &&
    color !== "" &&
    tasteDate !== "" &&
    sweetness > 0 &&
    acidity > 0 &&
    tannin > 0 &&
    body > 0 &&
    alcohol > 0 &&
    rating > 0;

  const handleRating = (value: number) => {
    setRating(value);
  };

  const mapLevelToValue = (level: number) => level * 20;

  const handleSearch = async (text: string) => {
    setSearchText(text);
    if (text.trim().length > 0) {
      try {
        const response = await searchWinesPublic({
          searchName: text,
          page: 0,
          size: 5,
        });

        if (response.isSuccess) {
          setSearchResults(response.result.content);
          setShowSearchResults(true);
        } else {
          setSearchResults([]);
          setShowSearchResults(false);
        }
      } catch (error) {
        console.error("Search failed:", error);
        setSearchResults([]);
      }
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  };

  const handleSelectWine = (wine: WineUserDTO) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    let imageUrl = wine.imageUrl;
    if (!imageUrl && wine.wineId) {
      imageUrl = `https://drinkeg-bucket-1.s3.ap-northeast-2.amazonaws.com/wine/${wine.wineId}.png`;
    }

    setSelectedWine({
      wineId: wine.wineId,
      wineName: wine.name,
      wineNameEng: wine.nameEng,
      wineImage: imageUrl,
      wineType: wine.sort,
    });
    setColor("");
    setSearchText("");
    setShowSearchResults(false);
  };

  const resetSelection = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelectedWine({});
    setSearchText("");
  };

  const handleSubmit = async () => {
    if (!selectedWine.wineId) {
      showAlert({
        title: t('tastingNoteWrite.error.noWine'),
        message: t('tastingNoteWrite.error.noWine'),
        singleButton: true,
      });
      return;
    }
    if (!tasteDate) {
      showAlert({
        title: t('tastingNoteWrite.error.noDate'),
        message: t('tastingNoteWrite.error.noDate'),
        singleButton: true,
      });
      return;
    }
    if (!color) {
      showAlert({
        title: t('tastingNoteWrite.error.noColor'),
        message: t('tastingNoteWrite.error.noColor'),
        singleButton: true,
      });
      return;
    }
    if (
      sweetness === 0 ||
      acidity === 0 ||
      tannin === 0 ||
      body === 0 ||
      alcohol === 0
    ) {
      showAlert({
        title: t('tastingNoteWrite.error.noTaste'),
        message: t('tastingNoteWrite.error.noTaste'),
        singleButton: true,
      });
      return;
    }
    if (rating === 0) {
      showAlert({
        title: t('tastingNoteWrite.error.noRating'),
        message: t('tastingNoteWrite.error.noRating'),
        singleButton: true,
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const reviewParts = [];
      if (finish) reviewParts.push(`[Finish] ${finish}`);
      if (review) reviewParts.push(review);

      const finalReview =
        reviewParts.length > 0 ? reviewParts.join("\n\n") : "";

      const requestData: TastingNoteRequest = {
        wineId: selectedWine.wineId,
        vintageYear:
          vintageYear === "NV"
            ? 0
            : vintageYear
              ? parseInt(vintageYear, 10)
              : undefined,
        color: color,
        tasteDate,
        sweetness: mapLevelToValue(sweetness),
        acidity: mapLevelToValue(acidity),
        tannin: mapLevelToValue(tannin),
        body: mapLevelToValue(body),
        alcohol: mapLevelToValue(alcohol),
        nose: nose
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s.length > 0),
        rating,
        review: finalReview,
      };

      const response = await createTastingNote(requestData);

      if (response.isSuccess) {
        logEvent("tasting_note_save_success");
        showAlert({
          title: t('tastingNoteWrite.success.saveTitle'),
          message: t('tastingNoteWrite.success.saveMsg'),
          singleButton: true,
          onConfirm: () => navigation.goBack(),
        });
      } else {
        showAlert({
          title: t('tastingNoteWrite.error.saveFail'),
          message: response.message || t('tastingNoteWrite.error.saveFail'),
          singleButton: true,
        });
      }
    } catch (error) {
      console.error("Tasting note submit error:", error);
      const isAuthError = (error as any).response?.status === 401;
      showAlert({
        title: t('tastingNoteWrite.error.saveFail'),
        message: isAuthError
          ? t('tastingNoteWrite.error.authExpired')
          : t('tastingNoteWrite.error.networkFail'),
        singleButton: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const showTip = (key: string) => {
    const tip = TASTE_TIPS[key];
    if (tip) {
      setCurrentTip(tip);
      setTipModalVisible(true);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Icon name="close" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('tastingNoteWrite.header')}</Text>
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={isSubmitting || !isFormValid}
        >
          <Text
            style={[
              styles.saveButton,
              (isSubmitting || !isFormValid) && { color: "#666" },
            ]}
          >
            {t('tastingNoteWrite.save')}
          </Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.section, { zIndex: 100 }]}>
            <Text style={styles.sectionTitle}>{t('tastingNoteWrite.section.wineSelection')}</Text>

            {selectedWine.wineId ? (
              <View style={styles.selectedWineContainer}>
                <View style={styles.wineInfoRow}>
                  {selectedWine.wineImage ? (
                    <Image
                      source={{ uri: selectedWine.wineImage }}
                      style={styles.wineThumbnail}
                      resizeMode="contain"
                    />
                  ) : (
                    <View style={styles.wineThumbnailPlaceholder}>
                      <Icon name="wine" size={30} color="#666" />
                    </View>
                  )}
                  <View style={styles.wineTextInfo}>
                    <Text style={styles.wineName} numberOfLines={2}>
                      {i18n.language === 'en' ? (selectedWine.wineNameEng || selectedWine.wineName) : selectedWine.wineName}
                    </Text>
                    <Text style={styles.wineType}>{selectedWine.wineType}</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.changeButton}
                  onPress={resetSelection}
                >
                  <Text style={styles.changeButtonText}>{t('tastingNoteWrite.wineSearch.changeButton')}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.searchSection}>
                <View style={styles.nameInputContainer}>
                  <View style={styles.searchIconContainer}>
                    <Icon name="search" size={20} color={colors.textSecondary} />
                  </View>
                  <TextInput
                    style={styles.nameInput}
                    placeholder={t('tastingNoteWrite.wineSearch.placeholder')}
                    placeholderTextColor="#666"
                    value={searchText}
                    onChangeText={handleSearch}
                    returnKeyType="search"
                  />

                  {showSearchResults && searchResults.length > 0 && (
                    <View style={styles.searchResultsContainer}>
                      <ScrollView
                        keyboardShouldPersistTaps="handled"
                        nestedScrollEnabled={true}
                        showsVerticalScrollIndicator={false}
                      >
                        {searchResults.map((item) => (
                          <TouchableOpacity
                            key={item.wineId}
                            style={styles.searchResultItem}
                            onPress={() => handleSelectWine(item)}
                          >
                            <View style={styles.resultTextContainer}>
                              {i18n.language === 'en' ? (
                                <Text style={styles.resultNameKor} numberOfLines={2}>
                                  {item.nameEng || item.name}
                                </Text>
                              ) : (
                                <>
                                  <Text style={styles.resultNameKor}>
                                    {item.name}
                                  </Text>
                                  <Text style={styles.resultNameEng}>
                                    {item.nameEng}
                                  </Text>
                                </>
                              )}
                            </View>
                            <View
                              style={[
                                styles.typeChip,
                                {
                                  backgroundColor: getWineTypeColor(item.sort),
                                },
                              ]}
                            >
                              <Text style={styles.typeChipText}>
                                {item.sort}
                              </Text>
                            </View>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>
              </View>
            )}
          </View>

          {selectedWine.wineId && (
            <>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('tastingNoteWrite.section.basicInfo')}</Text>

                <View style={styles.row}>
                  <View
                    style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}
                  >
                    <Text style={styles.label}>{t('tastingNoteWrite.basicInfo.vintage')}</Text>
                    <View
                      style={[
                        styles.vintageInputWrapper,
                        vintageYear.length === 4 &&
                        vintageYear !== "NV" &&
                        styles.vintageInputWrapperValid,
                      ]}
                    >
                      <TextInput
                        style={styles.vintageInput}
                        placeholder={t('tastingNoteWrite.basicInfo.vintagePlaceholder')}
                        placeholderTextColor="#666"
                        keyboardType="numeric"
                        value={vintageYear}
                        onChangeText={(text) => {
                          if (text !== "NV") {
                            setVintageYear(text.replace(/[^0-9]/g, ""));
                          } else {
                            setVintageYear(text);
                          }
                        }}
                        maxLength={4}
                      />
                      {vintageYear.length === 4 && vintageYear !== "NV" ? (
                        <Icon
                          name="checkmark-circle"
                          size={20}
                          color={colors.primary}
                          style={{ marginRight: 4 }}
                        />
                      ) : (
                        <TouchableOpacity
                          style={[
                            styles.nvButton,
                            vintageYear === "NV" && styles.nvButtonActive,
                          ]}
                          onPress={() =>
                            setVintageYear(vintageYear === "NV" ? "" : "NV")
                          }
                        >
                          <Text
                            style={[
                              styles.nvButtonText,
                              vintageYear === "NV" && styles.nvButtonTextActive,
                            ]}
                          >
                            NV
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>

                  <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                    <Text style={styles.label}>{t('tastingNoteWrite.basicInfo.tasteDate')}</Text>
                    <TouchableOpacity
                      style={styles.dateButton}
                      onPress={() => setCalendarVisible(true)}
                    >
                      <Text style={styles.dateButtonText}>
                        {tasteDate || t('tastingNoteWrite.basicInfo.datePlaceholder')}
                      </Text>
                      <Icon name="calendar-outline" size={20} color={colors.primary} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              <ColorSelector
                wineType={selectedWine.wineType}
                selectedColor={color}
                onSelectColor={setColor}
              />

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('tastingNoteWrite.section.nose')}</Text>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>
                    {t('tastingNoteWrite.nose.label')}
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder={t('tastingNoteWrite.nose.placeholder')}
                    placeholderTextColor="#666"
                    value={nose}
                    onChangeText={setNose}
                  />
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('tastingNoteWrite.section.palate')}</Text>
                <TasteLevelSelector
                  label={t('tastingNoteWrite.palate.sweetness')}
                  value={sweetness}
                  onChange={setSweetness}
                  onHelpPress={() => showTip("sweetness")}
                />
                <TasteLevelSelector
                  label={t('tastingNoteWrite.palate.acidity')}
                  value={acidity}
                  onChange={setAcidity}
                  onHelpPress={() => showTip("acidity")}
                />
                <TasteLevelSelector
                  label={t('tastingNoteWrite.palate.tannin')}
                  value={tannin}
                  onChange={setTannin}
                  onHelpPress={() => showTip("tannin")}
                />
                <TasteLevelSelector
                  label={t('tastingNoteWrite.palate.body')}
                  value={body}
                  onChange={setBody}
                  onHelpPress={() => showTip("body")}
                />
                <TasteLevelSelector
                  label={t('tastingNoteWrite.palate.alcohol')}
                  value={alcohol}
                  onChange={setAlcohol}
                  onHelpPress={() => showTip("alcohol")}
                />
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('tastingNoteWrite.section.finish')}</Text>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>
                    {t('tastingNoteWrite.finish.label')}
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder={t('tastingNoteWrite.finish.placeholder')}
                    placeholderTextColor="#666"
                    value={finish}
                    onChangeText={setFinish}
                  />
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('tastingNoteWrite.section.conclusion')}</Text>

                <StarRating rating={rating} onRatingChange={handleRating} />

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>{t('tastingNoteWrite.conclusion.reviewLabel')}</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder={t('tastingNoteWrite.conclusion.reviewPlaceholder')}
                    placeholderTextColor="#666"
                    multiline
                    numberOfLines={4}
                    value={review}
                    onChangeText={setReview}
                  />
                </View>
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <HelpModal
        visible={tipModalVisible}
        title={currentTip?.title || ""}
        description={currentTip?.description || ""}
        onClose={() => setTipModalVisible(false)}
      />

      <CalendarModal
        visible={calendarVisible}
        selectedDate={tasteDate}
        onDateSelect={setTasteDate}
        onClose={() => setCalendarVisible(false)}
      />
    </SafeAreaView >
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    color: colors.white,
    fontSize: 18,
    fontWeight: "600",
  },
  saveButton: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: "bold",
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    color: colors.white,
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    paddingLeft: 10,
  },

  searchSection: {
    position: "relative",
    zIndex: 100,
  },
  nameInputContainer: {
    position: "relative",
    zIndex: 100,
  },
  searchIconContainer: {
    position: "absolute",
    left: 12,
    top: 14,
    zIndex: 1,
  },
  nameInput: {
    backgroundColor: colors.surface1,
    borderRadius: 8,
    padding: 12,
    paddingLeft: 40,
    color: colors.white,
    fontSize: 16,
  },
  searchResultsContainer: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    marginTop: 4,
    backgroundColor: colors.surface1,
    borderRadius: 8,
    zIndex: 999,
    elevation: 10,
    borderWidth: 1,
    borderColor: "#444",
    maxHeight: 250,
    overflow: "hidden",
  },
  searchResultItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#444",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  resultTextContainer: {
    flex: 1,
    marginRight: 16,
  },
  resultNameKor: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 2,
  },
  resultNameEng: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  typeChip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    flexShrink: 0,
  },
  typeChipText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: "bold",
  },

  selectedWineContainer: {
    backgroundColor: colors.surface1,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#444",
  },
  wineInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  wineThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: colors.border,
  },
  wineThumbnailPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  wineTextInfo: {
    flex: 1,
    marginLeft: 12,
  },
  wineName: {
    color: colors.white,
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  wineType: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  changeButton: {
    backgroundColor: colors.border,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  changeButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "500",
  },

  row: {
    flexDirection: "row",
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    color: "#ccc",
    fontSize: 14,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.surface1,
    borderRadius: 8,
    padding: 12,
    color: colors.white,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  ratingContainer: {
    marginBottom: 20,
    alignItems: "center",
  },
  stars: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  ratingValue: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "bold",
  },

  vintageInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface1,
    borderRadius: 8,
    paddingRight: 8,
    borderWidth: 1,
    borderColor: "transparent",
  },
  vintageInputWrapperValid: {
    borderColor: colors.primary,
    backgroundColor: "rgba(142, 68, 173, 0.05)",
  },
  vintageInput: {
    flex: 1,
    padding: 12,
    color: colors.white,
    fontSize: 16,
  },
  nvButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    backgroundColor: "#444",
  },
  nvButtonActive: {
    backgroundColor: colors.primary,
  },
  nvButtonText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: "bold",
  },
  nvButtonTextActive: {
    color: colors.white,
  },

  dateButton: {
    backgroundColor: colors.surface1,
    borderRadius: 8,
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dateButtonText: {
    color: colors.white,
    fontSize: 16,
  },
});
