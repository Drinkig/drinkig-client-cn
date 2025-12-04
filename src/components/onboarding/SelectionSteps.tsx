import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

interface SelectionStepProps {
  title: string;
  options: string[];
  selected: string | undefined;
  onSelect: (value: string) => void;
  multi?: false;
}

interface MultiSelectionStepProps {
  title: string;
  options: string[];
  selected: string[];
  onSelect: (value: string) => void;
  multi: true;
}

// 통합 컴포넌트로 사용하거나 분리해도 됨. 여기선 일단 분리해서 export
export const SingleSelectionStep = ({ title, options, selected, onSelect }: SelectionStepProps) => {
  return (
    <View style={styles.content}>
      <Text style={styles.stepTitle}>{title}</Text>
      <ScrollView style={{flex:1}}>
        <View style={styles.grid}>
            {options.map((opt) => (
                <TouchableOpacity 
                    key={opt} 
                    style={[styles.chip, selected === opt && styles.selectedChip]}
                    onPress={() => onSelect(opt)}
                >
                    <Text style={[styles.chipText, selected === opt && styles.selectedChipText]}>{opt}</Text>
                </TouchableOpacity>
            ))}
        </View>
      </ScrollView>
    </View>
  );
};

export const MultiSelectionStep = ({ title, options, selected, onSelect }: MultiSelectionStepProps) => {
  return (
    <View style={styles.content}>
      <Text style={styles.stepTitle}>{title}</Text>
      <Text style={styles.stepDesc}>여러 개 선택 가능해요.</Text>
      <ScrollView style={{flex:1}}>
        <View style={styles.grid}>
            {options.map((opt) => (
                <TouchableOpacity 
                    key={opt} 
                    style={[styles.chip, selected.includes(opt) && styles.selectedChip]}
                    onPress={() => onSelect(opt)}
                >
                    <Text style={[styles.chipText, selected.includes(opt) && styles.selectedChipText]}>{opt}</Text>
                </TouchableOpacity>
            ))}
        </View>
      </ScrollView>
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#1e1e1e',
    borderRadius: 24,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#333',
  },
  selectedChip: {
    backgroundColor: '#8e44ad',
    borderColor: '#8e44ad',
  },
  chipText: {
    color: '#ccc',
    fontSize: 14,
  },
  selectedChipText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

