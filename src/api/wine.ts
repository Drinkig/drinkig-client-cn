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

// 상세 정보 응답 (추정 DTO)
export interface WineDetailResponse {
  isSuccess: boolean;
  code: string;
  message: string;
  result: WineDetailDTO;
}

export interface WineDetailDTO {
  wineId: number;
  name: string;
  nameEng: string;
  price: number;
  sort: string;
  country: string;
  region: string;
  variety: string;
  vivinoRating: number;
  wineImage?: string;
  // 추가적으로 있을 수 있는 필드들
  features?: {
    sweetness: number;
    acidity: number;
    body: number;
    tannin: number;
  };
  nose?: string[];
  palate?: string[];
  finish?: string[];
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

// 와인 등록/수정 요청 공통 타입
interface WineRequestData {
  name: string;
  nameEng: string;
  price: number;
  sort: string; // Red, White, Sparkling, Rose, Dessert, Fortified
  country: string;
  region: string;
  variety: string;
  vivinoRating: number;
}

// 와인 등록 요청 타입
export interface WineRegisterRequest {
  wineRegisterRequest: WineRequestData;
  wineImage?: string;
}

// 와인 수정 요청 타입
export interface WineUpdateRequest {
  wineUpdateRequest: WineRequestData;
  wineImage?: string;
}

export interface WineResponse {
  isSuccess: boolean;
  code: string;
  message: string;
  result: object;
}

export type WineRegisterResponse = WineResponse;
export type WineUpdateResponse = WineResponse;

// 위시리스트 응답 타입 (추가/삭제 공용)
export interface WishlistResponse {
  isSuccess: boolean;
  code: string;
  message: string;
  result: string;
}

// 위시리스트 조회 응답 타입
export interface WishlistListResponse {
  isSuccess: boolean;
  code: string;
  message: string;
  result: WishlistItemDTO[];
}

export interface WishlistItemDTO {
  wineId: number;
  name: string;
  nameEng: string;
  vintageYear: number;
  imageUrl: string;
  sort: string;
  country: string;
  region: string;
  variety: string;
  vivinoRating: number;
  price: number;
}

// 와인 검색 API
export const searchWines = async (params: SearchParams) => {
  const response = await client.get<WineSearchResponse>('/admin/wine', {
    params,
  });
  return response.data;
};

// 와인 상세 조회 API
export const getWineDetail = async (wineId: number) => {
  const response = await client.get<WineDetailResponse>(`/admin/wine/${wineId}`);
  return response.data;
};

// 와인 등록 API
export const registerWine = async (data: WineRegisterRequest) => {
  const response = await client.post<WineRegisterResponse>('/admin/wine', data);
  return response.data;
};

// 와인 수정 API
export const updateWine = async (wineId: number, data: WineUpdateRequest) => {
  const response = await client.patch<WineUpdateResponse>(`/admin/wine/${wineId}`, data);
  return response.data;
};

// 위시리스트 추가 API
export const addToWishlist = async (wineId: number, vintageYear?: number) => {
  const response = await client.post<WishlistResponse>(`/wine-wishlist/${wineId}`, null, {
    params: { vintageYear },
  });
  return response.data;
};

// 위시리스트 삭제 API
export const removeFromWishlist = async (wineId: number, vintageYear?: number) => {
  const response = await client.delete<WishlistResponse>(`/wine-wishlist/${wineId}`, {
    params: { vintageYear },
  });
  return response.data;
};

// 위시리스트 전체 조회 API
export const getWishlist = async () => {
  const response = await client.get<WishlistListResponse>('/wine-wishlist');
  return response.data;
};
