import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

interface HeroSectionProps {
  onPress: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onPress }) => {
  return (
    <View style={styles.heroSection}>
      <View style={styles.heroTextContainer}>
        <Text style={styles.heroTitle} numberOfLines={1} adjustsFontSizeToFit>
          지금 와인 고르는 중인가요?
        </Text>
        <Text style={styles.heroSubtitle}>취향에 딱 맞는 와인을 추천해드려요</Text>
      </View>

      <TouchableOpacity
        style={styles.recommendButton}
        onPress={onPress}
        activeOpacity={0.9}
      >
        <Text style={styles.recommendButtonText}>추천받기</Text>
        <Icon name="arrow-forward" size={14} color="#8e44ad" />
      </TouchableOpacity>

      <Image
        source={require('../../assets/onboarding/Drinky_onboarding_2.1.png')}
        style={styles.heroImage}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  heroSection: {
    marginHorizontal: 20,
    marginBottom: 16,
    marginTop: 8,
    backgroundColor: '#8e44ad',
    borderRadius: 20,
    padding: 24,
    position: 'relative',
    overflow: 'hidden',
    height: 210,
    flexShrink: 0,
    shadowColor: "#8e44ad",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
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
    color: '#fff',
    marginBottom: 8,
    lineHeight: 32,
    flexShrink: 1,
  },
  heroSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 16,
  },
  recommendButton: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 24,
    zIndex: 2,
    gap: 4,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  recommendButtonText: {
    color: '#8e44ad',
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

