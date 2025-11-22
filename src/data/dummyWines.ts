// 와인 검색을 위한 더미 데이터베이스
export interface WineDBItem {
  id: number;
  nameKor: string;
  nameEng: string;
  type: string;
  country: string;
  grape: string; // 품종
  image?: string; // 실제 이미지 URL이 있다면 사용
}

export const DUMMY_WINE_DB: WineDBItem[] = [
  {
    id: 1,
    nameKor: '샤토 마고',
    nameEng: 'Château Margaux',
    type: '레드',
    country: '프랑스',
    grape: '카베르네 소비뇽, 메를로',
  },
  {
    id: 2,
    nameKor: '클라우디 베이 소비뇽 블랑',
    nameEng: 'Cloudy Bay Sauvignon Blanc',
    type: '화이트',
    country: '뉴질랜드',
    grape: '소비뇽 블랑',
  },
  {
    id: 3,
    nameKor: '돔 페리뇽',
    nameEng: 'Dom Pérignon',
    type: '스파클링',
    country: '프랑스',
    grape: '샤르도네, 피노 누아',
  },
  {
    id: 4,
    nameKor: '오퍼스 원',
    nameEng: 'Opus One',
    type: '레드',
    country: '미국',
    grape: '카베르네 소비뇽',
  },
  {
    id: 5,
    nameKor: '모스카토 다스티',
    nameEng: 'Moscato d\'Asti',
    type: '디저트',
    country: '이탈리아',
    grape: '모스카토',
  },
  {
    id: 6,
    nameKor: '1865 카베르네 소비뇽',
    nameEng: '1865 Selected Vineyards Cabernet Sauvignon',
    type: '레드',
    country: '칠레',
    grape: '카베르네 소비뇽',
  },
  {
    id: 7,
    nameKor: '몬테스 알파 카베르네 소비뇽',
    nameEng: 'Montes Alpha Cabernet Sauvignon',
    type: '레드',
    country: '칠레',
    grape: '카베르네 소비뇽',
  },
  {
    id: 8,
    nameKor: '티냐넬로',
    nameEng: 'Tignanello',
    type: '레드',
    country: '이탈리아',
    grape: '산지오베제',
  },
  {
    id: 9,
    nameKor: '뵈브 클리코 옐로우 라벨',
    nameEng: 'Veuve Clicquot Yellow Label',
    type: '스파클링',
    country: '프랑스',
    grape: '피노 누아, 샤르도네',
  },
  {
    id: 10,
    nameKor: '이스까이',
    nameEng: 'Iscay',
    type: '레드',
    country: '아르헨티나',
    grape: '말벡, 카베르네 프랑',
  },
];

