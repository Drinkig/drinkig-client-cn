import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

interface SummaryStepProps {
  data: {
    name: string;
    isNewbie: boolean | null;
    monthPrice: number;
    wineSort: string[];
    wineArea: string[];
    wineVariety: string[];
    preferredAlcohols: string[];
    preferredFoods: string[];
  };
}

const SummaryStep = ({ data }: SummaryStepProps) => {
  return (
    <View style={styles.content}>
        <Text style={styles.stepTitle}>입력 내용 확인</Text>
        <ScrollView style={styles.summaryScroll}>
            <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>닉네임</Text>
                <Text style={styles.summaryValue}>{data.name}</Text>
            </View>
            <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>유형</Text>
                <Text style={styles.summaryValue}>
                  {data.isNewbie === true ? '초보' : data.isNewbie === false ? '매니아' : '미선택'}
                </Text>
            </View>
            <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>월 예산</Text>
                <Text style={styles.summaryValue}>{data.monthPrice.toLocaleString()}원</Text>
            </View>
            
            {/* Newbie Info */}
            {data.isNewbie && (
              <>
                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>즐기는 술</Text>
                    <Text style={styles.summaryValue} numberOfLines={1} ellipsizeMode="tail">
                        {data.preferredAlcohols.length > 0 ? data.preferredAlcohols.join(', ') : '미선택'}
                    </Text>
                </View>
                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>선호 안주</Text>
                    <Text style={styles.summaryValue} numberOfLines={1} ellipsizeMode="tail">
                        {data.preferredFoods.length > 0 ? data.preferredFoods.join(', ') : '미선택'}
                    </Text>
                </View>
              </>
            )}

            <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>관심 와인</Text>
                <Text style={styles.summaryValue}>
                    {data.wineSort.length > 0 ? data.wineSort.join(', ') : '미선택'}
                </Text>
            </View>

            {/* Expert Info */}
            {data.isNewbie === false && (
                <>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>선호 국가</Text>
                        <Text style={styles.summaryValue}>
                            {data.wineArea.length > 0 ? data.wineArea.join(', ') : '미선택'}
                        </Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>선호 품종</Text>
                        <Text style={styles.summaryValue}>
                            {data.wineVariety.length > 0 ? data.wineVariety.join(', ') : '미선택'}
                        </Text>
                    </View>
                </>
            )}
        </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingTop: 20,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  summaryScroll: {
    flex: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  summaryLabel: {
    color: '#888',
    fontSize: 16,
  },
  summaryValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    maxWidth: '70%', // 긴 텍스트 줄바꿈/말줄임 처리
    textAlign: 'right',
  },
});

export default SummaryStep;

