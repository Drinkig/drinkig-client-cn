import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const { width } = Dimensions.get('window');
const BANNER_WIDTH = width - 40; // 좌우 마진 20씩 제외한 너비

// 배너 데이터 타입 정의
interface BannerData {
  id: number;
  tag: string;
  title: string;
  subtitle: string;
  backgroundColor: string;
  iconName: string;
}

// 배너 더미 데이터 (5개)
const BANNERS: BannerData[] = [
  {
    id: 1,
    tag: 'EVENT',
    title: '이달의 와인 구독\n첫 달 무료 체험',
    subtitle: '프리미엄 와인잔 증정 혜택을 놓치지 마세요!',
    backgroundColor: '#2c3e50',
    iconName: 'gift',
  },
  {
    id: 2,
    tag: 'TREND',
    title: '편의점 신상 와인\n솔직 리뷰 모음',
    subtitle: '가성비 최고, 실패 없는 선택!',
    backgroundColor: '#d35400',
    iconName: 'fire',
  },
  {
    id: 3,
    tag: 'NEW',
    title: '이번 주 입고된\n한정판 와인',
    subtitle: '소믈리에가 엄선한 희귀템',
    backgroundColor: '#27ae60',
    iconName: 'bottle-wine-outline',
  },
  {
    id: 4,
    tag: 'TIP',
    title: '와인 초보자를 위한\n테이스팅 가이드',
    subtitle: '색, 향, 맛을 제대로 즐기는 방법',
    backgroundColor: '#8e44ad',
    iconName: 'glass-wine',
  },
  {
    id: 5,
    tag: 'SALE',
    title: '마감 임박 특가\n최대 50% 할인',
    subtitle: '창고 대방출! 지금 바로 득템하세요',
    backgroundColor: '#c0392b',
    iconName: 'tag-multiple',
  },
];

export const BannerSection: React.FC = () => {
  // 배너 관련 상태 및 ref
  const [bannerIndex, setBannerIndex] = useState(0);
  const bannerScrollRef = useRef<ScrollView>(null);
  const autoScrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 배너 자동 스크롤 로직
  useEffect(() => {
    startAutoScroll();
    return () => stopAutoScroll();
  }, [bannerIndex]);

  const startAutoScroll = () => {
    stopAutoScroll();
    autoScrollTimerRef.current = setTimeout(() => {
      let nextIndex = bannerIndex + 1;
      if (nextIndex >= BANNERS.length) {
        nextIndex = 0;
      }
      
      bannerScrollRef.current?.scrollTo({
        x: nextIndex * (BANNER_WIDTH + 12), // 12는 gap margin
        animated: true,
      });
      setBannerIndex(nextIndex);
    }, 4000); // 4초마다 스크롤
  };

  const stopAutoScroll = () => {
    if (autoScrollTimerRef.current) {
      clearTimeout(autoScrollTimerRef.current);
      autoScrollTimerRef.current = null;
    }
  };

  // 사용자가 수동으로 스크롤할 때 처리
  const handleBannerScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    // 대략적인 인덱스 계산 (gap 포함)
    const index = Math.round(contentOffsetX / (BANNER_WIDTH + 12));
    
    if (index !== bannerIndex && index >= 0 && index < BANNERS.length) {
      setBannerIndex(index);
    }
  };

  const handleScrollBeginDrag = () => {
    stopAutoScroll();
  };

  const handleScrollEndDrag = () => {
    startAutoScroll();
  };

  return (
    <View style={styles.bannerSection}>
      <ScrollView 
        ref={bannerScrollRef}
        horizontal 
        pagingEnabled 
        showsHorizontalScrollIndicator={false}
        style={{ flex: 1 }}
        contentContainerStyle={styles.bannerScrollViewContent}
        onScroll={handleBannerScroll}
        onScrollBeginDrag={handleScrollBeginDrag}
        onScrollEndDrag={handleScrollEndDrag}
        scrollEventThrottle={16}
        snapToInterval={BANNER_WIDTH + 12} // gap 포함
        decelerationRate="fast"
      >
        {BANNERS.map((banner) => (
          <TouchableOpacity 
            key={banner.id} 
            style={[styles.bannerItem, { backgroundColor: banner.backgroundColor }]} 
            activeOpacity={0.9}
          >
            <View style={styles.bannerContent}>
              <View style={styles.bannerHeader}>
                <View style={styles.bannerTagContainer}>
                  <Text style={styles.bannerTag}>{banner.tag}</Text>
                </View>
              </View>
              <View style={{ marginBottom: 4 }}> 
                <Text style={styles.bannerTitle} numberOfLines={2}>{banner.title}</Text>
                <Text style={styles.bannerSubtitle} numberOfLines={1}>{banner.subtitle}</Text>
              </View>
            </View>
            <MaterialCommunityIcons 
              name={banner.iconName} 
              size={110} 
              color="rgba(255,255,255,0.08)" 
              style={styles.bannerIcon} 
            />
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      {/* 페이지네이션 (점) */}
      <View style={styles.paginationContainer}>
        {BANNERS.map((_, index) => (
          <View 
            key={index} 
            style={[
              styles.paginationDot,
              index === bannerIndex && styles.paginationDotActive
            ]} 
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // 광고 배너 스타일
  bannerSection: {
    height: 150, // 높이 축소 (180 -> 150)
    marginBottom: 16,
    position: 'relative', // 페이지네이션 위치 기준
  },
  bannerScrollViewContent: {
    paddingHorizontal: 20,
    gap: 12, // 아이템 사이 간격
  },
  bannerItem: {
    width: BANNER_WIDTH,
    borderRadius: 24,
    padding: 20, // 24 -> 20
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    overflow: 'hidden',
    height: '100%',
  },
  bannerContent: {
    zIndex: 2,
    flex: 1,
    height: '100%',
    justifyContent: 'space-between', // 상하 분산 배치
    paddingVertical: 4, // 내부 상하 여백
  },
  bannerHeader: {
    // marginBottom 제거 (space-between으로 간격 자동 확보)
    flexDirection: 'row',
    alignItems: 'center',
  },
  bannerTagContainer: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingVertical: 3, // 4 -> 3
    paddingHorizontal: 8, // 10 -> 8
    borderRadius: 10, // 12 -> 10
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    // marginRight 제거
  },
  bannerTag: {
    color: '#fff',
    fontSize: 9, // 10 -> 9
    fontWeight: '800',
    letterSpacing: 1,
  },
  bannerTitle: {
    color: '#fff',
    fontSize: 18, 
    fontWeight: 'bold',
    lineHeight: 24,
    marginBottom: 6, 
    marginTop: 2,
  },
  bannerSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    lineHeight: 16,
    maxWidth: '85%', 
  },
  bannerIcon: {
    position: 'absolute',
    right: -10,
    bottom: -20,
    transform: [{ rotate: '-10deg' }],
    opacity: 0.15,
  },
  paginationContainer: {
    position: 'absolute',
    bottom: 12, // 조금 더 아래로 (16 -> 12)
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  paginationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  paginationDotActive: {
    backgroundColor: '#fff',
    width: 18, // 활성화된 점 길게
  },
});

