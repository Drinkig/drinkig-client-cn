import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  LayoutAnimation,
  UIManager,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { DUMMY_WINE_DB, WineDBItem } from '../data/dummyWines';
import {
  addMyWine,
  MyWineAddRequest,
  searchWinesPublic,
  WineUserDTO,
  updateMyWine,
  MyWineUpdateRequest,
  MyWineDTO
} from '../api/wine';
import CustomAlert from '../components/CustomAlert';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const WineAddScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const initialWine = route.params?.wine;
  const myWine = route.params?.myWine as MyWineDTO;
  const isEditMode = !!myWine;


  const [selectedWineId, setSelectedWineId] = useState<number | null>(
    myWine?.wineId || initialWine?.id || null
  );
  const [name, setName] = useState(
    myWine?.wineName || initialWine?.nameKor || ''
  );
  const [type, setType] = useState(
    myWine?.wineSort || initialWine?.type || ''
  );


  const [vintage, setVintage] = useState(
    myWine ? (myWine.vintageYear === 0 ? 'NV' : String(myWine.vintageYear)) : ''
  );


  const [purchasePrice, setPurchasePrice] = useState(
    myWine ? myWine.purchasePrice.toLocaleString() : ''
  );


  const [purchaseDate, setPurchaseDate] = useState(
    myWine?.purchaseDate || new Date().toISOString().split('T')[0]
  );


  const [purchaseType, setPurchaseType] = useState<'offline' | 'direct'>(
    myWine?.purchaseType === 'DIRECT' ? 'direct' : 'offline'
  );
  const [purchaseShop, setPurchaseShop] = useState(myWine?.purchaseShop || '');


  const [searchResults, setSearchResults] = useState<WineUserDTO[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);


  const [activeStep, setActiveStep] = useState((initialWine || myWine) ? 2 : 1);
  const [maxStep, setMaxStep] = useState((initialWine || myWine) ? 2 : 1);


  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{
    title: string;
    message: string;
    onConfirm?: () => void;
  }>({
    title: '',
    message: '',
  });

  const handleShowAlert = (title: string, message: string, onConfirm?: () => void) => {
    setAlertConfig({ title, message, onConfirm });
    setAlertVisible(true);
  };


  useEffect(() => {
    if (initialWine) {
      setSelectedWineId(initialWine.id);
      setName(initialWine.nameKor);
      setType(initialWine.type);
    }
  }, [initialWine]);


  const handleStepChange = (step: number) => {
    if (step > maxStep) return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveStep(prev => prev === step ? 0 : step);
  };

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


  const handleSearch = async (text: string) => {
    setName(text);
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


  const handleSelectWine = (wine: WineUserDTO) => {
    setSelectedWineId(wine.wineId);
    setName(wine.name);
    setType(wine.sort);

    setShowSearchResults(false);


    const nextMaxStep = Math.max(maxStep, 2);
    setMaxStep(nextMaxStep);

    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveStep(2);
  };


  const isFormValid = () => {
    if (!selectedWineId) return false;

    if (!vintage && vintage !== 'NV') return false;

    const priceValue = purchasePrice.replace(/,/g, '');
    if (!purchasePrice || priceValue.length < 4) return false;

    if (!purchaseDate) return false;

    if (!purchaseShop.trim()) return false;

    return true;
  };


  const handleSave = async () => {
    if (!isFormValid()) return;

    if (!selectedWineId) return;

    try {
      if (isEditMode) {

        const requestData: MyWineUpdateRequest = {
          vintageYear: vintage === 'NV' ? 0 : parseInt(vintage, 10),
          purchaseDate: purchaseDate,
          purchasePrice: purchasePrice ? parseInt(purchasePrice.replace(/[^0-9]/g, ''), 10) : 0,
          purchaseType: purchaseType === 'offline' ? 'OFFLINE' : 'DIRECT',
          purchaseShop: purchaseShop,
        };

        const response = await updateMyWine(myWine.myWineId, requestData);

        if (response.isSuccess) {
          handleShowAlert('성공', '와인 정보가 수정되었습니다.', () => {
            navigation.goBack();
          });
        } else {
          handleShowAlert('오류', response.message || '수정에 실패했습니다.');
        }
      } else {

        const requestData: MyWineAddRequest = {
          wineId: selectedWineId,
          vintageYear: vintage === 'NV' ? 0 : parseInt(vintage, 10),
          purchaseDate: purchaseDate,
          purchasePrice: purchasePrice ? parseInt(purchasePrice.replace(/[^0-9]/g, ''), 10) : 0,
          purchaseType: purchaseType === 'offline' ? 'OFFLINE' : 'DIRECT',
          purchaseShop: purchaseShop,
        };

        const response = await addMyWine(requestData);

        if (response.isSuccess) {
          handleShowAlert(
            '성공',
            '내 와인 창고에 추가되었습니다.',
            () => {
              navigation.goBack();
            }
          );
        } else {
          handleShowAlert(
            '오류',
            response.message || '와인 등록에 실패했습니다.'
          );
        }
      }
    } catch (error) {
      console.error('My wine add failed:', error);
      handleShowAlert('오류', '서버 통신 중 문제가 발생했습니다.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <CustomAlert
        visible={alertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={() => setAlertVisible(false)}
        onConfirm={() => {
          setAlertVisible(false);
          if (alertConfig.onConfirm) alertConfig.onConfirm();
        }}
        singleButton={true}
      />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
          <Text style={styles.closeText}>취소</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEditMode ? '와인 정보 수정' : '보유 와인 추가'}
        </Text>
        <TouchableOpacity
          onPress={handleSave}
          style={styles.saveButton}
          disabled={!isFormValid()}
        >
          <Text style={[styles.saveText, !isFormValid() && { color: '#555' }]}>저장</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>


          {!isEditMode && (
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
                (maxStep > 1 && activeStep !== 1) && { color: '#ccc' }
              ]}>
                와인 검색
              </Text>
              <Icon
                name={activeStep === 1 ? "chevron-up" : "chevron-down"}
                size={20}
                color={activeStep === 1 ? "#fff" : (maxStep > 1 ? "#ccc" : "#888")}
              />
            </TouchableOpacity>
          )}

          {activeStep === 1 && (
            <View style={styles.stepContent}>
              <View style={styles.searchSection}>
                <View style={styles.nameInputContainer}>
                  <TextInput
                    style={styles.nameInput}
                    placeholder="와인 이름을 검색하세요"
                    placeholderTextColor="#666"
                    value={name}
                    onChangeText={handleSearch}
                    returnKeyType="search"
                    multiline={false}
                  />


                  {showSearchResults && searchResults.length > 0 && (
                    <View style={styles.searchResultsContainer}>
                      <View>
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
                      </View>
                    </View>
                  )}
                </View>
              </View>
            </View>
          )}


          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => handleStepChange(2)}
            style={styles.stepHeader}
            disabled={maxStep < 2 && activeStep !== 2}
          >
            <View style={[
              styles.stepCircle,
              activeStep >= 2 && styles.stepCircleActive,
              maxStep < 2 && styles.stepCircleDisabled
            ]}>
              <Text style={[
                styles.stepNumber,
                activeStep >= 2 && styles.stepNumberActive,
                maxStep < 2 && styles.stepNumberDisabled
              ]}>2</Text>
            </View>
            <Text style={[
              styles.stepTitle,
              activeStep === 2 && styles.stepTitleActive,
              maxStep < 2 && styles.stepTitleDisabled
            ]}>
              상세 구매 정보
            </Text>
            <Icon
              name={activeStep === 2 ? "chevron-up" : "chevron-down"}
              size={20}
              color={activeStep === 2 ? "#fff" : (maxStep < 2 ? "#444" : "#888")}
            />
          </TouchableOpacity>

          {activeStep === 2 && (
            <View style={styles.stepContent}>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>와인 종류</Text>
                <View style={[styles.inputWrapper, { backgroundColor: '#2a2a2a' }]}>
                  <Text style={[styles.textInput, { color: '#aaa' }]}>{type || '-'}</Text>
                </View>
              </View>


              <View style={styles.inputGroup}>
                <Text style={styles.label}>빈티지 (년도)</Text>
                <View style={styles.vintageInputWrapper}>
                  <TextInput
                    style={styles.vintageInput}
                    placeholder="ex) 2019"
                    placeholderTextColor="#666"
                    keyboardType="numeric"
                    value={vintage}
                    onChangeText={(text) => {
                      if (text !== 'NV') {
                        setVintage(text.replace(/[^0-9]/g, ''));
                      } else {
                        setVintage(text);
                      }
                    }}
                    maxLength={4}
                  />

                  {((vintage.length === 4 && !isNaN(Number(vintage))) || vintage === 'NV') && (
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


              <View style={styles.inputGroup}>
                <Text style={styles.label}>구매가</Text>
                <View style={styles.priceInputWrapper}>
                  <Text style={styles.currencySymbol}>₩</Text>
                  <TextInput
                    style={styles.priceInput}
                    placeholder="0"
                    placeholderTextColor="#666"
                    keyboardType="numeric"
                    value={purchasePrice}
                    onChangeText={(text) => {
                      const numericValue = text.replace(/[^0-9]/g, '');
                      const formattedValue = numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
                      setPurchasePrice(formattedValue);
                    }}
                  />
                  {purchasePrice.replace(/,/g, '').length >= 4 && <Icon name="checkmark-circle" size={20} color="#2ecc71" style={{ marginLeft: 8 }} />}
                </View>
              </View>


              <View style={styles.inputGroup}>
                <Text style={styles.label}>구매처</Text>
                <View style={styles.purchaseTypeContainer}>
                  <TouchableOpacity
                    style={[styles.typeButton, purchaseType === 'offline' && styles.typeButtonActive]}
                    onPress={() => setPurchaseType('offline')}
                  >
                    <Text style={[styles.typeButtonText, purchaseType === 'offline' && styles.typeButtonTextActive]}>매장</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.typeButton, purchaseType === 'direct' && styles.typeButtonActive]}
                    onPress={() => setPurchaseType('direct')}
                  >
                    <Text style={[styles.typeButtonText, purchaseType === 'direct' && styles.typeButtonTextActive]}>직구</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.textInput}
                    placeholder={purchaseType === 'offline' ? "매장 이름을 입력하세요" : "직구 사이트 주소를 입력하세요"}
                    placeholderTextColor="#666"
                    value={purchaseShop}
                    onChangeText={setPurchaseShop}
                  />
                  {purchaseShop.length > 0 && <Icon name="checkmark-circle" size={20} color="#2ecc71" style={{ marginLeft: 8 }} />}
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
                  {purchaseDate.length > 0 && <Icon name="checkmark-circle" size={20} color="#2ecc71" style={{ marginLeft: 8 }} />}
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
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    marginBottom: 16,
    backgroundColor: '#1a1a1a',
  },
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
    paddingLeft: 12,
  },
  searchSection: {
    marginBottom: 24,
    zIndex: 100,
  },
  nameInputContainer: {
    position: 'relative',
    zIndex: 100,
  },
  nameInput: {
    fontSize: 18,
    color: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#444',
    paddingVertical: 8,
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
    width: '100%',
  },
  resultTextContainer: {
    flex: 1,
    marginRight: 24,
  },
  resultNameKor: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    lineHeight: 20,
  },
  resultNameEng: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
  },
  typeChip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    flexShrink: 0,
    marginLeft: 8, // 이름과 간격
  },
  typeChipText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    color: '#888',
    marginBottom: 8,
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
  purchaseTypeContainer: {
    flexDirection: 'row',
    marginBottom: 8,
    gap: 8,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: '#333',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#444',
  },
  typeButtonActive: {
    backgroundColor: '#8e44ad',
    borderColor: '#8e44ad',
  },
  typeButtonText: {
    color: '#888',
    fontSize: 14,
    fontWeight: '600',
  },
  typeButtonTextActive: {
    color: '#fff',
  },
});

export default WineAddScreen;
