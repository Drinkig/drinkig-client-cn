import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  StatusBar,
  Image,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import LinearGradient from "react-native-linear-gradient";
import Icon from "react-native-vector-icons/Ionicons";
import {
  useNavigation,
  useFocusEffect,
  useRoute,
  RouteProp,
} from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { WineDBItem } from "../types/Wine";
import { searchWinesPublic, WineUserDTO } from "../api/wine";
import { RootStackParamList } from "../types";
import { colors } from "../constants/colors";
import {
  getWinePlaceholderImage,
  getWineTypeColor,
} from "../constants/wineColors";
import HighlightedText from "../components/common/HighlightedText";
import { spacing, radius, surfaces } from "../constants/theme";
import { useTranslation } from "react-i18next";
import { rankByRelevance } from "../utils/searchRelevance";
import { getErrorMessageKey } from "../utils/apiError";

type SearchScreenRouteProp = RouteProp<RootStackParamList, "Search">;

export default function SearchScreen() {
  const navigation = useNavigation();
  const route = useRoute<SearchScreenRouteProp>();
  const { t, i18n } = useTranslation();
  const [returnScreen, setReturnScreen] = useState<
    keyof RootStackParamList | undefined
  >(undefined);

  useFocusEffect(
    useCallback(() => {
      if (route.params?.returnScreen) {
        setReturnScreen(route.params.returnScreen);
      } else {
        setReturnScreen(undefined);
      }
    }, [route.params])
  );

  const [searchText, setSearchText] = useState("");
  const [searchResults, setSearchResults] = useState<WineDBItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchErrorKey, setSearchErrorKey] = useState<string | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [recentWines, setRecentWines] = useState<WineDBItem[]>([]);
  const [failedImageIds, setFailedImageIds] = useState<Set<number>>(new Set());

  useFocusEffect(
    useCallback(() => {
      loadRecentWines();
      loadRecentSearches();
    }, [])
  );

  const loadRecentWines = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem("recent_wines");
      if (jsonValue != null) {
        setRecentWines(JSON.parse(jsonValue));
      }
    } catch (e) {
      console.error("Failed to load recent wines", e);
    }
  };

  const loadRecentSearches = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem("recent_searches");
      if (jsonValue != null) {
        const parsed = JSON.parse(jsonValue);
        if (Array.isArray(parsed)) {
          setRecentSearches(parsed.filter((v) => typeof v === "string"));
        }
      }
    } catch (e) {
      console.error("Failed to load recent searches", e);
    }
  };

  const updateRecentSearches = (next: string[]) => {
    setRecentSearches(next);
    AsyncStorage.setItem("recent_searches", JSON.stringify(next)).catch((e) =>
      console.error("Failed to save recent searches", e)
    );
  };

  useEffect(() => {
    if (searchText.trim().length > 0) {
      // 디바운스+응답 대기 동안 "결과 없음"이 먼저 보이지 않도록 검색 중 상태를 켠다
      setIsSearching(true);
      setSearchErrorKey(null);
    }
    const timer = setTimeout(async () => {
      if (searchText.trim().length > 0) {
        try {
          const response = await searchWinesPublic({
            searchName: searchText,
            page: 0,
            size: 50,
          });

          if (response.isSuccess) {
            const mappedResults: WineDBItem[] = response.result.content.map(
              (item: WineUserDTO) => ({
                id: item.wineId,
                nameKor: item.name,
                nameEng: item.nameEng,
                type: item.sort,
                country: item.country,
                grape: item.variety,
                imageUri: item.imageUrl,
                vivinoRating: item.vivinoRating,
              })
            );
            setSearchResults(rankByRelevance(mappedResults, searchText.trim()));
          } else {
            throw new Error(response.message);
          }
        } catch (error) {
          console.error("Wine search failed:", error);
          // 에러를 "검색 결과 없음"으로 위장하지 않는다
          setSearchErrorKey(getErrorMessageKey(error));
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchText]);

  const handleSearchSubmit = () => {
    const trimmedText = searchText.trim();
    if (trimmedText) {
      updateRecentSearches(
        [trimmedText, ...recentSearches.filter((v) => v !== trimmedText)].slice(
          0,
          10
        )
      );
      navigation.navigate("SearchResult", {
        searchKeyword: trimmedText,
        returnScreen,
      });
    }
  };

  // 타이핑 중 자동완성: 이미지 없이 텍스트만. 와인 타입은 칩 대신
  // 이름 텍스트 색으로 구분하고, 검색어와 겹치는 부분은 자동 볼드 처리.
  // 궁합 점수는 엔터 후 검색 결과 화면에서만 노출한다.
  const renderSearchResult = ({ item }: { item: WineDBItem }) => {
    const typeColor = getWineTypeColor(item.type);
    const primaryName =
      i18n.language === "en"
        ? item.nameEng || item.nameKor
        : item.nameKor || item.nameEng;
    const secondaryName = i18n.language === "en" ? "" : item.nameEng;

    return (
      <TouchableOpacity
        style={styles.resultItem}
        onPress={() => navigation.navigate("WineDetail", { wine: item })}
      >
        <View style={styles.resultTextContainer}>
          <HighlightedText
            text={primaryName}
            query={searchText}
            style={[styles.resultName, { color: typeColor }]}
            numberOfLines={2}
          />
          {secondaryName ? (
            <HighlightedText
              text={secondaryName}
              query={searchText}
              style={styles.resultNameEng}
              numberOfLines={1}
            />
          ) : null}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      <View style={styles.headerContainer}>
        <View style={styles.headerPill}>
          {/* 스택 화면(홈 검색바에서 진입) — 명시적 진입이므로 autoFocus로 바로 입력 가능 */}
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel={t("common.back")}
          >
            <Icon name="chevron-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.searchBarContainer}>
            <Icon
              name="search"
              size={20}
              color={colors.textSecondary}
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder={t("search.placeholder")}
              placeholderTextColor={colors.textSecondary}
              value={searchText}
              onChangeText={setSearchText}
              onSubmitEditing={handleSearchSubmit}
              autoFocus
            />
            {searchText.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchText("")}
                style={styles.clearButton}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                accessibilityRole="button"
                accessibilityLabel={t("common.close")}
              >
                <Icon
                  name="close-circle"
                  size={18}
                  color={colors.textTertiary}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      <View style={styles.content}>
        {searchText.length > 0 ? (
          <FlatList
            showsVerticalScrollIndicator={false}
            data={searchResults}
            renderItem={renderSearchResult}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              isSearching ? (
                <View style={styles.emptyContainer}>
                  <ActivityIndicator color={colors.primary} />
                </View>
              ) : (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>
                    {searchErrorKey
                      ? t(searchErrorKey)
                      : t("search.emptyResult")}
                  </Text>
                  {!searchErrorKey && (
                    <TouchableOpacity
                      style={styles.registerCta}
                      onPress={() =>
                        // @ts-ignore
                        navigation.navigate("WineRegister")
                      }
                    >
                      <Text style={styles.registerCtaText}>
                        {t("search.registerCta")}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )
            }
          />
        ) : (
          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.recentSearchContainer}>
              <Text style={styles.sectionTitle}>
                {t("search.recentSearch")}
              </Text>
              {recentSearches.length > 0 ? (
                <View style={styles.recentTags}>
                  {recentSearches.map((text, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.recentTag}
                      onPress={() => setSearchText(text)}
                    >
                      <Text style={styles.recentTagText}>{text}</Text>
                      <TouchableOpacity
                        style={styles.removeTagButton}
                        onPress={() =>
                          updateRecentSearches(
                            recentSearches.filter((_, i) => i !== index)
                          )
                        }
                      >
                        <Icon
                          name="close"
                          size={14}
                          color={colors.textSecondary}
                        />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <Text style={styles.emptyRecentText}>
                  {t("search.emptyRecentSearch")}
                </Text>
              )}
            </View>

            <View style={styles.recentWineContainer}>
              <Text style={styles.sectionTitle}>{t("search.recentWine")}</Text>
              {recentWines.length > 0 ? (
                <View>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.recentWineList}
                  >
                    {recentWines.map((wine) => (
                      <TouchableOpacity
                        key={wine.id}
                        style={styles.recentWineItem}
                        onPress={() =>
                          navigation.navigate("WineDetail", { wine })
                        }
                      >
                        <View style={styles.recentWineImageContainer}>
                          {wine.imageUri && !failedImageIds.has(wine.id) ? (
                            <Image
                              source={{ uri: wine.imageUri }}
                              style={styles.recentWineImage}
                              resizeMode="contain"
                              onError={() =>
                                setFailedImageIds((prev) =>
                                  new Set(prev).add(wine.id)
                                )
                              }
                            />
                          ) : (
                            <Image
                              source={getWinePlaceholderImage(wine.type)}
                              style={styles.recentWineImage}
                              resizeMode="contain"
                            />
                          )}
                        </View>
                        <Text style={styles.recentWineName} numberOfLines={2}>
                          {i18n.language === "en"
                            ? wine.nameEng || wine.nameKor
                            : wine.nameKor}
                        </Text>
                        <Text style={styles.recentWineType}>{wine.type}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                  {/* 스크롤로 잘리는 오른쪽 경계가 배경색으로 자연스럽게 녹도록 */}
                  <LinearGradient
                    colors={[`${colors.background}00`, colors.background]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.recentWineFade}
                    pointerEvents="none"
                  />
                </View>
              ) : (
                <Text style={styles.emptyRecentText}>
                  {t("search.emptyRecentWine")}
                </Text>
              )}
            </View>
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    backgroundColor: colors.background,
    zIndex: 10,
  },
  headerPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: surfaces.raised,
    borderRadius: radius.pill,
    height: 52,
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
    borderColor: surfaces.hairline,
  },
  backButton: {
    height: "100%",
    justifyContent: "center",
    paddingLeft: spacing.xs,
    paddingRight: spacing.sm,
  },
  searchBarContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
    height: "100%",
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 16,
    padding: 0,
    height: "100%",
  },
  clearButton: {
    padding: spacing.xs,
  },
  content: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: 0,
    paddingBottom: 110,
  },
  resultItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: surfaces.hairline,
  },
  resultTextContainer: {
    flex: 1,
    gap: spacing.xs,
  },
  resultName: {
    fontSize: 16,
    fontWeight: "400",
    lineHeight: 22,
  },
  resultNameEng: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: "400",
  },
  emptyContainer: {
    padding: spacing.xxxl,
    alignItems: "center",
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 16,
    textAlign: "center",
  },
  registerCta: {
    marginTop: spacing.xl,
    paddingHorizontal: 24,
    paddingVertical: 11,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: surfaces.card,
  },
  registerCtaText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "600",
  },
  recentSearchContainer: {
    padding: spacing.xxl,
    paddingBottom: spacing.md,
  },
  recentWineContainer: {
    padding: spacing.xxl,
    paddingTop: spacing.md,
  },
  recentWineList: {
    gap: spacing.lg,
    paddingRight: spacing.xxl,
  },
  recentWineFade: {
    position: "absolute",
    top: 0,
    bottom: 0,
    right: 0,
    width: 40,
  },
  recentWineItem: {
    width: 100,
  },
  recentWineImageContainer: {
    width: 100,
    height: 100,
    backgroundColor: surfaces.imageWell,
    borderRadius: radius.md,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.sm,
    overflow: "hidden",
  },
  recentWineImage: {
    width: "100%",
    height: "100%",
  },
  recentWineName: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: "500",
    marginBottom: spacing.xs,
    height: 32,
  },
  recentWineType: {
    color: colors.textSecondary,
    fontSize: 11,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: spacing.lg,
  },
  recentTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  recentTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: surfaces.raised,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: surfaces.hairline,
  },
  recentTagText: {
    color: colors.textPrimary,
    fontSize: 14,
    marginRight: spacing.xs,
  },
  removeTagButton: {
    padding: 2,
  },
  emptyRecentText: {
    color: colors.textTertiary,
    fontSize: 14,
  },
});
