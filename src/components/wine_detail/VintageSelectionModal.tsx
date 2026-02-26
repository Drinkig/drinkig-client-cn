import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, FlatList } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { VintageData } from '../../types/Wine';
import { colors } from '../../constants/colors';

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
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>빈티지 선택</Text>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color={colors.white} />
            </TouchableOpacity>
          </View>
          <FlatList
            showsVerticalScrollIndicator={false}
            data={vintages}
            keyExtractor={(item) => item.year}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.vintageModalItem,
                  selectedVintage?.year === item.year && styles.vintageModalItemSelected
                ]}
                onPress={() => {
                  onSelect(item);
                  onClose();
                }}
              >
                <Text style={[
                  styles.vintageModalItemText,
                  selectedVintage?.year === item.year && styles.vintageModalItemTextSelected
                ]}>
                  {item.year}
                </Text>

                <View style={styles.rightContainer}>
                  {item.reviews && item.reviews.length > 0 && (
                    <View style={styles.ratingInfoContainer}>
                      <Ionicons name="star" size={14} color="#f1c40f" style={styles.ratingIcon} />
                      <Text style={styles.ratingText}>
                        {item.rating ? item.rating.toFixed(1) : '0.0'}
                      </Text>
                      <Text style={styles.reviewCount}>
                        ({item.reviews.length})
                      </Text>
                    </View>
                  )}
                  {selectedVintage?.year === item.year && (
                    <Ionicons name="checkmark" size={20} color={colors.primary} style={styles.checkmark} />
                  )}
                </View>
              </TouchableOpacity>
            )}
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.white,
  },
  closeButton: {
    padding: 4,
  },
  vintageModalList: {
    paddingBottom: 40,
  },
  vintageModalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface1,
  },
  vintageModalItemSelected: {
    backgroundColor: colors.border,
    borderBottomColor: colors.border,
  },
  vintageModalItemText: {
    fontSize: 16,
    color: '#ccc',
  },
  vintageModalItemTextSelected: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  ratingIcon: {
    marginRight: 4,
  },
  ratingText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '500',
    marginRight: 4,
    lineHeight: 18, // Explicit line height for vertical centering
  },
  reviewCount: {
    color: '#666',
    fontSize: 12,
    fontWeight: 'normal',
    lineHeight: 18, // Match line height for shared baseline feeling
  },
  checkmark: {
    marginLeft: 4,
  },
});

