import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { MyWine } from '../../../context/WineContext';
import FeatureGauge from '../FeatureGauge';

interface MyRecordTabProps {
  wine: MyWine;
  features: {
    sweetness: number;
    acidity: number;
    body: number;
    tannin: number;
  };
}

export default function MyRecordTab({ wine, features }: MyRecordTabProps) {
  return (
    <View style={styles.tabContent}>
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>나의 시음 기록</Text>
        <View style={styles.myRatingCard}>
          <View style={styles.myRatingHeader}>
            <Text style={styles.myRatingDate}>{wine.purchaseDate || '날짜 미입력'}</Text>
            <View style={styles.ratingContainer}>
               <Ionicons name="star" size={20} color="#f1c40f" />
               <Ionicons name="star" size={20} color="#f1c40f" />
               <Ionicons name="star" size={20} color="#f1c40f" />
               <Ionicons name="star" size={20} color="#f1c40f" />
               <Ionicons name="star-outline" size={20} color="#f1c40f" />
               <Text style={[styles.ratingText, {fontSize: 18, marginLeft: 4}]}>4.0</Text>
            </View>
          </View>
          <Text style={styles.myComment}>
            "기대보다 훨씬 향이 좋았습니다. 친구들과 파티할 때 가져갔는데 다들 좋아했네요. 재구매 의사 있습니다!"
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>구매 정보</Text>
        <View style={styles.detailRow}>
          <Text style={styles.label}>빈티지</Text>
          <Text style={styles.value}>{wine.vintage || '-'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.label}>구매가</Text>
          <Text style={styles.value}>
            {wine.purchasePrice ? `₩${parseInt(wine.purchasePrice).toLocaleString()}` : '-'}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.label}>구매처</Text>
          <Text style={styles.value}>{wine.purchaseLocation || '-'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.label}>구매일</Text>
          <Text style={styles.value}>{wine.purchaseDate || '-'}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>나의 테이스팅 노트</Text>
        <View style={styles.featuresContainer}>
          <FeatureGauge label="당도" value={features.sweetness} />
          <FeatureGauge label="산도" value={features.acidity} />
          <FeatureGauge label="바디" value={features.body} />
          <FeatureGauge label="타닌" value={features.tannin} />
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  divider: {
    height: 8,
    backgroundColor: '#111',
    marginBottom: 24,
  },
  myRatingCard: {
    backgroundColor: '#222',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  myRatingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  myRatingDate: {
    color: '#888',
    fontSize: 14,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  myComment: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 24,
    fontStyle: 'italic',
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  label: {
    width: 80,
    fontSize: 15,
    color: '#888',
  },
  value: {
    flex: 1,
    fontSize: 15,
    color: '#fff',
  },
  featuresContainer: {
    gap: 12,
  },
});

