import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { colors } from "../constants/colors";
import { surfaces } from "../constants/theme";
import {
  getWineTypeColor as getTypeColor,
  WINE_TYPE_ON_COLOR,
} from "../constants/wineColors";
import {
  WineRequestDTO,
  WineRequestStatus,
  getAdminWineRequests,
  approveWineRequest,
  rejectWineRequest,
} from "../api/wine";
import { useGlobalUI } from "../context/GlobalUIContext";
import GlassHeader from "../components/common/GlassHeader";

const TABS: WineRequestStatus[] = ["PENDING", "APPROVED", "REJECTED"];

const AdminWineApprovalScreen = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { showToast } = useGlobalUI();

  const [activeTab, setActiveTab] = useState<WineRequestStatus>("PENDING");
  const [requests, setRequests] = useState<WineRequestDTO[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const fetchRequests = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getAdminWineRequests({
        status: activeTab,
        size: 50,
      });
      if (response.isSuccess) {
        setRequests(response.result.content);
      }
    } catch (error) {
      console.error("Failed to fetch wine requests:", error);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleApprove = (requestId: number) => {
    Alert.alert(
      t("adminWineApproval.approve"),
      t("adminWineApproval.confirmApprove"),
      [
        { text: "취소", style: "cancel" },
        {
          text: t("adminWineApproval.approve"),
          onPress: async () => {
            try {
              const response = await approveWineRequest(requestId);
              if (response.isSuccess) {
                showToast(t("adminWineApproval.alert.approveSuccess"), {
                  type: "success",
                });
                fetchRequests();
              } else {
                showToast(t("adminWineApproval.alert.error"), {
                  type: "error",
                });
              }
            } catch {
              showToast(t("adminWineApproval.alert.error"), { type: "error" });
            }
          },
        },
      ]
    );
  };

  const handleRejectStart = (requestId: number) => {
    setRejectTarget(requestId);
    setRejectReason("");
    setRejectModalVisible(true);
  };

  const handleRejectConfirm = async () => {
    if (rejectTarget === null) return;
    try {
      const response = await rejectWineRequest(rejectTarget, rejectReason);
      if (response.isSuccess) {
        showToast(t("adminWineApproval.alert.rejectSuccess"), {
          type: "success",
        });
        fetchRequests();
      } else {
        showToast(t("adminWineApproval.alert.error"), { type: "error" });
      }
    } catch {
      showToast(t("adminWineApproval.alert.error"), { type: "error" });
    }
    setRejectModalVisible(false);
    setRejectTarget(null);
  };

  const getStatusColor = (status: WineRequestStatus) => {
    switch (status) {
      case "PENDING":
        return colors.warning;
      case "APPROVED":
        return colors.success;
      case "REJECTED":
        return colors.error;
    }
  };

  const renderItem = ({ item }: { item: WineRequestDTO }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        {item.imageUrl ? (
          <Image
            source={{ uri: item.imageUrl }}
            style={styles.cardImage}
            resizeMode="contain"
          />
        ) : (
          <View style={styles.cardImagePlaceholder}>
            <Icon name="wine-outline" size={24} color={colors.textSecondary} />
          </View>
        )}
        <View style={styles.cardInfo}>
          <Text style={styles.cardName} numberOfLines={2}>
            {item.name}
          </Text>
          {item.nameEng ? (
            <Text style={styles.cardNameEng} numberOfLines={1}>
              {item.nameEng}
            </Text>
          ) : null}
          <View style={styles.cardMeta}>
            <View
              style={[
                styles.sortBadge,
                { backgroundColor: getTypeColor(item.sort) },
              ]}
            >
              <Text style={styles.sortBadgeText}>{item.sort}</Text>
            </View>
            <Text style={styles.cardMetaText}>{item.country}</Text>
            {item.region ? (
              <Text style={styles.cardMetaText}> / {item.region}</Text>
            ) : null}
          </View>
          {item.memberName ? (
            <Text style={styles.submitterText}>
              {t("adminWineApproval.detail.submittedBy")}: {item.memberName}
            </Text>
          ) : null}
          <Text style={styles.dateText}>
            {item.createdAt?.slice(0, 10) || ""}
          </Text>
        </View>
      </View>

      {item.memo ? <Text style={styles.memoText}>{item.memo}</Text> : null}

      {activeTab === "PENDING" && (
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionButton, styles.rejectButton]}
            onPress={() => handleRejectStart(item.requestId)}
          >
            <Icon name="close-circle-outline" size={18} color={colors.error} />
            <Text style={[styles.actionText, { color: colors.error }]}>
              {t("adminWineApproval.reject")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.approveButton]}
            onPress={() => handleApprove(item.requestId)}
          >
            <Icon
              name="checkmark-circle-outline"
              size={18}
              color={colors.success}
            />
            <Text style={[styles.actionText, { color: colors.success }]}>
              {t("adminWineApproval.approve")}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {activeTab !== "PENDING" && (
        <View style={styles.statusRow}>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(item.status) + "22" },
            ]}
          >
            <Text
              style={[
                styles.statusBadgeText,
                { color: getStatusColor(item.status) },
              ]}
            >
              {item.status}
            </Text>
          </View>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <GlassHeader
        floating={false}
        title={t("adminWineApproval.header")}
        left={
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon name="arrow-back" size={22} color={colors.white} />
          </TouchableOpacity>
        }
      />

      {/* Tabs */}
      <View style={styles.tabRow}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab && styles.tabTextActive,
              ]}
            >
              {t(`adminWineApproval.tabs.${tab.toLowerCase()}`)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={requests}
          renderItem={renderItem}
          keyExtractor={(item) => item.requestId.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="wine-outline" size={48} color={colors.textTertiary} />
              <Text style={styles.emptyText}>
                {t("adminWineApproval.empty")}
              </Text>
            </View>
          }
        />
      )}

      {/* Reject Reason Modal */}
      <Modal
        visible={rejectModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRejectModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {t("adminWineApproval.rejectReason")}
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder={t("adminWineApproval.rejectReasonPlaceholder")}
              placeholderTextColor={colors.textTertiary}
              value={rejectReason}
              onChangeText={setRejectReason}
              multiline
            />
            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => setRejectModalVisible(false)}
              >
                <Text style={styles.modalButtonSecondaryText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={handleRejectConfirm}
              >
                <Text style={styles.modalButtonPrimaryText}>
                  {t("adminWineApproval.reject")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  tabRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    backgroundColor: colors.surface1,
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: colors.surface1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: "row",
  },
  cardImage: {
    width: 56,
    height: 72,
    borderRadius: 8,
    backgroundColor: surfaces.imageWell,
  },
  cardImagePlaceholder: {
    width: 56,
    height: 72,
    borderRadius: 8,
    backgroundColor: surfaces.imageWell,
    justifyContent: "center",
    alignItems: "center",
  },
  cardInfo: {
    flex: 1,
    marginLeft: 12,
    gap: 2,
  },
  cardName: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.white,
  },
  cardNameEng: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  cardMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  sortBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  sortBadgeText: {
    fontSize: 10,
    fontWeight: "bold",
    color: WINE_TYPE_ON_COLOR,
  },
  cardMetaText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  submitterText: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 4,
  },
  dateText: {
    fontSize: 11,
    color: colors.textTertiary,
  },
  memoText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 8,
    gap: 4,
  },
  rejectButton: {
    backgroundColor: colors.error + "15",
    borderWidth: 1,
    borderColor: colors.error + "33",
  },
  approveButton: {
    backgroundColor: colors.success + "15",
    borderWidth: 1,
    borderColor: colors.success + "33",
  },
  actionText: {
    fontSize: 14,
    fontWeight: "600",
  },
  statusRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: "flex-start",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  emptyContainer: {
    padding: 64,
    alignItems: "center",
    gap: 12,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  modalCard: {
    backgroundColor: colors.surface1,
    borderRadius: 16,
    padding: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.white,
    marginBottom: 16,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: colors.white,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: "top",
    marginBottom: 16,
    backgroundColor: colors.background,
  },
  modalButtonRow: {
    flexDirection: "row",
    gap: 8,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  modalButtonPrimary: {
    backgroundColor: colors.error,
  },
  modalButtonSecondary: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalButtonPrimaryText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "600",
  },
  modalButtonSecondaryText: {
    color: colors.white,
    fontSize: 16,
  },
});

export default AdminWineApprovalScreen;
