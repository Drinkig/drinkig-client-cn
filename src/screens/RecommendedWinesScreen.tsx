import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Icon from "react-native-vector-icons/Ionicons";
import { useTranslation } from "react-i18next";
import GlassHeader from "../components/common/GlassHeader";
import { RootStackParamList } from "../types";
import { WineDBItem } from "../types/Wine";
import { colors } from "../constants/colors";
import { spacing, radius, surfaces } from "../constants/theme";
import {
  getWineTypeColor,
  getWineTypeLabel,
  WINE_TYPE_ON_COLOR,
} from "../constants/wineColors";

// 홈 "내 취향 추천 와인" 더보기: 홈에서 만든 실와인 추천 전체 목록.
const RecommendedWinesScreen = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, "RecommendedWines">>();
  const { t, i18n } = useTranslation();

  const wines = route.params?.wines ?? [];

  const renderWine = ({ item }: { item: WineDBItem }) => (
    <TouchableOpacity
      style={styles.wineItem}
      onPress={() => navigation.navigate("WineDetail", { wine: item })}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={item.nameKor || item.nameEng}
    >
      <View style={styles.wineImageContainer}>
        {item.imageUri ? (
          <Image
            source={{ uri: item.imageUri }}
            style={styles.wineImage}
            resizeMode="contain"
          />
        ) : (
          <Icon name="wine" size={26} color={colors.textTertiary} />
        )}
      </View>
      <View style={styles.wineTextContainer}>
        {i18n.language === "en" ? (
          <Text style={styles.wineName} numberOfLines={2}>
            {item.nameEng || item.nameKor}
          </Text>
        ) : (
          <>
            <Text style={styles.wineName} numberOfLines={2}>
              {item.nameKor}
            </Text>
            {item.nameEng ? (
              <Text style={styles.wineNameEng} numberOfLines={1}>
                {item.nameEng}
              </Text>
            ) : null}
          </>
        )}
        <View style={styles.wineInfoRow}>
          <View
            style={[
              styles.typeChip,
              { backgroundColor: getWineTypeColor(item.type) },
            ]}
          >
            <Text style={styles.typeChipText}>
              {getWineTypeLabel(item.type, t)}
            </Text>
          </View>
          {!!item.country && (
            <Text style={styles.countryText} numberOfLines={1}>
              {item.country}
            </Text>
          )}
          {!!item.vivinoRating && (
            <View style={styles.ratingContainer}>
              <Icon name="star" size={10} color={colors.ratingGold} />
              <Text style={styles.ratingText}>
                {item.vivinoRating.toFixed(1)}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <GlassHeader
        floating={false}
        title={t("recommendedWines.header")}
        left={
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon name="arrow-back" size={22} color={colors.white} />
          </TouchableOpacity>
        }
      />
      <FlatList
        showsVerticalScrollIndicator={false}
        data={wines}
        renderItem={renderWine}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <Text style={styles.introText}>{t("recommendedWines.intro")}</Text>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  introText: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  wineItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: surfaces.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: surfaces.hairline,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  wineImageContainer: {
    width: 56,
    height: 70,
    borderRadius: radius.sm,
    backgroundColor: surfaces.raised,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.lg,
    overflow: "hidden",
  },
  wineImage: {
    width: "85%",
    height: "85%",
  },
  wineTextContainer: {
    flex: 1,
    gap: 4,
    paddingVertical: 2,
  },
  wineName: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: "700",
  },
  wineNameEng: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  wineInfoRow: {
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
    flexShrink: 1,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  ratingText: {
    fontSize: 11,
    color: colors.ratingGold,
    fontWeight: "700",
  },
});

export default RecommendedWinesScreen;
