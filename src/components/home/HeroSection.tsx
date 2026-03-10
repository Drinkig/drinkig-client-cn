import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { colors } from '../../constants/colors';

import { useTranslation } from 'react-i18next';

interface HeroSectionProps {
  onPress: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onPress }) => {
  const { t } = useTranslation();

  return (
    <View style={styles.heroSectionShadow}>
      <View style={styles.heroSection}>
        <LinearGradient
          colors={[colors.primaryDark, '#4A086B']} // Deep signature purple gradient
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />

        <View style={styles.heroTextContainer}>
          <Text style={styles.heroTitle} numberOfLines={1} adjustsFontSizeToFit>
            {t('home.hero.title')}
          </Text>
          <Text style={styles.heroSubtitle}>{t('home.hero.subtitle')}</Text>
        </View>

        <TouchableOpacity
          style={styles.recommendButton}
          onPress={onPress}
          activeOpacity={0.9}
        >
          <Text style={styles.recommendButtonText}>{t('home.hero.button')}</Text>
          <Icon name="arrow-forward" size={14} color={colors.primaryDark} />
        </TouchableOpacity>

        <Image
          source={require('../../assets/onboarding/Drinky_onboarding_2.1.png')}
          style={styles.heroImage}
          resizeMode="contain"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  heroSectionShadow: {
    marginHorizontal: 20,
    marginBottom: 16,
    marginTop: 8,
    borderRadius: 20,
    // Premium matte shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  heroSection: {
    borderRadius: 20,
    padding: 24,
    position: 'relative',
    overflow: 'hidden', // Contain gradient and image bounds
    height: 210,
    flexShrink: 0,
    backgroundColor: colors.surface1, // Fallback
  },
  heroTextContainer: {
    zIndex: 2,
    paddingRight: 100,
    marginTop: 10,
    width: '100%',
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 8,
    lineHeight: 32,
    flexShrink: 1,
  },
  heroSubtitle: {
    fontSize: 14,
    color: 'rgba(244, 239, 249, 0.9)',
    marginBottom: 16,
  },
  recommendButton: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 24,
    zIndex: 2,
    gap: 4,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  recommendButtonText: {
    color: colors.primaryDark,
    fontWeight: 'bold',
    fontSize: 14,
  },
  heroImage: {
    position: 'absolute',
    right: -20,
    bottom: -20,

    width: 170,
    height: 170,
    opacity: 0.9,
    zIndex: 1,
  },
});

