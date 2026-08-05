import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  StatusBar,
  TouchableOpacity,
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
import { spacing, radius, surfaces } from "../constants/theme";
import { getWineTypeColor, getWineTypeLabel } from "../constants/wineColors";
import { useTranslation, Trans } from "react-i18next";
import { rankByRelevance } from "../utils/searchRelevance";
import { useUser } from "../context/UserContext";
import {
  calculateCompatibilityScore,
  getScoreColor,
} from "../utils/compatibility";
import { useSubscription } from "../context/SubscriptionContext";
import GlassHeader from "../components/common/GlassHeader";
import ListStateView from "../components/common/ListStateView";
import WineImage from "../components/common/WineImage";
import { getErrorMessageKey } from "../utils/apiError";

type SearchResultScreenRouteProp = RouteProp<
  RootStackParamList,
  "SearchResult"
>;

const scoreCache: { [wineId: number]: number | null } = {};

const PAGE_SIZE = 50;

export default function SearchResultScreen() {
  const navigation = useNavigation();
  const route = useRoute<SearchResultScreenRouteProp>();
  const { searchKeyword, returnScreen } = route.params;
  const { t, i18n } = useTranslation();
  const { flavorProfile } = useUser();
  const { isPremium } = useSubscription();

  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<WineDBItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [compatScores, setCompatScores] = useState<{
    [wineId: number]: number | null;
  }>({});
  const fetchingRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    fetchSearchResults();
  }, [searchKeyword]);

  const mapResults = (content: WineUserDTO[]): WineDBItem[] =>
    content.map((item: WineUserDTO) => ({
      id: item.wineId,
      nameKor: item.name,
      nameEng: item.nameEng,
      type: item.sort,
      country: item.country,
      grape: item.variety,
      imageUri: item.imageUrl,
      vivinoRating: item.vivinoRating,
    }));

  // 서버가 totalElements를 안 내려주는 경우(현재 프로드) 마지막 페이지를 한 번
  // 조회해 정확한 총 개수를 계산한다: (totalPages-1)*size + 마지막 페이지 건수
  const resolveTotalCount = async (
    tp: number,
    firstPageCount: number,
    totalElements?: number
  ) => {
    if (typeof totalElements === "number") {
      setTotalCount(totalElements);
      return;
    }
    if (!tp || tp <= 1) {
      setTotalCount(firstPageCount);
      return;
    }
    try {
      const last = await searchWinesPublic({
        searchName: searchKeyword,
        page: tp - 1,
        size: PAGE_SIZE,
      });
      if (last.isSuccess) {
        setTotalCount((tp - 1) * PAGE_SIZE + last.result.content.length);
      } else {
        setTotalCount((tp - 1) * PAGE_SIZE);
      }
    } catch {
      setTotalCount((tp - 1) * PAGE_SIZE);
    }
  };

  const fetchSearchResults = async () => {
    setIsLoading(true);
    try {
      const response = await searchWinesPublic({
        searchName: searchKeyword,
        page: 0,
        size: PAGE_SIZE,
      });

      if (response.isSuccess) {
        const { content, totalPages: tp, totalElements } = response.result;
        setTotalPages(tp ?? 1);
        setPage(0);
        resolveTotalCount(tp, content.length, totalElements);
        setSearchResults(rankByRelevance(mapResults(content), searchKeyword));
        setErrorKey(null);
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error("Search result fetch failed:", error);
      // 에러를 "검색 결과 없음"으로 위장하지 않는다
      setErrorKey(getErrorMessageKey(error));
    } finally {
      setIsLoading(false);
    }
  };

  // 무한 스크롤: 스크롤 하단 도달 시 다음 페이지를 이어 붙인다.
  // 이미 로드된 목록은 재정렬하지 않고(스크롤 위치 보존) 새 페이지만 랭킹한다.
  const loadMoreResults = async () => {
    if (isLoading || isLoadingMore || page + 1 >= totalPages) return;
    setIsLoadingMore(true);
    try {
      const nextPage = page + 1;
      const response = await searchWinesPublic({
        searchName: searchKeyword,
        page: nextPage,
        size: PAGE_SIZE,
      });
      if (response.isSuccess) {
        const chunk = rankByRelevance(
          mapResults(response.result.content),
          searchKeyword
        );
        setSearchResults((prev) => {
          const seen = new Set(prev.map((w) => w.id));
          return [...prev, ...chunk.filter((w) => !seen.has(w.id))];
        });
        setPage(nextPage);
      }
    } catch (error) {
      // 추가 로드 실패는 치명적이지 않다 — 다음 스크롤에서 재시도된다
      console.error("Load more results failed:", error);
    } finally {
      setIsLoadingMore(false);
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
                // avg 폴백 없음: avgAlcohol은 1~5 스케일 보장이 없어 공식 값만 사용
                alcohol: detail.officialAlcohol,
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

  // 라벨 이미지가 주인공인 큰 카드 — 좌측 정보 컬럼 + 우측 대형 화이트 이미지 웰.
  // 타입은 칩 대신 타입 색 텍스트로 구분한다.
  const renderSearchResult = ({ item }: { item: WineDBItem }) => {
    const score = compatScores[item.id];
    const typeColor = getWineTypeColor(item.type);

    return (
      <TouchableOpacity
        style={styles.resultCard}
        onPress={() => handleWinePress(item)}
        activeOpacity={0.85}
      >
        <View style={styles.resultImageWell}>
          {/* 로딩 스켈레톤 → 페이드인, 404 등 실패 시 타입별 기본 병 (WineImage 공용) */}
          <WineImage
            uri={item.imageUri}
            style={styles.resultImage}
            resizeMode="contain"
            wineType={item.type}
          />
        </View>
        <View style={styles.resultTextContainer}>
          {i18n.language === "en" ? (
            <Text style={styles.resultNameKor} numberOfLines={3}>
              {item.nameEng || item.nameKor}
            </Text>
          ) : (
            <>
              <Text style={styles.resultNameKor} numberOfLines={3}>
                {item.nameKor}
              </Text>
              {item.nameEng ? (
                <Text style={styles.resultNameEng} numberOfLines={2}>
                  {item.nameEng}
                </Text>
              ) : null}
            </>
          )}
          <View style={styles.resultInfoContainer}>
            <Text style={[styles.typeText, { color: typeColor }]}>
              {getWineTypeLabel(item.type, t)}
            </Text>
            {item.country ? (
              <Text style={styles.resultCountryText}>· {item.country}</Text>
            ) : null}
          </View>
          {isPremium &&
            flavorProfile &&
            score !== undefined &&
            score !== null && (
              <View style={styles.resultMetaRow}>
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
        </View>
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
        ) : errorKey ? (
          <ListStateView
            state="error"
            subtitle={t(errorKey)}
            onAction={() => fetchSearchResults()}
          />
        ) : (
          <FlatList
            showsVerticalScrollIndicator={false}
            data={searchResults}
            renderItem={renderSearchResult}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContent}
            onEndReached={loadMoreResults}
            onEndReachedThreshold={0.5}
            ListFooterComponent={
              isLoadingMore ? (
                <View style={styles.loadingMoreContainer}>
                  <ActivityIndicator size="small" color={colors.primary} />
                </View>
              ) : null
            }
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
                <Text style={styles.emptySubText}>
                  {t("search.registerPrompt")}
                </Text>
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
  loadingMoreContainer: {
    paddingVertical: spacing.xl,
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
  resultCard: {
    flexDirection: "row",
    alignItems: "stretch",
    backgroundColor: surfaces.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: surfaces.hairline,
    marginBottom: spacing.md,
    overflow: "hidden",
    minHeight: 172,
  },
  resultImageWell: {
    width: "42%",
    backgroundColor: surfaces.imageWell,
    justifyContent: "center",
    alignItems: "center",
  },
  // 주의: width/height "100%"를 쓰면 웰 높이(행 높이에 의존)를 다시 참조하는
  // 순환 레이아웃이 되어 카드가 화면 전체로 폭주한다 — 절대 배치로 계산에서 뺀다.
  resultImage: {
    ...StyleSheet.absoluteFillObject,
  },
  resultTextContainer: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: "center",
    gap: spacing.xs,
  },
  resultNameKor: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 22,
  },
  resultNameEng: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },
  resultInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  typeText: {
    fontSize: 13,
    fontWeight: "700",
  },
  resultCountryText: {
    color: colors.textTertiary,
    fontSize: 13,
  },
  resultMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.sm,
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
    color: colors.textSecondary,
    fontSize: 16,
  },
  emptySubText: {
    color: colors.textTertiary,
    fontSize: 13,
    marginTop: spacing.sm,
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
});
