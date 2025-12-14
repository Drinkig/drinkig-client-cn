import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { RootStackParamList } from '../types';
import { getMyWineDetail, deleteMyWine, MyWineDTO, getWineDetailPublic } from '../api/wine';

type MyWineDetailRouteProp = RouteProp<RootStackParamList, 'MyWineDetail'>;

export default function MyWineDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute<MyWineDetailRouteProp>();
  const { wineId } = route.params;

  const [wine, setWine] = useState<MyWineDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchWineDetail();
  }, [wineId]);

  const fetchWineDetail = async () => {
    try {
      setIsLoading(true);
      const response = await getMyWineDetail(wineId);
      if (response.isSuccess) {
        let wineData = response.result;

        // [임시 해결] wineImageUrl이 없으면 상세 조회 API를 찔러서 이미지를 가져옴
        if (!wineData.wineImageUrl) {
          try {
            const detailRes = await getWineDetailPublic(wineData.wineId);
            if (detailRes.isSuccess && detailRes.result.wineInfoResponse.imageUrl) {
              wineData = { ...wineData, wineImageUrl: detailRes.result.wineInfoResponse.imageUrl };
            }
          } catch (err) {
            // 실패 시 원본 데이터 사용
          }
        }

        setWine(wineData);
      } else {
        Alert.alert('오류', '와인 정보를 불러오는데 실패했습니다.');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Failed to fetch my wine detail:', error);
      Alert.alert('오류', '서버 통신 중 문제가 발생했습니다.');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      '와인 삭제',
      '정말로 이 와인을 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        { 
          text: '삭제', 
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await deleteMyWine(wineId);
              if (response.isSuccess) {
                Alert.alert('성공', '와인이 삭제되었습니다.');
                navigation.goBack();
              } else {
                Alert.alert('오류', response.message || '와인 삭제에 실패했습니다.');
              }
            } catch (error) {
              console.error('Failed to delete wine:', error);
              Alert.alert('오류', '서버 통신 중 문제가 발생했습니다.');
            }
          }
        },
      ]
    );
  };

  const handleEdit = () => {
    if (wine) {
      // WineAddScreen으로 이동하면서 현재 와인 정보를 'myWine' 파라미터로 전달
      // @ts-ignore
      navigation.navigate('WineAdd', { myWine: wine });
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8e44ad" />
      </View>
    );
  }

  if (!wine) {
    return null;
  }

  // 이미지 렌더링
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

  // 정보 행 렌더링
  const renderInfoRow = (icon: string, label: string, value?: string | number | null) => (
    <View style={styles.infoRow}>
      <View style={styles.labelContainer}>
        <MaterialCommunityIcons name={icon} size={20} color="#8e44ad" style={styles.icon} />
        <Text style={styles.label}>{label}</Text>
      </View>
      <Text style={styles.value}>{value || '-'}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
      
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>내 와인 상세</Text>
        <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
          <Ionicons name="trash-outline" size={22} color="#e74c3c" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* 상단 정보 카드 */}
        <View style={styles.card}>
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
        </View>

        {/* 구매 정보 섹션 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>구매 정보</Text>
          <View style={styles.infoContainer}>
            {renderInfoRow('calendar', '빈티지', wine.vintageYear === 0 ? 'NV' : wine.vintageYear)}
            <View style={styles.divider} />
            {renderInfoRow('cash', '구매가', wine.purchasePrice ? `₩${wine.purchasePrice.toLocaleString()}` : null)}
            <View style={styles.divider} />
            {renderInfoRow('store', '구매처', wine.purchaseShop ? `${wine.purchaseShop} (${wine.purchaseType === 'DIRECT' ? '직구' : '매장'})` : '-')}
            <View style={styles.divider} />
            {renderInfoRow('calendar-check', '구매일', wine.purchaseDate)}
            <View style={styles.divider} />
            {renderInfoRow('clock-outline', '보관 기간', `${wine.period}일`)}
          </View>
        </View>

        {/* 추가 정보 섹션 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>상세 정보</Text>
          <View style={styles.infoContainer}>
            {renderInfoRow('map-marker', '지역', wine.wineRegion)}
            {/* 수입사, 보관 상태 등은 API 응답에 없으므로 제외하거나 추가 요청 필요 */}
          </View>
        </View>
        
      </ScrollView>

      {/* 하단 버튼 */}
      <View style={styles.bottomButtonContainer}>
        <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
          <MaterialCommunityIcons name="pencil" size={20} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.editButtonText}>정보 수정하기</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#1a1a1a',
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
    borderBottomColor: '#333',
    backgroundColor: '#1a1a1a',
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
    color: '#fff',
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#2a2a2a',
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
    backgroundColor: '#1a1a1a', // 카드 배경(#2a2a2a)보다 조금 더 어둡게 처리하여 구분
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  wineImage: {
    width: '100%',
    height: '100%',
    // resizeMode는 컴포넌트 prop에서 제어
  },
  imagePlaceholder: {
    width: 80,
    height: 120,
    borderRadius: 8,
    backgroundColor: '#333',
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
    color: '#fff',
    marginBottom: 8,
  },
  badges: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  badge: {
    backgroundColor: '#333',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeText: {
    color: '#ccc',
    fontSize: 12,
  },
  grapeText: {
    color: '#888',
    fontSize: 14,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
    marginLeft: 4,
  },
  infoContainer: {
    backgroundColor: '#2a2a2a',
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
    color: '#fff',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#333',
  },
  bottomButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 34, // 홈 인디케이터 영역 확보
    backgroundColor: '#1a1a1a',
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  editButton: {
    backgroundColor: '#8e44ad',
    borderRadius: 12,
    height: 50,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
