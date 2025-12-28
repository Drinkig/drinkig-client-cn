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
  Image,
  Linking,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const { width } = Dimensions.get('window');
const BANNER_WIDTH = width - 40; // 좌우 마진 20씩 제외한 너비

// 배너 데이터 타입 정의
interface BannerData {
  id: number;
  imageUrl?: any; // require() 또는 { uri }
  title: string;
  subtitle: string;
  backgroundColor: string;
  linkUrl: string;
  tag?: string;
  iconName?: string;
  iconImage?: any;
}

// [수동 관리] 배너 리스트 (2개)
const BANNERS: BannerData[] = [
  {
    id: 1,
    tag: 'NOTICE',
    title: '새롭게 단장한 드링키지\n사용법 정리',
    subtitle: '확 바뀐 기능들을 확인해보세요',
    backgroundColor: '#252525', // 통일된 다크 그레이
    linkUrl: 'https://web.drinkig.com/notices/2',
    iconName: 'file-document-edit-outline',
  },
  {
    id: 2,
    tag: 'EVENT',
    title: '드링키지 런칭 기념\n광고주 무료 모집',
    subtitle: '1개월 무료로 광고해드려요!',
    backgroundColor: '#3a1a1a', // 프리미엄 다크 버건디
    linkUrl: 'https://web.drinkig.com/notices/3', // 가상의 링크 (사용자가 추후 수정 가능)
    iconImage: require('../../assets/wish_list.png'),
  },
];

export const BannerSection: React.FC = () => {
  const [bannerIndex, setBannerIndex] = useState(0);
  const bannerScrollRef = useRef<ScrollView>(null);
  const autoScrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 배너 자동 스크롤 로직
  useEffect(() => {
    startAutoScroll();
    return () => stopAutoScroll();
  }, [bannerIndex]);

  const startAutoScroll = () => {
    if (BANNERS.length <= 1) return; // 배너가 1개 이하면 자동 스크롤 안 함

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

  const handleBannerPress = async (url: string) => {
    if (!url) return;
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      }
    } catch (err) {
      console.error('Failed to open banner URL:', err);
    }
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
            onPress={() => handleBannerPress(banner.linkUrl)}
          >
            {/* 이미지가 있으면 이미지 표시, 없으면 텍스트 표시 */}
            {banner.imageUrl ? (
              <Image
                source={banner.imageUrl}
                style={styles.bannerImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.bannerContent}>
                <View style={{ flex: 1 }}>
                  {banner.tag && (
                    <View style={styles.bannerTagContainer}>
                      <Text style={styles.bannerTag}>{banner.tag}</Text>
                    </View>
                  )}
                  <View style={{ marginTop: banner.tag ? 0 : 12 }}>
                    <Text style={styles.bannerTitle} numberOfLines={2}>{banner.title}</Text>
                    <Text style={styles.bannerSubtitle} numberOfLines={1}>{banner.subtitle}</Text>
                  </View>
                </View>
                {banner.iconImage ? (
                  <Image
                    source={banner.iconImage}
                    style={{
                      position: 'absolute',
                      right: -35,
                      bottom: -35,
                      width: 170,
                      height: 170,
                    }}
                    resizeMode="contain"
                  />
                ) : (
                  banner.iconName && (
                    <MaterialCommunityIcons
                      name={banner.iconName}
                      size={90}
                      color="rgba(255,255,255,0.05)"
                      style={{
                        position: 'absolute',
                        right: -10,
                        bottom: -15,
                        transform: [{ rotate: '-15deg' }]
                      }}
                    />
                  )
                )}
              </View>
            )}
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
    </View >
  );
};

const styles = StyleSheet.create({
  // 광고 배너 스타일
  bannerSection: {
    height: 150,
    marginBottom: 16,
    position: 'relative',
  },
  bannerScrollViewContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  bannerItem: {
    width: BANNER_WIDTH,
    borderRadius: 24,
    padding: 20,
    height: '100%',
    overflow: 'hidden',
    backgroundColor: '#333',
  },
  bannerContent: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 4,
  },
  bannerTagContainer: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    marginBottom: 4,
  },
  bannerTag: {
    color: '#fff',
    fontSize: 8,
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
  bannerImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
  },
  paginationContainer: {
    position: 'absolute',
    bottom: 12,
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
    width: 18,
  },
});
