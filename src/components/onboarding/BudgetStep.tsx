import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors } from '../../constants/colors';
import SelectableCard from '../common/SelectableCard';

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
  const { t } = useTranslation();

  return (
    <View style={styles.content}>
      <Text style={styles.stepTitle}>{t('onboarding.budget.title')}</Text>
      <Text style={styles.stepDesc}>{t('onboarding.budget.subtitle')}</Text>

      {options.map((opt) => (
        <SelectableCard
          key={opt.value}
          selected={selectedPrice === opt.value}
          onPress={() => onSelect(opt.value)}
          style={styles.card}
        >
          <Text style={styles.cardTitle}>{opt.label}</Text>
        </SelectableCard>
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
    color: colors.textPrimary,
    marginBottom: 8,
  },
  stepDesc: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 24,
  },
  card: {
    padding: 20,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
});

export default BudgetStep;
