import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import FeatureGauge from '../FeatureGauge';

interface InfoTabProps {
  description: string;
  features: {
    sweetness: number;
    acidity: number;
    body: number;
    tannin: number;
  };
  nose: string[];
  palate: string[];
  finish: string[];
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
  return (
    <View style={styles.tabContent}>
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>와인 설명</Text>
        <Text style={styles.description}>{description}</Text>
      </View>

      {showTastingNotes && (
        <>
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>테이스팅 노트</Text>
            <View style={styles.featuresContainer}>
              <FeatureGauge label="당도" value={features.sweetness} />
              <FeatureGauge label="산도" value={features.acidity} />
              <FeatureGauge label="바디" value={features.body} />
              <FeatureGauge label="타닌" value={features.tannin} />
            </View>
          </View>

          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>
              노즈 <Text style={styles.subTitleText}>(Nose)</Text>
            </Text>
            <View style={styles.aromaContainer}>
              {nose.map((item, index) => (
                <View key={index} style={styles.aromaTag}>
                  <MaterialCommunityIcons name="scent" size={14} color="#8e44ad" style={{ marginRight: 4 }} />
                  <Text style={styles.aromaText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>
              팔레트 <Text style={styles.subTitleText}>(Palate)</Text>
            </Text>
            <View style={styles.aromaContainer}>
              {palate.map((item, index) => (
                <View key={index} style={styles.aromaTag}>
                  <MaterialCommunityIcons name="water-outline" size={14} color="#8e44ad" style={{ marginRight: 4 }} />
                  <Text style={styles.aromaText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>
              피니시 <Text style={styles.subTitleText}>(Finish)</Text>
            </Text>
            <View style={styles.aromaContainer}>
              {finish.map((item, index) => (
                <View key={index} style={styles.aromaTag}>
                  <MaterialCommunityIcons name="timer-sand" size={14} color="#8e44ad" style={{ marginRight: 4 }} />
                  <Text style={styles.aromaText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>
        </>
      )}
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
  aromaContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  aromaTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2d2033',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#4a3b52',
  },
  aromaText: {
    color: '#d2b4de',
    fontSize: 14,
    fontWeight: '500',
  },
});

