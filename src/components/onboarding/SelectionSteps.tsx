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
  allowCustomInput?: boolean; // [NEW] 직접 입력 허용 여부
}

// 통합 컴포넌트로 사용하거나 분리해도 됨. 여기선 일단 분리해서 export
export const SingleSelectionStep = ({ title, options, selected, onSelect }: SelectionStepProps) => {
// ... (SingleSelectionStep 유지)
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

export const MultiSelectionStep = ({ title, options, selected, onSelect, multi, allowCustomInput }: MultiSelectionStepProps) => {
  const [isInputVisible, setIsInputVisible] = useState(false);
  const [inputText, setInputText] = useState('');

  // options에 없는 선택된 값 찾기 (커스텀 입력값)
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
      <ScrollView style={{flex:1}}>
        <View style={styles.grid}>
            {options.map((opt) => {
                // '기타' 옵션 처리
                if (allowCustomInput && opt === '기타') {
                    if (customValue) {
                        // 이미 커스텀 값이 입력된 경우 -> 그 값을 칩으로 보여줌 (선택 상태)
                        return (
                            <TouchableOpacity 
                                key="custom-value" 
                                style={[styles.chip, styles.selectedChip]}
                                onPress={() => onSelect(customValue)} // 누르면 삭제됨
                            >
                                <Text style={[styles.chipText, styles.selectedChipText]}>{customValue}</Text>
                            </TouchableOpacity>
                        );
                    }
                    
                    if (isInputVisible) {
                        // 입력 모드
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

                    // 기본 '기타' 버튼 (선택 안 된 상태)
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

                // 일반 옵션
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
  inputChip: {
    backgroundColor: '#1e1e1e',
    borderColor: '#8e44ad',
    paddingVertical: 0, // TextInput 내부 패딩 고려
    paddingHorizontal: 0,
    minWidth: 100,
  },
  textInput: {
    color: '#fff',
    fontSize: 14,
    paddingVertical: 12,
    paddingHorizontal: 20,
    minWidth: 80,
  },
});

