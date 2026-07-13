import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  StatusBar,
  TouchableOpacity,
  Image,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/Ionicons";
import { useNavigation, useIsFocused } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { getWishlist, WishlistItemDTO } from "../api/wine";
import { WineDBItem } from "../types/Wine";
import GlassHeader from "../components/common/GlassHeader";
import ListStateView from "../components/common/ListStateView";
import { getErrorMessageKey } from "../utils/apiError";
import { colors } from "../constants/colors";
import { spacing, radius, surfaces, accent } from "../constants/theme";
import { getWineTypeColor, WINE_TYPE_ON_COLOR } from "../constants/wineColors";

export default function WishlistScreen() {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [wishlist, setWishlist] = useState<WishlistItemDTO[]>([]);
  const hasLoadedOnce = useRef(false);

  useEffect(() => {
    if (isFocused) {
      fetchWishlist();
    }
  }, [isFocused]);

  const fetchWishlist = async (viaPullToRefresh = false) => {
    // 재방문 시에는 기존 목록을 유지한 채 백그라운드 갱신 (깜빡임 방지)
    if (viaPullToRefresh) {
      setIsRefreshing(true);
    } else if (!hasLoadedOnce.current) {
      setIsLoading(true);
    }
    try {
      const response = await getWishlist();
      if (response.isSuccess) {
        setWishlist(response.result || []);
        setErrorKey(null);
        hasLoadedOnce.current = true;
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error("Failed to fetch wishlist:", error);
      // 에러를 빈 상태로 위장하지 않는다 — 기존 데이터가 없을 때만 에러 뷰 표시
      if (!hasLoadedOnce.current) {
        setErrorKey(getErrorMessageKey(error));
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleWinePress = (item: WishlistItemDTO) => {
    const wineItem: WineDBItem = {
      id: item.wineId,
      nameKor: item.name,
      nameEng: item.nameEng,
      type: item.sort,
      country: item.country,
      grape: item.variety,
      imageUri: item.imageUrl,
      vivinoRating: item.vivinoRating,
      price: item.price,
    };
    // @ts-ignore
    navigation.navigate("WineDetail", { wine: wineItem });
  };

  const renderItem = ({ item }: { item: WishlistItemDTO }) => (
    <TouchableOpacity
      style={styles.itemContainer}
      onPress={() => handleWinePress(item)}
      activeOpacity={0.85}
    >
      <View style={styles.imageContainer}>
        {item.imageUrl ? (
          <Image
            source={{ uri: item.imageUrl }}
            style={styles.image}
            resizeMode="contain"
          />
        ) : (
          <Icon name="wine" size={26} color={accent.text} />
        )}
      </View>
      <View style={styles.infoContainer}>
        <Text style={styles.nameKor} numberOfLines={1}>
          {item.name}
        </Text>
        {item.nameEng ? (
          <Text style={styles.nameEng} numberOfLines={1}>
            {item.nameEng}
          </Text>
        ) : null}
        <View style={styles.detailRow}>
          <View
            style={[
              styles.typeChip,
              { backgroundColor: getWineTypeColor(item.sort) },
            ]}
          >
            <Text style={styles.typeChipText}>{item.sort}</Text>
          </View>
          {item.country ? (
            <Text style={styles.countryText}>{item.country}</Text>
          ) : null}
        </View>
      </View>
      {item.vivinoRating > 0 && (
        <View style={styles.ratingContainer}>
          <Icon name="star" size={12} color={colors.warning} />
          <Text style={styles.ratingText}>{item.vivinoRating.toFixed(1)}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* 헤더 */}
      <GlassHeader
        floating={false}
        title={t("wishlist.header")}
        left={
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel={t("common.back")}
          >
            <Icon name="arrow-back" size={22} color={colors.white} />
          </TouchableOpacity>
        }
      />

      {/* 컨텐츠 */}
      <View style={styles.content}>
        {isLoading ? (
          <ListStateView state="loading" />
        ) : errorKey ? (
          <ListStateView
            state="error"
            subtitle={t(errorKey)}
            onAction={() => fetchWishlist()}
          />
        ) : (
          <FlatList
            data={wishlist}
            renderItem={renderItem}
            keyExtractor={(item) => item.wineId.toString()}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={() => fetchWishlist(true)}
                tintColor={colors.textSecondary}
              />
            }
            ListHeaderComponent={
              wishlist.length > 0 ? (
                <View style={styles.listHeader}>
                  <Text style={styles.countText}>
                    {t("wishlist.countPrefix")}
                    <Text style={styles.countHighlight}>{wishlist.length}</Text>
                    {t("wishlist.countSuffix")}
                  </Text>
                </View>
              ) : null
            }
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Image
                  source={require("../assets/wish_list.png")}
                  style={styles.emptyImage}
                  resizeMode="contain"
                />
                <Text style={styles.emptyText}>{t("wishlist.emptyTitle")}</Text>
                <Text style={styles.emptySubText}>
                  {t("wishlist.emptyDesc")}
                </Text>
                <TouchableOpacity
                  style={styles.emptyCta}
                  onPress={() =>
                    // @ts-ignore
                    navigation.navigate("Main", { screen: "Search" })
                  }
                >
                  <Text style={styles.emptyCtaText}>
                    {t("wishlist.exploreCta")}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  listHeader: {
    paddingBottom: spacing.md,
  },
  countText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  countHighlight: {
    color: colors.textPrimary,
    fontWeight: "bold",
  },
  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: surfaces.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: surfaces.hairline,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  imageContainer: {
    width: 56,
    height: 70,
    borderRadius: radius.sm,
    backgroundColor: surfaces.imageWell,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.lg,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  infoContainer: {
    flex: 1,
    gap: 4,
    paddingVertical: 2,
  },
  nameKor: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: "700",
  },
  nameEng: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  detailRow: {
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
    color: WINE_TYPE_ON_COLOR,
    fontSize: 10,
    fontWeight: "bold",
  },
  countryText: {
    color: colors.textTertiary,
    fontSize: 12,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingLeft: spacing.sm,
  },
  ratingText: {
    fontSize: 13,
    color: colors.textPrimary,
    fontWeight: "700",
  },
  emptyContainer: {
    padding: 32,
    alignItems: "center",
    marginTop: 60,
  },
  emptyImage: {
    width: 200,
    height: 200,
    marginBottom: 20,
  },
  emptyText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  emptySubText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  emptyCta: {
    marginTop: spacing.xl,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  emptyCtaText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "600",
  },
});
