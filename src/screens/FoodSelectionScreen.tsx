import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import GlassHeader from "../components/common/GlassHeader";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import { RootStackParamList } from "../types";
import { colors } from "../constants/colors";

export default function FoodSelectionScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { t } = useTranslation();

  const cuisines = t("foodSelection.cuisines", {
    returnObjects: true,
  }) as Array<{ name: string; flag: string; items: string[] }>;
  const categories = useMemo(
    () =>
      cuisines.map((c) => ({
        title: `${c.flag} ${c.name}`,
        data: c.items,
      })),
    [cuisines]
  );

  // Default to the first category
  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState(0);

  const handleSelect = (foodName: string) => {
    navigation.navigate("FoodPairingResult", { foodName });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <GlassHeader
        floating={false}
        left={
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={22} color={colors.white} />
          </TouchableOpacity>
        }
      />

      <View style={styles.topSection}>
        <Text style={styles.title}>{t("foodSelection.title")}</Text>
        <Text style={styles.subtitle}>{t("foodSelection.subtitle")}</Text>
      </View>

      <View style={styles.contentContainer}>
        {/* Left Sidebar: Categories - Only show if we have multiple categories */}
        {categories.length > 1 && (
          <View style={styles.sidebar}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {categories.map((category, index) => {
                const isSelected = selectedCategoryIndex === index;
                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.categoryItem,
                      isSelected && styles.categoryItemActive,
                    ]}
                    onPress={() => setSelectedCategoryIndex(index)}
                  >
                    <Text
                      style={[
                        styles.categoryText,
                        isSelected && styles.categoryTextActive,
                      ]}
                    >
                      {category.title}
                    </Text>
                    {isSelected && <View style={styles.activeIndicator} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Right Content: Food Items */}
        <View style={styles.mainContent}>
          <View style={styles.categoryHeader}>
            <Text style={styles.selectedCategoryTitle}>
              {categories[selectedCategoryIndex]?.title || ""}
            </Text>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.itemsContainer}
          >
            <View style={styles.grid}>
              {categories[selectedCategoryIndex]?.data.map((food, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.foodItem}
                  onPress={() => handleSelect(food)}
                >
                  <Text style={styles.foodItemText}>{food}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    flex: 1,
    flexDirection: "row",
  },
  sidebar: {
    width: "30%",
    backgroundColor: "#222",
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  categoryItem: {
    paddingVertical: 20,
    paddingHorizontal: 12,
    justifyContent: "center",
    position: "relative",
  },
  categoryItemActive: {
    backgroundColor: colors.background,
  },
  categoryText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
  },
  categoryTextActive: {
    color: colors.white,
    fontWeight: "bold",
  },
  activeIndicator: {
    position: "absolute",
    left: 0,
    top: 15,
    bottom: 15,
    width: 4,
    backgroundColor: colors.primary,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },
  mainContent: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topSection: {
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: colors.white,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#aaa",
  },
  categoryHeader: {
    padding: 20,
    paddingBottom: 10,
  },
  selectedCategoryTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: colors.white,
    marginBottom: 6,
  },
  selectedCategorySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  itemsContainer: {
    padding: 16,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  foodItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.surface1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  foodItemText: {
    color: "#ddd",
    fontSize: 15,
    textAlign: "center",
  },
});
