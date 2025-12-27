import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  StatusBar,
  Image,
  ActivityIndicator,
  Alert,
  ScrollView,
  Dimensions,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types';
import { getTastingNoteDetail, TastingNoteDTO, deleteTastingNote } from '../api/wine';
import { useGlobalUI } from '../context/GlobalUIContext';
import PentagonRadarChart from '../components/common/PentagonRadarChart';
import { COLOR_PALETTES } from '../components/tasting_note/constants';

type TastingNoteDetailRouteProp = RouteProp<RootStackParamList, 'TastingNoteDetail'>;

const { width } = Dimensions.get('window');

export default function TastingNoteDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute<TastingNoteDetailRouteProp>();
  const { tastingNoteId } = route.params;
  const { showAlert } = useGlobalUI();

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
        showAlert({
          title: '오류',
          message: response.message || '테이스팅 노트를 불러올 수 없습니다.',
          singleButton: true,
          onConfirm: () => navigation.goBack(),
        });
      }
    } catch (error) {
      console.error('Failed to fetch tasting note detail:', error);
      showAlert({
        title: '오류',
        message: '네트워크 오류가 발생했습니다.',
        singleButton: true,
        onConfirm: () => navigation.goBack(),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = () => {
    showAlert({
      title: '테이스팅 노트 삭제',
      message: '정말로 이 테이스팅 노트를\n삭제하시겠습니까?',
      confirmText: '삭제',
      singleButton: false,
      onConfirm: async () => {
        try {
          const response = await deleteTastingNote(tastingNoteId);
          if (response.isSuccess) {
            showAlert({
              title: '성공',
              message: '테이스팅 노트가 삭제되었습니다.',
              singleButton: true,
              onConfirm: () => navigation.goBack(),
            });
          } else {
            showAlert({
              title: '오류',
              message: response.message || '삭제에 실패했습니다.',
              singleButton: true,
            });
          }
        } catch (error) {
          console.error('Failed to delete tasting note:', error);
          showAlert({
            title: '오류',
            message: '서버 통신 중 문제가 발생했습니다.',
            singleButton: true,
          });
        }
      }
    });
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8e44ad" />
      </View>
    );
  }

  if (!note) return null;

  // Review 파싱: [Finish] 태그 분리 및 배열 변환
  const parseReview = (fullReview: string) => {
    const finishMatch = fullReview.match(/\[Finish\] (.*?)(?:\n\n|$)/s);
    const finishTextRaw = finishMatch ? finishMatch[1] : null;

    // 피니쉬 텍스트를 쉼표로 분리하여 배열로 변환
    const finishTags = finishTextRaw
      ? finishTextRaw.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
      : [];

    // [Finish] 부분을 제거하고 남은 텍스트를 리뷰로 사용
    let reviewText = fullReview.replace(/\[Finish\] .*?(?:\n\n|$)/s, '').trim();

    return { finishTags, reviewText };
  };

  const { finishTags, reviewText } = parseReview(note.review);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>테이스팅 노트</Text>
        <TouchableOpacity onPress={handleDelete} style={{ padding: 4 }}>
          <Ionicons name="trash-outline" size={24} color="#e74c3c" />
        </TouchableOpacity>
      </View>

      {/* Main Content - No Global Scroll */}
      <View style={styles.contentContainer}>

        {/* Top Section: Wine Info */}
        <View style={styles.topSection}>
          <View style={styles.wineImageContainer}>
            {note.imageUrl ? (
              <Image source={{ uri: note.imageUrl }} style={styles.wineImage} resizeMode="contain" />
            ) : (
              <View style={styles.wineImagePlaceholder}>
                <Ionicons name="wine" size={40} color="#666" />
              </View>
            )}
          </View>

          <View style={styles.wineInfoContainer}>
            <View style={styles.wineHeaderRow}>
              <View style={[styles.typeBadge, { backgroundColor: getWineTypeColor(note.sort || '') }]}>
                <Text style={styles.typeText}>{note.sort || 'Wine'}</Text>
              </View>
              <Text style={styles.dateText}>{note.tasteDate}</Text>
            </View>

            <Text style={styles.wineName} numberOfLines={2}>{note.wineName}</Text>
            <Text style={styles.vintageText}>{note.vintageYear === 0 ? 'NV' : `Vintage ${note.vintageYear}`}</Text>

            <View style={styles.metaRow}>
              <View style={styles.colorWrapper}>
                <Text style={styles.metaLabel}>Color</Text>
                <View style={[styles.colorCircle, { backgroundColor: getHexColorFromValue(note.color) }]} />
              </View>
              <View style={styles.ratingWrapper}>
                <Ionicons name="star" size={16} color="#f1c40f" />
                <Text style={styles.ratingValue}>{note.rating.toFixed(1)}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Middle Section: Palate (Left) & Nose/Finish (Right) */}
        <View style={styles.middleSection}>
          {/* Left: Palate Graph - Now in a Box */}
          <View style={[styles.palateColumn, styles.infoBox]}>
            <Text style={styles.boxTitle}>Palate</Text>
            <View style={styles.chartContainer}>
              <PentagonRadarChart
                data={{
                  acidity: note.acidity / 20,
                  sweetness: note.sweetness / 20,
                  tannin: note.tannin / 20,
                  body: note.body / 20,
                  alcohol: note.alcohol / 20,
                }}
                size={140}
              />
            </View>
          </View>

          {/* Right: Nose & Finish */}
          <View style={styles.rightColumn}>
            {/* Nose Box */}
            <View style={styles.infoBox}>
              <Text style={styles.boxTitle}>Nose</Text>
              <ScrollView nestedScrollEnabled style={{ maxHeight: 80 }}>
                <View style={styles.noseTagsContainer}>
                  {note.noseList && note.noseList.length > 0 ? (
                    note.noseList.map((scent, index) => (
                      <View key={index} style={styles.noseTag}>
                        <Text style={styles.noseText}>{scent}</Text>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.emptyText}>-</Text>
                  )}
                </View>
              </ScrollView>
            </View>

            {/* Finish Box */}
            <View style={[styles.infoBox, { flex: 1 }]}>
              <Text style={styles.boxTitle}>Finish</Text>
              <ScrollView nestedScrollEnabled>
                <View style={styles.noseTagsContainer}>
                  {finishTags.length > 0 ? (
                    finishTags.map((tag, index) => (
                      <View key={index} style={styles.noseTag}>
                        <Text style={styles.noseText}>{tag}</Text>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.emptyText}>-</Text>
                  )}
                </View>
              </ScrollView>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Bottom Section: Review Only */}
        <View style={styles.bottomSectionWrapper}>
          <Text style={styles.sectionHeader}>Review</Text>
          <ScrollView style={styles.bottomScroll} contentContainerStyle={styles.bottomContent}>
            <Text style={styles.bodyText}>
              {reviewText || '작성된 리뷰가 없습니다.'}
            </Text>
          </ScrollView>
        </View>

      </View>
    </SafeAreaView>
  );
}

