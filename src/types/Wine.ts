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
  rating: number;
  reviews: Review[];
  prices: PriceInfo[];
}

export interface WineDBItem {
  id: number;
  nameKor: string;
  nameEng: string;
  type: string;
  country: string;
  grape: string;
  image?: string;
  imageUri?: string;
  description?: string;
  features?: {
    sweetness: number;
    acidity: number;
    body: number;
    tannin: number;
    // 궁합 5축 확장 — 데이터 없는 경우 계산 시 중간값(3)으로 간주
    alcohol?: number | null;
  };
  nose?: string[];
  palate?: string[];
  finish?: string[];
  vintages?: VintageData[];
  vivinoRating?: number;
  price?: number;
}
