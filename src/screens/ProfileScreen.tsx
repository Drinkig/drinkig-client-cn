import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { useUser } from '../context/UserContext';
import { getMyWines, getMyTastingNotes, TastingNotePreviewDTO } from '../api/wine';
import PentagonRadarChart from '../components/common/PentagonRadarChart';

const ProfileScreen = () => {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const { user: userInfo, flavorProfile } = useUser();
  const [selectedType, setSelectedType] = React.useState('전체');
  const [wineCount, setWineCount] = React.useState(0);
  const [tastingNotes, setTastingNotes] = React.useState<TastingNotePreviewDTO[]>([]);

  React.useEffect(() => {
    if (isFocused) {
      fetchMyData();
    }
  }, [isFocused]);

  const fetchMyData = async () => {
    try {
      // 테이스팅 노트 목록 조회
      const response = await getMyTastingNotes();
      if (response.isSuccess) {
        setTastingNotes(response.result || []);
        setWineCount(response.result ? response.result.length : 0);
      }
    } catch (error) {
      console.error('Failed to fetch my data:', error);
    }
  };

  const wineTypes = ['전체', '레드', '화이트', '스파클링', '로제', '디저트', '주정강화', '기타'];

  const getWineTypeColor = (type: string) => {
    switch (type) {
      case '레드':
      case 'Red':
        return '#C0392B';
      case '화이트':
      case 'White':
        return '#D4AC0D';
      case '스파클링':
      case 'Sparkling':
        return '#2980B9';
      case '로제':
      case 'Rose':
        return '#C2185B';
      case '디저트':
      case 'Dessert':
        return '#D35400';
      default:
        return '#7F8C8D';
    }
  };

  // 필터링
  const filteredNotes = React.useMemo(() => {
    if (selectedType === '전체') return tastingNotes;
    
    const typeMap: { [key: string]: string } = {
      '레드': 'Red',
      '화이트': 'White',
      '스파클링': 'Sparkling',
      '로제': 'Rose',
      '디저트': 'Dessert',
      '주정강화': 'Fortified'
    };
    
    if (selectedType === '기타') {
      return tastingNotes.filter(note => {
        const sort = note.sort || '';
        return !['Red', 'White', 'Sparkling', 'Rose', 'Dessert', 'Fortified', '레드', '화이트', '스파클링', '로제', '디저트', '주정강화'].includes(sort);
      });
    }

    const targetType = typeMap[selectedType] || selectedType;
    return tastingNotes.filter(note => {
      const sort = note.sort || '';
      return sort === targetType || sort === selectedType || sort.toUpperCase() === targetType.toUpperCase();
    });
  }, [tastingNotes, selectedType]);

  const renderNoteItem = (item: TastingNotePreviewDTO) => (
    <TouchableOpacity 
      key={item.tastingNoteId}
      style={styles.noteItem}
      // 상세 화면 이동 (추후 테이스팅 노트 상세 화면으로 연결 or 와인 상세로 연결)
      // WineDetailScreen은 WineDBItem을 필수로 요구하므로 필요한 필드를 더미로라도 채워서 보냄
      onPress={() => navigation.navigate('WineDetail', { 
        wine: { 
          id: item.wineId, 
          nameKor: item.wineName,
          // 필수 필드 더미 채움 (상세 화면에서 API로 다시 불러오므로 크게 상관 없음)
          nameEng: '',
          type: item.sort,
          country: '',
          grape: '',
          imageUri: item.wineImageUrl
        } 
      })}
    >
      <Image 
        source={item.wineImageUrl ? { uri: item.wineImageUrl } : require('../assets/user_image/Drinky_1.png')} 
        style={styles.noteImage} 
        resizeMode="cover"
      />
      <View style={styles.noteInfo}>
        <Text style={styles.noteName} numberOfLines={1}>{item.wineName}</Text>
        <View style={styles.noteMetaRow}>
          <Text style={styles.noteVintage}>{item.vintageYear === 0 ? 'NV' : item.vintageYear}</Text>
          <View style={styles.noteRating}>
            <Icon name="star" size={12} color="#f1c40f" />
            <Text style={styles.noteRatingText}>{item.rating.toFixed(1)}</Text>
          </View>
        </View>
        <Text style={styles.noteDate}>{item.tasteDate}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* 상단 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>마이페이지</Text>
        <TouchableOpacity 
          style={styles.settingsButton}
          onPress={() => navigation.navigate('Setting' as never)}
        >
          <Icon name="settings-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* 1. 프로필 정보 섹션 */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <Image 
              source={userInfo?.profileImage ? { uri: userInfo.profileImage } : require('../assets/user_image/Drinky_3.png')} 
              style={styles.profileImage} 
              resizeMode="cover"
            />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.nickname}>{userInfo?.nickname || '게스트'}</Text>
            <Text style={styles.wineCountText}>마신 와인 {wineCount || 0}병</Text>
            {userInfo?.email ? <Text style={styles.email}>{userInfo.email}</Text> : null}
          </View>
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => navigation.navigate('ProfileEdit' as never)}
          >
            <Text style={styles.editButtonText}>수정</Text>
          </TouchableOpacity>
        </View>

        {/* 2. 내 와인 취향 섹션 */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>내 와인 취향</Text>
          </View>
          
          {/* 펜타곤 그래프 (Flavor Profile이 있을 경우 표시) */}
          {flavorProfile ? (
            <TouchableOpacity 
              style={styles.chartContainer} 
              onPress={() => navigation.navigate('RecommendationList' as never)}
              activeOpacity={0.8}
            >
              <View style={styles.chartContentWrapper}>
                <PentagonRadarChart data={flavorProfile} size={150} />
                <View style={styles.chartRightContent}>
                  <Text style={styles.chartLinkTitle}>추천 와인 스타일</Text>
                  <Text style={styles.chartLinkSubtitle}>보러가기</Text>
                </View>
              </View>
            </TouchableOpacity>
          ) : (
            // 데이터가 없을 경우
            <View style={styles.emptyWrapper}>
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>아직 분석된 취향 정보가 없습니다.</Text>
                <Text style={styles.emptySubText}>온보딩을 완료하거나 와인을 더 많이 즐겨보세요!</Text>
              </View>
            </View>
          )}
        </View>

        {/* 3. 내가 마신 와인 섹션 (테이스팅 노트 리스트) */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>내가 마신 와인</Text>
          </View>
          
          {/* 필터 칩 */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={styles.filterChipsContainer}
          >
            {wineTypes.map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.filterChip,
                  selectedType === type && styles.filterChipSelected
                ]}
                onPress={() => setSelectedType(type)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.filterChipText,
                  selectedType === type && styles.filterChipTextSelected
                ]}>
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {filteredNotes.length > 0 ? (
            <View style={styles.notesList}>
              {filteredNotes.map(item => renderNoteItem(item))}
            </View>
          ) : (
            <View style={styles.emptyWrapper}>
              <Text style={styles.emptyText}>아직 기록된 와인이 없습니다.</Text>
              <Text style={styles.emptySubText}>마신 와인을 기록해보세요!</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  settingsButton: {
    padding: 4,
  },
  scrollContent: {
    paddingVertical: 20,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 10,
    paddingHorizontal: 24,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#444',
    marginRight: 16,
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  userInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  nickname: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  wineCountText: {
    fontSize: 14,
    color: '#888',
    fontWeight: '600',
  },
  email: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  editButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#333',
    borderWidth: 1,
    borderColor: '#555',
  },
  editButtonText: {
    color: '#ccc',
    fontSize: 13,
    fontWeight: '500',
  },
  sectionContainer: {
    marginBottom: 10,
  },
  sectionHeader: {
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  chartContainer: {
    marginBottom: 24,
    backgroundColor: '#1a1a1a',
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginHorizontal: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  chartContentWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chartRightContent: {
    flex: 1,
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingLeft: 16,
  },
  chartLinkTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  chartLinkSubtitle: {
    color: '#8e44ad',
    fontSize: 14,
    fontWeight: '600',
  },
  carouselContent: {
    paddingHorizontal: 24,
    gap: 12,
  },
  recommendationCard: {
    width: 200,
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  filterChipsContainer: {
    paddingHorizontal: 24,
    gap: 8,
    marginBottom: 16,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#2a2a2a',
    borderWidth: 1,
    borderColor: '#333',
  },
  filterChipSelected: {
    backgroundColor: '#8e44ad',
    borderColor: '#8e44ad',
  },
  filterChipText: {
    fontSize: 14,
    color: '#888',
    fontWeight: '500',
  },
  filterChipTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
  infoContainer: {
    flex: 1,
    marginRight: 8,
  },
  wineVariety: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  wineRegion: {
    fontSize: 11,
    color: '#aaa',
  },
  tagWrapper: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    flexShrink: 0,
  },
  tagText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    includeFontPadding: false,
  },
  emptyWrapper: {
    paddingHorizontal: 24,
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyContainer: {
    backgroundColor: '#2a2a2a',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
    borderStyle: 'dashed',
    width: '100%',
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
    marginBottom: 8,
    fontWeight: 'bold',
  },
  emptySubText: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
  },
  notesList: {
    paddingHorizontal: 24,
    gap: 12,
  },
  noteItem: {
    flexDirection: 'row',
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  noteImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 16,
    backgroundColor: '#333',
  },
  noteInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  noteName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  noteMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  noteVintage: {
    color: '#aaa',
    fontSize: 12,
    marginRight: 8,
  },
  noteRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  noteRatingText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  noteDate: {
    color: '#666',
    fontSize: 11,
  },
});

export default ProfileScreen;

