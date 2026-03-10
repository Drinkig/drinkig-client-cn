import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { RootStackParamList } from '../types';
import { getMyWineDetail, deleteMyWine, MyWineDTO, getWineDetailPublic, searchWinesPublic } from '../api/wine';
import { useGlobalUI } from '../context/GlobalUIContext';
import MenuBottomSheet from '../components/common/MenuBottomSheet';
import SelectionModal from '../components/common/SelectionModal';
import { colors } from '../constants/colors';
import { useTranslation } from 'react-i18next';

type MyWineDetailRouteProp = RouteProp<RootStackParamList, 'MyWineDetail'>;

export default function MyWineDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute<MyWineDetailRouteProp>();
  const { wineId } = route.params;
  const { showAlert } = useGlobalUI();
  const { t } = useTranslation();

  const [wine, setWine] = useState<MyWineDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [isFinishModalVisible, setIsFinishModalVisible] = useState(false);

  useEffect(() => {
    fetchWineDetail();
  }, [wineId]);

  const fetchWineDetail = async () => {
    try {
      setIsLoading(true);
      const response = await getMyWineDetail(wineId);
      if (response.isSuccess) {
        let wineData = response.result;

        // Route params로 넘어온 이미지가 있으면 우선 사용
        if (!wineData.wineImageUrl && route.params?.wineImageUrl) {
          wineData = { ...wineData, wineImageUrl: route.params.wineImageUrl };
        }

        if (!wineData.wineImageUrl) {
          // S3 버킷의 wine 폴더에서 직접 이미지 URL 구성
          wineData.wineImageUrl = `https://drinkeg-bucket-1.s3.ap-northeast-2.amazonaws.com/wine/${wineData.wineId}.png`;
        }

        setWine(wineData);
      } else {
        showAlert({
          title: t('myWineDetail.error.fetchFailTitle'),
          message: t('myWineDetail.error.fetchFailMsg'),
          singleButton: true,
          onConfirm: () => navigation.goBack(),
        });
      }
    } catch (error) {
      console.error('Failed to fetch my wine detail:', error);
      showAlert({
        title: t('myWineDetail.error.fetchFailTitle'),
        message: t('myWineDetail.error.networkFailMsg'),
        singleButton: true,
        onConfirm: () => navigation.goBack(),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = () => {
    showAlert({
      title: t('myWineDetail.delete.title'),
      message: t('myWineDetail.delete.message'),
      confirmText: t('myWineDetail.delete.confirm'),
      singleButton: false,
      onConfirm: async () => {
        try {
          const response = await deleteMyWine(wineId);
          if (response.isSuccess) {
            showAlert({
              title: t('myWineDetail.delete.successTitle'),
              message: t('myWineDetail.delete.successMsg'),
              singleButton: true,
              onConfirm: () => navigation.goBack(),
            });
          } else {
            showAlert({
              title: t('myWineDetail.error.fetchFailTitle'),
              message: response.message || t('myWineDetail.delete.failMsg'),
              singleButton: true,
            });
          }
        } catch (error) {
          console.error('Failed to delete wine:', error);
          showAlert({
            title: t('myWineDetail.error.fetchFailTitle'),
            message: t('myWineDetail.error.networkFailMsg'),
            singleButton: true,
          });
        }
      }
    });
  };

  const handleEdit = () => {
    if (wine) {

      // @ts-ignore
      navigation.navigate('WineAdd', { myWine: wine });
    }
  };

  const handleFinishedDrinking = () => {
    setIsFinishModalVisible(true);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!wine) {
    return null;
  }


  const renderImage = () => {
    if (wine.wineImageUrl) {
      return (
        <Image source={{ uri: wine.wineImageUrl }} style={styles.wineImage} resizeMode="contain" />
      );
    }
    return (
      <View style={styles.imagePlaceholder}>
        <MaterialCommunityIcons name="bottle-wine" size={60} color="#ccc" />
      </View>
    );
  };


  const renderInfoRow = (icon: string, label: string, value?: string | number | null) => (
    <View style={styles.infoRow}>
      <View style={styles.labelContainer}>
        <MaterialCommunityIcons name={icon} size={20} color={colors.primary} style={styles.icon} />
        <Text style={styles.label}>{label}</Text>
      </View>
      <Text style={styles.value}>{value || '-'}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />


      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('myWineDetail.header')}</Text>
        <TouchableOpacity onPress={() => setIsMenuVisible(true)} style={styles.deleteButton}>
          <Ionicons name="ellipsis-vertical" size={22} color={colors.white} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        <TouchableOpacity
          style={[styles.card, { zIndex: 10 }]}
          onPress={() => {
            const wineParam = {
              id: wine.wineId,
              nameKor: wine.wineName,
              nameEng: '',
              type: wine.wineSort,
              country: wine.wineCountry,
              grape: wine.wineVariety,
              imageUri: wine.wineImageUrl,
            };
            // @ts-ignore
            navigation.navigate('WineDetail', { wine: wineParam });
          }}
          activeOpacity={0.5}
        >
          <View style={styles.imageContainer}>
            {renderImage()}
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.wineName}>{wine.wineName}</Text>
            <View style={styles.badges}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{wine.wineSort}</Text>
              </View>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{wine.wineCountry}</Text>
              </View>
            </View>
            <Text style={styles.grapeText}>{wine.wineVariety}</Text>
          </View>
        </TouchableOpacity>


        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('myWineDetail.section.purchaseInfo')}</Text>
          <View style={styles.infoContainer}>
            {renderInfoRow('calendar', t('myWineDetail.info.vintage'), wine.vintageYear === 0 ? 'NV' : wine.vintageYear)}
            <View style={styles.divider} />
            {renderInfoRow('cash', t('myWineDetail.info.price'), wine.purchasePrice ? `₩${wine.purchasePrice.toLocaleString()}` : null)}
            <View style={styles.divider} />
            {renderInfoRow('store', t('myWineDetail.info.shop'), wine.purchaseShop ? `${wine.purchaseShop} (${wine.purchaseType === 'DIRECT' ? t('myWineDetail.info.shopDirect') : t('myWineDetail.info.shopOffline')})` : '-')}
            <View style={styles.divider} />
            {renderInfoRow('calendar-check', t('myWineDetail.info.date'), wine.purchaseDate)}
            <View style={styles.divider} />
            {renderInfoRow('clock-outline', t('myWineDetail.info.storagePeriod'), t('myWineDetail.info.periodDays', { days: wine.period }))}
          </View>
        </View>


        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('myWineDetail.section.detailInfo')}</Text>
          <View style={styles.infoContainer}>
            {renderInfoRow('map-marker', t('myWineDetail.info.region'), wine.wineRegion)}

          </View>
        </View>

      </ScrollView>


      <MenuBottomSheet
        visible={isMenuVisible}
        onClose={() => setIsMenuVisible(false)}
        title={t('myWineDetail.menu.title')}
        options={[
          {
            label: t('myWineDetail.menu.edit'),
            icon: 'create-outline',
            onPress: handleEdit,
          },
          {
            label: t('myWineDetail.menu.delete'),
            icon: 'trash-outline',
            onPress: handleDelete,
            isDestructive: true,
          },
        ]}
      />

      <SelectionModal
        visible={isFinishModalVisible}
        title={t('myWineDetail.finishModal.title')}
        message={t('myWineDetail.finishModal.message')}
        onClose={() => setIsFinishModalVisible(false)}
        option1Text={t('myWineDetail.finishModal.writeNote')}
        onSelectOption1={() => {
          setIsFinishModalVisible(false);
          if (wine) {
            // @ts-ignore
            navigation.navigate('TastingNoteWrite', {
              wineId: wine.wineId,
              wineName: wine.wineName,
              wineImage: wine.wineImageUrl,
              wineType: wine.wineSort,
            });
          }
        }}
        option2Text={t('myWineDetail.finishModal.delete')}
        onSelectOption2={() => {
          setIsFinishModalVisible(false);
          handleDelete();
        }}
      />

      <View style={styles.bottomButtonContainer}>
        <TouchableOpacity style={styles.editButton} onPress={handleFinishedDrinking}>
          <MaterialCommunityIcons name="glass-wine" size={20} color={colors.white} style={{ marginRight: 8 }} />
          <Text style={styles.editButtonText}>{t('myWineDetail.button.finished')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  backButton: {
    padding: 4,
  },
  deleteButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.white,
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  imageContainer: {
    marginRight: 16,
    width: 80,
    height: 120,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  wineImage: {
    width: '100%',
    height: '100%',

  },
  imagePlaceholder: {
    width: 80,
    height: 120,
    borderRadius: 8,
    backgroundColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  wineName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 8,
  },
  badges: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  badge: {
    backgroundColor: colors.border,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeText: {
    color: '#ccc',
    fontSize: 12,
  },
  grapeText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 12,
    marginLeft: 4,
  },
  infoContainer: {
    backgroundColor: colors.surface1,
    borderRadius: 16,
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 12,
  },
  label: {
    fontSize: 16,
    color: '#ccc',
  },
  value: {
    fontSize: 16,
    color: colors.white,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  bottomButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 34,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  editButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    height: 50,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
