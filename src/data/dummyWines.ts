// 와인 검색을 위한 더미 데이터베이스

export interface Review {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
}

export interface PriceInfo {
  price: number;
  shop?: string;
  date: string;
}

export interface VintageData {
  year: string;
  rating: number; // 평균 평점
  reviews: Review[];
  prices: PriceInfo[]; // 유저들이 등록한 구매가
}

export interface WineDBItem {
  id: number;
  nameKor: string;
  nameEng: string;
  type: string;
  country: string;
  grape: string; // 품종
  image?: string; // 실제 이미지 URL이 있다면 사용
  description?: string;
  features?: {
    sweetness: number; // 1-5
    acidity: number; // 1-5
    body: number; // 1-5
    tannin: number; // 1-5
  };
  aromas?: string[];
  vintages?: VintageData[]; // 빈티지별 데이터
}

// 더미 리뷰/가격 데이터 생성 헬퍼
const generateReviews = (count: number): Review[] => {
  const users = ['와인러버', '포도대장', '소믈리에조', '드링키', '한잔더'];
  const comments = [
    '밸런스가 정말 좋네요. 다시 마시고 싶어요.',
    '가격 대비 훌륭합니다.',
    '타닌감이 조금 강하지만 시간이 지나니 부드러워졌어요.',
    '향이 풍부하고 끝맛이 깔끔해요.',
    '특별한 날 마시기 딱 좋은 와인입니다.',
  ];
  
  return Array.from({ length: count }).map((_, i) => ({
    id: `review-${i}`,
    userName: users[Math.floor(Math.random() * users.length)],
    rating: Math.floor(Math.random() * 2) + 4, // 4~5점
    comment: comments[Math.floor(Math.random() * comments.length)],
    date: '2023.10.25',
  }));
};

const generatePrices = (basePrice: number, count: number): PriceInfo[] => {
  return Array.from({ length: count }).map((_, i) => ({
    price: basePrice + (Math.floor(Math.random() * 20000) - 10000), // basePrice ± 10000
    shop: ['이마트', '코스트코', '와인앤모어', '편의점'][Math.floor(Math.random() * 4)],
    date: '2023.10.20',
  }));
};

const generateVintages = (years: string[], basePrice: number): VintageData[] => {
  return years.map(year => ({
    year,
    rating: 4.2,
    reviews: generateReviews(Math.floor(Math.random() * 5) + 3),
    prices: generatePrices(basePrice, Math.floor(Math.random() * 5) + 2),
  }));
};

