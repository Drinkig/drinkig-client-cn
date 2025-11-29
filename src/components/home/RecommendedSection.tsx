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
import { WineDBItem } from '../../data/dummyWines';

interface RecommendedSectionProps {
  data: WineDBItem[];
  onPressMore?: () => void;
  onPressWine?: (wine: WineDBItem) => void;
}

export const RecommendedSection: React.FC<RecommendedSectionProps> = ({ 
  data, 
  onPressMore,
  onPressWine 
}) => {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>최근 마신 와인과 비슷한 스타일</Text>
        <TouchableOpacity onPress={onPressMore}>
          <Text style={styles.moreText}>더보기</Text>
        </TouchableOpacity>
      </View>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalList}
      >
        {data.map((wine) => (
          <TouchableOpacity 
            key={wine.id} 
            style={styles.wineCard}
            activeOpacity={0.8}
            onPress={() => onPressWine?.(wine)}
          >
            {wine.imageUri ? (
              <Image source={{ uri: wine.imageUri }} style={styles.wineImage} resizeMode="cover" />
            ) : (
              <View style={styles.wineImagePlaceholder}>
                <MaterialCommunityIcons name="bottle-wine" size={40} color="#ccc" />
              </View>
            )}
            <View style={styles.wineInfo}>
              <Text style={styles.wineName} numberOfLines={1}>{wine.nameKor}</Text>
              <Text style={styles.wineType}>
                {wine.type}{wine.country ? ` · ${wine.country}` : ''}
              </Text>
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
  wineImagePlaceholder: {
    height: 140,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  wineImage: {
    width: '100%',
    height: 140,
    backgroundColor: '#333',
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
  wineType: {
    fontSize: 12,
    color: '#888',
  },
});
