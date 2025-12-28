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
  attribute?: keyof FlavorProfile;
}

const FLAVOR_ITEMS: { key: keyof FlavorProfile; label: string; description: string }[] = [
  { key: 'acidity', label: '산도', description: '침이 고이는 신맛의 정도' },
  { key: 'sweetness', label: '당도', description: '달콤함의 정도' },
  { key: 'tannin', label: '타닌', description: '떫은 맛의 정도' },
  { key: 'body', label: '바디', description: '입안에서의 무게감' },
  { key: 'alcohol', label: '알코올', description: '알코올 도수감' },
];

const FlavorProfileStep = ({ data, onChange, attribute }: FlavorProfileStepProps) => {

  const itemsToRender = attribute
    ? FLAVOR_ITEMS.filter(item => item.key === attribute)
    : FLAVOR_ITEMS;

  const renderItem = (item: typeof FLAVOR_ITEMS[0]) => {
    const currentValue = data[item.key];

    return (
      <View key={item.key} style={styles.itemContainer}>
        <View style={styles.itemHeader}>
          <View style={styles.itemTitleContainer}>
            <Text style={styles.itemLabel}>{item.label}</Text>
            <Text style={styles.itemDesc}>{item.description}</Text>
          </View>

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

        <View style={styles.sliderContainer}>

          <View style={styles.trackLine} />


          <View style={styles.dotsContainer}>
            {[1, 2, 3, 4, 5].map((score) => (
              <TouchableOpacity
                key={score}
                style={styles.dotTouchArea}
                onPress={() => onChange(item.key, score)}
                activeOpacity={0.8}
              >

                <View style={[
                  styles.dot,
                  currentValue === score && styles.selectedDot,
                ]} />


              </TouchableOpacity>
            ))}
          </View>


          <View style={styles.sliderLabels}>
            <View style={styles.labelWrapper}>
              <Text style={styles.sliderLabelText}>{item.key === 'alcohol' ? '낮음' : '약함'}</Text>
            </View>
            <View style={styles.labelWrapper}>
              <Text style={styles.sliderLabelText}>보통</Text>
            </View>
            <View style={styles.labelWrapper}>
              <Text style={styles.sliderLabelText}>{item.key === 'alcohol' ? '높음' : '강함'}</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>내 입맛 분석</Text>
      <Text style={styles.subtitle}>선호하는 맛의 정도를 선택해주세요.</Text>

      <View style={[styles.content, attribute && styles.centeredContent]}>
        {itemsToRender.map(renderItem)}
      </View>
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
    marginBottom: 20,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingBottom: 20,
  },
  centeredContent: {
    justifyContent: 'center',
    paddingBottom: 100,
  },
  itemContainer: {
    marginBottom: 0,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemTitleContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
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
  sliderContainer: {
    height: 40,
    justifyContent: 'center',
    position: 'relative',
    marginTop: 0,
  },
  trackLine: {
    position: 'absolute',
    left: 20,
    right: 20,
    height: 2,
    backgroundColor: '#333',
    top: 19,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    zIndex: 2,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    marginTop: -8,
  },
  labelWrapper: {
    width: 40,
    alignItems: 'center',
  },
  sliderLabelText: {
    color: '#666',
    fontSize: 10,
    textAlign: 'center',
  },
  dotTouchArea: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',

  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#444',
  },
  activeDot: {
    backgroundColor: '#8e44ad',
  },
  selectedDot: {
    width: 12,
    height: 12,
    borderRadius: 7,
    backgroundColor: '#8e44ad',
    shadowColor: "#8e44ad",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 6,
  },
  unknownButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#1e1e1e',
    borderWidth: 1,
    borderColor: '#333',
  },
  unknownButtonSelected: {
    backgroundColor: '#2a1a2a',
    borderColor: '#8e44ad',
  },
  unknownText: {
    color: '#888',
    fontSize: 12,
  },
  unknownTextSelected: {
    color: '#8e44ad',
    fontWeight: '600',
  },
});

export default FlavorProfileStep;

