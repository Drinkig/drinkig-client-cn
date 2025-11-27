import React from 'react';
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
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { RootStackParamList } from '../types';
import { useWine } from '../context/WineContext';

type MyWineDetailRouteProp = RouteProp<RootStackParamList, 'MyWineDetail'>;

export default function MyWineDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute<MyWineDetailRouteProp>();
  const { wine } = route.params;
  const { removeWine } = useWine();

  const handleDelete = () => {
    Alert.alert(
      '와인 삭제',
      '정말로 이 와인을 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        { 
          text: '삭제', 
          style: 'destructive',
          onPress: () => {
            removeWine(wine.id);
            navigation.goBack();
          }
        },
      ]
    );
  };

  const handleEdit = () => {
    // TODO: 수정 화면으로 이동 (현재는 WineAddScreen을 재사용하거나 별도 EditScreen 필요)
    // 일단 알림만 표시
    Alert.alert('알림', '수정 기능은 준비 중입니다.');
  };

  // 이미지 렌더링
  const renderImage = () => {
    if (wine.imageUri) {
      return (
        <Image source={{ uri: wine.imageUri }} style={styles.wineImage} resizeMode="cover" />
      );
    }
    return (
      <View style={styles.imagePlaceholder}>
        <MaterialCommunityIcons name="bottle-wine" size={60} color="#ccc" />
      </View>
    );
  };

  // 정보 행 렌더링
  const renderInfoRow = (icon: string, label: string, value?: string | null) => (
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
            <Text style={styles.wineName}>{wine.name}</Text>
            <View style={styles.badges}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{wine.type}</Text>
              </View>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{wine.country}</Text>
              </View>
            </View>
            <Text style={styles.grapeText}>{wine.grape}</Text>
          </View>
        </View>

        {/* 구매 정보 섹션 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>구매 정보</Text>
          <View style={styles.infoContainer}>
            {renderInfoRow('calendar', '빈티지', wine.vintage)}
            <View style={styles.divider} />
            {renderInfoRow('cash', '구매가', wine.purchasePrice ? `₩${parseInt(wine.purchasePrice).toLocaleString()}` : null)}
            <View style={styles.divider} />
            {renderInfoRow('store', '구매처', wine.purchaseLocation)}
            <View style={styles.divider} />
            {renderInfoRow('calendar-check', '구매일', wine.purchaseDate)}
          </View>
        </View>

        {/* 추가 정보 섹션 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>상세 정보</Text>
          <View style={styles.infoContainer}>
            {renderInfoRow('truck-delivery', '수입사', wine.importer)}
            <View style={styles.divider} />
            {renderInfoRow('thermometer', '보관 상태', wine.condition)}
          </View>
        </View>
        
        <View style={styles.footer}>
           <Text style={styles.dateText}>등록일: {new Date(wine.createdAt).toLocaleDateString()}</Text>
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
  },
  wineImage: {
    width: 80,
    height: 120,
    borderRadius: 8,
    backgroundColor: '#333',
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
  footer: {
    alignItems: 'flex-end',
    marginTop: 8,
  },
  dateText: {
    color: '#666',
    fontSize: 12,
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

