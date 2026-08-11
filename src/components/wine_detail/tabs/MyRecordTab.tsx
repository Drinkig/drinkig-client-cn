import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { MyWine } from '../../../context/WineContext';
import FeatureGauge from '../FeatureGauge';
import { colors } from '../../../constants/colors';
import { useTranslation } from 'react-i18next';

interface MyRecordTabProps {
  wine: MyWine;
  features: {
    sweetness: number;
    acidity: number;
    body: number;
    tannin: number;
  } | null;
}

export default function MyRecordTab({ wine, features }: MyRecordTabProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.tabContent}>
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>{t('wineDetail.myRecord.title')}</Text>
        <View style={styles.myRatingCard}>
          <View style={styles.myRatingHeader}>
            <Text style={styles.myRatingDate}>{wine.purchaseDate || t('wineDetail.myRecord.noDate')}</Text>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={20} color={colors.ratingStar} />
              <Ionicons name="star" size={20} color={colors.ratingStar} />
              <Ionicons name="star" size={20} color={colors.ratingStar} />
              <Ionicons name="star" size={20} color={colors.ratingStar} />
              <Ionicons name="star-outline" size={20} color={colors.ratingStar} />
              <Text style={[styles.ratingText, { fontSize: 18, marginLeft: 4 }]}>4.0</Text>
            </View>
          </View>
          <Text style={styles.myComment}>
            "기대보다 훨씬 향이 좋았습니다. 친구들과 파티할 때 가져갔는데 다들 좋아했네요. 재구매 의사 있습니다!"
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>{t('wineDetail.myRecord.purchaseInfo')}</Text>
        <View style={styles.detailRow}>
          <Text style={styles.label}>{t('wineDetail.vintage')}</Text>
          <Text style={styles.value}>{wine.vintage || '-'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.label}>{t('wineDetail.myRecord.purchasePrice')}</Text>
          <Text style={styles.value}>
            {wine.purchasePrice ? `₩${parseInt(wine.purchasePrice).toLocaleString()}` : '-'}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.label}>{t('wineDetail.myRecord.purchaseShop')}</Text>
          <Text style={styles.value}>{wine.purchaseLocation || '-'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.label}>{t('wineDetail.myRecord.purchaseDate')}</Text>
          <Text style={styles.value}>{wine.purchaseDate || '-'}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>{t('wineDetail.myRecord.myNote')}</Text>
        {features ? (
          <View style={styles.featuresContainer}>
            <FeatureGauge label={t('taste.sweetness')} value={features.sweetness} />
            <FeatureGauge label={t('taste.acidity')} value={features.acidity} />
            <FeatureGauge label={t('taste.body')} value={features.body} />
            <FeatureGauge label={t('taste.tannin')} value={features.tannin} />
          </View>
        ) : (
          <Text style={{ color: colors.textSecondary, fontStyle: 'italic' }}>{t('wineDetail.myRecord.emptyNote')}</Text>
        )}
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
    color: colors.white,
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
    borderColor: colors.border,
  },
  myRatingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  myRatingDate: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  myComment: {
    color: colors.white,
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
    color: colors.textSecondary,
  },
  value: {
    flex: 1,
    fontSize: 15,
    color: colors.white,
  },
  featuresContainer: {
    gap: 12,
  },
});

