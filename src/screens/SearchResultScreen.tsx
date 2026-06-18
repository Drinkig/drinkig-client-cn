import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  StatusBar,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/Ionicons";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import {
  searchWinesPublic,
  getWineDetailPublic,
  WineUserDTO,
} from "../api/wine";
import { WineDBItem } from "../types/Wine";
import { RootStackParamList } from "../types";
import { colors } from "../constants/colors";
import { spacing, radius, surfaces, accent } from "../constants/theme";
import { getWineTypeColor } from "../constants/wineColors";
import { useTranslation, Trans } from "react-i18next";
import { rankByRelevance } from "../utils/searchRelevance";
import { useUser } from "../context/UserContext";
import {
  calculateCompatibilityScore,
  getScoreColor,
} from "../utils/compatibility";
import { useSubscription } from "../context/SubscriptionContext";
import GlassHeader from "../components/common/GlassHeader";

type SearchResultScreenRouteProp = RouteProp<
  RootStackParamList,
  "SearchResult"
>;

const scoreCache: { [wineId: number]: number | null } = {};

export default function SearchResultScreen() {
  const navigation = useNavigation();
  const route = useRoute<SearchResultScreenRouteProp>();
  const { searchKeyword, returnScreen } = route.params;
  const { t, i18n } = useTranslation();
  const { flavorProfile } = useUser();
  const { isPremium } = useSubscription();

  const [isLoading, setIsLoading] = useState(true);
  const [searchResults, setSearchResults] = useState<WineDBItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [compatScores, setCompatScores] = useState<{
    [wineId: number]: number | null;
  }>({});
  const fetchingRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    fetchSearchResults();
  }, [searchKeyword]);

  const fetchSearchResults = async () => {
    setIsLoading(true);
    try {
      const response = await searchWinesPublic({
        searchName: searchKeyword,
        page: 0,
        size: 50,
      });

      if (response.isSuccess) {
        const total =
          response.result.totalElements ?? response.result.content.length;
        setTotalCount(total);

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
        setSearchResults(rankByRelevance(mappedResults, searchKeyword));
      }
    } catch (error) {
      console.error("Search result fetch failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-fetch compatibility scores
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
  }, [searchResults, flavorProfile, isPremium]);

  const handleWinePress = (item: WineDBItem) => {
    if (returnScreen === "TastingNoteWrite") {
      navigation.navigate("TastingNoteWrite", {
        wineId: item.id,
        wineName: item.nameKor,
        wineImage: item.imageUri,
        wineType: item.type,
      });
    } else {
      navigation.navigate("WineDetail", { wine: item });
    }
  };

  const renderSearchResult = ({ item }: { item: WineDBItem }) => {
    const score = compatScores[item.id];

    return (
      <TouchableOpacity
        style={styles.resultItem}
        onPress={() => handleWinePress(item)}
        activeOpacity={0.85}
      >
        <View style={styles.resultIconContainer}>
          {item.imageUri ? (
            <Image
              source={{ uri: item.imageUri }}
              style={styles.resultImage}
              resizeMode="contain"
            />
          ) : (
            <Icon name="wine" size={26} color={accent.text} />
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
              {item.nameEng ? (
                <Text style={styles.resultNameEng} numberOfLines={1}>
                  {item.nameEng}
                </Text>
              ) : null}
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

      <GlassHeader
        floating={false}
        title={t("search.resultHeaderTitle", { keyword: searchKeyword })}
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
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            showsVerticalScrollIndicator={false}
            data={searchResults}
            renderItem={renderSearchResult}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContent}
            ListHeaderComponent={
              <View>
                {!isLoading && searchResults.length > 0 ? (
                  <SearchResultHeader count={totalCount} />
                ) : null}
              </View>
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>{t("search.emptyResult")}</Text>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const SearchResultHeader = ({ count }: { count: number }) => {
  const { t } = useTranslation();
  return (
    <View style={styles.resultCountContainer}>
      <Text style={styles.resultCountText}>
        <Trans
          i18nKey="search.resultCount"
          values={{ count }}
          components={[<Text style={styles.resultCountHighlight} />]}
        />
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  resultCountContainer: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  resultCountText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  resultCountHighlight: {
    color: colors.textPrimary,
    fontWeight: "bold",
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: 0,
    paddingBottom: 110,
  },
  resultItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: surfaces.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: surfaces.hairline,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  resultIconContainer: {
    width: 56,
    height: 70,
    borderRadius: radius.sm,
    backgroundColor: surfaces.raised,
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
    gap: 4,
    paddingVertical: 2,
  },
  resultNameKor: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: "700",
  },
  resultNameEng: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  resultInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.xs,
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
    padding: 32,
    alignItems: "center",
  },
  emptyText: {
    color: colors.textTertiary,
    fontSize: 16,
  },
});
