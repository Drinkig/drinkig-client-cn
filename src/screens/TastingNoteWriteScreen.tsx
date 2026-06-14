import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import React, { useCallback, useEffect, useRef, useState } from "react";
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
import GlassHeader from "../components/common/GlassHeader";
import { logEvent, logScreen } from "utils/analytics";
import {
  createTastingNote,
  searchWinesPublic,
  TastingNoteRequest,
  WineUserDTO,
} from "../api/wine";
import { rankWineUserDTOByRelevance } from "../utils/searchRelevance";
import CalendarModal from "../components/tasting_note/CalendarModal";
import ColorSelector from "../components/tasting_note/ColorSelector";
import HelpModal from "../components/tasting_note/HelpModal";
import StarRating from "../components/tasting_note/StarRating";
import TasteLevelSelector from "../components/tasting_note/TasteLevelSelector";
import { TASTE_TIPS } from "../components/tasting_note/constants";
import { useGlobalUI } from "../context/GlobalUIContext";
import { RootStackParamList } from "../types";
import { colors } from "../constants/colors";
import { getWineTypeColor } from "../constants/wineColors";
import { useTranslation } from "react-i18next";
import {
  saveDraft,
  loadDraft,
  clearDraft,
  TastingNoteDraft,
} from "../utils/tastingNoteDraftStorage";

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
  const { showAlert, showToast } = useGlobalUI();
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

  useEffect(() => {
    logScreen("tasting_note_write");
  }, []);

  // Debounced wine search (same as WineAddScreen)
  useEffect(() => {
    if (searchText.trim().length === 0) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const response = await searchWinesPublic({
          searchName: searchText,
        });
        if (response.isSuccess) {
          setSearchResults(
            rankWineUserDTOByRelevance(
              response.result.content,
              searchText.trim()
            )
          );
        } else {
          setSearchResults([]);
        }
      } catch (error) {
        console.error("Search failed:", error);
        setSearchResults([]);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchText]);

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

  const [vintageYear, setVintageYear] = useState("");
  const [color, setColor] = useState("");
  const [tasteDate, setTasteDate] = useState(
    new Date().toISOString().split("T")[0]
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
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [draftSavedMessage, setDraftSavedMessage] = useState(false);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load draft on mount
  useEffect(() => {
    if (params.wineId) {
      // If opened with a specific wine, don't load draft
      setDraftLoaded(true);
      return;
    }
    (async () => {
      const draft = await loadDraft();
      if (draft) {
        showAlert({
          title: t("tastingNoteWrite.draft.restoreTitle"),
          message: t("tastingNoteWrite.draft.restoreMsg"),
          singleButton: false,
          confirmText: t("tastingNoteWrite.draft.restoreConfirm"),
          cancelText: t("tastingNoteWrite.draft.restoreCancel"),
          onConfirm: () => {
            if (draft.wineId) {
              setSelectedWine({
                wineId: draft.wineId,
                wineName: draft.wineName,
                wineNameEng: draft.wineNameEng,
                wineImage: draft.wineImage,
                wineType: draft.wineType,
              });
            }
            setVintageYear(draft.vintageYear);
            setColor(draft.color);
            setTasteDate(draft.tasteDate);
            setSweetness(draft.sweetness);
            setAcidity(draft.acidity);
            setTannin(draft.tannin);
            setBody(draft.body);
            setAlcohol(draft.alcohol);
            setNose(draft.nose);
            setFinish(draft.finish);
            setRating(draft.rating);
            setReview(draft.review);
            setDraftLoaded(true);
          },
          onCancel: () => {
            clearDraft();
            setDraftLoaded(true);
          },
        });
      } else {
        setDraftLoaded(true);
      }
    })();
  }, []);

  // Build current draft data
  const getCurrentDraft = useCallback(
    (): TastingNoteDraft => ({
      wineId: selectedWine.wineId,
      wineName: selectedWine.wineName,
      wineNameEng: selectedWine.wineNameEng,
      wineImage: selectedWine.wineImage,
      wineType: selectedWine.wineType,
      vintageYear,
      color,
      tasteDate,
      sweetness,
      acidity,
      tannin,
      body,
      alcohol,
      nose,
      finish,
      rating,
      review,
      savedAt: new Date().toISOString(),
    }),
    [
      selectedWine,
      vintageYear,
      color,
      tasteDate,
      sweetness,
      acidity,
      tannin,
      body,
      alcohol,
      nose,
      finish,
      rating,
      review,
    ]
  );

  // Auto-save draft (debounced 3s)
  useEffect(() => {
    if (!draftLoaded) return;
    // Only auto-save if user has started filling in data
    const hasData =
      selectedWine.wineId ||
      vintageYear ||
      color ||
      nose ||
      finish ||
      review ||
      sweetness > 0 ||
      acidity > 0 ||
      tannin > 0 ||
      body > 0 ||
      alcohol > 0 ||
      rating > 0;
    if (!hasData) return;

    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current);
    }
    autoSaveTimer.current = setTimeout(() => {
      saveDraft(getCurrentDraft());
    }, 3000);

    return () => {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
    };
  }, [draftLoaded, getCurrentDraft]);

  // Manual draft save
  const handleSaveDraft = useCallback(async () => {
    await saveDraft(getCurrentDraft());
    setDraftSavedMessage(true);
    setTimeout(() => setDraftSavedMessage(false), 2000);
    logEvent("tasting_note_draft_save");
  }, [getCurrentDraft]);

  // Close with confirmation if there's unsaved data
  const handleClose = useCallback(() => {
    const hasData =
      selectedWine.wineId ||
      vintageYear ||
      color ||
      nose ||
      finish ||
      review ||
      sweetness > 0 ||
      acidity > 0 ||
      tannin > 0 ||
      body > 0 ||
      alcohol > 0 ||
      rating > 0;

    if (hasData) {
      showAlert({
        title: t("tastingNoteWrite.draft.closeTitle"),
        message: t("tastingNoteWrite.draft.closeMsg"),
        singleButton: false,
        confirmText: t("tastingNoteWrite.draft.closeSave"),
        cancelText: t("tastingNoteWrite.draft.closeDiscard"),
        onConfirm: async () => {
          await saveDraft(getCurrentDraft());
          navigation.goBack();
        },
        onCancel: async () => {
          await clearDraft();
          navigation.goBack();
        },
      });
    } else {
      navigation.goBack();
    }
  }, [
    selectedWine,
    vintageYear,
    color,
    nose,
    finish,
    review,
    sweetness,
    acidity,
    tannin,
    body,
    alcohol,
    rating,
    getCurrentDraft,
    navigation,
    showAlert,
    t,
  ]);

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
    setSearchResults([]);
  };

  const resetSelection = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelectedWine({});
    setSearchText("");
  };

  const handleSubmit = async () => {
    if (!selectedWine.wineId) {
      showToast(t("tastingNoteWrite.error.noWine"), { type: "info" });
      return;
    }
    if (!tasteDate) {
      showToast(t("tastingNoteWrite.error.noDate"), { type: "info" });
      return;
    }
    if (!color) {
      showToast(t("tastingNoteWrite.error.noColor"), { type: "info" });
      return;
    }
    if (
      sweetness === 0 ||
      acidity === 0 ||
      tannin === 0 ||
      body === 0 ||
      alcohol === 0
    ) {
      showToast(t("tastingNoteWrite.error.noTaste"), { type: "info" });
      return;
    }
    if (rating === 0) {
      showToast(t("tastingNoteWrite.error.noRating"), { type: "info" });
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
        await clearDraft();
        logEvent("tasting_note_save_success");
        showToast(t("tastingNoteWrite.success.saveMsg"), {
          type: "success",
          onHide: () => navigation.goBack(),
        });
      } else {
        showToast(response.message || t("tastingNoteWrite.error.saveFail"), {
          type: "error",
        });
      }
    } catch (error) {
      console.error("Tasting note submit error:", error);
      const isAuthError = (error as any).response?.status === 401;
      showToast(
        isAuthError
          ? t("tastingNoteWrite.error.authExpired")
          : t("tastingNoteWrite.error.networkFail"),
        { type: "error" }
      );
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

      <GlassHeader
        floating={false}
        title={t("tastingNoteWrite.header")}
        left={
          <TouchableOpacity onPress={handleClose} style={styles.headerSide}>
            <Icon name="close" size={24} color={colors.white} />
          </TouchableOpacity>
        }
        right={
          <TouchableOpacity
            onPress={isFormValid ? handleSubmit : handleSaveDraft}
            disabled={isSubmitting}
            style={styles.headerSide}
          >
            <Text
              style={[
                styles.saveButton,
                !isFormValid && styles.draftSaveButton,
                isSubmitting && { opacity: 0.4 },
              ]}
            >
              {isFormValid
                ? t("tastingNoteWrite.save")
                : t("tastingNoteWrite.draft.save")}
            </Text>
          </TouchableOpacity>
        }
      />

      {draftSavedMessage && (
        <View style={styles.draftSavedToast}>
          <Icon name="checkmark-circle" size={16} color={colors.primary} />
          <Text style={styles.draftSavedToastText}>
            {t("tastingNoteWrite.draft.savedMsg")}
          </Text>
        </View>
      )}

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
            <Text style={styles.sectionTitle}>
              {t("tastingNoteWrite.section.wineSelection")}
            </Text>

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
                      <Icon name="wine" size={30} color={colors.textTertiary} />
                    </View>
                  )}
                  <View style={styles.wineTextInfo}>
                    <Text style={styles.wineName} numberOfLines={2}>
                      {i18n.language === "en"
                        ? selectedWine.wineNameEng || selectedWine.wineName
                        : selectedWine.wineName}
                    </Text>
                    <Text style={styles.wineType}>{selectedWine.wineType}</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.changeButton}
                  onPress={resetSelection}
                >
                  <Text style={styles.changeButtonText}>
                    {t("tastingNoteWrite.wineSearch.changeButton")}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.searchSection}>
                <View style={styles.searchBarContainer}>
                  <Icon
                    name="search"
                    size={20}
                    color={colors.textSecondary}
                    style={styles.searchIcon}
                  />
                  <TextInput
                    style={styles.searchInput}
                    placeholder={t("tastingNoteWrite.wineSearch.placeholder")}
                    placeholderTextColor={colors.textTertiary}
                    value={searchText}
                    onChangeText={setSearchText}
                    returnKeyType="search"
                  />
                  {searchText.length > 0 && (
                    <TouchableOpacity
                      onPress={() => {
                        setSearchText("");
                        setSearchResults([]);
                      }}
                      style={styles.clearButton}
                    >
                      <Icon
                        name="close-circle"
                        size={18}
                        color={colors.textTertiary}
                      />
                    </TouchableOpacity>
                  )}
                </View>

                {searchResults.length > 0 ? (
                  searchResults.map((item) => (
                    <TouchableOpacity
                      key={item.wineId}
                      style={styles.resultItem}
                      onPress={() => handleSelectWine(item)}
                    >
                      <View style={styles.resultIconContainer}>
                        {item.imageUrl ? (
                          <Image
                            source={{ uri: item.imageUrl }}
                            style={styles.resultImage}
                            resizeMode="contain"
                          />
                        ) : (
                          <Icon name="wine" size={20} color={colors.primary} />
                        )}
                      </View>
                      <View style={styles.resultTextContainer}>
                        {i18n.language === "en" ? (
                          <Text style={styles.resultNameKor} numberOfLines={2}>
                            {item.nameEng || item.name}
                          </Text>
                        ) : (
                          <>
                            <Text
                              style={styles.resultNameKor}
                              numberOfLines={2}
                            >
                              {item.name}
                            </Text>
                            <Text style={styles.resultNameEng}>
                              {item.nameEng}
                            </Text>
                          </>
                        )}
                        <View style={styles.resultInfoRow}>
                          <View
                            style={[
                              styles.typeChip,
                              { backgroundColor: getWineTypeColor(item.sort) },
                            ]}
                          >
                            <Text style={styles.typeChipText}>{item.sort}</Text>
                          </View>
                          <Text style={styles.resultCountryText}>
                            {item.country}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))
                ) : searchText.length > 0 ? (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>
                      {t("tastingNoteWrite.wineSearch.noResult")}
                    </Text>
                  </View>
                ) : null}
              </View>
            )}
          </View>

          {selectedWine.wineId && (
            <>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  {t("tastingNoteWrite.section.basicInfo")}
                </Text>

                <View style={styles.row}>
                  <View
                    style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}
                  >
                    <Text style={styles.label}>
                      {t("tastingNoteWrite.basicInfo.vintage")}
                    </Text>
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
                        placeholder={t(
                          "tastingNoteWrite.basicInfo.vintagePlaceholder"
                        )}
                        placeholderTextColor={colors.textTertiary}
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
                    <Text style={styles.label}>
                      {t("tastingNoteWrite.basicInfo.tasteDate")}
                    </Text>
                    <TouchableOpacity
                      style={styles.dateButton}
                      onPress={() => setCalendarVisible(true)}
                    >
                      <Text style={styles.dateButtonText}>
                        {tasteDate ||
                          t("tastingNoteWrite.basicInfo.datePlaceholder")}
                      </Text>
                      <Icon
                        name="calendar-outline"
                        size={20}
                        color={colors.primary}
                      />
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
                <Text style={styles.sectionTitle}>
                  {t("tastingNoteWrite.section.nose")}
                </Text>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>
                    {t("tastingNoteWrite.nose.label")}
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder={t("tastingNoteWrite.nose.placeholder")}
                    placeholderTextColor={colors.textTertiary}
                    value={nose}
                    onChangeText={setNose}
                  />
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  {t("tastingNoteWrite.section.palate")}
                </Text>
                <TasteLevelSelector
                  label={t("tastingNoteWrite.palate.sweetness")}
                  value={sweetness}
                  onChange={setSweetness}
                  onHelpPress={() => showTip("sweetness")}
                />
                <TasteLevelSelector
                  label={t("tastingNoteWrite.palate.acidity")}
                  value={acidity}
                  onChange={setAcidity}
                  onHelpPress={() => showTip("acidity")}
                />
                <TasteLevelSelector
                  label={t("tastingNoteWrite.palate.tannin")}
                  value={tannin}
                  onChange={setTannin}
                  onHelpPress={() => showTip("tannin")}
                />
                <TasteLevelSelector
                  label={t("tastingNoteWrite.palate.body")}
                  value={body}
                  onChange={setBody}
                  onHelpPress={() => showTip("body")}
                />
                <TasteLevelSelector
                  label={t("tastingNoteWrite.palate.alcohol")}
                  value={alcohol}
                  onChange={setAlcohol}
                  onHelpPress={() => showTip("alcohol")}
                />
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  {t("tastingNoteWrite.section.finish")}
                </Text>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>
                    {t("tastingNoteWrite.finish.label")}
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder={t("tastingNoteWrite.finish.placeholder")}
                    placeholderTextColor={colors.textTertiary}
                    value={finish}
                    onChangeText={setFinish}
                  />
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  {t("tastingNoteWrite.section.conclusion")}
                </Text>

                <StarRating rating={rating} onRatingChange={handleRating} />

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>
                    {t("tastingNoteWrite.conclusion.reviewLabel")}
                  </Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder={t(
                      "tastingNoteWrite.conclusion.reviewPlaceholder"
                    )}
                    placeholderTextColor={colors.textTertiary}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerSide: {
    width: 60,
    alignItems: "center",
    justifyContent: "center",
    padding: 4,
  },
  draftSaveButton: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: "normal",
  },
  draftSavedToast: {
    position: "absolute",
    top: 100,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
    zIndex: 999,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  draftSavedToastText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "500",
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

  searchSection: {},
  searchBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface1,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: colors.white,
    fontSize: 16,
    padding: 0,
    height: "100%",
  },
  clearButton: {
    padding: 4,
  },
  searchResultList: {
    maxHeight: 320,
  },
  resultItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    borderRadius: 8,
  },
  resultIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: colors.surface1,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
    overflow: "hidden",
  },
  resultImage: {
    width: "85%",
    height: "85%",
  },
  resultTextContainer: {
    flex: 1,
    gap: 3,
  },
  resultNameKor: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "600",
  },
  resultNameEng: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  resultInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
  },
  resultCountryText: {
    color: colors.textTertiary,
    fontSize: 12,
  },
  typeChip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  typeChipText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: "bold",
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    color: colors.textTertiary,
    fontSize: 14,
  },

  selectedWineContainer: {
    backgroundColor: colors.surface1,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
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
    color: colors.textSecondary,
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
    backgroundColor: colors.surface2,
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
