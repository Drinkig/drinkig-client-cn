import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
  Easing,
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

  // Slow, subtle sheen sweeping diagonally across the card
  const sheenAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(sheenAnim, {
          toValue: 1,
          duration: 3800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.delay(2600),
      ]),
    ).start();
  }, [sheenAnim]);

  const sheenTranslate = sheenAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-220, 420],
  });
  const sheenOpacity = sheenAnim.interpolate({
    inputRange: [0, 0.15, 0.5, 0.85, 1],
    outputRange: [0, 0.35, 0.5, 0.35, 0],
  });

  return (
    <View style={styles.heroSectionShadow}>
      <View style={styles.heroSection}>
        <LinearGradient
          colors={[colors.primaryDark, '#4A086B']} // Deep signature purple gradient
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />

        {/* Subtle sheen sweeping diagonally across the card */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.sheen,
            {
              opacity: sheenOpacity,
              transform: [{ translateX: sheenTranslate }, { rotate: '18deg' }],
            },
          ]}
        >
          <LinearGradient
            colors={[
              'rgba(255,255,255,0)',
              'rgba(255,255,255,0.18)',
              'rgba(255,255,255,0)',
            ]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFillObject}
          />
        </Animated.View>

        <View style={styles.heroTextContainer}>
          <Text
            style={styles.heroTitle}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.75}
          >
            {t('home.hero.title')}
          </Text>
          <Text style={styles.heroSubtitle} numberOfLines={2}>
            {t('home.hero.subtitle')}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.recommendButton}
          onPress={onPress}
          activeOpacity={0.85}
        >
          <Icon
            name="chatbubble-ellipses"
            size={16}
            color={colors.primaryDark}
          />
          <Text style={styles.recommendButtonText}>{t('home.hero.button')}</Text>
        </TouchableOpacity>

        <Image
          source={require('../../assets/onboarding/Drinky_onboarding_3.png')}
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
    height: 188,
    flexShrink: 0,
    backgroundColor: colors.surface1, // Fallback
  },
  heroTextContainer: {
    zIndex: 2,
    paddingRight: 110,
    marginTop: 4,
    width: '100%',
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 8,
    lineHeight: 28,
    flexShrink: 1,
  },
  heroSubtitle: {
    fontSize: 13,
    color: 'rgba(244, 239, 249, 0.9)',
    lineHeight: 19,
    fontWeight: '500',
  },
  sheen: {
    position: 'absolute',
    top: -40,
    bottom: -40,
    width: 90,
    zIndex: 1,
  },
  recommendButton: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 26,
    zIndex: 2,
    gap: 7,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  recommendButtonText: {
    color: colors.primaryDark,
    fontWeight: 'bold',
    fontSize: 15,
    letterSpacing: 0.2,
  },
  heroImage: {
    position: 'absolute',
    right: -18,
    bottom: -20,
    width: 200,
    height: 200,
    opacity: 0.95,
    zIndex: 1,
  },
});

