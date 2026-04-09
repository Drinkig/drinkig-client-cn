import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors } from '../../constants/colors';
import GlassChip from '../common/GlassChip';

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
  return (
    <View style={styles.content}>
      <Text style={styles.stepTitle}>{title}</Text>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <View style={styles.grid}>
          {options.map((opt) => (
            <GlassChip
              key={opt}
              label={opt}
              selected={selected === opt}
              onPress={() => onSelect(opt)}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

export const MultiSelectionStep = ({ title, options, selected, onSelect, multi, allowCustomInput }: MultiSelectionStepProps) => {
  const { t } = useTranslation();
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
      <Text style={styles.stepDesc}>{t('onboarding.selection.multiDesc')}</Text>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <View style={styles.grid}>
          {options.map((opt) => {
            if (allowCustomInput && opt === '기타') {
              if (customValue) {
                return (
                  <GlassChip
                    key="custom-value"
                    label={customValue}
                    selected
                    onPress={() => onSelect(customValue)}
                  />
                );
              }

              if (isInputVisible) {
                return (
                  <View key="custom-input" style={styles.inputChip}>
                    <TextInput
                      style={styles.textInput}
                      value={inputText}
                      onChangeText={setInputText}
                      placeholder={t('onboarding.selection.customPlaceholder')}
                      placeholderTextColor={colors.textSecondary}
                      autoFocus
                      onSubmitEditing={handleCustomSubmit}
                      onBlur={handleCustomSubmit}
                      returnKeyType="done"
                    />
                  </View>
                );
              }


              return (
                <GlassChip
                  key={opt}
                  label={opt}
                  onPress={() => setIsInputVisible(true)}
                />
              );
            }


            return (
              <GlassChip
                key={opt}
                label={opt}
                selected={selected.includes(opt)}
                onPress={() => onSelect(opt)}
              />
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
    color: colors.textPrimary,
    marginBottom: 8,
  },
  stepDesc: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 24,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  inputChip: {
    backgroundColor: colors.surface1,
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: 12,
    minWidth: 80,
    justifyContent: 'center',
  },
  textInput: {
    color: colors.textPrimary,
    fontSize: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    minWidth: 60,
  },
});
