import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors } from '../../constants/colors';

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

      <TouchableOpacity
        style={[styles.selectionCard, isNewbie === true && styles.selectedCard]}
        onPress={() => onSelect(true)}
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
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.selectionCard, isNewbie === false && styles.selectedCard]}
        onPress={() => onSelect(false)}
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
      </TouchableOpacity>
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
    marginBottom: 24,
    lineHeight: 32,
  },
  selectionCard: {
    width: '100%',
    height: 110,
    padding: 20,
    backgroundColor: '#1e1e1e',
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  selectedCard: {
    borderColor: colors.primary,
    backgroundColor: '#2a1a2a',
  },
  cardTextContainer: {
    flex: 1,
    marginRight: 80,
    zIndex: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 13,
    color: '#aaa',
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