export const DUMMY_WINE_DB: WineDBItem[] = [
  {
    id: 1,
    nameKor: '샤토 마고',
    nameEng: 'Château Margaux',
    type: '레드',
    country: '프랑스',
    grape: '카베르네 소비뇽, 메를로',
    description: '보르도 5대 샤토 중 하나로, 우아함과 섬세함의 극치를 보여주는 와인입니다. 붉은 과실의 풍미와 부드러운 타닌, 긴 여운이 특징입니다.',
    features: { sweetness: 1, acidity: 4, body: 5, tannin: 4 },
    aromas: ['블랙커런트', '제비꽃', '가죽', '담배'],
    vintages: generateVintages(['2015', '2016', '2017', '2018'], 1200000),
  },
  {
    id: 2,
    nameKor: '클라우디 베이 소비뇽 블랑',
    nameEng: 'Cloudy Bay Sauvignon Blanc',
    type: '화이트',
    country: '뉴질랜드',
    grape: '소비뇽 블랑',
    description: '뉴질랜드 말보로 지역을 대표하는 소비뇽 블랑으로, 생동감 넘치는 산도와 풍부한 열대 과일 향이 매력적입니다.',
    features: { sweetness: 1, acidity: 5, body: 3, tannin: 1 },
    aromas: ['패션후르츠', '라임', '풀', '구스베리'],
    vintages: generateVintages(['2021', '2022', '2023'], 45000),
  },
  {
    id: 3,
    nameKor: '돔 페리뇽',
    nameEng: 'Dom Pérignon',
    type: '스파클링',
    country: '프랑스',
    grape: '샤르도네, 피노 누아',
    description: '샴페인의 대명사로 불리는 돔 페리뇽은 완벽한 균형미와 복합미를 자랑합니다. 섬세한 기포와 토스트 향이 일품입니다.',
    features: { sweetness: 2, acidity: 5, body: 4, tannin: 1 },
    aromas: ['토스트', '아몬드', '살구', '브리오슈'],
    vintages: generateVintages(['2010', '2012', '2013'], 350000),
  },
  {
    id: 4,
    nameKor: '오퍼스 원',
    nameEng: 'Opus One',
    type: '레드',
    country: '미국',
    grape: '카베르네 소비뇽',
    description: '미국 나파 밸리의 컬트 와인으로, 보르도 스타일의 블렌딩을 통해 깊이 있고 구조감 있는 맛을 선사합니다.',
    features: { sweetness: 1, acidity: 3, body: 5, tannin: 5 },
    aromas: ['블랙베리', '초콜릿', '바닐라', '오크'],
    vintages: generateVintages(['2016', '2017', '2018', '2019'], 600000),
  },
  {
    id: 5,
    nameKor: '모스카토 다스티',
    nameEng: 'Moscato d\'Asti',
    type: '디저트',
    country: '이탈리아',
    grape: '모스카토',
    description: '달콤하고 향긋한 약발포성 화이트 와인으로, 디저트와 함께 즐기거나 가볍게 마시기에 좋습니다.',
    features: { sweetness: 5, acidity: 3, body: 2, tannin: 1 },
    aromas: ['복숭아', '꿀', '아카시아', '오렌지'],
    vintages: generateVintages(['2022', '2023'], 25000),
  },
  {
    id: 6,
    nameKor: '1865 카베르네 소비뇽',
    nameEng: '1865 Selected Vineyards Cabernet Sauvignon',
    type: '레드',
    country: '칠레',
    grape: '카베르네 소비뇽',
    description: '한국에서 가장 사랑받는 칠레 와인 중 하나로, 진한 과실향과 적절한 오크 터치가 조화를 이룹니다.',
    features: { sweetness: 1, acidity: 3, body: 4, tannin: 4 },
    aromas: ['체리', '자두', '바닐라', '스파이스'],
    vintages: generateVintages(['2019', '2020', '2021'], 32000),
  },
  {
    id: 7,
    nameKor: '몬테스 알파 카베르네 소비뇽',
    nameEng: 'Montes Alpha Cabernet Sauvignon',
    type: '레드',
    country: '칠레',
    grape: '카베르네 소비뇽',
    description: '칠레 프리미엄 와인의 선구자로, 농축된 과일 향과 부드러운 타닌이 특징입니다.',
    features: { sweetness: 1, acidity: 3, body: 4, tannin: 4 },
    aromas: ['블랙커런트', '초콜릿', '시가', '민트'],
    vintages: generateVintages(['2018', '2019', '2020', '2021'], 35000),
  },
  {
    id: 8,
    nameKor: '티냐넬로',
    nameEng: 'Tignanello',
    type: '레드',
    country: '이탈리아',
    grape: '산지오베제',
    description: '슈퍼 투스칸의 효시로 불리는 와인으로, 산지오베제 특유의 산미와 탄탄한 구조감이 돋보입니다.',
    features: { sweetness: 1, acidity: 4, body: 4, tannin: 4 },
    aromas: ['체리', '허브', '가죽', '감초'],
    vintages: generateVintages(['2017', '2018', '2019', '2020'], 220000),
  },
  {
    id: 9,
    nameKor: '뵈브 클리코 옐로우 라벨',
    nameEng: 'Veuve Clicquot Yellow Label',
    type: '스파클링',
    country: '프랑스',
    grape: '피노 누아, 샤르도네',
    description: '피노 누아 베이스의 샴페인으로, 힘차고 풍부한 맛과 상쾌한 과일 향이 조화를 이룹니다.',
    features: { sweetness: 2, acidity: 5, body: 3, tannin: 1 },
    aromas: ['사과', '배', '바닐라', '브리오슈'],
    vintages: generateVintages(['NV'], 85000),
  },
  {
    id: 10,
    nameKor: '이스까이',
    nameEng: 'Iscay',
    type: '레드',
    country: '아르헨티나',
    grape: '말벡, 카베르네 프랑',
    description: '잉카어로 "둘"이라는 뜻을 가진 이스까이는 두 가지 품종의 완벽한 블렌딩을 보여줍니다.',
    features: { sweetness: 1, acidity: 3, body: 5, tannin: 4 },
    aromas: ['자두', '제비꽃', '초콜릿', '허브'],
    vintages: generateVintages(['2017', '2019'], 80000),
  },
];
