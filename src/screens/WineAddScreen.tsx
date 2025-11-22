import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  KeyboardAvoidingView,
  Platform,
  Alert,
  FlatList,
  LayoutAnimation,
  UIManager,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import { launchImageLibrary } from 'react-native-image-picker';
import { useNavigation } from '@react-navigation/native';
import { DUMMY_WINE_DB, WineDBItem } from '../data/dummyWines';
import { useWine } from '../context/WineContext';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const WineTypes = ['레드', '화이트', '스파클링', '로제', '디저트', '주정강화'];

const WineAddScreen = () => {
  const navigation = useNavigation();
  const { addWine } = useWine();

  // 입력 상태 관리
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState('레드');
  const [country, setCountry] = useState('');
  const [grape, setGrape] = useState('');
  const [vintage, setVintage] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [marketPrice, setMarketPrice] = useState(''); // 해평가
  
  // 검색 상태 관리
  const [searchResults, setSearchResults] = useState<WineDBItem[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showManualButton, setShowManualButton] = useState(false);

  // 단계별 상태 관리 (1: 검색, 2: 기본정보, 3: 상세정보)
  const [activeStep, setActiveStep] = useState(1);
  // 완료된 가장 높은 단계 (1단계 완료 -> 2, 2단계 완료 -> 3)
  const [maxStep, setMaxStep] = useState(1);

  // 모든 필수 정보가 입력되었는지 확인하고 자동 이동
  useEffect(() => {
    const hasCountry = country.trim().length > 0;
    const hasGrape = grape.trim().length > 0;
    const hasVintage = vintage === 'NV' || vintage.length === 4;

    if (activeStep === 2 && hasCountry && hasGrape && hasVintage && maxStep < 3) {
      const timer = setTimeout(() => {
        setMaxStep(3);
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setActiveStep(3);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [activeStep, country, grape, vintage, maxStep]);

  // 단계 변경 핸들러
  const handleStepChange = (step: number) => {
    // 이전 단계가 완료되지 않았으면 이동 불가 (현재 단계보다 더 높은 단계로 가려고 할 때)
    if (step > maxStep) {
      return;
    }

    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    // 이미 열려있는 단계를 누르면 닫기 (0으로 설정), 아니면 해당 단계 열기
    setActiveStep(prev => prev === step ? 0 : step);
  };

  // 검색 로직
  const handleSearch = (text: string) => {
    setName(text);
    setShowManualButton(false); // 타이핑 시작하면 버튼 숨김

    if (text.trim().length > 0) {
      const searchKey = text.replace(/\s/g, '').toLowerCase(); // 공백 제거 및 소문자 변환
      
      const filtered = DUMMY_WINE_DB.filter(wine => {
        const nameKorKey = wine.nameKor.replace(/\s/g, '');
        const nameEngKey = wine.nameEng.replace(/\s/g, '').toLowerCase();
        
        return nameKorKey.includes(searchKey) || nameEngKey.includes(searchKey);
      });
      
      setSearchResults(filtered);
      setShowSearchResults(true);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  };

  // 엔터(Submit) 시 처리
  const handleSubmitSearch = () => {
    if (searchResults.length === 0 && name.trim().length > 0) {
      setShowManualButton(true); // 결과 없으면 버튼 표시
    }
  };

  // 직접 추가하기 핸들러
  const handleManualAdd = () => {
    setShowSearchResults(false);
    setShowManualButton(false);
    
    // 2단계 활성화 및 이동
    const nextMaxStep = Math.max(maxStep, 2);
    setMaxStep(nextMaxStep);
    
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveStep(2);
  };

  // 검색 결과 선택
  const handleSelectWine = (wine: WineDBItem) => {
    setName(wine.nameKor); // 한글 이름 자동 입력 (또는 영문 선택 가능)
    setType(wine.type);
    setCountry(wine.country);
    setGrape(wine.grape);
    
    setShowSearchResults(false); // 검색창 닫기
    
    // 2단계 활성화 및 이동
    const nextMaxStep = Math.max(maxStep, 2);
    setMaxStep(nextMaxStep);
    
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveStep(2);
  };
  
  // 상세 정보 토글 (더 이상 사용 안함, activeStep으로 대체)
  // const [showDetails, setShowDetails] = useState(false);
  
  // 상세 정보 상태
  const [purchaseLocation, setPurchaseLocation] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]); // YYYY-MM-DD
  const [importer, setImporter] = useState('');
  const [condition, setCondition] = useState('');

  // 이미지 선택
  const handleSelectImage = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.8,
      selectionLimit: 1,
    });

    if (result.assets && result.assets.length > 0) {
      setImageUri(result.assets[0].uri || null);
    }
  };

  // 저장
  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('알림', '와인 이름을 입력해주세요.');
      return;
    }
    
    // 데이터 저장
    addWine({
      name,
      type,
      country,
      grape,
      vintage,
      purchasePrice,
      marketPrice,
      purchaseLocation,
      purchaseDate,
      importer,
      condition,
      imageUri,
    });
    
    console.log('Saved:', { name, type, country, grape, vintage, purchasePrice, marketPrice });
    
    navigation.goBack();
  };

  // 다음 단계로 이동 (Step 2 -> Step 3) - 현재는 수동 호출 없음
  const handleNextStep = () => {
    const nextMaxStep = Math.max(maxStep, 3);
    setMaxStep(nextMaxStep);
    
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveStep(3);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
          <Text style={styles.closeText}>취소</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>와인 등록</Text>
        <TouchableOpacity 
          onPress={handleSave} 
          style={styles.saveButton}
          disabled={maxStep < 3}
        >
          <Text style={[styles.saveText, maxStep < 3 && { color: '#555' }]}>저장</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          
          {/* Step 1: 와인 이름 및 사진 */}
          <TouchableOpacity 
            activeOpacity={0.8}
            onPress={() => handleStepChange(1)}
            style={styles.stepHeader}
          >
            <View style={[
              styles.stepCircle, 
              activeStep >= 1 && styles.stepCircleActive,
              maxStep > 1 && styles.stepCircleCompleted
            ]}>
              {maxStep > 1 ? (
                <Icon name="checkmark" size={16} color="#fff" />
              ) : (
                <Text style={[styles.stepNumber, activeStep >= 1 && styles.stepNumberActive]}>1</Text>
              )}
            </View>
            <Text style={[
              styles.stepTitle, 
              activeStep === 1 && styles.stepTitleActive,
              (maxStep > 1 && activeStep !== 1) && { color: '#ccc' } // 완료되었지만 현재 닫혀있을 때만 회색
            ]}>
              와인 검색
            </Text>
            <Icon 
              name={activeStep === 1 ? "chevron-up" : "chevron-down"} 
              size={20} 
              color={activeStep === 1 ? "#fff" : (maxStep > 1 ? "#ccc" : "#888")} 
            />
          </TouchableOpacity>

          {activeStep === 1 && (
            <View style={styles.stepContent}>
              {/* 1. 와인 이름 (검색) */}
              <View style={styles.searchSection}>
                <View style={styles.nameInputContainer}>
                  {/* <Text style={styles.label}>와인 이름 (검색)</Text> */}
                  <TextInput
                    style={styles.nameInput}
                    placeholder="와인 이름을 검색하세요"
                    placeholderTextColor="#666"
                    value={name}
                    onChangeText={handleSearch}
                    onSubmitEditing={handleSubmitSearch} // 엔터 처리
                    returnKeyType="search" // 엔터 키를 '검색'으로 표시
                    multiline={false}
                  />
                  
                  {/* 검색 결과 리스트 (Z-Index 높음) */}
                  {((showSearchResults && searchResults.length > 0) || showManualButton) && (
                    <View style={styles.searchResultsContainer}>
                      {searchResults.length > 0 ? (
                        <ScrollView
                          style={{ maxHeight: 200 }}
                          nestedScrollEnabled
                          keyboardShouldPersistTaps="handled"
                        >
                          {searchResults.map((item) => (
                            <TouchableOpacity 
                              key={item.id}
                              style={styles.searchResultItem}
                              onPress={() => handleSelectWine(item)}
                            >
                              <View>
                                <Text style={styles.resultNameKor}>{item.nameKor}</Text>
                                <Text style={styles.resultNameEng}>{item.nameEng}</Text>
                              </View>
                              <Text style={styles.resultType}>{item.type}</Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      ) : showManualButton && (
                        // 검색 결과가 없을 때만 직접 추가 버튼 표시
                        <TouchableOpacity 
                          style={styles.manualAddButton} 
                          onPress={handleManualAdd}
                        >
                          <Text style={styles.manualAddText}>'{name}' 직접 추가하기</Text>
                          <Icon name="arrow-forward" size={16} color="#8e44ad" />
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </View>
              </View>
            </View>
          )}

          {/* Step 2: 기본 정보 */}
          <TouchableOpacity 
            activeOpacity={0.8}
            onPress={() => handleStepChange(2)}
            style={styles.stepHeader}
            disabled={maxStep < 2 && activeStep !== 2}
          >
            <View style={[
              styles.stepCircle, 
              activeStep >= 2 && styles.stepCircleActive,
              maxStep < 2 && styles.stepCircleDisabled,
              maxStep > 2 && styles.stepCircleCompleted
            ]}>
              {maxStep > 2 ? (
                <Icon name="checkmark" size={16} color="#fff" />
              ) : (
                <Text style={[
                  styles.stepNumber, 
                  activeStep >= 2 && styles.stepNumberActive,
                  maxStep < 2 && styles.stepNumberDisabled
                ]}>2</Text>
              )}
            </View>
            <Text style={[
              styles.stepTitle, 
              activeStep === 2 && styles.stepTitleActive,
              maxStep < 2 && styles.stepTitleDisabled
            ]}>
              기본 정보
            </Text>
            <Icon 
              name={activeStep === 2 ? "chevron-up" : "chevron-down"} 
              size={20} 
              color={activeStep === 2 ? "#fff" : (maxStep < 2 ? "#444" : "#888")} 
            />
          </TouchableOpacity>

          {activeStep === 2 && (
            <View style={styles.stepContent}>
              {/* 2. 기본 정보 (종류, 국가, 품종, 빈티지) */}
              <View style={styles.section}>
                
                {/* 와인 종류 (가로 스크롤 칩) */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeScroll}>
                  {WineTypes.map((t) => (
                    <TouchableOpacity
                      key={t}
                      style={[styles.typeChip, type === t && styles.typeChipActive]}
                      onPress={() => setType(t)}
                    >
                      <Text style={[styles.typeText, type === t && styles.typeTextActive]}>{t}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* 국가 & 품종 입력 */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>국가 / 지역</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.textInput}
                      placeholder="ex) 프랑스, 보르도"
                      placeholderTextColor="#666"
                      value={country}
                      onChangeText={setCountry}
                    />
                    {country.length > 0 && (
                      <Icon name="checkmark-circle" size={20} color="#2ecc71" />
                    )}
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>품종</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.textInput}
                      placeholder="ex) 카베르네 소비뇽, 메를로"
                      placeholderTextColor="#666"
                      value={grape}
                      onChangeText={setGrape}
                    />
                    {grape.length > 0 && (
                      <Icon name="checkmark-circle" size={20} color="#2ecc71" />
                    )}
                  </View>
                </View>

                {/* 빈티지 입력 */}
                <View style={styles.rowInput}>
                  <View style={styles.halfInputContainer}>
                    <Text style={styles.label}>빈티지 (년도)</Text>
                    <View style={styles.vintageInputWrapper}>
                      <TextInput
                        style={styles.vintageInput}
                        placeholder="ex) 2019"
                        placeholderTextColor="#666"
                        keyboardType="numeric"
                        value={vintage}
                        onChangeText={(text) => {
                          // NV가 아닌 경우 숫자만 입력 허용
                          if (text !== 'NV') {
                            setVintage(text.replace(/[^0-9]/g, ''));
                          } else {
                            setVintage(text);
                          }
                        }}
                        maxLength={4}
                      />
                      {(vintage === 'NV' || vintage.length === 4) && (
                        <Icon name="checkmark-circle" size={20} color="#2ecc71" style={{ marginRight: 8 }} />
                      )}
                      <TouchableOpacity 
                        style={[styles.nvButton, vintage === 'NV' && styles.nvButtonActive]}
                        onPress={() => setVintage(vintage === 'NV' ? '' : 'NV')}
                      >
                        <Text style={[styles.nvButtonText, vintage === 'NV' && styles.nvButtonTextActive]}>NV</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View style={styles.halfInputContainer} /> 
                </View>
              </View>
            </View>
          )}

          {/* Step 3: 상세 정보 */}
          <TouchableOpacity 
            activeOpacity={0.8}
            onPress={() => handleStepChange(3)}
            style={styles.stepHeader}
            disabled={maxStep < 3 && activeStep !== 3}
          >
            <View style={[
              styles.stepCircle, 
              activeStep >= 3 && styles.stepCircleActive,
              maxStep < 3 && styles.stepCircleDisabled
            ]}>
              <Text style={[
                styles.stepNumber, 
                activeStep >= 3 && styles.stepNumberActive,
                maxStep < 3 && styles.stepNumberDisabled
              ]}>3</Text>
            </View>
            <Text style={[
              styles.stepTitle, 
              activeStep === 3 && styles.stepTitleActive,
              maxStep < 3 && styles.stepTitleDisabled
            ]}>
              상세 구매 정보
            </Text>
            <Icon 
              name={activeStep === 3 ? "chevron-up" : "chevron-down"} 
              size={20} 
              color={activeStep === 3 ? "#fff" : (maxStep < 3 ? "#444" : "#888")} 
            />
          </TouchableOpacity>

          {activeStep === 3 && (
            <View style={styles.stepContent}>
              {/* 3. 가격 정보 (구매가, 해평가) - Step 2에서 이동됨 */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>가격 정보</Text>
                <View style={styles.rowInput}>
                  <View style={styles.halfInputContainer}>
                    <Text style={styles.label}>구매가</Text>
                    <View style={styles.priceInputWrapper}>
                      <Text style={styles.currencySymbol}>₩</Text>
                      <TextInput
                        style={styles.priceInput}
                        placeholder="0"
                        placeholderTextColor="#666"
                        keyboardType="numeric"
                        value={purchasePrice}
                        onChangeText={setPurchasePrice}
                      />
                    </View>
                  </View>
                  <View style={styles.halfInputContainer}>
                    <Text style={styles.label}>해외 평균가</Text>
                    <View style={styles.priceInputWrapper}>
                      <Text style={styles.currencySymbol}>$</Text>
                      <TextInput
                        style={styles.priceInput}
                        placeholder="0"
                        placeholderTextColor="#666"
                        keyboardType="numeric"
                        value={marketPrice}
                        onChangeText={setMarketPrice}
                      />
                    </View>
                  </View>
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>상세 구매 정보</Text>
                <View style={styles.detailsForm}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>구매처</Text>
                    <View style={styles.inputWrapper}>
                      <TextInput
                        style={styles.textInput}
                        placeholder="구매한 장소 입력"
                        placeholderTextColor="#666"
                        value={purchaseLocation}
                        onChangeText={setPurchaseLocation}
                      />
                    </View>
                  </View>
                  
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>구매일자</Text>
                    <View style={styles.inputWrapper}>
                      <TextInput
                        style={styles.textInput}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor="#666"
                        value={purchaseDate}
                        onChangeText={setPurchaseDate}
                      />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>수입사</Text>
                    <View style={styles.inputWrapper}>
                      <TextInput
                        style={styles.textInput}
                        placeholder="수입사 입력"
                        placeholderTextColor="#666"
                        value={importer}
                        onChangeText={setImporter}
                      />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>구매 시 상태</Text>
                    <View style={styles.inputWrapper}>
                      <TextInput
                        style={styles.textInput}
                        placeholder="라벨 손상, 캡슐 상태 등"
                        placeholderTextColor="#666"
                        value={condition}
                        onChangeText={setCondition}
                      />
                    </View>
                  </View>
                </View>
              </View>
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
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
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeButton: {
    padding: 8,
  },
  closeText: {
    color: '#888',
    fontSize: 16,
  },
  saveButton: {
    padding: 8,
  },
  saveText: {
    color: '#8e44ad',
    fontSize: 16,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  searchSection: {
    marginBottom: 24,
    zIndex: 100, // 검색 결과가 아래 요소들을 덮도록 최상위
  },
  imageSection: {
    marginBottom: 32,
    zIndex: 1,
  },
  imageUpload: {
    width: 100,
    height: 140, // 와인 라벨 비율 고려 (세로형)
    backgroundColor: '#333',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#444',
    overflow: 'hidden',
    marginTop: 8,
  },
  uploadedImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    alignItems: 'center',
  },
  imageText: {
    color: '#888',
    fontSize: 12,
    marginTop: 8,
  },
  nameInputContainer: {
    position: 'relative', // 검색 결과 리스트 위치 잡기 위해
    zIndex: 100,
  },
  label: {
    fontSize: 13,
    color: '#888',
    marginBottom: 8,
    marginTop: 8, // 상단 여백 추가
  },
  nameInput: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#444',
    paddingVertical: 8,
  },
  searchResultsContainer: {
    position: 'absolute',
    top: 45, // 입력창 바로 아래 위치 (라벨 제거로 높이 조정)
    left: 0,
    right: 0,
    backgroundColor: '#2a2a2a', // 배경색을 조금 더 밝게 해서 구분
    borderRadius: 8,
    maxHeight: 200,
    zIndex: 999, // 아주 높게 설정
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#444',
  },
  searchResultItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultNameKor: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultNameEng: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
  },
  resultType: {
    color: '#8e44ad',
    fontSize: 12,
  },
  manualAddButton: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  manualAddText: {
    color: '#8e44ad',
    fontSize: 14,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  typeScroll: {
    marginBottom: 16,
  },
  typeChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#333',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#444',
  },
  typeChipActive: {
    backgroundColor: '#8e44ad',
    borderColor: '#8e44ad',
  },
  typeText: {
    color: '#888',
    fontSize: 14,
  },
  typeTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  rowInput: {
    flexDirection: 'row',
    gap: 16,
  },
  halfInputContainer: {
    flex: 1,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#444',
    paddingHorizontal: 12,
  },
  textInput: {
    flex: 1,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 16,
  },
  input: { // 하위 호환을 위해 남겨두거나 삭제 (Step 3에서 사용 중인지 확인)
    backgroundColor: '#333',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#444',
  },
  priceInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#444',
    paddingHorizontal: 12,
  },
  currencySymbol: {
    color: '#888',
    fontSize: 16,
    marginRight: 8,
  },
  priceInput: {
    flex: 1,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 16,
  },
  vintageInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#444',
    paddingRight: 8,
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
  detailsToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  detailsForm: {
    marginTop: 8,
    gap: 16,
  },
  inputGroup: {
    marginBottom: 4,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    marginBottom: 16,
    backgroundColor: '#1a1a1a', // 배경색 명시 (애니메이션 시 투명도 이슈 방지)
  },
  // stepHeaderDisabled 삭제 (Opacity 로직 제거하여 Active 상태 보장)
  stepCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#666',
  },
  stepCircleActive: {
    backgroundColor: '#8e44ad',
    borderColor: '#8e44ad',
  },
  stepCircleCompleted: {
    backgroundColor: '#2ecc71',
    borderColor: '#2ecc71',
  },
  stepCircleDisabled: {
    borderColor: '#444',
    backgroundColor: '#222',
  },
  stepNumber: {
    color: '#888',
    fontSize: 12,
    fontWeight: 'bold',
  },
  stepNumberActive: {
    color: '#fff',
  },
  stepNumberDisabled: {
    color: '#444',
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#888',
    flex: 1,
  },
  stepTitleActive: {
    color: '#fff',
  },
  stepTitleDisabled: {
    color: '#555',
  },
  stepContent: {
    marginBottom: 24,
    paddingLeft: 12, // 살짝 들여쓰기
  },
  nextButton: {
    backgroundColor: '#333',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#8e44ad',
  },
  nextButtonText: {
    color: '#8e44ad',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default WineAddScreen;

