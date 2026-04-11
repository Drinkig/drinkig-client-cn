import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from "react-native";
import { useTranslation } from "react-i18next";
import { colors } from "../../constants/colors";
import GlassChip from "../common/GlassChip";

interface Category {
  title: string;
  data: string[];
}

interface CategorizedSelectionStepProps {
  title: string;
  categories: Category[];
  selected: string[];
  onSelect: (value: string) => void;
  allowCustomInput?: boolean;
}

export const CategorizedSelectionStep = ({
  title,
  categories,
  selected,
  onSelect,
  allowCustomInput,
}: CategorizedSelectionStepProps) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState(0);
  const [isInputVisible, setIsInputVisible] = useState(false);
  const [inputText, setInputText] = useState("");

  const allOptions = categories.flatMap((c) => c.data);
  const customValue = selected.find(
    (val) => !allOptions.includes(val) && val !== "기타"
  );

  const activeCategory = categories[activeTab];

  const getSelectedCount = (category: Category) => {
    let count = category.data.filter(
      (opt) => opt !== "기타" && selected.includes(opt)
    ).length;
    if (allowCustomInput && category.data.includes("기타") && customValue) {
      count += 1;
    }
    return count;
  };

  const handleCustomSubmit = () => {
    if (inputText.trim()) {
      onSelect(inputText.trim());
      setInputText("");
    }
    setIsInputVisible(false);
  };

  return (
    <View style={styles.content}>
      <Text style={styles.stepTitle}>{title}</Text>
      <Text style={styles.stepDesc}>{t("onboarding.selection.multiDesc")}</Text>

      {/* Category Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabBar}
        contentContainerStyle={styles.tabBarContent}
      >
        {categories.map((category, index) => {
          const isActive = index === activeTab;
          const count = getSelectedCount(category);
          return (
            <TouchableOpacity
              key={category.title}
              style={[styles.tab, isActive && styles.activeTab]}
              onPress={() => setActiveTab(index)}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, isActive && styles.activeTabText]}>
                {category.title}
              </Text>
              {count > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{count}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Active Category Items */}
      <View style={styles.itemsContainer}>
        <View style={styles.grid}>
          {activeCategory.data.map((opt) => {
            if (allowCustomInput && opt === "기타") {
              if (customValue) {
                return (
                  <GlassChip
                    key="custom-value"
                    label={customValue}
                    selected
                    onPress={() => onSelect(customValue)}
                  />
                );
              }
              if (isInputVisible) {
                return (
                  <View key="custom-input" style={styles.inputChip}>
                    <TextInput
                      style={styles.textInput}
                      value={inputText}
                      onChangeText={setInputText}
                      placeholder={t("onboarding.selection.customPlaceholder")}
                      placeholderTextColor={colors.textSecondary}
                      autoFocus
                      onSubmitEditing={handleCustomSubmit}
                      onBlur={handleCustomSubmit}
                      returnKeyType="done"
                    />
                  </View>
                );
              }
              return (
                <GlassChip
                  key={opt}
                  label={opt}
                  onPress={() => setIsInputVisible(true)}
                />
              );
            }

            return (
              <GlassChip
                key={opt}
                label={opt}
                selected={selected.includes(opt)}
                onPress={() => onSelect(opt)}
              />
            );
          })}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingTop: 10,
    backgroundColor: colors.background,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: colors.textPrimary,
    marginBottom: 8,
  },
  stepDesc: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  tabBar: {
    flexGrow: 0,
    marginBottom: 24,
  },
  tabBarContent: {
    gap: 8,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.border,
  },
  activeTab: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.textTertiary,
  },
  activeTabText: {
    color: colors.white,
    fontWeight: "700",
  },
  badge: {
    marginLeft: 6,
    backgroundColor: colors.white,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  badgeText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: "700",
  },
  itemsContainer: {
    flex: 1,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  inputChip: {
    backgroundColor: colors.surface1,
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: 12,
    minWidth: 80,
    justifyContent: "center",
  },
  textInput: {
    color: colors.textPrimary,
    fontSize: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    minWidth: 60,
  },
});
