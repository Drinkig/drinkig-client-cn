import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors } from '../../constants/colors';

export interface FlavorProfile {
  acidity: number | null | undefined;
  sweetness: number | null | undefined;
  tannin: number | null | undefined;
  body: number | null | undefined;
  alcohol: number | null | undefined;
}

interface FlavorProfileStepProps {
  data: FlavorProfile;
  onChange: (key: keyof FlavorProfile, value: number | null) => void;
  attribute?: keyof FlavorProfile;
}

type FlavorKey = keyof FlavorProfile;

const FlavorProfileStep = ({ data, onChange, attribute }: FlavorProfileStepProps) => {
  const { t } = useTranslation();

  const FLAVOR_ITEMS: { key: FlavorKey; label: string; description: string }[] = [
    { key: 'acidity', label: t('onboarding.flavorProfile.acidity.label'), description: t('onboarding.flavorProfile.acidity.desc') },
    { key: 'sweetness', label: t('onboarding.flavorProfile.sweetness.label'), description: t('onboarding.flavorProfile.sweetness.desc') },
    { key: 'tannin', label: t('onboarding.flavorProfile.tannin.label'), description: t('onboarding.flavorProfile.tannin.desc') },
    { key: 'body', label: t('onboarding.flavorProfile.body.label'), description: t('onboarding.flavorProfile.body.desc') },
    { key: 'alcohol', label: t('onboarding.flavorProfile.alcohol.label'), description: t('onboarding.flavorProfile.alcohol.desc') },
  ];

  const itemsToRender = attribute
    ? FLAVOR_ITEMS.filter(item => item.key === attribute)
    : FLAVOR_ITEMS;

  const renderItem = (item: typeof FLAVOR_ITEMS[0]) => {
    const currentValue = data[item.key];

    return (
      <View key={item.key} style={styles.itemContainer}>
        <View style={styles.itemHeader}>
          <View style={styles.itemTitleContainer}>
            <Text style={styles.itemLabel}>{item.label}</Text>
            <Text style={styles.itemDesc}>{item.description}</Text>
          </View>

          <TouchableOpacity
            style={[
              styles.unknownButton,
              currentValue === 2.5 && styles.unknownButtonSelected
            ]}
            onPress={() => onChange(item.key, 2.5)}
          >
            <Text style={[
              styles.unknownText,
              currentValue === 2.5 && styles.unknownTextSelected
            ]}>
              {t('onboarding.flavorProfile.unknownBtn')}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sliderContainer}>
          <View style={styles.trackLine} />

          <View style={styles.dotsContainer}>
            {[1, 2, 3, 4, 5].map((score) => (
              <TouchableOpacity
                key={score}
                style={styles.dotTouchArea}
                onPress={() => onChange(item.key, score)}
                activeOpacity={0.8}
              >
                <View style={[
                  styles.dot,
                  currentValue === score && styles.selectedDot,
                ]} />
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.sliderLabels}>
            <View style={styles.labelWrapper}>
              <Text style={styles.sliderLabelText}>
                {item.key === 'alcohol' ? t('onboarding.flavorProfile.low') : t('onboarding.flavorProfile.weak')}
              </Text>
            </View>
            <View style={styles.labelWrapper}>
              <Text style={styles.sliderLabelText}>{t('onboarding.flavorProfile.medium')}</Text>
            </View>
            <View style={styles.labelWrapper}>
              <Text style={styles.sliderLabelText}>
                {item.key === 'alcohol' ? t('onboarding.flavorProfile.high') : t('onboarding.flavorProfile.strong')}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('onboarding.flavorProfile.title')}</Text>
      <Text style={styles.subtitle}>{t('onboarding.flavorProfile.subtitle')}</Text>

      <View style={[styles.content, attribute && styles.centeredContent]}>
        {itemsToRender.map(renderItem)}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 20,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingBottom: 20,
  },
  centeredContent: {
    justifyContent: 'center',
    paddingBottom: 100,
  },
  itemContainer: {
    marginBottom: 0,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemTitleContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  itemLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.white,
    marginRight: 8,
  },
  itemDesc: {
    fontSize: 13,
    color: '#aaa',
  },
  sliderContainer: {
    height: 40,
    justifyContent: 'center',
    position: 'relative',
    marginTop: 0,
  },
  trackLine: {
    position: 'absolute',
    left: 20,
    right: 20,
    height: 2,
    backgroundColor: colors.border,
    top: 19,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    zIndex: 2,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    marginTop: -8,
  },
  labelWrapper: {
    width: 40,
    alignItems: 'center',
  },
  sliderLabelText: {
    color: '#666',
    fontSize: 10,
    textAlign: 'center',
  },
  dotTouchArea: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#444',
  },
  activeDot: {
    backgroundColor: colors.primary,
  },
  selectedDot: {
    width: 12,
    height: 12,
    borderRadius: 7,
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 6,
  },
  unknownButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#1e1e1e',
    borderWidth: 1,
    borderColor: colors.border,
  },
  unknownButtonSelected: {
    backgroundColor: '#2a1a2a',
    borderColor: colors.primary,
  },
  unknownText: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  unknownTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
});

export default FlavorProfileStep;
