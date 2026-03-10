import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Image,
  ActivityIndicator,
  Alert,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types';
import { getTastingNoteDetail, TastingNoteDTO, deleteTastingNote } from '../api/wine';
import { useGlobalUI } from '../context/GlobalUIContext';
import PentagonRadarChart from '../components/common/PentagonRadarChart';
import { COLOR_PALETTES } from '../components/tasting_note/constants';
import { colors } from '../constants/colors';
import { useTranslation } from 'react-i18next';

type TastingNoteDetailRouteProp = RouteProp<RootStackParamList, 'TastingNoteDetail'>;

const { width } = Dimensions.get('window');

export default function TastingNoteDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute<TastingNoteDetailRouteProp>();
  const { tastingNoteId } = route.params;
  const { showAlert } = useGlobalUI();
  const { t } = useTranslation();

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
        let noteData = response.result;
        if (!noteData.imageUrl && noteData.wineId) {
          noteData.imageUrl = `https://drinkeg-bucket-1.s3.ap-northeast-2.amazonaws.com/wine/${noteData.wineId}.png`;
        }
        setNote(noteData);
      } else {
        showAlert({
          title: t('tastingNoteDetail.error.fetchFailTitle'),
          message: response.message || t('tastingNoteDetail.error.fetchFailMsg'),
          singleButton: true,
          onConfirm: () => navigation.goBack(),
        });
      }
    } catch (error) {
      console.error('Failed to fetch tasting note detail:', error);
      showAlert({
        title: t('tastingNoteDetail.error.fetchFailTitle'),
        message: t('tastingNoteDetail.error.networkFailMsg'),
        singleButton: true,
        onConfirm: () => navigation.goBack(),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = () => {
    showAlert({
      title: t('tastingNoteDetail.delete.title'),
      message: t('tastingNoteDetail.delete.message'),
      confirmText: t('tastingNoteDetail.delete.confirm'),
      singleButton: false,
      onConfirm: async () => {
        try {
          const response = await deleteTastingNote(tastingNoteId);
          if (response.isSuccess) {
            showAlert({
              title: t('tastingNoteDetail.delete.successTitle'),
              message: t('tastingNoteDetail.delete.successMsg'),
              singleButton: true,
              onConfirm: () => navigation.goBack(),
            });
          } else {
            showAlert({
              title: t('tastingNoteDetail.error.fetchFailTitle'),
              message: response.message || t('tastingNoteDetail.delete.failMsg'),
              singleButton: true,
            });
          }
        } catch (error) {
          console.error('Failed to delete tasting note:', error);
          showAlert({
            title: t('tastingNoteDetail.error.fetchFailTitle'),
            message: t('tastingNoteDetail.delete.networkFailMsg'),
            singleButton: true,
          });
        }
      }
    });
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!note) return null;


  const parseReview = (fullReview: string) => {
    const finishMatch = fullReview.match(/\[Finish\] (.*?)(?:\n\n|$)/s);
    const finishTextRaw = finishMatch ? finishMatch[1] : null;


    const finishTags = finishTextRaw
      ? finishTextRaw.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
      : [];


    let reviewText = fullReview.replace(/\[Finish\] .*?(?:\n\n|$)/s, '').trim();

    return { finishTags, reviewText };
  };

  const { finishTags, reviewText } = parseReview(note.review);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />


      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('tastingNoteDetail.header')}</Text>
        <TouchableOpacity onPress={handleDelete} style={{ padding: 4 }}>
          <Ionicons name="trash-outline" size={24} color={colors.error} />
        </TouchableOpacity>
      </View>


      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>


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
            <Text style={styles.vintageText}>{note.vintageYear === 0 ? t('tastingNoteDetail.info.nv') : t('tastingNoteDetail.info.vintage', { year: note.vintageYear })}</Text>

            <View style={styles.metaRow}>
              <View style={styles.colorWrapper}>
                <Text style={styles.metaLabel}>{t('tastingNoteDetail.info.color')}</Text>
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


        <View style={styles.middleSection}>

          <View style={[styles.palateColumn, styles.infoBox]}>
            <Text style={styles.boxTitle}>{t('tastingNoteDetail.info.palate')}</Text>
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


          <View style={styles.rightColumn}>

            <View style={styles.infoBox}>
              <Text style={styles.boxTitle}>{t('tastingNoteDetail.info.nose')}</Text>
              <View>
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
              </View>
            </View>


            <View style={[styles.infoBox, { flex: 1 }]}>
              <Text style={styles.boxTitle}>{t('tastingNoteDetail.info.finish')}</Text>
              <View>
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
              </View>
            </View>
          </View>
        </View>

        <View style={styles.divider} />


        <View style={styles.bottomSectionWrapper}>
          <Text style={styles.sectionHeader}>{t('tastingNoteDetail.info.review')}</Text>
          <View style={styles.bottomContent}>
            <Text style={styles.bodyText}>
              {reviewText || t('tastingNoteDetail.info.emptyReview')}
            </Text>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const getWineTypeColor = (type: string) => {
  switch (type?.toUpperCase()) {
    case 'RED': case '레드': return '#EF5350';
    case 'WHITE': case '화이트': return '#F4D03F';
    case 'SPARKLING': case '스파클링': return '#5DADE2';
    case 'ROSE': case '로제': return '#F1948A';
    case 'DESSERT': case '디저트': return '#F5B041';
    default: return '#95A5A6';
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
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 32,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
    paddingBottom: 40,
  },

  topSection: {
    flexDirection: 'row',
    height: 120,
  },
  wineImageContainer: {
    width: 90,
    height: 120,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: colors.surface1,
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
    color: colors.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  dateText: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  wineName: {
    color: colors.white,
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
    color: colors.textSecondary,
    fontSize: 12,
  },
  colorCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.white,
  },
  ratingWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingValue: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },

  divider: {
    height: 1,
    backgroundColor: colors.border,
  },


  middleSection: {
    flexDirection: 'row',
    minHeight: 220,
    gap: 16,
  },
  palateColumn: {
    flex: 1,
  },
  chartContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -10,
  },


  rightColumn: {
    flex: 1,
    gap: 12,
  },
  infoBox: {
    backgroundColor: colors.surface1,
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  boxTitle: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: 'bold',
  },


  noseTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  noseTag: {
    backgroundColor: colors.border,
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


  bodyText: {
    color: '#ccc',
    fontSize: 13,
    lineHeight: 20,
  },


  bottomSectionWrapper: {
    backgroundColor: colors.surface1,
    borderRadius: 12,
    padding: 16,
  },
  sectionHeader: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  bottomContent: {
    paddingBottom: 0,
  },
});
