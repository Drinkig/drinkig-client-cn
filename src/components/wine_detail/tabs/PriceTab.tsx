import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { VintageData } from '../../../data/dummyWines';
import PriceStats from '../PriceStats';

interface PriceTabProps {
  selectedVintage: VintageData | null;
}

export default function PriceTab({ selectedVintage }: PriceTabProps) {
  if (!selectedVintage) {
     return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateText}>빈티지를 선택해주세요.</Text>
      </View>
    );
  }

  if (!selectedVintage.prices || selectedVintage.prices.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateText}>선택한 빈티지의 가격 정보가 없습니다.</Text>
      </View>
    );
  }

  return (
    <View style={styles.tabContent}>
      <View style={styles.sectionContainer}>
        <View style={styles.vintageInfoContainer}>
            <Text style={styles.subSectionTitle}>구매가 정보 ({selectedVintage.year})</Text>
            <PriceStats prices={selectedVintage.prices} />
            
            <View style={styles.priceInfoNote}>
               <Ionicons name="information-circle-outline" size={14} color="#888" style={{marginRight: 4}} />
               <Text style={styles.priceInfoText}>유저들이 등록한 구매 가격을 바탕으로 집계된 정보입니다.</Text>
            </View>
          </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tabContent: {
    paddingTop: 24,
  },
  sectionContainer: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    color: '#666',
    fontSize: 16,
  },
  vintageInfoContainer: {
    marginTop: 8,
    backgroundColor: '#222',
    borderRadius: 12,
    padding: 16,
  },
  subSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ddd',
    marginBottom: 12,
    marginTop: 8,
  },
  priceInfoNote: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  priceInfoText: {
    color: '#888',
    fontSize: 12,
  },
});

