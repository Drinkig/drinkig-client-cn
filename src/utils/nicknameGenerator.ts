import i18n from '../i18n';

const KO_ADJECTIVES = [
  '달콤한', '상큼한', '부드러운', '깊은', '풍부한',
  '향긋한', '우아한', '은은한', '진한', '화려한',
  '섬세한', '따뜻한', '신비한', '귀여운', '행복한',
];

const KO_NOUNS = [
  '와인러버', '소믈리에', '탐험가', '미식가', '여행자',
  '큐레이터', '감별사', '애호가', '컬렉터', '테이스터',
];

const EN_ADJECTIVES = [
  'Sweet', 'Fresh', 'Smooth', 'Deep', 'Rich',
  'Bold', 'Elegant', 'Subtle', 'Vivid', 'Cozy',
  'Bright', 'Warm', 'Lucky', 'Happy', 'Calm',
];

const EN_NOUNS = [
  'WineLover', 'Sommelier', 'Explorer', 'Gourmet', 'Traveler',
  'Curator', 'Taster', 'Collector', 'Enthusiast', 'Connoisseur',
];

const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

export const generateRandomNickname = (): string => {
  const isKorean = (i18n.language || '').startsWith('ko');
  const adjectives = isKorean ? KO_ADJECTIVES : EN_ADJECTIVES;
  const nouns = isKorean ? KO_NOUNS : EN_NOUNS;
  const num = Math.floor(Math.random() * 9000) + 1000;
  return `${pick(adjectives)}${pick(nouns)}${num}`;
};
