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

// 사용자용 와인 검색 응답 타입 (GET /wine)
export interface WineUserSearchResponse {
  isSuccess: boolean;
  code: string;
  message: string;
  result: {
    content: WineUserDTO[];
    pageNumber: number;
    totalPages: number;
  };
}

export interface WineUserDTO {
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

// 상세 정보 응답 (관리자용)
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

// 사용자용 상세 정보 응답 (GET /wine/{wineId})
export interface WineDetailUserResponse {
  isSuccess: boolean;
  code: string;
  message: string;
  result: {
    wineInfoResponse: WineInfoDTO;
    recentReviews: RecentReviewDTO[];
  };
}

export interface WineInfoDTO {
  wineId: number;
  name: string;
  nameEng: string;
  vintageYear: number;
  imageUrl: string;
  price: number;
  sort: string;
  country: string;
  region: string;
  variety: string;
  vivinoRating: number;
  avgSweetness: number;
  avgAcidity: number;
  avgTannin: number;
  avgBody: number;
  avgAlcohol: number;
  nose1: string | null;
  nose2: string | null;
  nose3: string | null;
  avgMemberRating: number;
  liked: boolean;
}

export interface RecentReviewDTO {
  name: string;
  review: string;
  rating: number;
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

interface PublicSearchParams {
  searchName?: string;
  wineSort?: string;
  wineVariety?: string;
  wineCountry?: string;
  page?: number;
  size?: number;
  sort?: string[];
}

// 추천 와인 응답 타입
export interface RecommendedWineResponse {
  isSuccess: boolean;
  code: string;
  message: string;
  result: RecommendedWineDTO[];
}

export interface RecommendedWineDTO {
  wineId: number;
  imageUrl: string;
  wineName: string;
  wineNameEng: string;
  sort: string;
  price: number;
  vivinoRating: number;
}

// 보유 와인 응답 타입 (목록 조회 및 단건 조회 공용)
export interface MyWineListResponse {
  isSuccess: boolean;
  code: string;
  message: string;
  result: MyWineDTO[];
}

export interface MyWineDetailResponse {
  isSuccess: boolean;
  code: string;
  message: string;
  result: MyWineDTO;
}

export interface MyWineDTO {
  myWineId: number;
  wineId: number;
  wineName: string;
  vintageYear: number;
  wineSort: string;
  wineCountry: string;
  wineRegion: string;
  wineVariety: string;
  wineImageUrl: string;
  purchaseDate: string;
  purchasePrice: number;
  period: number;
  purchaseType?: 'OFFLINE' | 'DIRECT'; // 추가됨
  purchaseShop?: string; // 추가됨
}

// 보유 와인 추가 요청 타입
export interface MyWineAddRequest {
  wineId: number;
  vintageYear: number;
  purchaseDate: string; // YYYY-MM-DD
  purchasePrice: number;
  purchaseType: 'OFFLINE' | 'DIRECT';
  purchaseShop: string;
}

export interface MyWineAddResponse {
  isSuccess: boolean;
  code: string;
  message: string;
  result: string;
}

// 보유 와인 수정 요청 타입
export interface MyWineUpdateRequest {
  vintageYear: number;
  purchaseDate: string; // YYYY-MM-DD
  purchasePrice: number;
  purchaseType?: 'OFFLINE' | 'DIRECT';
  purchaseShop?: string;
}

export interface MyWineUpdateResponse {
  isSuccess: boolean;
  code: string;
  message: string;
  result: string;
}

// 보유 와인 삭제 응답 타입
export interface MyWineDeleteResponse {
  isSuccess: boolean;
  code: string;
  message: string;
  result: string;
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

// 리뷰 목록 응답 타입
export interface ReviewListResponse {
  isSuccess: boolean;
  code: string;
  message: string;
  result: {
    content: ReviewDTO[];
    pageNumber: number;
    totalPages: number;
  };
}

export interface ReviewDTO {
  name: string;
  review: string;
  rating: number;
  createdAt: string;
}

// 리뷰 조회 파라미터
interface ReviewParams {
  vintageYear: number;
  sortType: string; // "최신순", "오래된 순", "별점 높은 순", "별점 낮은 순"
  page?: number;
  size?: number;
  sort?: string[];
}

// 와인 검색 API (관리자용)
export const searchWines = async (params: SearchParams) => {
  const response = await client.get<WineSearchResponse>('/admin/wine', {
    params,
  });
  return response.data;
};

// 와인 검색 API (사용자용)
export const searchWinesPublic = async (params: PublicSearchParams) => {
  const response = await client.get<WineUserSearchResponse>('/wine', {
    params,
  });
  return response.data;
};

// 와인 상세 조회 API (관리자용)
export const getWineDetail = async (wineId: number) => {
  const response = await client.get<WineDetailResponse>(`/admin/wine/${wineId}`);
  return response.data;
};

// 와인 상세 조회 API (사용자용)
export const getWineDetailPublic = async (wineId: number, vintageYear?: number) => {
  const response = await client.get<WineDetailUserResponse>(`/wine/${wineId}`, {
    params: { vintageYear },
  });
  return response.data;
};

// 추천 와인 조회 API
export const getRecommendedWines = async () => {
  const response = await client.get<RecommendedWineResponse>('/wine/recommend');
  return response.data;
};

// 온보딩 결과 추천 와인 조회 API
export const getOnboardingRecommendation = async () => {
  const response = await client.get<OnboardingRecommendationResponse>('/wine/recommend');
  return response.data;
};

// 온보딩 추천 응답 타입
export interface OnboardingRecommendationResponse {
  isSuccess: boolean;
  code: string;
  message: string;
  result: OnboardingRecommendationDTO[];
}

export interface OnboardingRecommendationDTO {
  sort: string;
  country: string;
  region: string;
  variety: string;
}

// 보유 와인 목록 조회 API
export const getMyWines = async () => {
  const response = await client.get<MyWineListResponse>('/my-wine');
  return response.data;
};

// 보유 와인 단건 조회 API
export const getMyWineDetail = async (myWineId: number) => {
  const response = await client.get<MyWineDetailResponse>(`/my-wine/${myWineId}`);
  return response.data;
};

// 보유 와인 추가 API
export const addMyWine = async (data: MyWineAddRequest) => {
  const response = await client.post<MyWineAddResponse>('/my-wine', data);
  return response.data;
};

// 보유 와인 수정 API
export const updateMyWine = async (myWineId: number, data: MyWineUpdateRequest) => {
  const response = await client.patch<MyWineUpdateResponse>(`/my-wine/${myWineId}`, data);
  return response.data;
};

// 보유 와인 삭제 API
export const deleteMyWine = async (myWineId: number) => {
  const response = await client.delete<MyWineDeleteResponse>(`/my-wine/${myWineId}`);
  return response.data;
};

// 와인 리뷰 전체 조회 API
export const getWineReviews = async (wineId: number, params: ReviewParams) => {
  const response = await client.get<ReviewListResponse>(`/wine/review/${wineId}`, {
    params,
  });
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
