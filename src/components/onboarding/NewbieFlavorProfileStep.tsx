import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { FlavorProfile } from './FlavorProfileStep';
import { colors } from '../../constants/colors';

interface NewbieFlavorProfileStepProps {
  attribute: keyof FlavorProfile;
  value: number | null | undefined;
  onChange: (value: number) => void;
}

type FlavorOption = {
  score: number;
  emoji: string;
  label: string;
  description: string;
};

const NEWBIE_FLAVOR_EMOJIS: Record<keyof FlavorProfile, string[]> = {
  alcohol: ['🍺', '🍹', '🍶', '🥣', '🥃'],
  body: ['💧', '🍵', '🍊', '🥛', '☕'],
  sweetness: ['☕', '🥛', '🍊', '🥤', '🍰'],
  acidity: ['🍈', '🍑', '🍓', '🍍', '🍋'],
  tannin: ['🧃', '🧋', '🍵', '🍫', '☕'],
};

const NewbieFlavorProfileStep = ({ attribute, value, onChange }: NewbieFlavorProfileStepProps) => {
  const { t } = useTranslation();
  const emojis = NEWBIE_FLAVOR_EMOJIS[attribute];
  const data = {
    question: t(`onboarding.newbieFlavorProfile.${attribute}.question`),
    options: [1, 2, 3, 4, 5].map((score) => ({
      score,
      emoji: emojis[score - 1],
      label: t(`onboarding.newbieFlavorProfile.${attribute}.opt${score}Label`),
      description: t(`onboarding.newbieFlavorProfile.${attribute}.opt${score}Desc`),
    })),
  };

  if (!data) return null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>{data.question}</Text>

      <View style={styles.optionsContainer}>
        {data.options.map((option) => (
          <TouchableOpacity
            key={option.score}
            style={[
              styles.optionButton,
              value === option.score && styles.selectedOptionButton
            ]}
            onPress={() => onChange(option.score)}
            activeOpacity={0.8}
          >
            <Text style={styles.emoji}>{option.emoji}</Text>
            <View style={styles.textContainer}>
              <Text style={[
                styles.optionLabel,
                value === option.score && styles.selectedOptionText
              ]}>
                {option.label}
              </Text>
              <Text style={styles.optionDesc}>
                {option.description}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 30,
    lineHeight: 32,
  },
  question: {
    fontSize: 16,
    color: '#aaa',
    marginBottom: 30,
    lineHeight: 24,
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e1e1e',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectedOptionButton: {
    borderColor: colors.primary,
    backgroundColor: '#2a1a2a',
  },
  emoji: {
    fontSize: 24,
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
    marginBottom: 4,
  },
  selectedOptionText: {
    color: colors.primary,
  },
  optionDesc: {
    fontSize: 13,
    color: '#ccc',
    marginTop: 2,
  },
});

export default NewbieFlavorProfileStep;

