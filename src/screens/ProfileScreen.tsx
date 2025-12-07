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
import { getMyWines } from '../api/wine';

const ProfileScreen = () => {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const { user: userInfo, recommendations } = useUser();
  const [selectedType, setSelectedType] = React.useState('전체');
  const [wineCount, setWineCount] = React.useState(0);

  React.useEffect(() => {
    if (isFocused) {
      fetchMyWinesCount();
    }
  }, [isFocused]);

  const fetchMyWinesCount = async () => {
    try {
      const response = await getMyWines();
      if (response.isSuccess) {
        setWineCount(response.result ? response.result.length : 0);
      }
    } catch (error) {
      console.error('Failed to fetch wine count:', error);
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
            <Text style={styles.wineCountText}>마신 와인 {wineCount}병</Text>
            {userInfo?.email ? <Text style={styles.email}>{userInfo.email}</Text> : null}
          </View>
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => navigation.navigate('ProfileEdit' as never)}
          >
            <Text style={styles.editButtonText}>수정</Text>
          </TouchableOpacity>
        </View>

        {/* 2. 추천받은 품종 섹션 */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>추천 스타일</Text>
          </View>
          
          {recommendations && recommendations.length > 0 ? (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.carouselContent}
            >
              {recommendations.map((item, index) => (
                <View key={index} style={styles.recommendationCard}>
                  <View style={styles.infoContainer}>
                    <Text style={styles.wineVariety} numberOfLines={1}>{item.variety}</Text>
                    <Text style={styles.wineRegion} numberOfLines={1}>{item.country} {item.region}</Text>
                  </View>
                  
                  <View style={[styles.tagWrapper, { backgroundColor: getWineTypeColor(item.sort), opacity: 1 }]}>
                      <Text style={styles.tagText}>{item.sort}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.emptyWrapper}>
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>아직 분석된 취향 정보가 없습니다.</Text>
                <Text style={styles.emptySubText}>온보딩을 완료하거나 와인을 더 많이 즐겨보세요!</Text>
              </View>
            </View>
          )}
        </View>

        {/* 3. 내가 마신 와인 섹션 */}
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

          <View style={styles.emptyWrapper}>
            <Text style={styles.emptyText}>아직 기록된 와인이 없습니다.</Text>
            <Text style={styles.emptySubText}>마신 와인을 기록해보세요!</Text>
          </View>
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
    marginBottom: 40,
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
});

export default ProfileScreen;
