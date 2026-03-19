import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors } from '../../constants/colors';

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
        <TouchableOpacity
          key={opt.value}
          style={[styles.selectionCard, selectedPrice === opt.value && styles.selectedCard]}
          onPress={() => onSelect(opt.value)}
        >
          <Text style={[styles.cardTitle, { fontSize: 16 }]}>{opt.label}</Text>
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
    color: colors.white,
    marginBottom: 8,
  },
  stepDesc: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 24,
  },
  selectionCard: {
    width: '100%',
    padding: 20,
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectedCard: {
    borderColor: colors.primary,
    backgroundColor: '#2a1a2a',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 4,
  },
});

export default BudgetStep;
