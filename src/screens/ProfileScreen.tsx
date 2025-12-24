import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Image,
  Modal,
  TouchableWithoutFeedback,
  Dimensions,
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

  // 상태 관리
  const [selectedType, setSelectedType] = React.useState('전체');
  const [wineCount, setWineCount] = React.useState(0);
  const [tastingNotes, setTastingNotes] = React.useState<TastingNotePreviewDTO[]>([]);

  // 정렬 상태 추가
  const [sortType, setSortType] = React.useState('latest'); // latest, rating_high, rating_low
  const [isSortModalVisible, setIsSortModalVisible] = React.useState(false);

  const sortOptions = [
    { label: '최근 등록 순', value: 'latest' },
    { label: '별점 높은 순', value: 'rating_high' },
    { label: '별점 낮은 순', value: 'rating_low' },
  ];

  const fetchMyData = async () => {
    try {
      // 테이스팅 노트 목록 조회
      const response = await getMyTastingNotes();

      if (response.isSuccess) {
        // [수정] 서버 응답이 { content: [...] } 형태인 경우 처리
        let notes = [];
        if (Array.isArray(response.result)) {
          notes = response.result;
        } else if (response.result && Array.isArray((response.result as any).content)) {
          notes = (response.result as any).content;
        }

        setTastingNotes(notes);
        setWineCount(notes.length);
      }
    } catch (error) {
      console.error('Failed to fetch my data:', error);
      setTastingNotes([]); // 에러 시 빈 배열 초기화
    }
  };

  // 포커스 될 때마다 데이터 갱신
  React.useEffect(() => {
    if (isFocused) {
      fetchMyData();
    }
  }, [isFocused]);

  const wineTypes = ['전체', '레드', '화이트', '스파클링', '로제', '디저트', '주정강화', '기타'];

  const getWineTypeColor = (type: string) => {
    switch (type) {
      case '레드': case 'Red': return '#C0392B';
      case '화이트': case 'White': return '#D4AC0D';
      case '스파클링': case 'Sparkling': return '#2980B9';
      case '로제': case 'Rose': return '#C2185B';
      case '디저트': case 'Dessert': return '#D35400';
      default: return '#7F8C8D';
    }
  };

  // 필터링 및 정렬
  const processedNotes = React.useMemo(() => {
    // tastingNotes가 배열이 아니면 빈 배열 반환 (방어 코드)
    if (!Array.isArray(tastingNotes)) return [];

    let filtered = [];

    // 1. 필터링
    if (selectedType === '전체') {
      filtered = [...tastingNotes];
    } else {
      const typeMap: { [key: string]: string } = {
        '레드': 'Red',
        '화이트': 'White',
        '스파클링': 'Sparkling',
        '로제': 'Rose',
        '디저트': 'Dessert',
        '주정강화': 'Fortified'
      };

      if (selectedType === '기타') {
        filtered = tastingNotes.filter(note => {
          const sort = note.sort || '';
          return !['Red', 'White', 'Sparkling', 'Rose', 'Dessert', 'Fortified', '레드', '화이트', '스파클링', '로제', '디저트', '주정강화'].includes(sort);
        });
      } else {
        const targetType = typeMap[selectedType] || selectedType;
        filtered = tastingNotes.filter(note => {
          const sort = note.sort || '';
          return sort === targetType || sort === selectedType || sort.toUpperCase() === targetType.toUpperCase();
        });
      }
    }

    // 2. 정렬
    return filtered.sort((a, b) => {
      switch (sortType) {
        case 'rating_high':
          return b.rating - a.rating;
        case 'rating_low':
          return a.rating - b.rating;
        case 'latest':
        default:
          // createdAt이나 tasteDate 기준 정렬 (문자열 비교)
          return (b.createdAt || '').localeCompare(a.createdAt || '');
      }
    });
  }, [tastingNotes, selectedType, sortType]);

  // 그리드 아이템 렌더링 설정
  const { width } = Dimensions.get('window');
  const numColumns = 3;
  const gap = 12;
  const padding = 24; // ProfileScreen의 좌우 패딩
  // (전체 너비 - 좌우 패딩 - (아이템 간 간격 * (컬럼수 - 1))) / 컬럼수
  const itemWidth = (width - padding * 2 - gap * (numColumns - 1)) / numColumns;

  const renderNoteItem = ({ item }: { item: TastingNotePreviewDTO }) => (
    <TouchableOpacity
      // 서버에서 noteId로 내려올 수 있으므로 tastingNoteId 또는 noteId 사용 (any 타입 캐스팅 활용하여 유연하게 처리)
      key={item.tastingNoteId || (item as any).noteId}
      style={[styles.noteItem, { width: itemWidth }]}
      // 테이스팅 노트 상세 화면으로 이동 (TastingNoteDetailScreen)
      onPress={() => navigation.navigate('TastingNoteDetail', {
        tastingNoteId: item.tastingNoteId || (item as any).noteId
      })}
      activeOpacity={0.8}
    >
      <View style={styles.imageWrapper}>
        {item.imageUrl ? (
          <Image
            source={{ uri: item.imageUrl }}
            style={styles.noteImage}
            resizeMode="contain"
          />
        ) : (
          <View style={[styles.noteImage, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#333' }]}>
            <Icon name="wine" size={30} color="#666" />
          </View>
        )}
        <View style={styles.ratingBadge}>
          <Icon name="star" size={10} color="#f1c40f" />
          <Text style={styles.ratingBadgeText}>{item.rating.toFixed(1)}</Text>
        </View>
      </View>

      <View style={styles.noteInfo}>
        <Text style={styles.noteName} numberOfLines={1} ellipsizeMode="tail">{item.wineName}</Text>
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
              source={userInfo?.profileImage ? { uri: userInfo.profileImage } : require('../assets/Standard_profile.png')}
              style={styles.profileImage}
              resizeMode="cover"
            />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.nickname}>{userInfo?.nickname || '게스트'}</Text>
            <Text style={styles.wineCountText}>마신 와인 {wineCount || 0}병</Text>
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

          {/* 총 개수 및 정렬 버튼 (필터 칩 밑에 같은 줄로 배치) */}
          <View style={styles.countAndSortContainer}>
            <Text style={styles.countText}>
              총 <Text style={styles.countValue}>{processedNotes.length}</Text>병
            </Text>

            {/* 정렬 버튼 */}
            {!Array.isArray(tastingNotes) || tastingNotes.length === 0 ? null : (
              <TouchableOpacity
                style={styles.sortButton}
                onPress={() => setIsSortModalVisible(true)}
              >
                <Text style={styles.sortButtonText}>
                  {sortOptions.find(opt => opt.value === sortType)?.label}
                </Text>
                <Icon name="chevron-down" size={14} color="#888" style={{ marginLeft: 4 }} />
              </TouchableOpacity>
            )}
          </View>

          {/* 그리드 리스트 */}
          {processedNotes.length > 0 ? (
            <View style={styles.gridContainer}>
              {processedNotes.map((item) => (
                <View key={item.tastingNoteId || (item as any).noteId} style={{ marginBottom: 16 }}>
                  {renderNoteItem({ item })}
                </View>
              ))}
              {/* 그리드 정렬을 위한 빈 아이템 (필요 시) */}
              {[...Array(numColumns - (processedNotes.length % numColumns || numColumns))].map((_, i) => (
                <View key={`empty-${i}`} style={{ width: itemWidth }} />
              ))}
            </View>
          ) : (
            <View style={styles.emptyWrapper}>
              <Text style={styles.emptyText}>아직 기록된 와인이 없습니다.</Text>
              <Text style={styles.emptySubText}>마신 와인을 기록해보세요!</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* 정렬 모달 */}
      <Modal
        visible={isSortModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsSortModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsSortModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>정렬</Text>
                  <TouchableOpacity onPress={() => setIsSortModalVisible(false)}>
                    <Icon name="close" size={24} color="#fff" />
                  </TouchableOpacity>
                </View>
                {sortOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={styles.sortOptionItem}
                    onPress={() => {
                      setSortType(option.value);
                      setIsSortModalVisible(false);
                    }}
                  >
                    <Text style={[
                      styles.sortOptionText,
                      sortType === option.value && styles.sortOptionTextSelected
                    ]}>
                      {option.label}
                    </Text>
                    {sortType === option.value && (
                      <Icon name="checkmark" size={20} color="#8e44ad" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
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
    transform: [{ scale: 1.3 }], // 이미지를 확대해서 보여줌
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
    marginBottom: 20,
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
  countAndSortContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  countText: {
    color: '#888',
    fontSize: 14,
  },
  countValue: {
    color: '#fff',
    fontWeight: 'bold',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  sortButtonText: {
    color: '#888',
    fontSize: 13,
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
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 24,
    justifyContent: 'space-between', // gap 대신 사용 (React Native 버전에 따라 gap 지원 여부가 다를 수 있음)
  },
  noteItem: {
    flexDirection: 'column',
    marginBottom: 16, // 간격 조정
    backgroundColor: '#2a2a2a', // 배경색 통일
    borderRadius: 12,
    overflow: 'hidden', // 자식 요소(이미지 등)가 둥근 모서리를 넘치지 않게
    // padding: 12, // 제거 (MyWineScreen 스타일 따름)
    // alignItems: 'center', // 제거
  },
  imageWrapper: {
    width: '100%',
    aspectRatio: 1, // 정사각형
    backgroundColor: '#2a2a2a', // 여백이 자연스럽게 보이도록 배경색 변경
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10, // 이미지가 너무 꽉 차지 않도록 여백 추가
  },
  noteImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  ratingBadge: {
    position: 'absolute',
    top: 6,    // 상단으로 이동
    right: 6,  // 우측으로 이동
    backgroundColor: 'rgba(0, 0, 0, 0.6)', // 반투명 배경
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    borderWidth: 1, // 테두리 추가 (MyWineScreen 스타일 따름)
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  ratingBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  noteInfo: {
    padding: 8, // 내부 패딩 추가
    justifyContent: 'center',
    alignItems: 'flex-start', // 왼쪽 정렬
  },
  noteName: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  noteDate: {
    color: '#666',
    fontSize: 11,
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

  // 모달 스타일
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '50%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  sortOptionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  sortOptionText: {
    fontSize: 16,
    color: '#ccc',
  },
  sortOptionTextSelected: {
    color: '#8e44ad',
    fontWeight: 'bold',
  },
});

export default ProfileScreen;
