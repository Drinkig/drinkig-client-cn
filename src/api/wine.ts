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
  sort: string;
  variety: string;
  country: string;
  region: string;
  createdAt: string;
}

export interface WineUserSearchResponse {
  isSuccess: boolean;
  code: string;
  message: string;
  result: {
    content: WineUserDTO[];
    pageNumber: number;
    totalPages: number;
    totalElements: number;
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
  purchaseType?: 'OFFLINE' | 'DIRECT';
  purchaseShop?: string;
}

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

export interface MyWineDeleteResponse {
  isSuccess: boolean;
  code: string;
  message: string;
  result: string;
}

interface WineRequestData {
  name: string;
  nameEng: string;
  price: number;
  sort: string;
  country: string;
  region: string;
  variety: string;
  vivinoRating: number;
}

export interface WineRegisterRequest {
  wineRegisterRequest: WineRequestData;
  wineImage?: string;
}

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

export interface WishlistResponse {
  isSuccess: boolean;
  code: string;
  message: string;
  result: string;
}

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
  vintageYear?: number;
  tasteDate?: string;
}

interface ReviewParams {
  vintageYear?: number;
  sortType: string;
  page?: number;
  size?: number;
  sort?: string[];
}

export const searchWines = async (params: SearchParams) => {
  const response = await client.get<WineSearchResponse>('/admin/wine', {
    params,
  });
  return response.data;
};

export const searchWinesPublic = async (params: PublicSearchParams) => {
  const response = await client.get<WineUserSearchResponse>('/wine', {
    params,
  });
  return response.data;
};

export const getWineDetail = async (wineId: number) => {
  const response = await client.get<WineDetailResponse>(`/admin/wine/${wineId}`);
  return response.data;
};

export const getWineDetailPublic = async (wineId: number, vintageYear?: number) => {
  const response = await client.get<WineDetailUserResponse>(`/wine/${wineId}`, {
    params: { vintageYear },
  });
  return response.data;
};

export const getRecommendedWines = async () => {
  const response = await client.get<RecommendedWineResponse>('/wine/recommend');
  return response.data;
};

export const getOnboardingRecommendation = async () => {
  const response = await client.get<OnboardingRecommendationResponse>('/wine/recommend');
  return response.data;
};

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

export const getMyWines = async () => {
  const response = await client.get<MyWineListResponse>('/my-wine');
  return response.data;
};

export const getMyWineDetail = async (myWineId: number) => {
  const response = await client.get<MyWineDetailResponse>(`/my-wine/${myWineId}`);
  return response.data;
};

export const addMyWine = async (data: MyWineAddRequest) => {
  const response = await client.post<MyWineAddResponse>('/my-wine', data);
  return response.data;
};

export const updateMyWine = async (myWineId: number, data: MyWineUpdateRequest) => {
  const response = await client.patch<MyWineUpdateResponse>(`/my-wine/${myWineId}`, data);
  return response.data;
};

export const deleteMyWine = async (myWineId: number) => {
  const response = await client.delete<MyWineDeleteResponse>(`/my-wine/${myWineId}`);
  return response.data;
};

export const getPriceHistory = async (wineId: number, vintageYear?: number) => {
  const response = await client.get<WinePriceHistoryResponse>(`/wine/${wineId}/price-history`, {
    params: { vintageYear },
  });
  return response.data;
};

export interface WinePriceHistoryResponse {
  isSuccess: boolean;
  code: string;
  message: string;
  result: PriceHistoryDTO[];
}

export interface PriceHistoryDTO {
  vintage: number;
  purchaseDate: string;
  price: number;
  shopName: string;
  purchaseType?: string;
}

export const getWineReviews = async (wineId: number, params: ReviewParams) => {
  const response = await client.get<ReviewListResponse>(`/wine/review/${wineId}`, {
    params,
  });
  return response.data;
};

