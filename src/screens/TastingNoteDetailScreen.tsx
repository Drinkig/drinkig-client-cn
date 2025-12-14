import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types';
import { getTastingNoteDetail, TastingNoteDTO } from '../api/wine';
import FeatureGauge from '../components/wine_detail/FeatureGauge';

type TastingNoteDetailRouteProp = RouteProp<RootStackParamList, 'TastingNoteDetail'>;

export default function TastingNoteDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute<TastingNoteDetailRouteProp>();
  const { tastingNoteId } = route.params;

  const [note, setNote] = useState<TastingNoteDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchNoteDetail();
  }, [tastingNoteId]);

  const fetchNoteDetail = async () => {
    try {
      setIsLoading(true);
      const response = await getTastingNoteDetail(tastingNoteId);
      if (response.isSuccess) {
        setNote(response.result);
      } else {
        Alert.alert('오류', response.message || '테이스팅 노트를 불러올 수 없습니다.');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Failed to fetch tasting note detail:', error);
      Alert.alert('오류', '네트워크 오류가 발생했습니다.');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8e44ad" />
      </View>
    );
  }

  if (!note) return null;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>테이스팅 노트</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Wine Info Card */}
        <View style={styles.wineCard}>
          <View style={styles.wineHeader}>
            {note.imageUrl ? (
              <Image source={{ uri: note.imageUrl }} style={styles.wineImage} resizeMode="contain" />
            ) : (
              <View style={styles.wineImagePlaceholder}>
                <Ionicons name="wine" size={30} color="#666" />
              </View>
            )}
            <View style={styles.wineInfo}>
              <Text style={styles.wineName}>{note.wineName}</Text>
              <View style={styles.wineMeta}>
                <View style={[styles.typeChip, { backgroundColor: getWineTypeColor(note.sort || '') }]}>
                  <Text style={styles.typeText}>{note.sort || 'Wine'}</Text>
                </View>
                <Text style={styles.vintageText}>
                  {note.vintageYear === 0 ? 'NV' : note.vintageYear}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Basic Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>기본 정보</Text>
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Text style={styles.label}>시음 날짜</Text>
              <Text style={styles.value}>{note.tasteDate}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.label}>색상</Text>
              <View style={styles.colorWrapper}>
                <View style={[styles.colorCircle, { backgroundColor: note.color }]} />
                {/* <Text style={styles.value}>{note.color}</Text> */}
              </View>
            </View>
          </View>
        </View>

        {/* Nose */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>향 (Nose)</Text>
          <View style={styles.tagContainer}>
            {note.noseList && note.noseList.length > 0 ? (
              note.noseList.map((scent, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{scent}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>기록된 향이 없습니다.</Text>
            )}
          </View>
        </View>

        {/* Palate Graph */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>맛 (Palate)</Text>
          <View style={styles.featuresContainer}>
            <FeatureGauge label="당도" value={note.sweetness / 20} />
            <FeatureGauge label="산도" value={note.acidity / 20} />
            <FeatureGauge label="타닌" value={note.tannin / 20} />
            <FeatureGauge label="바디" value={note.body / 20} />
            <FeatureGauge label="알코올" value={note.alcohol / 20} />
          </View>
        </View>

        {/* Review */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>총평</Text>
          <View style={styles.ratingContainer}>
            <View style={styles.stars}>
              {[1, 2, 3, 4, 5].map((star) => {
                let iconName = 'star-outline';
                if (note.rating >= star) iconName = 'star';
                else if (note.rating >= star - 0.5) iconName = 'star-half';
                
                return (
                  <Ionicons 
                    key={star} 
                    name={iconName} 
                    size={24} 
                    color="#f1c40f" 
                    style={{ marginRight: 2 }} 
                  />
                );
              })}
            </View>
            <Text style={styles.ratingText}>{note.rating.toFixed(1)}</Text>
          </View>
          
          <View style={styles.reviewBox}>
            <Text style={styles.reviewText}>{note.review}</Text>
          </View>
        </View>

        <Text style={styles.dateText}>작성일: {new Date(note.createdAt).toLocaleDateString()}</Text>

      </ScrollView>
    </SafeAreaView>
  );
}

const getWineTypeColor = (type: string) => {
  switch (type.toUpperCase()) {
    case 'RED': case '레드': return '#C0392B';
    case 'WHITE': case '화이트': return '#D4AC0D';
    case 'SPARKLING': case '스파클링': return '#2980B9';
    case 'ROSE': case '로제': return '#C2185B';
    case 'DESSERT': case '디저트': return '#D35400';
    default: return '#7F8C8D';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 32,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  wineCard: {
    flexDirection: 'row',
    marginBottom: 32,
    backgroundColor: '#252525',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  wineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  wineImage: {
    width: 60,
    height: 80,
    borderRadius: 4,
    backgroundColor: '#333',
  },
  wineImagePlaceholder: {
    width: 60,
    height: 80,
    borderRadius: 4,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  wineInfo: {
    marginLeft: 16,
    flex: 1,
  },
  wineName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  wineMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeChip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  typeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  vintageText: {
    color: '#aaa',
    fontSize: 14,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#8e44ad',
    paddingLeft: 10,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#2a2a2a',
    padding: 16,
    borderRadius: 12,
  },
  infoItem: {
    flex: 1,
  },
  label: {
    color: '#888',
    fontSize: 12,
    marginBottom: 4,
  },
  value: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  colorWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fff',
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#444',
  },
  tagText: {
    color: '#ccc',
    fontSize: 14,
  },
  emptyText: {
    color: '#666',
    fontStyle: 'italic',
  },
  featuresContainer: {
    backgroundColor: '#2a2a2a',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  stars: {
    flexDirection: 'row',
    marginRight: 12,
  },
  ratingText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  reviewBox: {
    backgroundColor: '#2a2a2a',
    padding: 16,
    borderRadius: 12,
    minHeight: 100,
  },
  reviewText: {
    color: '#fff',
    fontSize: 15,
    lineHeight: 24,
  },
  dateText: {
    color: '#666',
    fontSize: 12,
    textAlign: 'right',
    marginTop: -10,
  },
});

