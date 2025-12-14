import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StatusBar,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
  LayoutAnimation,
  UIManager,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types';
import { createTastingNote, TastingNoteRequest, searchWinesPublic, WineUserDTO } from '../api/wine';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type TastingNoteWriteScreenRouteProp = RouteProp<RootStackParamList, 'TastingNoteWrite'>;

// 색상 팔레트 정의
const COLOR_PALETTES: { [key: string]: { label: string; value: string; color: string }[] } = {
  WHITE: [
    { label: 'Water White', value: 'WATER_WHITE', color: '#FDFAF5' },
    { label: 'Pale Green', value: 'PALE_GREEN', color: '#F2F6DE' },
    { label: 'Straw', value: 'STRAW', color: '#F0EEC2' },
    { label: 'Pale Yellow', value: 'PALE_YELLOW', color: '#F4ECA6' },
    { label: 'Lemon', value: 'LEMON', color: '#F7E666' },
    { label: 'Butter Yellow', value: 'BUTTER_YELLOW', color: '#F4D355' },
    { label: 'Gold', value: 'GOLD', color: '#EBC046' },
    { label: 'Deep Gold', value: 'DEEP_GOLD', color: '#D9A934' },
    { label: 'Old Gold', value: 'OLD_GOLD', color: '#C49226' },
    { label: 'Pale Amber', value: 'PALE_AMBER', color: '#C78529' },
    { label: 'Amber', value: 'AMBER', color: '#B06D1F' },
    { label: 'Brown', value: 'BROWN', color: '#8C531B' },
  ],
  RED: [
    { label: 'Pinkish Purple', value: 'PINKISH_PURPLE', color: '#A63B6B' },
    { label: 'Bright Violet', value: 'BRIGHT_VIOLET', color: '#8C184E' },
    { label: 'Purple', value: 'PURPLE', color: '#750936' },
    { label: 'Deep Purple', value: 'DEEP_PURPLE', color: '#590526' },
    { label: 'Ruby', value: 'RUBY', color: '#8A0F1D' },
    { label: 'Deep Ruby', value: 'DEEP_RUBY', color: '#660A13' },
    { label: 'Blackish Red', value: 'BLACKISH_RED', color: '#3B040B' },
    { label: 'Garnet', value: 'GARNET', color: '#7B2618' },
    { label: 'Brick Red', value: 'BRICK_RED', color: '#8D361F' },
    { label: 'Tawny', value: 'TAWNY', color: '#934626' },
    { label: 'Mahogany', value: 'MAHOGANY', color: '#632D19' },
  ],
  ROSE: [
    { label: 'Grey Pink', value: 'GREY_PINK', color: '#FBE6E3' },
    { label: 'Pale Blush', value: 'PALE_BLUSH', color: '#FADADD' },
    { label: 'Shell Pink', value: 'SHELL_PINK', color: '#F7BFBE' },
    { label: 'Salmon', value: 'SALMON', color: '#F5A99B' },
    { label: 'Peach', value: 'PEACH', color: '#F5B695' },
    { label: 'Pink', value: 'PINK', color: '#F28E95' },
    { label: 'Rose', value: 'ROSE', color: '#E86A76' },
    { label: 'Deep Rose', value: 'DEEP_ROSE', color: '#D64858' },
    { label: 'Cherry', value: 'CHERRY', color: '#C93648' },
    { label: 'Onion Skin', value: 'ONION_SKIN', color: '#D47A60' },
  ],
  SPARKLING: [
    { label: 'Silver', value: 'SILVER', color: '#FAFBE6' },
    { label: 'Greenish Yellow', value: 'GREENISH_YELLOW', color: '#F4F6D4' },
    { label: 'Pale Gold', value: 'PALE_GOLD', color: '#F2E9AA' },
    { label: 'Rich Gold', value: 'RICH_GOLD', color: '#EAC65F' },
    { label: 'Deep Gold', value: 'DEEP_GOLD', color: '#D9A934' },
    { label: 'Old Gold', value: 'OLD_GOLD', color: '#C49226' },
    { label: 'Amber', value: 'AMBER', color: '#B06D1F' },
    { label: 'Rose Gold', value: 'ROSE_GOLD', color: '#D69562' },
  ],
  DESSERT: [
    { label: 'Honey', value: 'HONEY', color: '#E3B836' },
    { label: 'Topaz', value: 'TOPAZ', color: '#D69426' },
    { label: 'Amber', value: 'AMBER', color: '#BF731F' },
    { label: 'Caramel', value: 'CARAMEL', color: '#A65E1C' },
    { label: 'Rust', value: 'RUST', color: '#8F4217' },
    { label: 'Chestnut', value: 'CHESTNUT', color: '#703212' },
    { label: 'Coffee', value: 'COFFEE', color: '#54220E' },
    { label: 'Dark Brown', value: 'DARK_BROWN', color: '#3D1606' },
    { label: 'Ebony', value: 'EBONY', color: '#260D04' },
  ],
  FORTIFIED: [
    { label: 'Honey', value: 'HONEY', color: '#E3B836' },
    { label: 'Topaz', value: 'TOPAZ', color: '#D69426' },
    { label: 'Amber', value: 'AMBER', color: '#BF731F' },
    { label: 'Caramel', value: 'CARAMEL', color: '#A65E1C' },
    { label: 'Rust', value: 'RUST', color: '#8F4217' },
    { label: 'Chestnut', value: 'CHESTNUT', color: '#703212' },
    { label: 'Coffee', value: 'COFFEE', color: '#54220E' },
    { label: 'Dark Brown', value: 'DARK_BROWN', color: '#3D1606' },
    { label: 'Ebony', value: 'EBONY', color: '#260D04' },
  ],
};

