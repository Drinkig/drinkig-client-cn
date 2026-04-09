import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { FlavorProfile } from './FlavorProfileStep';
import { colors } from '../../constants/colors';
import SelectableCard from '../common/SelectableCard';

interface NewbieFlavorProfileStepProps {
  attribute: keyof FlavorProfile;
  value: number | null | undefined;
  onChange: (value: number) => void;
}

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
        {data.options.map((option) => {
          const isSelected = value === option.score;
          return (
            <SelectableCard
              key={option.score}
              selected={isSelected}
              onPress={() => onChange(option.score)}
              style={styles.optionButton}
            >
              <Text style={styles.emoji}>{option.emoji}</Text>
              <View style={styles.textContainer}>
                <Text style={[
                  styles.optionLabel,
                  isSelected && styles.selectedOptionText,
                ]}>
                  {option.label}
                </Text>
                <Text style={styles.optionDesc}>
                  {option.description}
                </Text>
              </View>
            </SelectableCard>
          );
        })}
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
    color: colors.textPrimary,
    marginBottom: 30,
    lineHeight: 32,
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
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
    color: colors.textPrimary,
    marginBottom: 4,
  },
  selectedOptionText: {
    color: colors.primary,
  },
  optionDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
});

export default NewbieFlavorProfileStep;
