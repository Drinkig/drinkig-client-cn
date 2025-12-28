import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface PriceStatsProps {
  prices: { price: number }[];
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

      <View style={styles.avgPriceContainer}>
        <Text style={styles.avgPriceLabel}>평균 구매가</Text>
        <Text style={styles.avgPriceValue}>₩{avgPrice.toLocaleString()}</Text>
      </View>

      <View style={styles.divider} />


      <View style={styles.rangeContainer}>
        <View style={styles.rangeItem}>
          <Text style={styles.rangeLabel}>최저</Text>
          <Text style={styles.rangeValue}>₩{minPrice.toLocaleString()}</Text>
        </View>
        <View style={styles.rangeItem}>
          <Text style={styles.rangeLabel}>최고</Text>
          <Text style={styles.rangeValue}>₩{maxPrice.toLocaleString()}</Text>
        </View>
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
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
  },
  avgPriceContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  avgPriceLabel: {
    fontSize: 14,
    color: '#888',
    marginBottom: 6,
  },
  avgPriceValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8e44ad',
  },
  divider: {
    height: 1,
    backgroundColor: '#444',
    marginBottom: 16,
  },
  rangeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  rangeItem: {
    alignItems: 'center',
  },
  rangeLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  rangeValue: {
    fontSize: 16,
    color: '#ddd',
    fontWeight: '600',
  },
});

