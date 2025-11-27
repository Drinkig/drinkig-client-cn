import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PriceInfo } from '../../data/dummyWines';

interface PriceStatsProps {
  prices: PriceInfo[];
}

export default function PriceStats({ prices }: PriceStatsProps) {
  if (!prices || prices.length === 0) return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateText}>등록된 가격 정보가 없습니다.</Text>
    </View>
  );
  
  const priceValues = prices.map(p => p.price);
  const avgPrice = Math.round(priceValues.reduce((a, b) => a + b, 0) / priceValues.length);
  const minPrice = Math.min(...priceValues);
  const maxPrice = Math.max(...priceValues);

  return (
    <View style={styles.priceStatsContainer}>
      <View style={styles.priceStatItem}>
        <Text style={styles.priceStatLabel}>평균 구매가</Text>
        <Text style={styles.priceStatValue}>₩{avgPrice.toLocaleString()}</Text>
      </View>
      <View style={styles.priceStatDivider} />
      <View style={styles.priceStatItem}>
        <Text style={styles.priceStatLabel}>최저 ~ 최고</Text>
        <Text style={styles.priceStatRange}>
          ₩{minPrice.toLocaleString()} ~ ₩{maxPrice.toLocaleString()}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    color: '#666',
    fontSize: 16,
  },
  priceStatsContainer: {
    flexDirection: 'row',
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  priceStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  priceStatDivider: {
    width: 1,
    height: '80%',
    backgroundColor: '#444',
    marginHorizontal: 12,
  },
  priceStatLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  priceStatValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  priceStatRange: {
    fontSize: 14,
    color: '#fff',
  },
});

