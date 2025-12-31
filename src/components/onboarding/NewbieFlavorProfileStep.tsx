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
    question: `평소 선호하는\n주종이 있나요?`,
    options: [
      { score: 1, emoji: '🍺', label: '맥주/이슬톡톡', description: '술이 약해서 음료수 같은 게 좋아요' },
      { score: 2, emoji: '🍹', label: '하이볼/칵테일', description: '맛있게 즐기는 정도가 딱 좋아요' },
      { score: 3, emoji: '🍶', label: '소주 반 병~한 병', description: '일반적인 식사 반주 정도' },
      { score: 4, emoji: '🥣', label: '막걸리/소주 2병 이상', description: '취기를 확실히 즐겨요' },
      { score: 5, emoji: '🥃', label: '위스키/고량주', description: '목이 타는 듯한 독주를 선호해요' },
    ],
  },
  body: {
    title: '바디감 (Body)',
    question: `입안에 머금었을 때\n어떤 느낌(무게감)을 원하시나요?`,
    options: [
      { score: 1, emoji: '💧', label: '생수', description: '아주 가볍고 찰랑거리는 느낌' },
      { score: 2, emoji: '🍵', label: '이온음료/보리차', description: '물보다는 살짝 맛이 느껴짐' },
      { score: 3, emoji: '🍊', label: '오렌지 주스/우유', description: '적당한 무게감과 질감' },
      { score: 4, emoji: '🥛', label: '진한 두유/미숫가루', description: '묵직하고 꽉 찬 느낌' },
      { score: 5, emoji: '☕', label: '요거트/에스프레소', description: '걸쭉하고 아주 진한 밀도감' },
    ],
  },
  sweetness: {
    title: '당도 (Sweetness)',
    question: `평소 카페에서\n어떤 스타일의 음료를 드시나요?`,
    options: [
      { score: 1, emoji: '☕', label: '아이스 아메리카노', description: '단맛 0% - 깔끔한 맛' },
      { score: 2, emoji: '🍵', label: '카페라떼', description: '우유의 고소함 정도, 아주 은은한 단맛' },
      { score: 3, emoji: '🍊', label: '자몽 에이드', description: '새콤달콤, 기분 좋은 적당한 단맛' },
      { score: 4, emoji: '🥤', label: '바닐라 라떼/콜라', description: '확실하게 달달한 맛' },
      { score: 5, emoji: '🍰', label: '초코 쉐이크/카라멜 마끼아또', description: '당 충전! 아주 달콤한 맛' },
    ],
  },
  acidity: {
    title: '산도 (Acidity)',
    question: `가장 선호하는\n과일은 무엇인가요?`,
    options: [
      { score: 1, emoji: '🍈', label: '바나나/멜론', description: '신맛이 거의 없는 부드러운 과일' },
      { score: 2, emoji: '🍑', label: '복숭아/적사과', description: '거슬리지 않는 편안한 상큼함' },
      { score: 3, emoji: '🍓', label: '딸기/포도', description: '침이 적당히 고이는 새콤달콤함' },
      { score: 4, emoji: '🍍', label: '파인애플/오렌지', description: '짜릿하고 생기 넘치는 신맛' },
      { score: 5, emoji: '🍋', label: '레몬/라임', description: '눈이 저절로 감기는 강렬한 신맛' },
    ],
  },
  tannin: {
    title: '타닌 (Tannin)',
    question: `평소 떫은맛이나 쌉싸름한 맛을\n얼마나 선호하시나요?`,
    options: [
      { score: 1, emoji: '🧃', label: '포도 주스', description: '떫은맛이 전혀 없는 게 좋아요' },
      { score: 2, emoji: '🧋', label: '밀크티', description: '우유가 섞여서 부드러운 정도면 괜찮아요' },
      { score: 3, emoji: '🍵', label: '녹차', description: '끝맛이 살짝 쌉싸름한 정도가 좋아요' },
      { score: 4, emoji: '🍫', label: '다크 초콜릿(72%)', description: '입안이 살짝 코팅되는 듯한 느낌을 원해요' },
      { score: 5, emoji: '☕', label: '진한 에스프레소', description: '혀를 조여오는 강한 떫은맛도 즐겨요' },
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

