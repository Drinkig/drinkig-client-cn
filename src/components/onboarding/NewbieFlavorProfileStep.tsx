import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { FlavorProfile } from './FlavorProfileStep';

interface NewbieFlavorProfileStepProps {
  attribute: keyof FlavorProfile;
  value: number | null | undefined;
  onChange: (value: number) => void;
}

type FlavorOption = {
  score: number;
  emoji: string;
  label: string;
  description: string;
};

const NEWBIE_FLAVOR_DATA: Record<keyof FlavorProfile, { title: string; question: string; options: FlavorOption[] }> = {
  alcohol: {
    title: '알코올 (Alcohol)',
    question: `와인에서 어느 정도의\n알코올(취기)을 원하시나요?`,
    options: [
      { score: 1, emoji: '🍺', label: '가벼운 음료수 같은 술', description: 'ex) 맥주, 이슬톡톡' },
      { score: 2, emoji: '🍹', label: '맛있게 즐기는 정도', description: 'ex) 하이볼, 칵테일' },
      { score: 3, emoji: '🍶', label: '적당한 취기', description: 'ex) 소주 반 병~한 병' },
      { score: 4, emoji: '🥣', label: '확실한 취기', description: 'ex) 막걸리, 소주 2병 이상' },
      { score: 5, emoji: '🥃', label: '강렬한 독주', description: 'ex) 위스키, 고량주' },
    ],
  },
  body: {
    title: '바디감 (Body)',
    question: `입안에 머금었을 때\n어떤 느낌(무게감)을 원하시나요?`,
    options: [
      { score: 1, emoji: '💧', label: '가볍고 찰랑거리는 느낌', description: 'ex) 생수' },
      { score: 2, emoji: '🍵', label: '가벼운 무게감', description: 'ex) 이온음료, 보리차' },
      { score: 3, emoji: '🍊', label: '적당한 무게감', description: 'ex) 오렌지 주스, 우유' },
      { score: 4, emoji: '🥛', label: '묵직하고 꽉 찬 느낌', description: 'ex) 진한 두유, 미숫가루' },
      { score: 5, emoji: '☕', label: '아주 진한 밀도감', description: 'ex) 요거트, 에스프레소' },
    ],
  },
  sweetness: {
    title: '당도 (Sweetness)',
    question: `와인에서 어느 정도의\n단맛(당도)을 원하시나요?`,
    options: [
      { score: 1, emoji: '☕', label: '단맛이 없는 깔끔함', description: 'ex) 아이스 아메리카노' },
      { score: 2, emoji: '🥛', label: '아주 은은한 단맛', description: 'ex) 카페라떼의 고소한 단맛' },
      { score: 3, emoji: '🍊', label: '적당한 단맛', description: 'ex) 자몽 에이드의 상큼달콤함' },
      { score: 4, emoji: '🥤', label: '확실한 달콤함', description: 'ex) 바닐라 라떼, 콜라' },
      { score: 5, emoji: '🍰', label: '진한 달콤함', description: 'ex) 카라멜 마끼아또, 초코 쉐이크' },
    ],
  },
  acidity: {
    title: '산도 (Acidity)',
    question: `와인에서 어느 정도의\n신맛(산미)을 선호하시나요?`,
    options: [
      { score: 1, emoji: '🍈', label: '신맛이 거의 없는', description: 'ex) 바나나, 멜론' },
      { score: 2, emoji: '🍑', label: '편안한 상큼함', description: 'ex) 복숭아, 적사과' },
      { score: 3, emoji: '🍓', label: '적당한 새콤달콤함', description: 'ex) 딸기, 포도' },
      { score: 4, emoji: '🍍', label: '짜릿한 신맛', description: 'ex) 파인애플, 오렌지' },
      { score: 5, emoji: '🍋', label: '강렬한 신맛', description: 'ex) 레몬, 라임' },
    ],
  },
  tannin: {
    title: '타닌 (Tannin)',
    question: `와인에서 어느 정도의\n떫은맛(타닌)을 원하시나요?`,
    options: [
      { score: 1, emoji: '🧃', label: '떫은맛이 없는', description: 'ex) 포도 주스' },
      { score: 2, emoji: '🧋', label: '부드러운 정도', description: 'ex) 밀크티' },
      { score: 3, emoji: '🍵', label: '살짝 쌉싸름한 정도', description: 'ex) 녹차' },
      { score: 4, emoji: '🍫', label: '입안이 코팅되는 느낌', description: 'ex) 다크 초콜릿(72%)' },
      { score: 5, emoji: '☕', label: '강한 떫은맛', description: 'ex) 진한 에스프레소' },
    ],
  },
};

const NewbieFlavorProfileStep = ({ attribute, value, onChange }: NewbieFlavorProfileStepProps) => {
  const data = NEWBIE_FLAVOR_DATA[attribute];

  if (!data) return null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>{data.question}</Text>

      <View style={styles.optionsContainer}>
        {data.options.map((option) => (
          <TouchableOpacity
            key={option.score}
            style={[
              styles.optionButton,
              value === option.score && styles.selectedOptionButton
            ]}
            onPress={() => onChange(option.score)}
            activeOpacity={0.8}
          >
            <Text style={styles.emoji}>{option.emoji}</Text>
            <View style={styles.textContainer}>
              <Text style={[
                styles.optionLabel,
                value === option.score && styles.selectedOptionText
              ]}>
                {option.label}
              </Text>
              <Text style={styles.optionDesc}>
                {option.description}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 30,
    lineHeight: 32,
  },
  question: {
    fontSize: 16,
    color: '#aaa',
    marginBottom: 30,
    lineHeight: 24,
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e1e1e',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  selectedOptionButton: {
    borderColor: '#8e44ad',
    backgroundColor: '#2a1a2a',
  },
  emoji: {
    fontSize: 24,
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  selectedOptionText: {
    color: '#8e44ad',
  },
  optionDesc: {
    fontSize: 13,
    color: '#ccc',
    marginTop: 2,
  },
});

export default NewbieFlavorProfileStep;

