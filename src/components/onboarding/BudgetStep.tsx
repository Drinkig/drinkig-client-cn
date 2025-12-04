import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface BudgetOption {
  label: string;
  value: number;
}

interface BudgetStepProps {
  selectedPrice: number;
  onSelect: (price: number) => void;
  options: BudgetOption[];
}

const BudgetStep = ({ selectedPrice, onSelect, options }: BudgetStepProps) => {
  return (
    <View style={styles.content}>
      <Text style={styles.stepTitle}>월 평균 와인 구매 비용</Text>
      <Text style={styles.stepDesc}>어느 정도의 가격대를 선호하시나요?</Text>
      
      {options.map((opt) => (
        <TouchableOpacity 
          key={opt.value}
          style={[styles.selectionCard, selectedPrice === opt.value && styles.selectedCard]}
          onPress={() => onSelect(opt.value)}
        >
            <Text style={[styles.cardTitle, {fontSize: 16}]}>{opt.label}</Text>
        </TouchableOpacity>
      ))}
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
});

export default BudgetStep;

