import client from './client';

export interface WineSearchResponse {
  isSuccess: boolean;
  code: string;
  message: string;
  result: {
    content: WineDTO[];
    pageNumber: number;
    totalPages: number;
  };
}

export interface WineDTO {
  wineId: number;
  name: string;
  nameEng: string;
  sort: string; // Red, White, etc.
  variety: string;
  country: string;
  region: string;
  createdAt: string;
}

interface SearchParams {
  searchName?: string;
  wineSort?: string;
  wineVariety?: string;
  wineCountry?: string;
  page?: number;
  size?: number;
  sort?: string[];
}

// 와인 등록 요청 타입
export interface WineRegisterRequest {
  wineRegisterRequest: {
    name: string;
    nameEng: string;
    price: number;
    sort: string; // Red, White, Sparkling, Rose, Dessert, Fortified
    country: string;
    region: string;
    variety: string;
    vivinoRating: number;
  };
  wineImage?: string; // Base64 string or URL? API 명세상 string
}

export interface WineRegisterResponse {
  isSuccess: boolean;
  code: string;
  message: string;
  result: object;
}

// 와인 검색 API
export const searchWines = async (params: SearchParams) => {
  const response = await client.get<WineSearchResponse>('/admin/wine', {
    params,
  });
  return response.data;
};

// 와인 등록 API
export const registerWine = async (data: WineRegisterRequest) => {
  const response = await client.post<WineRegisterResponse>('/admin/wine', data);
  return response.data;
};
