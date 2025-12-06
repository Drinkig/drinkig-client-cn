import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface NewbieCheckStepProps {
  isNewbie: boolean | null;
  onSelect: (isNewbie: boolean) => void;
  name: string;
}

const NewbieCheckStep = ({ isNewbie, onSelect, name }: NewbieCheckStepProps) => {
  return (
    <View style={styles.content}>
      <Text style={styles.stepTitle}>
        {name}님은{'\n'}와인에 대해 얼마나 알고 계신가요?
      </Text>
      
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
    marginBottom: 24, // 간격을 조금 넓힘 (서브타이틀 제거로 인한 여백 확보)
    lineHeight: 32, // 줄간격 추가
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
