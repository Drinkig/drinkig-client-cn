import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  LayoutAnimation,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  UIManager,
  View,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { logEvent, logScreen } from "utils/analytics";
import {
  createTastingNote,
  searchWinesPublic,
  TastingNoteRequest,
  WineUserDTO,
} from "../api/wine";
import ColorSelector from "../components/tasting_note/ColorSelector";
import HelpModal from "../components/tasting_note/HelpModal";
import StarRating from "../components/tasting_note/StarRating";
import TasteLevelSelector from "../components/tasting_note/TasteLevelSelector";
import { TASTE_TIPS } from "../components/tasting_note/constants";
import { useGlobalUI } from "../context/GlobalUIContext";
import { RootStackParamList } from "../types";

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

  const params = route.params || {};
  const [selectedWine, setSelectedWine] = useState<{
    wineId?: number;
    wineName?: string;
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
        title: "오류",
        message: "와인을 선택해주세요.",
        singleButton: true,
      });
      return;
    }
    if (!tasteDate) {
      showAlert({
        title: "오류",
        message: "시음 날짜를 입력해주세요.",
        singleButton: true,
      });
      return;
    }
    if (!color) {
      showAlert({
        title: "오류",
        message: "와인 색상을 선택해주세요.",
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
        title: "오류",
        message: "모든 맛 평가 항목을 선택해주세요.",
        singleButton: true,
      });
      return;
    }
    if (rating === 0) {
      showAlert({
        title: "오류",
        message: "별점을 선택해주세요.",
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
          title: "성공",
          message: "테이스팅 노트가 저장되었습니다.",
          singleButton: true,
          onConfirm: () => navigation.goBack(),
        });
      } else {
        showAlert({
          title: "실패",
          message: response.message || "저장에 실패했습니다.",
          singleButton: true,
        });
      }
    } catch (error) {
      console.error("Tasting note submit error:", error);
      const isAuthError = (error as any).response?.status === 401;
      showAlert({
        title: "오류",
        message: isAuthError
          ? "인증 세션이 만료되었습니다. 로그아웃 후 다시 로그인해주세요."
          : "네트워크 오류가 발생했습니다.",
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
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Icon name="close" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>테이스팅 노트 작성</Text>
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
            저장
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
            <Text style={styles.sectionTitle}>와인 선택</Text>

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
                    <Text style={styles.wineName}>{selectedWine.wineName}</Text>
                    <Text style={styles.wineType}>{selectedWine.wineType}</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.changeButton}
                  onPress={resetSelection}
                >
                  <Text style={styles.changeButtonText}>와인 변경 (검색)</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.searchSection}>
                <View style={styles.nameInputContainer}>
                  <View style={styles.searchIconContainer}>
                    <Icon name="search" size={20} color="#888" />
                  </View>
                  <TextInput
                    style={styles.nameInput}
                    placeholder="와인 이름을 검색하세요"
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
                              <Text style={styles.resultNameKor}>
                                {item.name}
                              </Text>
                              <Text style={styles.resultNameEng}>
                                {item.nameEng}
                              </Text>
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
                <Text style={styles.sectionTitle}>기본 정보</Text>

                <View style={styles.row}>
                  <View
                    style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}
                  >
                    <Text style={styles.label}>빈티지 (연도)</Text>
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
                        placeholder="예: 2020"
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
                          color="#8e44ad"
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
                    <Text style={styles.label}>시음 날짜</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor="#666"
                      value={tasteDate}
                      onChangeText={setTasteDate}
                    />
                  </View>
                </View>
              </View>

              <ColorSelector
                wineType={selectedWine.wineType}
                selectedColor={color}
                onSelectColor={setColor}
              />

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>향 (Nose)</Text>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>
                    느껴지는 향을 쉼표(,)로 구분하여 적어주세요
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder="예: 체리, 오크, 바닐라, 가죽"
                    placeholderTextColor="#666"
                    value={nose}
                    onChangeText={setNose}
                  />
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>맛 (Palate)</Text>
                <TasteLevelSelector
                  label="당도 (Sweetness)"
                  value={sweetness}
                  onChange={setSweetness}
                  onHelpPress={() => showTip("sweetness")}
                />
                <TasteLevelSelector
                  label="산도 (Acidity)"
                  value={acidity}
                  onChange={setAcidity}
                  onHelpPress={() => showTip("acidity")}
                />
                <TasteLevelSelector
                  label="탄닌 (Tannin)"
                  value={tannin}
                  onChange={setTannin}
                  onHelpPress={() => showTip("tannin")}
                />
                <TasteLevelSelector
                  label="바디 (Body)"
                  value={body}
                  onChange={setBody}
                  onHelpPress={() => showTip("body")}
                />
                <TasteLevelSelector
                  label="알코올 (Alcohol)"
                  value={alcohol}
                  onChange={setAlcohol}
                  onHelpPress={() => showTip("alcohol")}
                />
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>피니쉬 (Finish)</Text>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>
                    와인을 삼킨 후의 느낌이나 여운을 적어주세요
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder="예: 깔끔한 산미가 오래 남음, 씁쓸한 끝맛"
                    placeholderTextColor="#666"
                    value={finish}
                    onChangeText={setFinish}
                  />
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>총평 (Conclusion)</Text>

                <StarRating rating={rating} onRatingChange={handleRating} />

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>상세 리뷰 (선택)</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="와인에 대한 전체적인 감상을 자유롭게 적어주세요."
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a1a",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  saveButton: {
    color: "#8e44ad",
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
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: "#8e44ad",
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
    backgroundColor: "#2a2a2a",
    borderRadius: 8,
    padding: 12,
    paddingLeft: 40,
    color: "#fff",
    fontSize: 16,
  },
  searchResultsContainer: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    marginTop: 4,
    backgroundColor: "#2a2a2a",
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
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 2,
  },
  resultNameEng: {
    color: "#888",
    fontSize: 12,
  },
  typeChip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    flexShrink: 0,
  },
  typeChipText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },

  selectedWineContainer: {
    backgroundColor: "#252525",
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
    backgroundColor: "#333",
  },
  wineThumbnailPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: "#333",
    justifyContent: "center",
    alignItems: "center",
  },
  wineTextInfo: {
    flex: 1,
    marginLeft: 12,
  },
  wineName: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  wineType: {
    color: "#888",
    fontSize: 14,
  },
  changeButton: {
    backgroundColor: "#333",
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  changeButtonText: {
    color: "#fff",
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
    backgroundColor: "#2a2a2a",
    borderRadius: 8,
    padding: 12,
    color: "#fff",
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
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },

  vintageInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2a2a2a",
    borderRadius: 8,
    paddingRight: 8,
    borderWidth: 1,
    borderColor: "transparent",
  },
  vintageInputWrapperValid: {
    borderColor: "#8e44ad",
    backgroundColor: "rgba(142, 68, 173, 0.05)",
  },
  vintageInput: {
    flex: 1,
    padding: 12,
    color: "#fff",
    fontSize: 16,
  },
  nvButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    backgroundColor: "#444",
  },
  nvButtonActive: {
    backgroundColor: "#8e44ad",
  },
  nvButtonText: {
    color: "#888",
    fontSize: 12,
    fontWeight: "bold",
  },
  nvButtonTextActive: {
    color: "#fff",
  },
});
