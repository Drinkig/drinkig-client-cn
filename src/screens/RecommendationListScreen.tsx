import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useUser } from '../context/UserContext';
import { colors } from '../constants/colors';
import { useTranslation } from 'react-i18next';

const RANK_BADGES = ['🥇', '🥈', '🥉'];

const RecommendationListScreen = () => {
  const navigation = useNavigation();
  const { recommendations, user } = useUser();
  const { t, i18n } = useTranslation();

  const getWineTypeColor = (type: string) => {
    switch (type) {
      case '레드':
      case 'Red':
        return '#EF5350';
      case '화이트':
      case 'White':
        return '#F4D03F';
      case '스파클링':
      case 'Sparkling':
        return '#5DADE2';
      case '로제':
      case 'Rose':
        return '#F1948A';
      case '디저트':
      case 'Dessert':
        return '#F5B041';
      default:
        return '#95A5A6';
    }
  };

  const getWineTypeLabel = (type: string, lang: string) => {
    if (lang !== 'en') return type;
    switch (type) {
      case '레드': return 'Red';
      case '화이트': return 'White';
      case '스파클링': return 'Sparkling';
      case '로제': return 'Rosé';
      case '디저트': return 'Dessert';
      case '주정강화': return 'Fortified';
      default: return type;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('recommendationList.header')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.introContainer}>
          <Text style={styles.introTitle}>{t('recommendationList.title', { name: user?.nickname || t('recommendationList.defaultName') })}</Text>
        </View>

        {recommendations && recommendations.length > 0 ? (
          <View style={styles.listContainer}>
            {recommendations.map((item, index) => (
              <View key={index} style={styles.recommendationCard}>

                <View style={styles.rankSection}>
                  {index < 3 ? (
                    <Text style={styles.rankEmoji}>{RANK_BADGES[index]}</Text>
                  ) : (
                    <Text style={styles.rankNumber}>{index + 1}</Text>
                  )}
                </View>


                <View style={styles.infoSection}>
                  <View style={styles.infoHeader}>
                    <View style={[styles.typeBadge, { backgroundColor: getWineTypeColor(item.sort) }]}>
                      <Text style={styles.typeText}>{getWineTypeLabel(item.sort, i18n.language)}</Text>
                    </View>
                  </View>

                  <Text style={styles.wineVariety}>
                    {i18n.language === 'en' ? (item.varietyEng || item.variety) : item.variety}
                  </Text>
                  {item.varietyEng && i18n.language !== 'en' && <Text style={styles.wineVarietyEng}>{item.varietyEng}</Text>}

                  <View style={{ height: 4 }} />

                  {i18n.language === 'en' ? (
                    <Text style={styles.wineRegionEng}>
                      {item.countryEng || item.country}{(item.countryEng || item.country) && (item.regionEng || item.region) ? ' · ' : ''}{item.regionEng || item.region}
                    </Text>
                  ) : (
                    <>
                      <Text style={styles.wineRegion}>{item.country} · {item.region}</Text>
                      {(item.countryEng || item.regionEng) && (
                        <Text style={styles.wineRegionEng}>
                          {item.countryEng || ''}{(item.countryEng && item.regionEng) ? ' · ' : ''}{item.regionEng || ''}
                        </Text>
                      )}
                    </>
                  )}
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>{t('recommendationList.empty')}</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.white,
  },
  scrollContent: {
    padding: 24,
  },
  introContainer: {
    marginBottom: 32,
  },
  introTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.white,
    lineHeight: 34,
  },
  listContainer: {
    gap: 16,
  },
  recommendationCard: {
    flexDirection: 'row',
    backgroundColor: '#1e1e1e',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  rankSection: {
    width: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: colors.border,
    marginRight: 16,
    paddingRight: 16,
  },
  rankEmoji: {
    fontSize: 28,
  },
  rankNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#666',
  },
  infoSection: {
    flex: 1,
  },
  infoHeader: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  typeText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: 'bold',
  },
  wineVariety: {
    fontSize: 17,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 4,
  },
  wineRegion: {
    fontSize: 13,
    color: '#ccc',
    fontWeight: '500',
  },
  wineVarietyEng: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
    fontStyle: 'italic',
  },
  wineRegionEng: {
    fontSize: 12,
    color: '#666',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 16,
  },
});

export default RecommendationListScreen;

