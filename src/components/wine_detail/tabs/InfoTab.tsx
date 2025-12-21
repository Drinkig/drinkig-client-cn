import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import FeatureGauge from '../FeatureGauge';

interface InfoTabProps {
  description: string | null;
  features: {
    sweetness: number;
    acidity: number;
    body: number;
    tannin: number;
  } | null;
  nose: string[] | null;
  palate: string[] | null;
  finish: string[] | null;
  showTastingNotes: boolean;
}

export default function InfoTab({
  description,
  features,
  nose,
  palate,
  finish,
  showTastingNotes,
}: InfoTabProps) {
  // 모든 데이터가 없으면 안내 메시지 표시
  const hasAnyData = description || (showTastingNotes && (features || (nose && nose.length > 0) || (palate && palate.length > 0) || (finish && finish.length > 0)));

  if (!hasAnyData) {
    return (
      <View style={styles.tabContent}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>등록된 상세 정보가 없습니다.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.tabContent}>
      {description && (
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>와인 설명</Text>
          <Text style={styles.description}>{description}</Text>
        </View>
      )}

      {showTastingNotes && (
        <>
          {features && (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>테이스팅 노트</Text>
              <View style={styles.featuresContainer}>
                <FeatureGauge label="당도" value={features.sweetness} />
                <FeatureGauge label="산도" value={features.acidity} />
                <FeatureGauge label="바디" value={features.body} />
                <FeatureGauge label="타닌" value={features.tannin} />
              </View>
            </View>
          )}

          {nose && nose.length > 0 && (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>
                노즈 <Text style={styles.subTitleText}>(Nose)</Text>
              </Text>
              <Text style={styles.aromaListText}>{nose.join(', ')}</Text>
            </View>
          )}

          {palate && palate.length > 0 && (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>
                팔레트 <Text style={styles.subTitleText}>(Palate)</Text>
              </Text>
              <Text style={styles.aromaListText}>{palate.join(', ')}</Text>
            </View>
          )}

          {finish && finish.length > 0 && (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>
                피니시 <Text style={styles.subTitleText}>(Finish)</Text>
              </Text>
              <Text style={styles.aromaListText}>{finish.join(', ')}</Text>
            </View>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tabContent: {
    paddingTop: 24,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
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
  description: {
    fontSize: 15,
    color: '#ccc',
    lineHeight: 24,
  },
  featuresContainer: {
    gap: 12,
  },
  subTitleText: {
    fontSize: 14,
    fontWeight: 'normal',
    color: '#aaa',
  },
  aromaListText: {
    color: '#ccc',
    fontSize: 15,
    lineHeight: 24,
  },
});

