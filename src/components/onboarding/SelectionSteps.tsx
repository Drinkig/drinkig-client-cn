import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native';

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
  allowCustomInput?: boolean;
}


export const SingleSelectionStep = ({ title, options, selected, onSelect }: SelectionStepProps) => {
  // ... (SingleSelectionStep 유지)
  return (
    <View style={styles.content}>
      <Text style={styles.stepTitle}>{title}</Text>
      <ScrollView style={{ flex: 1 }}>
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

export const MultiSelectionStep = ({ title, options, selected, onSelect, multi, allowCustomInput }: MultiSelectionStepProps) => {
  const [isInputVisible, setIsInputVisible] = useState(false);
  const [inputText, setInputText] = useState('');


  const customValue = selected.find(val => !options.includes(val) && val !== '기타');

  const handleCustomSubmit = () => {
    if (inputText.trim()) {
      onSelect(inputText.trim());
      setInputText('');
    }
    setIsInputVisible(false);
  };

  return (
    <View style={styles.content}>
      <Text style={styles.stepTitle}>{title}</Text>
      <Text style={styles.stepDesc}>여러 개 선택 가능해요.</Text>
      <ScrollView style={{ flex: 1 }}>
        <View style={styles.grid}>
          {options.map((opt) => {
            if (allowCustomInput && opt === '기타') {
              if (customValue) {
                return (
                  <TouchableOpacity
                    key="custom-value"
                    style={[styles.chip, styles.selectedChip]}
                    onPress={() => onSelect(customValue)}
                  >
                    <Text style={[styles.chipText, styles.selectedChipText]}>{customValue}</Text>
                  </TouchableOpacity>
                );
              }

              if (isInputVisible) {
                return (
                  <View key="custom-input" style={[styles.chip, styles.inputChip]}>
                    <TextInput
                      style={styles.textInput}
                      value={inputText}
                      onChangeText={setInputText}
                      placeholder="직접 입력"
                      placeholderTextColor="#888"
                      autoFocus
                      onSubmitEditing={handleCustomSubmit}
                      onBlur={handleCustomSubmit}
                      returnKeyType="done"
                    />
                  </View>
                );
              }


              return (
                <TouchableOpacity
                  key={opt}
                  style={styles.chip}
                  onPress={() => setIsInputVisible(true)}
                >
                  <Text style={styles.chipText}>{opt}</Text>
                </TouchableOpacity>
              );
            }


            return (
              <TouchableOpacity
                key={opt}
                style={[styles.chip, selected.includes(opt) && styles.selectedChip]}
                onPress={() => onSelect(opt)}
              >
                <Text style={[styles.chipText, selected.includes(opt) && styles.selectedChipText]}>{opt}</Text>
              </TouchableOpacity>
            );
          })}
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
    gap: 8,
  },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    marginBottom: 4,
    borderWidth: 1.5,
    borderColor: '#333',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedChip: {
    backgroundColor: '#3e204a',
    borderColor: '#8e44ad',
  },
  chipText: {
    color: '#bbb',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    includeFontPadding: false,
  },
  selectedChipText: {
    color: '#d4acfb',
    fontWeight: '700',
  },
  inputChip: {
    backgroundColor: '#1e1e1e',
    borderColor: '#8e44ad',
    paddingVertical: 0,
    paddingHorizontal: 0,
    minWidth: 80,
    borderRadius: 12,
  },
  textInput: {
    color: '#fff',
    fontSize: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    minWidth: 60,
  },
});