const getWineTypeColor = (type: string) => {
  switch (type?.toUpperCase()) {
    case 'RED': case '레드': return '#C0392B';
    case 'WHITE': case '화이트': return '#D4AC0D';
    case 'SPARKLING': case '스파클링': return '#2980B9';
    case 'ROSE': case '로제': return '#C2185B';
    case 'DESSERT': case '디저트': return '#D35400';
    default: return '#7F8C8D';
  }
};

const getHexColorFromValue = (value: string) => {
  if (!value) return 'transparent';
  for (const paletteKey in COLOR_PALETTES) {
    const palette = COLOR_PALETTES[paletteKey];
    const found = palette.find(item => item.value === value);
    if (found) return found.color;
  }
  return value.startsWith('#') ? value : 'transparent';
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
  contentContainer: {
    flex: 1,
    padding: 16,
    gap: 16,
  },
  // Top Section
  topSection: {
    flexDirection: 'row',
    height: 120,
  },
  wineImageContainer: {
    width: 90,
    height: 120,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#252525',
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  wineImage: {
    width: '100%',
    height: '100%',
  },
  wineImagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wineInfoContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  wineHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  typeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  dateText: {
    color: '#888',
    fontSize: 12,
  },
  wineName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    lineHeight: 24,
  },
  vintageText: {
    color: '#aaa',
    fontSize: 14,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  colorWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaLabel: {
    color: '#888',
    fontSize: 12,
  },
  colorCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fff',
  },
  ratingWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },

  divider: {
    height: 1,
    backgroundColor: '#333',
  },

  // Middle Section
  middleSection: {
    flexDirection: 'row',
    height: 220,
    gap: 16,
  },
  palateColumn: {
    flex: 1,
  },
  chartContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -10, // 타이틀 공간 고려 및 시각적 중심 보정
  },

  // Right Column (Nose & Finish)
  rightColumn: {
    flex: 1,
    gap: 12,
  },
  infoBox: {
    backgroundColor: '#252525',
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  boxTitle: {
    color: '#8e44ad',
    fontSize: 14,
    fontWeight: 'bold',
  },

  // Nose Tags
  noseTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  noseTag: {
    backgroundColor: '#333',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#444',
  },
  noseText: {
    color: '#ddd',
    fontSize: 11,
  },
  emptyText: {
    color: '#666',
    fontSize: 12,
    fontStyle: 'italic',
  },

  // Text
  bodyText: {
    color: '#ccc',
    fontSize: 13,
    lineHeight: 20,
  },

  // Bottom SectionWrapper (Review)
  bottomSectionWrapper: {
    flex: 1, // Takes remaining space
    backgroundColor: '#252525',
    borderRadius: 12,
    padding: 16,
  },
  sectionHeader: {
    color: '#8e44ad',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  bottomScroll: {
    flex: 1,
  },
  bottomContent: {
    paddingBottom: 10,
  },
});
