import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

export interface FlavorProfile {
  acidity: number | null | undefined;
  sweetness: number | null | undefined;
  tannin: number | null | undefined;
  body: number | null | undefined;
  alcohol: number | null | undefined;
}

interface FlavorProfileStepProps {
  data: FlavorProfile;
  onChange: (key: keyof FlavorProfile, value: number | null) => void;
}

const FLAVOR_ITEMS: { key: keyof FlavorProfile; label: string; description: string }[] = [
  { key: 'acidity', label: '산도', description: '침이 고이는 신맛의 정도' },
  { key: 'sweetness', label: '당도', description: '달콤함의 정도' },
  { key: 'tannin', label: '타닌', description: '떫은 맛의 정도' },
  { key: 'body', label: '바디', description: '입안에서의 무게감' },
  { key: 'alcohol', label: '알코올', description: '알코올 도수감' },
];

const FlavorProfileStep = ({ data, onChange }: FlavorProfileStepProps) => {
  
  const renderItem = (item: typeof FLAVOR_ITEMS[0]) => {
    const currentValue = data[item.key];

    return (
      <View key={item.key} style={styles.itemContainer}>
        <View style={styles.itemHeader}>
          <Text style={styles.itemLabel}>{item.label}</Text>
          <Text style={styles.itemDesc}>{item.description}</Text>
        </View>
        
        <View style={styles.selectionRow}>
          {[1, 2, 3, 4, 5].map((score) => (
            <TouchableOpacity
              key={score}
              style={[
                styles.scoreButton,
                currentValue === score && styles.scoreButtonSelected
              ]}
              onPress={() => onChange(item.key, score)}
            >
              <Text style={[
                styles.scoreText,
                currentValue === score && styles.scoreTextSelected
              ]}>
                {score}
              </Text>
            </TouchableOpacity>
          ))}
          
          <TouchableOpacity
            style={[
              styles.unknownButton,
              currentValue === 2.5 && styles.unknownButtonSelected
            ]}
            onPress={() => onChange(item.key, 2.5)}
          >
            <Text style={[
              styles.unknownText,
              currentValue === 2.5 && styles.unknownTextSelected
            ]}>
              모르겠어요
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>내 입맛 분석</Text>
      <Text style={styles.subtitle}>선호하는 맛의 정도를 선택해주세요.</Text>
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {FLAVOR_ITEMS.map(renderItem)}
        {/* 하단 여백 확보 */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    marginBottom: 24,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  itemContainer: {
    marginBottom: 24,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  itemLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginRight: 8,
  },
  itemDesc: {
    fontSize: 13,
    color: '#aaa',
  },
  selectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  scoreButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1e1e1e',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  scoreButtonSelected: {
    backgroundColor: '#8e44ad',
    borderColor: '#8e44ad',
  },
  scoreText: {
    color: '#888',
    fontSize: 16,
    fontWeight: '600',
  },
  scoreTextSelected: {
    color: '#fff',
  },
  unknownButton: {
    paddingHorizontal: 12,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1e1e1e',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
    marginLeft: 4,
  },
  unknownButtonSelected: {
    backgroundColor: '#2a1a2a',
    borderColor: '#8e44ad',
  },
  unknownText: {
    color: '#888',
    fontSize: 13,
  },
  unknownTextSelected: {
    color: '#8e44ad',
    fontWeight: '600',
  },
});

export default FlavorProfileStep;

