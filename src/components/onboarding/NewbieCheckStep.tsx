import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors } from '../../constants/colors';
import SelectableCard from '../common/SelectableCard';

interface NewbieCheckStepProps {
  isNewbie: boolean | null;
  onSelect: (isNewbie: boolean) => void;
  name: string;
}

const NewbieCheckStep = ({ isNewbie, onSelect, name }: NewbieCheckStepProps) => {
  const { t } = useTranslation();

  return (
    <View style={styles.content}>
      <Text style={styles.stepTitle}>
        {t('onboarding.newbieCheck.question', { name })}
      </Text>

      <SelectableCard
        selected={isNewbie === true}
        onPress={() => onSelect(true)}
        style={styles.card}
      >
        <View style={styles.cardTextContainer}>
          <Text style={styles.cardTitle}>{t('onboarding.newbieCheck.newbieTitle')}</Text>
          <Text style={styles.cardDesc}>{t('onboarding.newbieCheck.newbieDesc')}</Text>
        </View>
        <Image
          source={require('../../assets/onboarding/Drinky_onboarding_2.1.png')}
          style={styles.cardImage}
          resizeMode="contain"
        />
      </SelectableCard>

      <SelectableCard
        selected={isNewbie === false}
        onPress={() => onSelect(false)}
        style={styles.card}
      >
        <View style={styles.cardTextContainer}>
          <Text style={styles.cardTitle}>{t('onboarding.newbieCheck.expertTitle')}</Text>
          <Text style={styles.cardDesc}>{t('onboarding.newbieCheck.expertDesc')}</Text>
        </View>
        <Image
          source={require('../../assets/onboarding/Drinky_onboarding_2.png')}
          style={styles.cardImage}
          resizeMode="contain"
        />
      </SelectableCard>
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
    marginBottom: 24,
    lineHeight: 32,
  },
  card: {
    height: 110,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTextContainer: {
    flex: 1,
    marginRight: 80,
    zIndex: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  cardImage: {
    position: 'absolute',
    right: -10,
    bottom: -15,
    width: 100,
    height: 100,
    opacity: 0.9,
    zIndex: 1,
  },
});

export default NewbieCheckStep;
