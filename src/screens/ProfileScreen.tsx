import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Modal,
  TouchableWithoutFeedback,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/Ionicons";

import { useNavigation, useIsFocused } from "@react-navigation/native";
import { useUser } from "../context/UserContext";
import {
  getMyWines,
  getMyTastingNotes,
  TastingNotePreviewDTO,
} from "../api/wine";
import PentagonRadarChart from "../components/common/PentagonRadarChart";
import { colors } from "../constants/colors";
import { surfaces, accent, radius } from "../constants/theme";
import GlassHeader, {
  useGlassHeaderHeight,
} from "../components/common/GlassHeader";
import { useTranslation, Trans } from "react-i18next";

const ProfileScreen = () => {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const { user: userInfo, flavorProfile } = useUser();

  const [selectedType, setSelectedType] = React.useState("전체");
  const [wineCount, setWineCount] = React.useState(0);
  const [tastingNotes, setTastingNotes] = React.useState<
    TastingNotePreviewDTO[]
  >([]);

  const [sortType, setSortType] = React.useState("latest");
  const [isSortModalVisible, setIsSortModalVisible] = React.useState(false);
  const [viewMode, setViewMode] = React.useState<"list" | "card">("list");
  const { t, i18n } = useTranslation();
  const headerHeight = useGlassHeaderHeight();

  const sortOptions = [
    { label: t("profile.sort.latest"), value: "latest" },
    { label: t("profile.sort.ratingHigh"), value: "rating_high" },
    { label: t("profile.sort.ratingLow"), value: "rating_low" },
  ];

  const fetchMyData = async () => {
    try {
      const response = await getMyTastingNotes();

      if (response.isSuccess) {
        let notes: any[] = [];
        if (Array.isArray(response.result)) {
          notes = response.result;
        } else if (
          response.result &&
          Array.isArray((response.result as any).content)
        ) {
          notes = (response.result as any).content;
        }

        // S3 이미지 URL Fallback 적용
        notes = notes.map((note: any) => {
          if (!note.imageUrl && note.wineId) {
            return {
              ...note,
              imageUrl: `https://drinkeg-bucket-1.s3.ap-northeast-2.amazonaws.com/wine/${note.wineId}.png`,
            };
          }
          return note;
        });

        setTastingNotes(notes);
        setWineCount(notes.length);
      }
    } catch (error) {
      console.error("Failed to fetch my data:", error);
      setTastingNotes([]);
    }
  };

  React.useEffect(() => {
    if (isFocused) {
      fetchMyData();
    }
  }, [isFocused]);

  const wineTypes = [
    { label: t("myWine.types.all"), value: "전체" },
    { label: t("myWine.types.red"), value: "레드" },
    { label: t("myWine.types.white"), value: "화이트" },
    { label: t("myWine.types.sparkling"), value: "스파클링" },
    { label: t("myWine.types.rose"), value: "로제" },
    { label: t("myWine.types.dessert"), value: "디저트" },
    { label: t("myWine.types.fortified"), value: "주정강화" },
    { label: t("myWine.types.other"), value: "기타" },
  ];

  const processedNotes = React.useMemo(() => {
    if (!Array.isArray(tastingNotes)) return [];

    let filtered = [];

    if (selectedType === "전체") {
      filtered = [...tastingNotes];
    } else {
      const typeMap: { [key: string]: string } = {
        레드: "Red",
        화이트: "White",
        스파클링: "Sparkling",
        로제: "Rose",
        디저트: "Dessert",
        주정강화: "Fortified",
      };

      if (selectedType === "기타") {
        filtered = tastingNotes.filter((note) => {
          const sort = note.sort || "";
          return ![
            "Red",
            "White",
            "Sparkling",
            "Rose",
            "Dessert",
            "Fortified",
            "레드",
            "화이트",
            "스파클링",
            "로제",
            "디저트",
            "주정강화",
          ].includes(sort);
        });
      } else {
        const targetType = typeMap[selectedType] || selectedType;
        filtered = tastingNotes.filter((note) => {
          const sort = note.sort || "";
          return (
            sort === targetType ||
            sort === selectedType ||
            sort.toUpperCase() === targetType.toUpperCase()
          );
        });
      }
    }

    return filtered.sort((a, b) => {
      switch (sortType) {
        case "rating_high":
          return b.rating - a.rating;
        case "rating_low":
          return a.rating - b.rating;
        case "latest":
        default:
          return (b.createdAt || "").localeCompare(a.createdAt || "");
      }
    });
  }, [tastingNotes, selectedType, sortType]);

  const { width } = Dimensions.get("window");
  const cardGap = 12;
  const cardPadding = 20;
  const cardItemWidth = (width - cardPadding * 2 - cardGap) / 2;

  const navigateToNote = (item: TastingNotePreviewDTO) => {
    navigation.navigate("TastingNoteDetail", {
      tastingNoteId: item.tastingNoteId || (item as any).noteId,
    });
  };

  const renderListItem = (item: TastingNotePreviewDTO) => (
    <TouchableOpacity
      key={item.tastingNoteId || (item as any).noteId}
      style={styles.listItem}
      onPress={() => navigateToNote(item)}
      activeOpacity={0.8}
    >
      <View style={styles.listImageWrapper}>
        {item.imageUrl ? (
          <Image
            source={{ uri: item.imageUrl }}
            style={styles.noteImage}
            resizeMode="contain"
          />
        ) : (
          <View
            style={[
              styles.noteImage,
              {
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: surfaces.raised,
              },
            ]}
          >
            <Icon name="wine" size={24} color={colors.textTertiary} />
          </View>
        )}
      </View>
      <View style={styles.listNoteInfo}>
        <Text style={styles.listNoteName} numberOfLines={2}>
          {i18n.language === "en"
            ? item.wineNameEng || item.wineName
            : item.wineName}
        </Text>
        <Text style={styles.listNoteDate}>{item.tasteDate}</Text>
      </View>
      <View style={styles.listRatingBadge}>
        <Icon name="star" size={12} color="#E8C94A" />
        <Text style={styles.listRatingText}>{item.rating.toFixed(1)}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderCardItem = (item: TastingNotePreviewDTO) => (
    <TouchableOpacity
      key={item.tastingNoteId || (item as any).noteId}
      style={[styles.cardItem, { width: cardItemWidth }]}
      onPress={() => navigateToNote(item)}
      activeOpacity={0.8}
    >
      <View style={styles.cardImageWrapper}>
        {item.imageUrl ? (
          <Image
            source={{ uri: item.imageUrl }}
            style={styles.noteImage}
            resizeMode="contain"
          />
        ) : (
          <View
            style={[
              styles.noteImage,
              {
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: surfaces.raised,
              },
            ]}
          >
            <Icon name="wine" size={28} color={colors.textTertiary} />
          </View>
        )}
        <View style={styles.cardRatingBadge}>
          <Icon name="star" size={10} color="#E8C94A" />
          <Text style={styles.cardRatingText}>{item.rating.toFixed(1)}</Text>
        </View>
      </View>
      <View style={styles.cardNoteInfo}>
        <Text style={styles.cardNoteName} numberOfLines={2}>
          {i18n.language === "en"
            ? item.wineNameEng || item.wineName
            : item.wineName}
        </Text>
        <Text style={styles.cardNoteDate}>{item.tasteDate}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={["left", "right"]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: headerHeight + 12 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <Image
              source={
                userInfo?.profileImage
                  ? { uri: userInfo.profileImage }
                  : require("../assets/Standard_profile.png")
              }
              style={styles.profileImage}
              resizeMode="cover"
            />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.nickname}>
              {userInfo?.nickname || t("profile.guest")}
            </Text>
            <Text style={styles.wineCountText}>
              {t("profile.wineCountText", { count: wineCount || 0 })}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => navigation.navigate("ProfileEdit" as never)}
          >
            <Text style={styles.editButtonText}>{t("profile.editBtn")}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t("profile.tasteTitle")}</Text>
          </View>

          {flavorProfile ? (
            <TouchableOpacity
              style={styles.chartContainer}
              onPress={() => navigation.navigate("RecommendationList" as never)}
              activeOpacity={0.8}
            >
              <View style={styles.chartContentWrapper}>
                <PentagonRadarChart data={flavorProfile} size={150} />
                <View style={styles.chartRightContent}>
                  <Text style={styles.chartLinkTitle}>
                    {t("profile.chartLinkTitle")}
                  </Text>
                  <Text style={styles.chartLinkSubtitle}>
                    {t("profile.chartLinkSubtitle")}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ) : (
            <View style={styles.emptyWrapper}>
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  {t("profile.emptyFlavor.title")}
                </Text>
                <Text style={styles.emptySubText}>
                  {t("profile.emptyFlavor.desc")}
                </Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t("profile.historyTitle")}</Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterChipsContainer}
          >
            {wineTypes.map((type) => (
              <TouchableOpacity
                key={type.value}
                style={[
                  styles.filterChip,
                  selectedType === type.value && styles.filterChipSelected,
                ]}
                onPress={() => setSelectedType(type.value)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selectedType === type.value &&
                      styles.filterChipTextSelected,
                  ]}
                >
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View
            style={[
              styles.countAndSortContainer,
              processedNotes.length === 0 && styles.countAndSortContainerFlat,
            ]}
          >
            <Text style={styles.countText}>
              <Trans
                i18nKey="profile.historyCountText"
                values={{ count: processedNotes.length }}
                components={[<Text style={styles.countValue} />]}
              />
            </Text>

            {!Array.isArray(tastingNotes) ||
            tastingNotes.length === 0 ? null : (
              <View style={styles.sortAndViewContainer}>
                <TouchableOpacity
                  style={styles.sortButton}
                  onPress={() => setIsSortModalVisible(true)}
                >
                  <Text style={styles.sortButtonText}>
                    {sortOptions.find((opt) => opt.value === sortType)?.label}
                  </Text>
                  <Icon
                    name="chevron-down"
                    size={14}
                    color={colors.textSecondary}
                    style={{ marginLeft: 4 }}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() =>
                    setViewMode(viewMode === "list" ? "card" : "list")
                  }
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Icon
                    name={viewMode === "list" ? "grid-outline" : "list-outline"}
                    size={20}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            )}
          </View>

          {processedNotes.length > 0 ? (
            viewMode === "list" ? (
              <View style={styles.listContainer}>
                {processedNotes.map((item) => renderListItem(item))}
              </View>
            ) : (
              <View style={styles.cardGrid}>
                {processedNotes.map((item) => renderCardItem(item))}
              </View>
            )
          ) : (
            <View style={styles.emptyWrapper}>
              <Text style={styles.emptyText}>
                {t("profile.emptyNotes.title")}
              </Text>
              <Text style={styles.emptySubText}>
                {t("profile.emptyNotes.desc")}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      <GlassHeader
        title={t("profile.headerTitle")}
        right={
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => navigation.navigate("Setting" as never)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon name="settings-outline" size={22} color={colors.white} />
          </TouchableOpacity>
        }
      />

      <Modal
        visible={isSortModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsSortModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsSortModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>
                    {t("profile.sort.title")}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setIsSortModalVisible(false)}
                  >
                    <Icon name="close" size={24} color={colors.white} />
                  </TouchableOpacity>
                </View>
                {sortOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={styles.sortOptionItem}
                    onPress={() => {
                      setSortType(option.value);
                      setIsSortModalVisible(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.sortOptionText,
                        sortType === option.value &&
                          styles.sortOptionTextSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                    {sortType === option.value && (
                      <Icon name="checkmark" size={20} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  settingsButton: {
    padding: 4,
  },
  scrollContent: {
    paddingTop: 0,
    paddingBottom: 140,
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 30,
    marginTop: 20,
    paddingHorizontal: 24,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: surfaces.card,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: accent.border,
    marginRight: 16,
    overflow: "hidden",
  },
  profileImage: {
    width: "100%",
    height: "100%",
    transform: [{ scale: 1.3 }],
  },
  userInfo: {
    flex: 1,
    justifyContent: "center",
  },
  nickname: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.white,
    marginBottom: 4,
  },
  wineCountText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: "600",
  },

  editButton: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    backgroundColor: accent.soft,
    borderWidth: 1,
    borderColor: accent.border,
  },
  editButtonText: {
    color: accent.text,
    fontSize: 13,
    fontWeight: "600",
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionHeader: {
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.white,
  },
  countAndSortContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    backgroundColor: colors.background,
    zIndex: 1,
  },
  countAndSortContainerFlat: {
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },
  countText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  countValue: {
    color: colors.white,
    fontWeight: "bold",
  },
  sortButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
  },
  sortButtonText: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  chartContainer: {
    marginBottom: 24,
    backgroundColor: surfaces.card,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginHorizontal: 24,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: surfaces.hairline,
  },
  chartContentWrapper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  chartRightContent: {
    flex: 1,
    alignItems: "flex-end",
    justifyContent: "center",
    paddingLeft: 16,
  },
  chartLinkTitle: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
    textAlign: "right",
  },
  chartLinkSubtitle: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "600",
    textAlign: "right",
  },
  filterChipsContainer: {
    paddingHorizontal: 24,
    gap: 8,
    marginBottom: 16,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: surfaces.card,
    borderWidth: 1,
    borderColor: surfaces.hairline,
  },
  filterChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  filterChipTextSelected: {
    color: colors.white,
    fontWeight: "bold",
  },
  sortAndViewContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  // shared
  noteImage: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  // list view
  listContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    backgroundColor: surfaces.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: surfaces.hairline,
    padding: 12,
    gap: 14,
  },
  listImageWrapper: {
    width: 56,
    height: 70,
    borderRadius: radius.sm,
    backgroundColor: surfaces.raised,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    flexShrink: 0,
  },
  listNoteInfo: {
    flex: 1,
    justifyContent: "center",
  },
  listNoteName: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 4,
    lineHeight: 20,
  },
  listNoteDate: {
    color: colors.textTertiary,
    fontSize: 12,
  },
  listRatingBadge: {
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    marginLeft: "auto",
    flexShrink: 0,
  },
  listRatingText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "bold",
  },
  // card view
  cardGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 12,
  },
  cardItem: {
    marginBottom: 0,
    backgroundColor: surfaces.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: surfaces.hairline,
    overflow: "hidden",
  },
  cardImageWrapper: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: surfaces.raised,
    justifyContent: "center",
    alignItems: "center",
    padding: 10,
  },
  cardRatingBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  cardRatingText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: "bold",
  },
  cardNoteInfo: {
    padding: 10,
  },
  cardNoteName: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "bold",
    marginBottom: 3,
    lineHeight: 18,
  },
  cardNoteDate: {
    color: colors.textTertiary,
    fontSize: 11,
  },
  emptyWrapper: {
    paddingHorizontal: 24,
    paddingVertical: 60,
    alignItems: "center",
  },
  emptyContainer: {
    backgroundColor: surfaces.card,
    borderRadius: radius.md,
    padding: 30,
    alignItems: "center",
    borderWidth: 1,
    borderColor: surfaces.hairline,
    borderStyle: "dashed",
    width: "100%",
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 8,
    fontWeight: "bold",
  },
  emptySubText: {
    fontSize: 13,
    color: colors.textTertiary,
    textAlign: "center",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "50%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.white,
  },
  sortOptionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: surfaces.hairline,
  },
  sortOptionText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  sortOptionTextSelected: {
    color: colors.primary,
    fontWeight: "bold",
  },
});

export default ProfileScreen;
