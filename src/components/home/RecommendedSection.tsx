import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Icon from 'react-native-vector-icons/Ionicons';
import { WineDBItem } from '../../data/dummyWines';

interface RecommendedSectionProps {
  data: WineDBItem[];
  title?: string;
  onPressMore?: () => void;
  onPressWine?: (wine: WineDBItem) => void;
}

export const RecommendedSection: React.FC<RecommendedSectionProps> = ({ 
  data, 
  title,
  onPressMore,
  onPressWine 
}) => {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title || '최근 마신 와인과 비슷한 스타일'}</Text>
        <TouchableOpacity onPress={onPressMore}>
          <Text style={styles.moreText}>더보기</Text>
        </TouchableOpacity>
      </View>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalList}
      >
        {data.map((wine, index) => (
          <TouchableOpacity 
            key={`${wine.id}-${index}`} 
            style={styles.wineCard}
            activeOpacity={0.8}
            onPress={() => onPressWine?.(wine)}
          >
            <View style={styles.wineImageContainer}>
              {wine.imageUri ? (
                <Image source={{ uri: wine.imageUri }} style={styles.wineImage} resizeMode="contain" />
              ) : (
                <MaterialCommunityIcons name="bottle-wine" size={40} color="#ccc" />
              )}
            </View>
            <View style={styles.wineInfo}>
              <Text style={styles.wineName} numberOfLines={1}>{wine.nameKor}</Text>
              <View style={styles.wineDetailsRow}>
                <Text style={styles.wineType}>
                  {wine.type}{wine.country ? ` · ${wine.country}` : ''}
                </Text>
                {wine.vivinoRating && (
                  <View style={styles.ratingContainer}>
                    <Icon name="star" size={10} color="#e74c3c" />
                    <Text style={styles.ratingText}>{wine.vivinoRating.toFixed(1)}</Text>
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    flexShrink: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  moreText: {
    fontSize: 14,
    color: '#888',
  },
  horizontalList: {
    paddingHorizontal: 20,
    gap: 12,
  },
  wineCard: {
    width: 140,
    backgroundColor: '#2a2a2a',
    borderRadius: 16,
    overflow: 'hidden',
  },
  wineImageContainer: {
    height: 140,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  wineImage: {
    width: '65%',
    height: '85%',
  },
  wineInfo: {
    padding: 12,
  },
  wineName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  wineDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  wineType: {
    fontSize: 12,
    color: '#888',
    flex: 1, // 텍스트가 길어지면 줄어들게 하고 평점 공간 확보
    marginRight: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    // backgroundColor: 'rgba(255, 255, 255, 0.1)', // 배경 제거하거나 더 은은하게
    // paddingHorizontal: 6,
    // paddingVertical: 2,
    // borderRadius: 8,
  },
  ratingText: {
    fontSize: 11, // 12 -> 11
    color: '#e74c3c', // 텍스트 색상도 붉은 계열로 통일
    fontWeight: 'bold',
  },
});
