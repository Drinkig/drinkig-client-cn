import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { VintageData } from "../../types/Wine";
import { colors } from "../../constants/colors";
import { surfaces, accent, radius, spacing } from "../../constants/theme";
import { useTranslation } from "react-i18next";

interface VintageSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  vintages: VintageData[];
  selectedVintage: VintageData | null;
  onSelect: (vintage: VintageData) => void;
}

export default function VintageSelectionModal({
  visible,
  onClose,
  vintages,
  selectedVintage,
  onSelect,
}: VintageSelectionModalProps) {
  const { t } = useTranslation();
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.modalContent}>
          <View style={styles.grabber} />
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {t("wineDetail.vintage")} {t("wineDetail.select")}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <FlatList
            showsVerticalScrollIndicator={false}
            data={vintages}
            keyExtractor={(item) => item.year}
            renderItem={({ item }) => {
              const isSelected = selectedVintage?.year === item.year;
              return (
                <TouchableOpacity
                  style={[
                    styles.vintageModalItem,
                    isSelected && styles.vintageModalItemSelected,
                  ]}
                  activeOpacity={0.8}
                  onPress={() => {
                    onSelect(item);
                    onClose();
                  }}
                >
                  <Text
                    style={[
                      styles.vintageModalItemText,
                      isSelected && styles.vintageModalItemTextSelected,
                    ]}
                  >
                    {item.year}
                  </Text>

                  <View style={styles.rightContainer}>
                    {item.reviews && item.reviews.length > 0 && (
                      <View style={styles.ratingInfoContainer}>
                        <Ionicons
                          name="star"
                          size={14}
                          color="#E8C94A"
                          style={styles.ratingIcon}
                        />
                        <Text style={styles.ratingText}>
                          {item.rating ? item.rating.toFixed(1) : "0.0"}
                        </Text>
                        <Text style={styles.reviewCount}>
                          ({item.reviews.length})
                        </Text>
                      </View>
                    )}
                    {isSelected && (
                      <Ionicons
                        name="checkmark"
                        size={20}
                        color={accent.text}
                        style={styles.checkmark}
                      />
                    )}
                  </View>
                </TouchableOpacity>
              );
            }}
            contentContainerStyle={styles.vintageModalList}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: "80%",
    paddingBottom: 40,
  },
  grabber: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: surfaces.hairlineStrong,
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 4,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.white,
    letterSpacing: -0.2,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: surfaces.raised,
    justifyContent: "center",
    alignItems: "center",
  },
  vintageModalList: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xs,
  },
  vintageModalItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: surfaces.card,
    borderWidth: 1,
    borderColor: surfaces.hairline,
  },
  vintageModalItemSelected: {
    backgroundColor: accent.soft,
    borderColor: accent.border,
  },
  vintageModalItemText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  vintageModalItemTextSelected: {
    color: accent.text,
    fontWeight: "700",
  },
  rightContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 8,
  },
  ratingIcon: {
    marginRight: 4,
  },
  ratingText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "500",
    marginRight: 4,
    lineHeight: 18,
  },
  reviewCount: {
    color: colors.textTertiary,
    fontSize: 12,
    fontWeight: "normal",
    lineHeight: 18,
  },
  checkmark: {
    marginLeft: 4,
  },
});