export const registerWine = async (data: WineRegisterRequest) => {
  const response = await client.post<WineRegisterResponse>('/admin/wine', data);
  return response.data;
};

export const updateWine = async (wineId: number, data: WineUpdateRequest) => {
  const response = await client.patch<WineUpdateResponse>(`/admin/wine/${wineId}`, data);
  return response.data;
};

export const addToWishlist = async (wineId: number, vintageYear?: number) => {
  const response = await client.post<WishlistResponse>(`/wine-wishlist/${wineId}`, null, {
    params: { vintageYear },
  });
  return response.data;
};

export const removeFromWishlist = async (wineId: number, vintageYear?: number) => {
  const response = await client.delete<WishlistResponse>(`/wine-wishlist/${wineId}`, {
    params: { vintageYear },
  });
  return response.data;
};

export const getWishlist = async () => {
  const response = await client.get<WishlistListResponse>('/wine-wishlist');
  return response.data;
};

export interface TastingNoteListResponse {
  isSuccess: boolean;
  code: string;
  message: string;
  result: TastingNotePreviewDTO[];
}

export interface TastingNotePreviewDTO {
  tastingNoteId: number; // API 응답: noteId일 수 있음 (확인 필요)
  wineId: number;
  wineName: string;
  vintageYear: number;
  imageUrl?: string;
  tasteDate: string;
  rating: number;
  createdAt: string;
  sort: string;
}

export const getMyTastingNotes = async () => {
  const response = await client.get<TastingNoteListResponse>('/tasting-note/my');
  return response.data;
};

export interface TastingNoteRequest {
  wineId: number;
  vintageYear?: number;
  color: string;
  tasteDate: string;
  sweetness: number; // 0-100
  acidity: number; // 0-100
  tannin: number; // 0-100
  body: number; // 0-100
  alcohol: number; // 0-100
  nose?: string[];
  rating: number;
  review?: string;
}

export interface TastingNoteResponse {
  isSuccess: boolean;
  code: string;
  message: string;
  result: string;
}

export const createTastingNote = async (data: TastingNoteRequest) => {
  const response = await client.post<TastingNoteResponse>('/tasting-note/new-note', data);
  return response.data;
};

export const getTastingNoteDetail = async (noteId: number) => {
  const response = await client.get<TastingNoteDetailResponse>(`/tasting-note/${noteId}`);
  return response.data;
};

export interface TastingNoteDetailResponse {
  isSuccess: boolean;
  code: string;
  message: string;
  result: TastingNoteDTO;
}

export interface TastingNoteDTO {
  noteId: number;
  wineId: number;
  wineName: string;
  vintageYear: number;
  color: string;
  tasteDate: string;
  sweetness: number;
  acidity: number;
  tannin: number;
  body: number;
  alcohol: number;
  noseList: string[];
  rating: number;
  review: string;
  createdAt: string;
  imageUrl?: string;
  sort?: string;
}
export interface TastingNoteDeleteResponse {
  isSuccess: boolean;
  code: string;
  message: string;
  result: string;
}

export const deleteTastingNote = async (noteId: number) => {
  const response = await client.delete<TastingNoteDeleteResponse>(`/tasting-note/${noteId}`);
  return response.data;
};

export interface FoodRecommendationResponse {
  isSuccess: boolean;
  code: string;
  message: string;
  result: FoodPairingResultDTO;
}

export interface FoodPairingResultDTO {
  foodName: string;
  foodFlavor: {
    sweetness: number;
    acidity: number;
    body: number;
    tannin: number;
    alcohol: number;
  };
  recommendWines: FoodRecommendationDTO[];
}

export interface FoodRecommendationDTO {
  sort: string;
  variety: string;
  country: string;
  region: string;
}

export const getFoodPairingRecommendation = async (foodName: string) => {
  const response = await client.get<FoodRecommendationResponse>('/wine/recommend/food', {
    params: { foodName },
  });
  return response.data;
};

