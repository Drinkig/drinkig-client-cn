import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors } from '../../constants/colors';

interface TransitionStepProps {
  isNewbie: boolean;
  name: string;
}

const TransitionStep = ({ isNewbie, name }: TransitionStepProps) => {
  const { t } = useTranslation();

  return (
    <View style={styles.centerContent}>
      <Image
        source={require('../../assets/onboarding/Drinky_onboarding_3.png')}
        style={styles.image}
        resizeMode="contain"
      />
      <Text style={styles.title}>
        {t('onboarding.transition.title', { name })}{'\n'}
        {isNewbie ? t('onboarding.transition.newbieMessage') : t('onboarding.transition.expertMessage')}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: 280,
    height: 280,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 32,
  },
});

export default TransitionStep;