export default function TastingNoteWriteScreen() {
  const navigation = useNavigation();
  const route = useRoute<TastingNoteWriteScreenRouteProp>();
  
  // 파라미터가 없을 수도 있으므로 기본값 처리 또는 undefined 확인
  const params = route.params || {};
  const [selectedWine, setSelectedWine] = useState<{
    wineId?: number;
    wineName?: string;
    wineImage?: string;
    wineType?: string;
  }>({
    wineId: params.wineId,
    wineName: params.wineName,
    wineImage: params.wineImage,
    wineType: params.wineType,
  });

  // 검색 상태 관리
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState<WineUserDTO[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  const getPaletteType = (type?: string) => {
    if (!type) return 'RED';
    const upper = type.toUpperCase();
    if (upper === 'RED' || upper === '레드') return 'RED';
    if (upper === 'WHITE' || upper === '화이트') return 'WHITE';
    if (upper === 'ROSE' || upper === '로제') return 'ROSE';
    if (upper === 'SPARKLING' || upper === '스파클링') return 'SPARKLING';
    if (upper === 'DESSERT' || upper === '디저트') return 'DESSERT';
    if (upper === 'FORTIFIED' || upper === '주정강화') return 'FORTIFIED';
    return 'RED'; // Default or fallback
  };

  // route.params가 변경되면 상태 업데이트
  useEffect(() => {
    if (route.params?.wineId) {
      setSelectedWine({
        wineId: route.params.wineId,
        wineName: route.params.wineName,
        wineImage: route.params.wineImage,
        wineType: route.params.wineType,
      });
      // 와인 타입에 맞는 팔레트의 첫 번째 색상을 기본값으로 설정하지 않고 비워둠 (사용자 선택 유도)
      // 또는 첫번째 값 설정: setColor(COLOR_PALETTES[getPaletteType(route.params.wineType)][0].value);
      setColor('');
    }
  }, [route.params]);

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

  // Form State
  const [vintageYear, setVintageYear] = useState('');
  const [color, setColor] = useState(''); 
  const [tasteDate, setTasteDate] = useState(new Date().toISOString().split('T')[0]); // YYYY-MM-DD
  
  // 5 Taste Indicators (1-5 Level)
  const [sweetness, setSweetness] = useState(0);
  const [acidity, setAcidity] = useState(0);
  const [tannin, setTannin] = useState(0);
  const [body, setBody] = useState(0);
  const [alcohol, setAlcohol] = useState(0);
  
  const [nose, setNose] = useState('');
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  const isFormValid = 
    selectedWine.wineId &&
    color !== '' &&
    tasteDate !== '' &&
    sweetness > 0 &&
    acidity > 0 &&
    tannin > 0 &&
    body > 0 &&
    alcohol > 0 &&
    rating > 0;

  const handleRating = (value: number) => {
    setRating(value);
  };

  const mapLevelToValue = (level: number) => level * 20;

  // 검색 로직
  const handleSearch = async (text: string) => {
    setSearchText(text);
    if (text.trim().length > 0) {
      try {
        const response = await searchWinesPublic({
          searchName: text,
          page: 0,
          size: 5
        });
        
        if (response.isSuccess) {
          setSearchResults(response.result.content);
          setShowSearchResults(true);
        } else {
          setSearchResults([]);
          setShowSearchResults(false);
        }
      } catch (error) {
        console.error('Search failed:', error);
        setSearchResults([]);
      }
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  };

  // 검색 결과 선택
  const handleSelectWine = (wine: WineUserDTO) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelectedWine({
      wineId: wine.wineId,
      wineName: wine.name,
      wineImage: wine.imageUrl,
      wineType: wine.sort,
    });
    setColor('');
    setSearchText('');
    setShowSearchResults(false);
  };

  const resetSelection = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelectedWine({});
    setSearchText('');
  };

  const handleSubmit = async () => {
    if (!selectedWine.wineId) {
      Alert.alert('오류', '와인을 선택해주세요.');
      return;
    }
    if (!tasteDate) {
      Alert.alert('오류', '시음 날짜를 입력해주세요.');
      return;
    }
    if (!color) {
      Alert.alert('오류', '와인 색상을 선택해주세요.');
      return;
    }
    if (sweetness === 0 || acidity === 0 || tannin === 0 || body === 0 || alcohol === 0) {
      Alert.alert('오류', '모든 맛 평가 항목을 선택해주세요.');
      return;
    }
    if (rating === 0) {
      Alert.alert('오류', '별점을 선택해주세요.');
      return;
    }

    setIsSubmitting(true);

    try {
      const requestData: TastingNoteRequest = {
        wineId: selectedWine.wineId,
        vintageYear: vintageYear === 'NV' ? 0 : (vintageYear ? parseInt(vintageYear, 10) : undefined),
        color: color.toUpperCase(), // Ensure uppercase for server
        tasteDate,
        sweetness: mapLevelToValue(sweetness),
        acidity: mapLevelToValue(acidity),
        tannin: mapLevelToValue(tannin),
        body: mapLevelToValue(body),
        alcohol: mapLevelToValue(alcohol),
        nose: nose.split(',').map(s => s.trim()).filter(s => s.length > 0),
        rating,
        review,
      };

      const response = await createTastingNote(requestData);
      
      if (response.isSuccess) {
        Alert.alert('성공', '테이스팅 노트가 저장되었습니다.', [
          { text: '확인', onPress: () => navigation.goBack() }
        ]);
      } else {
        Alert.alert('실패', response.message || '저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('Tasting note submit error:', error);
      Alert.alert('오류', '네트워크 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderColorSelector = () => {
    const paletteType = getPaletteType(selectedWine.wineType);
    const palette = COLOR_PALETTES[paletteType] || COLOR_PALETTES['WHITE'];

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>와인 색상</Text>
        <View style={styles.colorPaletteContainer}>
          {palette.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.colorOption,
                color === option.value && styles.colorOptionSelected
              ]}
              onPress={() => setColor(option.value)}
            >
              <View style={[styles.colorCircle, { backgroundColor: option.color }]} />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderLevelSelector = (label: string, value: number, onChange: (val: number) => void) => (
    <View style={styles.levelContainer}>
      <Text style={styles.levelLabel}>{label}</Text>
      <View style={styles.levelButtons}>
        {[1, 2, 3, 4, 5].map((level) => (
          <TouchableOpacity
            key={level}
            style={[
              styles.levelButton,
              value === level && styles.levelButtonSelected,
              { backgroundColor: value === level ? '#8e44ad' : '#333' }
            ]}
            onPress={() => onChange(level)}
          >
            <Text style={[styles.levelButtonText, value === level && { color: '#fff' }]}>{level}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.levelValueText}>
        {value === 1 ? '매우 약함' : 
         value === 2 ? '약함' : 
         value === 3 ? '보통' : 
         value === 4 ? '강함' : 
         value === 5 ? '매우 강함' : '선택해주세요'}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="close" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>테이스팅 노트 작성</Text>
        <TouchableOpacity onPress={handleSubmit} disabled={isSubmitting || !isFormValid}>
          <Text style={[styles.saveButton, (isSubmitting || !isFormValid) && { color: '#666' }]}>저장</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
          
          {/* 와인 선택 영역 */}
          <View style={[styles.section, { zIndex: 100 }]}>
            <Text style={styles.sectionTitle}>와인 선택</Text>
            
            {selectedWine.wineId ? (
              // 와인이 선택된 상태
              <View style={styles.selectedWineContainer}>
                <View style={styles.wineInfoRow}>
                  {selectedWine.wineImage ? (
                    <Image source={{ uri: selectedWine.wineImage }} style={styles.wineThumbnail} resizeMode="contain" />
                  ) : (
                    <View style={styles.wineThumbnailPlaceholder}>
                       <Icon name="wine" size={30} color="#666" />
                    </View>
                  )}
                  <View style={styles.wineTextInfo}>
                    <Text style={styles.wineName}>{selectedWine.wineName}</Text>
                    <Text style={styles.wineType}>{selectedWine.wineType}</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.changeButton} onPress={resetSelection}>
                  <Text style={styles.changeButtonText}>와인 변경 (검색)</Text>
                </TouchableOpacity>
              </View>
            ) : (
              // 와인 검색 상태 (WineAddScreen 스타일)
              <View style={styles.searchSection}>
                <View style={styles.nameInputContainer}>
                  <View style={styles.searchIconContainer}>
                    <Icon name="search" size={20} color="#888" />
                  </View>
                  <TextInput
                    style={styles.nameInput}
                    placeholder="와인 이름을 검색하세요"
                    placeholderTextColor="#666"
                    value={searchText}
                    onChangeText={handleSearch}
                    returnKeyType="search"
                  />
                  
                  {/* 검색 결과 리스트 */}
                  {showSearchResults && searchResults.length > 0 && (
                    <View style={styles.searchResultsContainer}>
                      <ScrollView 
                        keyboardShouldPersistTaps="handled" 
                        nestedScrollEnabled={true}
                        showsVerticalScrollIndicator={true}
                      >
                        {searchResults.map((item) => (
                          <TouchableOpacity 
                            key={item.wineId}
                            style={styles.searchResultItem}
                            onPress={() => handleSelectWine(item)}
                          >
                            <View style={styles.resultTextContainer}>
                              <Text style={styles.resultNameKor}>{item.name}</Text>
                              <Text style={styles.resultNameEng}>{item.nameEng}</Text>
                            </View>
                            <View style={[styles.typeChip, { backgroundColor: getWineTypeColor(item.sort) }]}>
                              <Text style={styles.typeChipText}>{item.sort}</Text>
                            </View>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>
              </View>
            )}
          </View>
          
          {selectedWine.wineId && (
            <>
              {/* Basic Info */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>기본 정보</Text>
                
                <View style={styles.row}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.label}>빈티지 (연도)</Text>
                    <View style={[
                      styles.vintageInputWrapper,
                      vintageYear.length === 4 && vintageYear !== 'NV' && styles.vintageInputWrapperValid
                    ]}>
                      <TextInput
                        style={styles.vintageInput}
                        placeholder="예: 2020"
                        placeholderTextColor="#666"
                        keyboardType="numeric"
                        value={vintageYear}
                        onChangeText={(text) => {
                          if (text !== 'NV') {
                            setVintageYear(text.replace(/[^0-9]/g, ''));
                          } else {
                            setVintageYear(text);
                          }
                        }}
                        maxLength={4}
                      />
                      {vintageYear.length === 4 && vintageYear !== 'NV' ? (
                        <Icon name="checkmark-circle" size={20} color="#8e44ad" style={{ marginRight: 4 }} />
                      ) : (
                        <TouchableOpacity 
                          style={[styles.nvButton, vintageYear === 'NV' && styles.nvButtonActive]}
                          onPress={() => setVintageYear(vintageYear === 'NV' ? '' : 'NV')}
                        >
                          <Text style={[styles.nvButtonText, vintageYear === 'NV' && styles.nvButtonTextActive]}>NV</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                  
                  <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                    <Text style={styles.label}>시음 날짜</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor="#666"
                      value={tasteDate}
                      onChangeText={setTasteDate}
                    />
                  </View>
                </View>
              </View>

              {/* Color Selector */}
              {renderColorSelector()}

              {/* Taste Indicators */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>맛 평가</Text>
                {renderLevelSelector('당도 (Sweetness)', sweetness, setSweetness)}
                {renderLevelSelector('산도 (Acidity)', acidity, setAcidity)}
                {renderLevelSelector('탄닌 (Tannin)', tannin, setTannin)}
                {renderLevelSelector('바디 (Body)', body, setBody)}
                {renderLevelSelector('알코올 (Alcohol)', alcohol, setAlcohol)}
              </View>

              {/* Rating & Review */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>리뷰</Text>
                
                <View style={styles.ratingContainer}>
                  <Text style={styles.label}>별점</Text>
                  <View style={styles.stars}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <TouchableOpacity key={star} onPress={() => handleRating(star)}>
                        <Icon 
                          name={star <= rating ? "star" : "star-outline"} 
                          size={32} 
                          color="#8e44ad" 
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                  <Text style={styles.ratingValue}>{rating}점</Text>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>향 (Nose) - 쉼표(,)로 구분</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="예: 체리, 오크, 바닐라"
                    placeholderTextColor="#666"
                    value={nose}
                    onChangeText={setNose}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>한줄 평</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="와인에 대한 감상을 자유롭게 적어주세요."
                    placeholderTextColor="#666"
                    multiline
                    numberOfLines={4}
                    value={review}
                    onChangeText={setReview}
                  />
                </View>
              </View>
            </>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
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
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  saveButton: {
    color: '#8e44ad',
    fontSize: 16,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
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
  
  // 검색 관련 스타일 (WineAddScreen 스타일 차용)
  searchSection: {
    position: 'relative',
    zIndex: 100,
  },
  nameInputContainer: {
    position: 'relative',
    zIndex: 100,
  },
  searchIconContainer: {
    position: 'absolute',
    left: 12,
    top: 14,
    zIndex: 1,
  },
  nameInput: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 12,
    paddingLeft: 40,
    color: '#fff',
    fontSize: 16,
  },
  searchResultsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 4,
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    zIndex: 999,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#444',
    maxHeight: 250, // 최대 높이 제한
    overflow: 'hidden', // 둥근 모서리 및 영역 밖 컨텐츠 숨김
  },
  searchResultItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultTextContainer: {
    flex: 1,
    marginRight: 16,
  },
  resultNameKor: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  resultNameEng: {
    color: '#888',
    fontSize: 12,
  },
  typeChip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    flexShrink: 0,
  },
  typeChipText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },

  selectedWineContainer: {
    backgroundColor: '#252525',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#444',
  },
  wineInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  wineThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  wineThumbnailPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  wineTextInfo: {
    flex: 1,
    marginLeft: 12,
  },
  wineName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  wineType: {
    color: '#888',
    fontSize: 14,
  },
  changeButton: {
    backgroundColor: '#333',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  changeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  
  // 나머지 입력 폼 스타일
  row: {
    flexDirection: 'row',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  levelContainer: {
    marginBottom: 20,
  },
  levelLabel: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 8,
  },
  levelButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  levelButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#333',
  },
  levelButtonSelected: {
    backgroundColor: '#8e44ad',
  },
  levelButtonText: {
    color: '#888',
    fontSize: 16,
    fontWeight: 'bold',
  },
  levelValueText: {
    color: '#8e44ad',
    fontSize: 12,
    textAlign: 'center',
  },
  colorButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  colorButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#444',
  },
  colorButtonSelected: {
    borderColor: '#8e44ad',
    backgroundColor: 'rgba(142, 68, 173, 0.1)',
  },
  colorButtonText: {
    color: '#888',
    fontSize: 14,
  },
  ratingContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  stars: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  ratingValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  // 새로 추가된 스타일
  vintageInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    paddingRight: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  vintageInputWrapperValid: {
    borderColor: '#8e44ad',
    backgroundColor: 'rgba(142, 68, 173, 0.05)',
  },
  vintageInput: {
    flex: 1,
    padding: 12,
    color: '#fff',
    fontSize: 16,
  },
  nvButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    backgroundColor: '#444',
  },
  nvButtonActive: {
    backgroundColor: '#8e44ad',
  },
  nvButtonText: {
    color: '#888',
    fontSize: 12,
    fontWeight: 'bold',
  },
  nvButtonTextActive: {
    color: '#fff',
  },
  colorPaletteContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    justifyContent: 'center',
  },
  colorOption: {
    width: '14.5%', // 6 items per row approx
    marginHorizontal: '1%',
    marginBottom: 8,
    alignItems: 'center',
    padding: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  colorOptionSelected: {
    borderColor: '#8e44ad',
    backgroundColor: 'rgba(142, 68, 173, 0.1)',
  },
  colorCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: '#444',
  },
});

