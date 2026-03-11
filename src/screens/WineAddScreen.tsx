import { useNavigation, useRoute } from "@react-navigation/native";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/Ionicons";
import { logEvent, logScreen } from "../utils/analytics";
import {
  addMyWine,
  MyWineAddRequest,
  MyWineDTO,
  MyWineUpdateRequest,
  searchWinesPublic,
  updateMyWine,
  WineUserDTO,
} from "../api/wine";
import CustomAlert from "../components/CustomAlert";
import CalendarModal from "../components/tasting_note/CalendarModal";
import { colors } from '../constants/colors';
import { useTranslation } from "react-i18next";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const WineAddScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const initialWine = route.params?.wine;
  const myWine = route.params?.myWine as MyWineDTO;
  const isEditMode = !!myWine;
  const { t, i18n } = useTranslation();

  // Step management
  const [currentStep, setCurrentStep] = useState(initialWine || myWine ? 2 : 1);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Wine selection (Step 1)
  const [selectedWineId, setSelectedWineId] = useState<number | null>(
    myWine?.wineId || initialWine?.id || null,
  );
  const [selectedWineName, setSelectedWineName] = useState(
    myWine?.wineName || initialWine?.nameKor || "",
  );
  const [selectedWineNameEng, setSelectedWineNameEng] = useState(
    myWine?.wineNameEng || initialWine?.nameEng || "",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [type, setType] = useState(myWine?.wineSort || initialWine?.type || "");
  const [searchResults, setSearchResults] = useState<WineUserDTO[]>([]);

  // Purchase details (Step 2)
  const [vintage, setVintage] = useState(
    myWine
      ? myWine.vintageYear === 0
        ? "NV"
        : String(myWine.vintageYear)
      : "",
  );
  const [purchasePrice, setPurchasePrice] = useState(
    myWine ? myWine.purchasePrice.toLocaleString() : "",
  );
  const [purchaseDate, setPurchaseDate] = useState(
    myWine?.purchaseDate || new Date().toISOString().split("T")[0],
  );
  const [purchaseType, setPurchaseType] = useState<"offline" | "direct">(
    myWine?.purchaseType === "DIRECT" ? "direct" : "offline",
  );
  const [purchaseShop, setPurchaseShop] = useState(myWine?.purchaseShop || "");
  const [quantity, setQuantity] = useState(1);

  const [isSaving, setIsSaving] = useState(false);
  const [isCalendarVisible, setCalendarVisible] = useState(false);

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{
    title: string;
    message: string;
    onConfirm?: () => void;
  }>({
    title: "",
    message: "",
  });

  const handleShowAlert = (
    title: string,
    message: string,
    onConfirm?: () => void,
  ) => {
    setAlertConfig({ title, message, onConfirm });
    setAlertVisible(true);
  };

  useEffect(() => {
    if (!isEditMode) logScreen("wine_add");
  }, []);

  useEffect(() => {
    if (initialWine) {
      setSelectedWineId(initialWine.id);
      setSelectedWineName(initialWine.nameKor);
      setType(initialWine.type);
    }
  }, [initialWine]);

  // Animate progress bar
  useEffect(() => {
    const targetProgress = currentStep === 1 ? 0.5 : 1;
    Animated.timing(progressAnim, {
      toValue: targetProgress,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, [currentStep]);

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

  useEffect(() => {
    let timer = 0;
    if (searchQuery.length === 0) setSearchResults([]);
    else {
      timer = setTimeout(async () => {
        try {
          const response = await searchWinesPublic({
            searchName: searchQuery,
          });

          if (response.isSuccess) {
            setSearchResults(response.result.content);
          } else {
            setSearchResults([]);
          }
        } catch (error) {
          console.error("Search failed:", error);
          setSearchResults([]);
        }
      }, 400);
    }
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearch = async (text: string) => {
    setSearchQuery(text);
    setSelectedWineId(null);
    setSelectedWineName("");
    setSelectedWineNameEng("");
  };

  const handleSelectWine = (wine: WineUserDTO) => {
    setSelectedWineId(wine.wineId);
    setSelectedWineName(wine.name);
    setSelectedWineNameEng(wine.nameEng);
    setType(wine.sort);
  };

  const isStep1Valid = () => {
    return !!selectedWineId;
  };

  const isStep2Valid = () => {
    if (!selectedWineId) return false;
    if (!vintage && vintage !== "NV") return false;
    const priceValue = purchasePrice.replace(/,/g, "");
    if (!purchasePrice || priceValue.length < 4) return false;
    if (!purchaseDate) return false;
    if (!purchaseShop.trim()) return false;
    return true;
  };

  const animateTransition = (nextStep: number, direction: "next" | "prev") => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: direction === "next" ? -SCREEN_WIDTH : SCREEN_WIDTH,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setCurrentStep(nextStep);
      slideAnim.setValue(direction === "next" ? SCREEN_WIDTH : -SCREEN_WIDTH);

      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const handleNext = () => {
    if (currentStep === 1 && isStep1Valid()) {
      animateTransition(2, "next");
    }
  };

  const handleBack = () => {
    if (currentStep === 2) {
      animateTransition(1, "prev");
    } else {
      navigation.goBack();
    }
  };

  const handleSave = async () => {
    if (!isStep2Valid() || isSaving) return;

    if (!selectedWineId) return;

    setIsSaving(true);

    try {
      if (isEditMode) {
        const requestData: MyWineUpdateRequest = {
          vintageYear: vintage === "NV" ? 0 : parseInt(vintage, 10),
          purchaseDate: purchaseDate,
          purchasePrice: purchasePrice
            ? parseInt(purchasePrice.replace(/[^0-9]/g, ""), 10)
            : 0,
          purchaseType: purchaseType === "offline" ? "OFFLINE" : "DIRECT",
          purchaseShop: purchaseShop,
        };

        const response = await updateMyWine(myWine.myWineId, requestData);

        if (response.isSuccess) {
          handleShowAlert(t('wineAdd.alert.success'), t('wineAdd.alert.editSuccess'), () => {
            navigation.goBack();
          });
        } else {
          handleShowAlert(t('wineAdd.alert.error'), response.message || t('wineAdd.alert.editFail'));
        }
      } else {
        const requestData: MyWineAddRequest = {
          wineId: selectedWineId,
          vintageYear: vintage === "NV" ? 0 : parseInt(vintage, 10),
          purchaseDate: purchaseDate,
          purchasePrice: purchasePrice
            ? parseInt(purchasePrice.replace(/[^0-9]/g, ""), 10)
            : 0,
          purchaseType: purchaseType === "offline" ? "OFFLINE" : "DIRECT",
          purchaseShop: purchaseShop,
        };

        let successCount = 0;
        let failCount = 0;

        for (let i = 0; i < quantity; i++) {
          try {
            const response = await addMyWine(requestData);
            if (response.isSuccess) {
              successCount++;
            } else {
              failCount++;
            }
          } catch (e) {
            failCount++;
          }
        }

        if (successCount > 0) {
          logEvent("wine_add_success", { count: successCount });
          const message =
            quantity > 1
              ? failCount > 0
                ? t('wineAdd.alert.addSuccessPluralFail', { count: successCount, failCount })
                : t('wineAdd.alert.addSuccessPlural', { count: successCount })
              : t('wineAdd.alert.addSuccessSingular');

          handleShowAlert(t('wineAdd.alert.success'), message, () => {
            navigation.goBack();
          });
        } else {
          handleShowAlert(t('wineAdd.alert.error'), t('wineAdd.alert.addFail'));
        }
      }
    } catch (error) {
      console.error("My wine add failed:", error);
      handleShowAlert(t('wineAdd.alert.error'), t('wineAdd.alert.networkError'));
    } finally {
      setIsSaving(false);
    }
  };

  const renderProgressBar = () => {
    if (isEditMode) return null;

    const widthInterpolation = progressAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ["0%", "100%"],
    });

    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressBarBackground}>
          <Animated.View
            style={[styles.progressBarFill, { width: widthInterpolation }]}
          />
        </View>
      </View>
    );
  };

  const renderSearchResult = ({ item }: { item: WineUserDTO }) => {
    const isSelected = selectedWineId === item.wineId;

    return (
      <TouchableOpacity
        style={[styles.resultItem, isSelected && styles.resultItemSelected]}
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
          {i18n.language === 'en' ? (
            <Text style={styles.resultNameKor} numberOfLines={2} lineBreakStrategyIOS="hangul-word">
              {item.nameEng || item.name}
            </Text>
          ) : (
            <>
              <Text style={styles.resultNameKor} lineBreakStrategyIOS="hangul-word">
                {item.name}
              </Text>
              <Text style={styles.resultNameEng}>{item.nameEng}</Text>
            </>
          )}
          <View style={styles.resultInfoContainer}>
            <View
              style={[
                styles.typeChip,
                { backgroundColor: getWineTypeColor(item.sort) },
              ]}
            >
              <Text style={styles.typeChipText}>{item.sort}</Text>
            </View>
            <Text style={styles.resultCountryText}>{item.country}</Text>
          </View>
        </View>

        {isSelected ? (
          <Icon name="checkmark-circle" size={24} color={colors.primary} />
        ) : (
          <View style={{ width: 24, height: 24 }} />
        )}
      </TouchableOpacity>
    );
  };

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>{t('wineAdd.step1.title')}</Text>
      <Text style={styles.stepSubtitle}>{t('wineAdd.step1.subtitle')}</Text>

      <View style={styles.searchBarContainer}>
        <Icon name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={t('wineAdd.step1.placeholder')}
          placeholderTextColor="#666"
          value={searchQuery}
          onChangeText={handleSearch}
          returnKeyType="search"
          autoFocus={!initialWine && !myWine}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => {
              setSearchQuery("");
              setSearchResults([]);
              setSelectedWineId(null);
            }}
            style={styles.clearButton}
          >
            <Icon name="close-circle" size={18} color="#666" />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={searchResults}
        renderItem={renderSearchResult}
        keyExtractor={(item) => item.wineId.toString()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          searchQuery.length > 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>{t('wineAdd.step1.empty')}</Text>
            </View>
          ) : null
        }
      />
    </View>
  );

  const renderStep2 = () => (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <ScrollView
        style={styles.stepContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.step2Content}
      >
        <Text style={styles.stepTitle}>{t('wineAdd.step2.title')}</Text>
        <Text style={styles.stepSubtitle}>
          {t('wineAdd.step2.subtitle', {
            name: i18n.language === 'en' ? (selectedWineNameEng || selectedWineName) : selectedWineName
          })}
        </Text>

        {!isEditMode && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('wineAdd.step2.quantity')}</Text>
            <View style={styles.quantityContainer}>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => {
                  if (quantity > 1) setQuantity((prev) => prev - 1);
                }}
              >
                <Icon name="remove" size={20} color={colors.white} />
              </TouchableOpacity>
              <View style={styles.quantityValueContainer}>
                <Text style={styles.quantityValue}>{quantity}</Text>
                <Text style={styles.quantityUnit}>{t('wineAdd.step2.unit')}</Text>
              </View>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => setQuantity((prev) => prev + 1)}
              >
                <Icon name="add" size={20} color={colors.white} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('wineAdd.step2.type')}</Text>
          <View style={[styles.inputWrapper, { backgroundColor: colors.surface1 }]}>
            <Text style={[styles.textInput, { color: "#aaa" }]}>
              {type || "-"}
            </Text>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('wineAdd.step2.vintage')}</Text>
          <View style={styles.vintageInputWrapper}>
            <TextInput
              style={styles.vintageInput}
              placeholder={t('wineAdd.step2.vintagePlaceholder')}
              placeholderTextColor="#666"
              keyboardType="numeric"
              value={vintage}
              onChangeText={(text) => {
                if (text !== "NV") {
                  setVintage(text.replace(/[^0-9]/g, ""));
                } else {
                  setVintage(text);
                }
              }}
              maxLength={4}
            />

            {((vintage.length === 4 && !isNaN(Number(vintage))) ||
              vintage === "NV") && (
                <Icon
                  name="checkmark-circle"
                  size={20}
                  color="#2ecc71"
                  style={{ marginRight: 8 }}
                />
              )}
            <TouchableOpacity
              style={[
                styles.nvButton,
                vintage === "NV" && styles.nvButtonActive,
              ]}
              onPress={() => setVintage(vintage === "NV" ? "" : "NV")}
            >
              <Text
                style={[
                  styles.nvButtonText,
                  vintage === "NV" && styles.nvButtonTextActive,
                ]}
              >
                NV
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('wineAdd.step2.price')}</Text>
          <View style={styles.priceInputWrapper}>
            <Text style={styles.currencySymbol}>₩</Text>
            <TextInput
              style={styles.priceInput}
              placeholder="0"
              placeholderTextColor="#666"
              keyboardType="numeric"
              value={purchasePrice}
              onChangeText={(text) => {
                const numericValue = text.replace(/[^0-9]/g, "");
                const formattedValue = numericValue.replace(
                  /\B(?=(\d{3})+(?!\d))/g,
                  ",",
                );
                setPurchasePrice(formattedValue);
              }}
            />
            {purchasePrice.replace(/,/g, "").length >= 4 && (
              <Icon
                name="checkmark-circle"
                size={20}
                color="#2ecc71"
                style={{ marginLeft: 8 }}
              />
            )}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('wineAdd.step2.shop')}</Text>
          <View style={styles.purchaseTypeContainer}>
            <TouchableOpacity
              style={[
                styles.typeButton,
                purchaseType === "offline" && styles.typeButtonActive,
              ]}
              onPress={() => setPurchaseType("offline")}
            >
              <Text
                style={[
                  styles.typeButtonText,
                  purchaseType === "offline" && styles.typeButtonTextActive,
                ]}
              >
                {t('wineAdd.step2.shopOffline')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.typeButton,
                purchaseType === "direct" && styles.typeButtonActive,
              ]}
              onPress={() => setPurchaseType("direct")}
            >
              <Text
                style={[
                  styles.typeButtonText,
                  purchaseType === "direct" && styles.typeButtonTextActive,
                ]}
              >
                {t('wineAdd.step2.shopDirect')}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              placeholder={
                purchaseType === "offline"
                  ? t('wineAdd.step2.shopPlaceholderOff')
                  : t('wineAdd.step2.shopPlaceholderDir')
              }
              placeholderTextColor="#666"
              value={purchaseShop}
              onChangeText={setPurchaseShop}
            />
            {purchaseShop.length > 0 && (
              <Icon
                name="checkmark-circle"
                size={20}
                color="#2ecc71"
                style={{ marginLeft: 8 }}
              />
            )}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('wineAdd.step2.date')}</Text>
          <TouchableOpacity
            style={styles.inputWrapper}
            onPress={() => setCalendarVisible(true)}
          >
            <Text style={[styles.textInput, { paddingVertical: 12 }]}>
              {purchaseDate || t('wineAdd.step2.datePlaceholder')}
            </Text>
            {purchaseDate.length > 0 && (
              <Icon
                name="checkmark-circle"
                size={20}
                color="#2ecc71"
                style={{ marginLeft: 8 }}
              />
            )}
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <CustomAlert
        visible={alertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={() => setAlertVisible(false)}
        onConfirm={() => {
          setAlertVisible(false);
          if (alertConfig.onConfirm) alertConfig.onConfirm();
        }}
        singleButton={true}
      />

      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEditMode ? t('wineAdd.headerEdit') : t('wineAdd.headerAdd')}
        </Text>
        <View style={styles.headerRight} />
      </View>

      {renderProgressBar()}

      <Animated.View
        style={[
          styles.body,
          {
            transform: [{ translateX: slideAnim }],
            opacity: fadeAnim,
          },
        ]}
      >
        {currentStep === 1 ? renderStep1() : renderStep2()}
      </Animated.View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.nextButton,
            ((currentStep === 1 && !isStep1Valid()) ||
              (currentStep === 2 && !isStep2Valid()) ||
              isSaving) &&
            styles.disabledButton,
          ]}
          onPress={currentStep === 1 ? handleNext : handleSave}
          disabled={
            (currentStep === 1 && !isStep1Valid()) ||
            (currentStep === 2 && !isStep2Valid()) ||
            isSaving
          }
        >
          <Text style={styles.nextButtonText}>
            {isSaving
              ? t('wineAdd.button.saving')
              : currentStep === 1
                ? t('wineAdd.button.next')
                : isEditMode
                  ? t('wineAdd.button.edit')
                  : t('wineAdd.button.add')}
          </Text>
        </TouchableOpacity>
      </View>

      <CalendarModal
        visible={isCalendarVisible}
        selectedDate={purchaseDate}
        onDateSelect={setPurchaseDate}
        onClose={() => setCalendarVisible(false)}
      />
    </SafeAreaView>
  );
};

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
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.white,
  },
  backButton: {
    padding: 8,
    width: 40,
  },
  headerRight: {
    width: 40,
  },
  progressContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  body: {
    flex: 1,
  },
  stepContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.white,
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 24,
  },
  searchBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface1,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 16,
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
  listContent: {
    paddingBottom: 16,
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
  resultItemSelected: {
    backgroundColor: "#2a1a3a",
  },
  resultIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: colors.surface1,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    overflow: "hidden",
  },
  resultImage: {
    width: "85%",
    height: "85%",
  },
  resultTextContainer: {
    flex: 1,
    gap: 4,
    paddingVertical: 2,
  },
  resultNameKor: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "600",
  },
  resultNameEng: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  resultInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
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
  resultCountryText: {
    color: "#666",
    fontSize: 12,
  },
  rightRatingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingLeft: 8,
  },
  rightRatingText: {
    fontSize: 14,
    color: colors.error,
    fontWeight: "bold",
  },
  emptyContainer: {
    padding: 48,
    alignItems: "center",
  },
  emptyText: {
    color: "#666",
    fontSize: 16,
  },
  step2Content: {
    paddingBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#444",
    paddingHorizontal: 12,
  },
  textInput: {
    flex: 1,
    paddingVertical: 12,
    color: colors.white,
    fontSize: 16,
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    marginTop: 8,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#444",
    justifyContent: "center",
    alignItems: "center",
  },
  quantityValueContainer: {
    minWidth: 60,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  quantityValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.white,
    marginRight: 4,
  },
  quantityUnit: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  vintageInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#444",
    paddingRight: 8,
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
  priceInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#444",
    paddingHorizontal: 12,
  },
  currencySymbol: {
    color: colors.textSecondary,
    fontSize: 16,
    marginRight: 8,
  },
  priceInput: {
    flex: 1,
    paddingVertical: 12,
    color: colors.white,
    fontSize: 16,
  },
  purchaseTypeContainer: {
    flexDirection: "row",
    marginBottom: 8,
    gap: 8,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: colors.border,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#444",
  },
  typeButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  typeButtonText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: "600",
  },
  typeButtonTextActive: {
    color: colors.white,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#222",
  },
  nextButton: {
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
  nextButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default WineAddScreen;
