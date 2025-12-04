import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface NewbieCheckStepProps {
  isNewbie: boolean;
  onSelect: (isNewbie: boolean) => void;
}

const NewbieCheckStep = ({ isNewbie, onSelect }: NewbieCheckStepProps) => {
  return (
    <View style={styles.content}>
      <Text style={styles.stepTitle}>와인 경험을 알려주세요</Text>
      <Text style={styles.stepDesc}>와인에 대해 얼마나 알고 계신가요?</Text>

      <TouchableOpacity 
        style={[styles.selectionCard, isNewbie === true && styles.selectedCard]}
        onPress={() => onSelect(true)}
      >
        <Text style={styles.cardTitle}>🌱 와인 초보에요</Text>
        <Text style={styles.cardDesc}>아직 잘 모르지만 배우고 싶어요.</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.selectionCard, isNewbie === false && styles.selectedCard]}
        onPress={() => onSelect(false)}
      >
        <Text style={styles.cardTitle}>🍷 즐겨 마시는 편이에요</Text>
        <Text style={styles.cardDesc}>선호하는 스타일이 확고해요.</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingTop: 20,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  stepDesc: {
    fontSize: 14,
    color: '#888',
    marginBottom: 24,
  },
  selectionCard: {
    width: '100%',
    padding: 20,
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  selectedCard: {
    borderColor: '#8e44ad',
    backgroundColor: '#2a1a2a',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 14,
    color: '#aaa',
  },
});

export default NewbieCheckStep;

