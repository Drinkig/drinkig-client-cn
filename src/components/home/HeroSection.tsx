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
        source={require('../../assets/Drinky_5.png')} 
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
    backgroundColor: '#8e44ad', // 브랜드 컬러로 변경
    borderRadius: 20,
    padding: 24,
    position: 'relative',
    overflow: 'hidden',
    height: 210, // 120 -> 210 (약 1.7배 확대)
    flexShrink: 0,
    // 그림자 추가
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
    marginTop: 10, // 상단 여백으로 위치 조정
    width: '100%', // 텍스트 컨테이너 너비 확보
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    lineHeight: 32,
    flexShrink: 1, // 텍스트가 너무 길어지면 줄어들게
  },
  heroSubtitle: {
    fontSize: 14, // 12 -> 14
    color: 'rgba(255, 255, 255, 0.9)', // 가독성을 위해 불투명도 조정
    marginBottom: 16,
  },
  recommendButton: {
    position: 'absolute', // 절대 위치로 변경
    bottom: 24, // 하단 고정
    left: 24,   // 좌측 고정
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff', // 흰색 배경으로 변경
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 24,
    zIndex: 2,
    gap: 4,
    // 그림자 살짝 추가해서 버튼 강조
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
    color: '#8e44ad', // 텍스트 색상 변경
    fontWeight: 'bold',
    fontSize: 14,
  },
  heroImage: {
    position: 'absolute',
    right: -20,
    bottom: -20,
    width: 170, // 130 -> 170
    height: 170,
    opacity: 0.9,
    zIndex: 1,
  },
});

