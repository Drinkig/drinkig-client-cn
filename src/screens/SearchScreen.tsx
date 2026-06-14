import React, { useState, useEffect, useCallback, useRef } from "react";
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/Ionicons";
import {
  useNavigation,
  useFocusEffect,
  useRoute,
  RouteProp,
} from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { WineDBItem } from "../types/Wine";
import {
  searchWinesPublic,
  getWineDetailPublic,
  WineUserDTO,
} from "../api/wine";
import { RootStackParamList } from "../types";
import { colors } from "../constants/colors";
import { getWineTypeColor } from "../constants/wineColors";
import { spacing, radius, surfaces, accent } from "../constants/theme";
import { useTranslation } from "react-i18next";
import { rankByRelevance } from "../utils/searchRelevance";
import { useUser } from "../context/UserContext";
import {
  calculateCompatibilityScore,
  getScoreColor,
} from "../utils/compatibility";
import { useSubscription } from "../context/SubscriptionContext";

type SearchScreenRouteProp =
  | RouteProp<RootStackParamList, "Search">
  | RouteProp<RootStackParamList, "WineSearch">;

// Module-level cache to avoid re-fetching across re-renders
const scoreCache: { [wineId: number]: number | null } = {};

export default function SearchScreen() {
  const navigation = useNavigation();
  const route = useRoute<SearchScreenRouteProp>();
  const { t, i18n } = useTranslation();
  const { flavorProfile } = useUser();
  const { isPremium } = useSubscription();
  const [returnScreen, setReturnScreen] = useState<
    keyof RootStackParamList | undefined
  >(undefined);
  const [compatScores, setCompatScores] = useState<{
    [wineId: number]: number | null;
  }>({});
  const fetchingRef = useRef<Set<number>>(new Set());

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
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [recentWines, setRecentWines] = useState<WineDBItem[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadRecentWines();
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

  useEffect(() => {
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
          }
        } catch (error) {
          console.error("Wine search failed:", error);
        }
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchText]);

  // Auto-fetch compatibility scores for search results
  useEffect(() => {
    if (!isPremium || !flavorProfile || searchResults.length === 0) return;

    searchResults.forEach((wine) => {
      if (scoreCache[wine.id] !== undefined) {
        setCompatScores((prev) => ({
          ...prev,
          [wine.id]: scoreCache[wine.id],
        }));
        return;
      }
      if (fetchingRef.current.has(wine.id)) return;
      fetchingRef.current.add(wine.id);

      getWineDetailPublic(wine.id)
        .then((response) => {
          if (response.isSuccess) {
            const detail = response.result.wineInfoResponse;
            const result = calculateCompatibilityScore(
              flavorProfile,
              {
                sweetness: detail.officialSweetness ?? detail.avgSweetness,
                acidity: detail.officialAcidity ?? detail.avgAcidity,
                tannin: detail.officialTannin ?? detail.avgTannin,
                body: detail.officialBody ?? detail.avgBody,
              },
              t
            );
            const score = result?.score ?? null;
            scoreCache[wine.id] = score;
            setCompatScores((prev) => ({ ...prev, [wine.id]: score }));
          }
        })
        .catch(() => {
          scoreCache[wine.id] = null;
        })
        .finally(() => {
          fetchingRef.current.delete(wine.id);
        });
    });
  }, [searchResults, flavorProfile, isPremium, t]);

  const handleSearchSubmit = () => {
    const trimmedText = searchText.trim();
    if (trimmedText) {
      if (!recentSearches.includes(trimmedText)) {
        setRecentSearches((prev) => [trimmedText, ...prev].slice(0, 10));
      }
      navigation.navigate("SearchResult", {
        searchKeyword: trimmedText,
        returnScreen,
      });
    }
  };

  const renderSearchResult = ({ item }: { item: WineDBItem }) => {
    const score = compatScores[item.id];

    return (
      <TouchableOpacity
        style={styles.resultItem}
        onPress={() => navigation.navigate("WineDetail", { wine: item })}
      >
        <View style={styles.resultIconContainer}>
          {item.imageUri ? (
            <Image
              source={{ uri: item.imageUri }}
              style={styles.resultImage}
              resizeMode="contain"
            />
          ) : (
            <Icon name="wine" size={20} color={accent.base} />
          )}
        </View>
        <View style={styles.resultTextContainer}>
          {i18n.language === "en" ? (
            <Text style={styles.resultNameKor} numberOfLines={2}>
              {item.nameEng || item.nameKor}
            </Text>
          ) : (
            <>
              <Text style={styles.resultNameKor} numberOfLines={2}>
                {item.nameKor}
              </Text>
              <Text style={styles.resultNameEng} numberOfLines={1}>
                {item.nameEng}
              </Text>
            </>
          )}
          <View style={styles.resultInfoContainer}>
            <View
              style={[
                styles.typeChip,
                { backgroundColor: getWineTypeColor(item.type) },
              ]}
            >
              <Text style={styles.typeChipText}>{item.type}</Text>
            </View>
            <Text style={styles.resultCountryText}>{item.country}</Text>
          </View>
        </View>
        {isPremium &&
          flavorProfile &&
          score !== undefined &&
          score !== null && (
            <View style={styles.scoreContainer}>
              <View
                style={[
                  styles.scoreBadge,
                  {
                    borderColor: getScoreColor(score),
                    backgroundColor: `${getScoreColor(score)}1F`,
                  },
                ]}
              >
                <Text
                  style={[styles.scoreValue, { color: getScoreColor(score) }]}
                >
                  {score}
                </Text>
              </View>
            </View>
          )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      <View style={styles.headerContainer}>
        <View style={styles.headerPill}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color={colors.textPrimary} />
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
              autoFocus={true}
            />
            {searchText.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchText("")}
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
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>{t("search.emptyResult")}</Text>
              </View>
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
                          setRecentSearches((prev) =>
                            prev.filter((_, i) => i !== index)
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
                        {wine.imageUri ? (
                          <Image
                            source={{ uri: wine.imageUri }}
                            style={styles.recentWineImage}
                            resizeMode="contain"
                          />
                        ) : (
                          <Icon name="wine" size={30} color={accent.base} />
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
    padding: spacing.sm,
    marginRight: spacing.xs,
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
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: surfaces.hairline,
  },
  resultIconContainer: {
    width: 64,
    height: 64,
    borderRadius: radius.md,
    backgroundColor: surfaces.card,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.lg,
    overflow: "hidden",
  },
  resultImage: {
    width: "85%",
    height: "85%",
  },
  resultTextContainer: {
    flex: 1,
    gap: spacing.xs,
    paddingVertical: 2,
  },
  resultNameKor: {
    color: colors.textPrimary,
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
    gap: spacing.sm,
    marginTop: 2,
  },
  typeChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  typeChipText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: "bold",
  },
  resultCountryText: {
    color: colors.textTertiary,
    fontSize: 12,
  },
  scoreContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingLeft: spacing.md,
  },
  scoreBadge: {
    minWidth: 34,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: radius.sm,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scoreValue: {
    fontSize: 13,
    fontWeight: "700",
  },
  emptyContainer: {
    padding: spacing.xxxl,
    alignItems: "center",
  },
  emptyText: {
    color: colors.textTertiary,
    fontSize: 16,
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
  recentWineItem: {
    width: 100,
  },
  recentWineImageContainer: {
    width: 100,
    height: 100,
    backgroundColor: surfaces.card,
    borderRadius: radius.md,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  recentWineImage: {
    width: "80%",
    height: "80%",
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
