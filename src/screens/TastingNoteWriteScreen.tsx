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
import TagInput from "../components/common/TagInput";
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
import StepProgress from "../components/tasting_note/StepProgress";
import TasteLevelSelector from "../components/tasting_note/TasteLevelSelector";
import { TASTE_TIPS } from "../components/tasting_note/constants";
import { useGlobalUI } from "../context/GlobalUIContext";
import { RootStackParamList } from "../types";
import { colors } from "../constants/colors";
import { spacing, radius, accent, surfaces } from "../constants/theme";
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

// Wizard step indices
const STEP_WINE = 0;
const STEP_APPEARANCE = 1;
const STEP_NOSE = 2;
const STEP_PALATE = 3;
const STEP_CONCLUSION = 4;
const TOTAL_STEPS = 5;

const splitTags = (value: string) =>
  value
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

// Vintage must be a plausible past harvest year — no future years.
const MIN_VINTAGE = 1900;
const MAX_VINTAGE = new Date().getFullYear();
const isVintageComplete = (year: string) => {
  if (year.length !== 4 || year === "NV") return false;
  const n = parseInt(year, 10);
  return n >= MIN_VINTAGE && n <= MAX_VINTAGE;
};

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

  const [currentStep, setCurrentStep] = useState(
    params.wineId ? STEP_APPEARANCE : STEP_WINE
  );
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
    // Run once on mount to restore any saved draft.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const hasAnyData = useCallback(
    () =>
      !!(
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
        rating > 0
      ),
    [
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
    ]
  );

  // Auto-save draft (debounced 3s)
  useEffect(() => {
    if (!draftLoaded) return;
    if (!hasAnyData()) return;

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
  }, [draftLoaded, getCurrentDraft, hasAnyData]);

  // Manual draft save
  const handleSaveDraft = useCallback(async () => {
    await saveDraft(getCurrentDraft());
    setDraftSavedMessage(true);
    setTimeout(() => setDraftSavedMessage(false), 2000);
    logEvent("tasting_note_draft_save");
  }, [getCurrentDraft]);

  // Close with confirmation if there's unsaved data
  const handleClose = useCallback(() => {
    if (hasAnyData()) {
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
  }, [hasAnyData, getCurrentDraft, navigation, showAlert, t]);

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

  // Per-step gate for the primary "Next" button
  const canProceed = (() => {
    switch (currentStep) {
      case STEP_WINE:
        return !!selectedWine.wineId;
      case STEP_APPEARANCE:
        return color !== "" && tasteDate !== "";
      case STEP_NOSE:
        return true; // optional
      case STEP_PALATE:
        return (
          sweetness > 0 && acidity > 0 && tannin > 0 && body > 0 && alcohol > 0
        );
      case STEP_CONCLUSION:
        return rating > 0;
      default:
        return false;
    }
  })();

  const goToStep = (step: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setCurrentStep(step);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  };

  const scrollRef = useRef<ScrollView>(null);

  const handleNext = () => {
    if (currentStep < STEP_CONCLUSION) {
      goToStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > STEP_WINE) {
      goToStep(currentStep - 1);
    } else {
      handleClose();
    }
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
            : isVintageComplete(vintageYear)
            ? parseInt(vintageYear, 10)
            : undefined,
        color: color,
        tasteDate,
        sweetness: mapLevelToValue(sweetness),
        acidity: mapLevelToValue(acidity),
        tannin: mapLevelToValue(tannin),
        body: mapLevelToValue(body),
        alcohol: mapLevelToValue(alcohol),
        nose: splitTags(nose),
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

  const stepLabels = [
    t("tastingNoteWrite.step.wine"),
    t("tastingNoteWrite.step.appearance"),
    t("tastingNoteWrite.step.nose"),
    t("tastingNoteWrite.step.palate"),
    t("tastingNoteWrite.step.conclusion"),
  ];

  const wineDisplayName =
    i18n.language === "en"
      ? selectedWine.wineNameEng || selectedWine.wineName
      : selectedWine.wineName;

  const renderStepHeader = (title: string, subtitle: string) => (
    <View style={styles.stepHeader}>
      <Text style={styles.stepTitle}>{title}</Text>
      <Text style={styles.stepSubtitle}>{subtitle}</Text>
    </View>
  );

  const renderWineStep = () => (
    <View>
      {renderStepHeader(
        t("tastingNoteWrite.wineSelection.title"),
        t("tastingNoteWrite.wineSelection.subtitle")
      )}

      {selectedWine.wineId ? (
        <View style={styles.selectedWineCard}>
          {selectedWine.wineImage ? (
            <Image
              source={{ uri: selectedWine.wineImage }}
              style={styles.selectedWineImage}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.selectedWineImagePlaceholder}>
              <Icon name="wine" size={28} color={colors.textTertiary} />
            </View>
          )}
          <View style={styles.selectedWineInfo}>
            <Text style={styles.selectedWineName} numberOfLines={2}>
              {wineDisplayName}
            </Text>
            {selectedWine.wineType ? (
              <View
                style={[
                  styles.typeChip,
                  { backgroundColor: getWineTypeColor(selectedWine.wineType) },
                ]}
              >
                <Text style={styles.typeChipText}>{selectedWine.wineType}</Text>
              </View>
            ) : null}
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
        <View>
          <View style={styles.searchBar}>
            <Icon name="search" size={20} color={colors.textSecondary} />
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
              >
                <Icon
                  name="close-circle"
                  size={18}
                  color={colors.textTertiary}
                />
              </TouchableOpacity>
            )}
          </View>

          {searchResults.length > 0
            ? searchResults.map((item) => (
                <TouchableOpacity
                  key={item.wineId}
                  style={styles.resultItem}
                  onPress={() => handleSelectWine(item)}
                >
                  <View style={styles.resultImageBox}>
                    {item.imageUrl ? (
                      <Image
                        source={{ uri: item.imageUrl }}
                        style={styles.resultImage}
                        resizeMode="contain"
                      />
                    ) : (
                      <Icon name="wine" size={20} color={accent.text} />
                    )}
                  </View>
                  <View style={styles.resultText}>
                    {i18n.language === "en" ? (
                      <Text style={styles.resultName} numberOfLines={2}>
                        {item.nameEng || item.name}
                      </Text>
                    ) : (
                      <>
                        <Text style={styles.resultName} numberOfLines={2}>
                          {item.name}
                        </Text>
                        <Text style={styles.resultNameEng} numberOfLines={1}>
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
                      <Text style={styles.resultCountry}>{item.country}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            : searchText.length > 0 && (
                <View style={styles.emptyBox}>
                  <Text style={styles.emptyText}>
                    {t("tastingNoteWrite.wineSearch.noResult")}
                  </Text>
                </View>
              )}
        </View>
      )}
    </View>
  );

  const renderAppearanceStep = () => (
    <View>
      {renderStepHeader(
        t("tastingNoteWrite.appearance.title"),
        t("tastingNoteWrite.appearance.subtitle")
      )}

      <View style={styles.row}>
        <View style={[styles.fieldGroup, { flex: 1, marginRight: spacing.md }]}>
          <Text style={styles.fieldLabel}>
            {t("tastingNoteWrite.basicInfo.vintage")}
          </Text>
          <View
            style={[
              styles.vintageWrapper,
              isVintageComplete(vintageYear) && styles.vintageWrapperValid,
            ]}
          >
            <TextInput
              style={styles.vintageInput}
              placeholder={t("tastingNoteWrite.basicInfo.vintagePlaceholder")}
              placeholderTextColor={colors.textTertiary}
              keyboardType="numeric"
              value={vintageYear}
              onChangeText={(text) => {
                if (text === "NV") {
                  setVintageYear("NV");
                  return;
                }
                const digits = text.replace(/[^0-9]/g, "");
                // Reject future years outright (e.g. typing past 2026 → 2412).
                if (digits.length === 4 && parseInt(digits, 10) > MAX_VINTAGE) {
                  return;
                }
                setVintageYear(digits);
              }}
              maxLength={4}
            />
            {isVintageComplete(vintageYear) ? (
              <Icon
                name="checkmark-circle"
                size={20}
                color={accent.base}
                style={{ marginRight: spacing.xs }}
              />
            ) : (
              <TouchableOpacity
                style={[
                  styles.nvButton,
                  vintageYear === "NV" && styles.nvButtonActive,
                ]}
                onPress={() => setVintageYear(vintageYear === "NV" ? "" : "NV")}
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

        <View style={[styles.fieldGroup, { flex: 1 }]}>
          <Text style={styles.fieldLabel}>
            {t("tastingNoteWrite.basicInfo.tasteDate")}
          </Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setCalendarVisible(true)}
          >
            <Text style={styles.dateButtonText}>
              {tasteDate || t("tastingNoteWrite.basicInfo.datePlaceholder")}
            </Text>
            <Icon name="calendar-outline" size={20} color={accent.text} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.colorBlock}>
        <Text style={styles.fieldLabel}>
          {t("tastingNoteWrite.color.title")}
        </Text>
        <ColorSelector
          wineType={selectedWine.wineType}
          selectedColor={color}
          onSelectColor={setColor}
        />
      </View>
    </View>
  );

  const renderNoseStep = () => (
    <View>
      {renderStepHeader(
        t("tastingNoteWrite.nose.title"),
        t("tastingNoteWrite.nose.subtitle")
      )}
      <TagInput
        tags={splitTags(nose)}
        onChange={(tags) => setNose(tags.join(", "))}
        placeholder={t("tastingNoteWrite.nose.addPlaceholder")}
        suggestions={
          t("tastingNoteWrite.nose.suggestions", {
            returnObjects: true,
          }) as string[]
        }
        suggestionsTitle={t("tastingNoteWrite.nose.suggestionsTitle")}
      />
    </View>
  );

  const renderPalateStep = () => (
    <View>
      {renderStepHeader(
        t("tastingNoteWrite.palate.title"),
        t("tastingNoteWrite.palate.subtitle")
      )}
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
  );

  const renderConclusionStep = () => (
    <View>
      {renderStepHeader(
        t("tastingNoteWrite.conclusion.title"),
        t("tastingNoteWrite.conclusion.subtitle")
      )}

      <Text style={styles.fieldLabel}>
        {t("tastingNoteWrite.conclusion.finishLabel")}
      </Text>
      <TagInput
        tags={splitTags(finish)}
        onChange={(tags) => setFinish(tags.join(", "))}
        placeholder={t("tastingNoteWrite.finish.addPlaceholder")}
        suggestions={
          t("tastingNoteWrite.finish.suggestions", {
            returnObjects: true,
          }) as string[]
        }
        suggestionsTitle={t("tastingNoteWrite.finish.suggestionsTitle")}
      />

      <View style={styles.ratingBlock}>
        <Text style={styles.fieldLabel}>
          {t("tastingNoteWrite.conclusion.ratingLabel")}
        </Text>
        <StarRating rating={rating} onRatingChange={setRating} />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>
          {t("tastingNoteWrite.conclusion.reviewLabel")}
        </Text>
        <TextInput
          style={styles.textArea}
          placeholder={t("tastingNoteWrite.conclusion.reviewPlaceholder")}
          placeholderTextColor={colors.textTertiary}
          multiline
          numberOfLines={4}
          value={review}
          onChangeText={setReview}
        />
      </View>
    </View>
  );

  const renderStep = () => {
    switch (currentStep) {
      case STEP_WINE:
        return renderWineStep();
      case STEP_APPEARANCE:
        return renderAppearanceStep();
      case STEP_NOSE:
        return renderNoseStep();
      case STEP_PALATE:
        return renderPalateStep();
      case STEP_CONCLUSION:
        return renderConclusionStep();
      default:
        return null;
    }
  };

  const isLastStep = currentStep === STEP_CONCLUSION;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      <GlassHeader
        floating={false}
        title={t("tastingNoteWrite.step.count", {
          current: currentStep + 1,
          total: TOTAL_STEPS,
        })}
        left={
          <TouchableOpacity onPress={handleBack} style={styles.headerSide}>
            <Icon
              name={currentStep === STEP_WINE ? "close" : "chevron-back"}
              size={24}
              color={colors.white}
            />
          </TouchableOpacity>
        }
        right={
          <TouchableOpacity
            onPress={handleSaveDraft}
            disabled={isSubmitting}
            style={styles.headerSide}
          >
            <Text style={styles.draftButton}>
              {t("tastingNoteWrite.draft.save")}
            </Text>
          </TouchableOpacity>
        }
      />

      <StepProgress steps={stepLabels} current={currentStep} />

      {draftSavedMessage && (
        <View style={styles.draftSavedToast}>
          <Icon name="checkmark-circle" size={16} color={accent.text} />
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
          ref={scrollRef}
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {renderStep()}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.nextButton,
              (!canProceed || isSubmitting) && styles.nextButtonDisabled,
            ]}
            onPress={handleNext}
            disabled={!canProceed || isSubmitting}
          >
            <Text
              style={[
                styles.nextButtonText,
                (!canProceed || isSubmitting) && styles.nextButtonTextDisabled,
              ]}
            >
              {isLastStep
                ? t("tastingNoteWrite.nav.complete")
                : t("tastingNoteWrite.nav.next")}
            </Text>
            {!isLastStep && (
              <Icon
                name="chevron-forward"
                size={20}
                color={canProceed ? accent.onAccent : colors.textTertiary}
              />
            )}
          </TouchableOpacity>
        </View>
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
    minWidth: 56,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xs,
  },
  draftButton: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: "600",
  },
  draftSavedToast: {
    position: "absolute",
    top: 120,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: surfaces.card,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    gap: spacing.xs,
    zIndex: 999,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  draftSavedToastText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "500",
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxxl,
  },

  stepHeader: {
    marginBottom: spacing.xxl,
  },
  stepTitle: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  stepSubtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: spacing.sm,
    lineHeight: 20,
  },

  // Wine search
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: surfaces.card,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: surfaces.hairline,
    paddingHorizontal: spacing.lg,
    height: 52,
    marginBottom: spacing.md,
  },
  searchInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 16,
    padding: 0,
    height: "100%",
  },
  resultItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: surfaces.hairline,
  },
  resultImageBox: {
    width: 52,
    height: 52,
    borderRadius: radius.sm,
    backgroundColor: surfaces.card,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  resultImage: {
    width: "85%",
    height: "85%",
  },
  resultText: {
    flex: 1,
    gap: 3,
  },
  resultName: {
    color: colors.textPrimary,
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
    gap: spacing.sm,
    marginTop: 2,
  },
  resultCountry: {
    color: colors.textTertiary,
    fontSize: 12,
  },
  typeChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
    alignSelf: "flex-start",
  },
  typeChipText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: "bold",
  },
  emptyBox: {
    padding: spacing.xxxl,
    alignItems: "center",
  },
  emptyText: {
    color: colors.textTertiary,
    fontSize: 14,
  },

  // Selected wine card
  selectedWineCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: surfaces.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: surfaces.hairline,
    padding: spacing.lg,
    gap: spacing.lg,
  },
  selectedWineImage: {
    width: 60,
    height: 72,
    borderRadius: radius.sm,
    backgroundColor: surfaces.base,
  },
  selectedWineImagePlaceholder: {
    width: 60,
    height: 72,
    borderRadius: radius.sm,
    backgroundColor: surfaces.base,
    justifyContent: "center",
    alignItems: "center",
  },
  selectedWineInfo: {
    flex: 1,
    gap: spacing.sm,
  },
  selectedWineName: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 22,
  },
  changeButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: surfaces.hairlineStrong,
  },
  changeButtonText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: "600",
  },

  // Fields
  row: {
    flexDirection: "row",
  },
  fieldGroup: {
    marginBottom: spacing.xl,
  },
  fieldLabel: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: "600",
    marginBottom: spacing.md,
  },
  vintageWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: surfaces.card,
    borderRadius: radius.sm,
    paddingRight: spacing.sm,
    borderWidth: 1,
    borderColor: surfaces.hairline,
  },
  vintageWrapperValid: {
    borderColor: accent.border,
    backgroundColor: accent.soft,
  },
  vintageInput: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    color: colors.textPrimary,
    fontSize: 16,
  },
  nvButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    backgroundColor: surfaces.base,
  },
  nvButtonActive: {
    backgroundColor: accent.base,
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
    backgroundColor: surfaces.card,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: surfaces.hairline,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dateButtonText: {
    color: colors.textPrimary,
    fontSize: 15,
  },
  colorBlock: {
    marginTop: spacing.sm,
  },

  ratingBlock: {
    marginTop: spacing.xxl,
    marginBottom: spacing.xl,
  },
  textArea: {
    backgroundColor: surfaces.card,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: surfaces.hairline,
    padding: spacing.lg,
    color: colors.textPrimary,
    fontSize: 15,
    height: 120,
    textAlignVertical: "top",
  },

  // Footer
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    borderTopWidth: 1,
    borderTopColor: surfaces.hairline,
    backgroundColor: colors.background,
  },
  nextButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    height: 54,
    borderRadius: radius.md,
    backgroundColor: accent.base,
  },
  nextButtonDisabled: {
    backgroundColor: surfaces.card,
  },
  nextButtonText: {
    color: accent.onAccent,
    fontSize: 16,
    fontWeight: "700",
  },
  nextButtonTextDisabled: {
    color: colors.textTertiary,
  },
});
