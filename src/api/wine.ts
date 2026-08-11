import client from "./client";

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
  // 공식(소믈리에 입력) 맛 수치 — 없으면 avg* 값으로 폴백해 사용한다.
  officialSweetness?: number | null;
  officialAcidity?: number | null;
  officialTannin?: number | null;
  officialBody?: number | null;
  // 1~5 단계 (서버 §7 확인). 구버전 응답에는 없을 수 있다.
  officialAlcohol?: number | null;
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

// GET /wine/recommend/wines — 취향 기반 "실제 와인" 추천 (홈 개인화 섹션)
export interface RecommendedBottlesResponse {
  isSuccess: boolean;
  code: string;
  message: string;
  result: RecommendedBottleDTO[];
}

export interface RecommendedBottleDTO {
  wineId: number;
  imageUrl: string | null;
  wineName: string;
  wineNameEng: string;
  sort: string;
  country: string;
  variety: string;
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
  wineNameEng?: string;
  vintageYear: number;
  wineSort: string;
  wineCountry: string;
  wineRegion: string;
  wineVariety: string;
  wineImageUrl: string;
  purchaseDate: string;
  purchasePrice: number;
  period: number;
  purchaseType?: "OFFLINE" | "DIRECT";
  purchaseShop?: string;
}

export interface MyWineAddRequest {
  wineId: number;
  vintageYear: number;
  purchaseDate: string; // YYYY-MM-DD
  purchasePrice: number;
  purchaseType: "OFFLINE" | "DIRECT";
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
  purchaseType?: "OFFLINE" | "DIRECT";
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
  // 작성자 프로필 이미지. 백엔드는 member 객체 안에 imageUrl로 내려준다.
  // (혹시 평탄화되어 오는 경우도 대비해 최상위 imageUrl도 함께 본다.)
  imageUrl?: string;
  member?: {
    name?: string;
    imageUrl?: string;
  };
}

interface ReviewParams {
  vintageYear?: number;
  sortType: string;
  page?: number;
  size?: number;
  sort?: string[];
}

export const searchWines = async (params: SearchParams) => {
  const response = await client.get<WineSearchResponse>("/admin/wine", {
    params,
  });
  return response.data;
};

export const searchWinesPublic = async (params: PublicSearchParams) => {
  const response = await client.get<WineUserSearchResponse>("/wine", {
    params,
  });
  return response.data;
};

export const getWineDetail = async (wineId: number) => {
  const response = await client.get<WineDetailResponse>(
    `/admin/wine/${wineId}`
  );
  return response.data;
};

export const getWineDetailPublic = async (
  wineId: number,
  vintageYear?: number
) => {
  const response = await client.get<WineDetailUserResponse>(`/wine/${wineId}`, {
    params: { vintageYear },
  });
  return response.data;
};

export const getRecommendedBottles = async () => {
  const response = await client.get<RecommendedBottlesResponse>(
    "/wine/recommend/wines"
  );
  return response.data;
};

export const getOnboardingRecommendation = async () => {
  const response = await client.get<OnboardingRecommendationResponse>(
    "/wine/recommend"
  );
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
  countryEng?: string;
  region: string;
  regionEng?: string;
  variety: string;
  varietyEng?: string;
}

export const getMyWines = async () => {
  const response = await client.get<MyWineListResponse>("/my-wine");
  return response.data;
};

export const getMyWineDetail = async (myWineId: number) => {
  const response = await client.get<MyWineDetailResponse>(
    `/my-wine/${myWineId}`
  );
  return response.data;
};

export const addMyWine = async (data: MyWineAddRequest) => {
  const response = await client.post<MyWineAddResponse>("/my-wine", data);
  return response.data;
};

export const updateMyWine = async (
  myWineId: number,
  data: MyWineUpdateRequest
) => {
  const response = await client.patch<MyWineUpdateResponse>(
    `/my-wine/${myWineId}`,
    data
  );
  return response.data;
};

export const deleteMyWine = async (myWineId: number) => {
  const response = await client.delete<MyWineDeleteResponse>(
    `/my-wine/${myWineId}`
  );
  return response.data;
};

export const getPriceHistory = async (wineId: number, vintageYear?: number) => {
  const response = await client.get<WinePriceHistoryResponse>(
    `/wine/${wineId}/price-history`,
    {
      params: { vintageYear },
    }
  );
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
  const response = await client.get<ReviewListResponse>(
    `/wine/review/${wineId}`,
    {
      params,
    }
  );
  return response.data;
};

// 홈 피드용: 전체 와인을 가로질러 최신 리뷰 N개. 카드에서 와인 상세로 이동할 수
// 있도록 wineId/wineName을 포함한다. (백엔드: GET /wine/review/recent)
export interface HomeRecentReviewDTO {
  wineId: number;
  wineName: string;
  wineNameEng?: string;
  name: string; // 작성자 닉네임
  review: string;
  rating: number;
  createdAt: string;
  // 홈 피드는 와인 이미지가 있는 리뷰를 우선 노출한다. 백엔드가 recent 응답에
  // 와인 대표 이미지를 함께 내려주면 이미지 중심 카드가 채워진다(없으면 숨김).
  wineImageUrl?: string;
}

export interface HomeRecentReviewListResponse {
  isSuccess: boolean;
  code: string;
  message: string;
  result: HomeRecentReviewDTO[];
}

export const getRecentReviews = async (size: number = 10) => {
  const response = await client.get<HomeRecentReviewListResponse>(
    "/wine/review/recent",
    {
      params: { size },
    }
  );
  return response.data;
};

export const registerWine = async (data: WineRegisterRequest) => {
  const response = await client.post<WineRegisterResponse>("/admin/wine", data);
  return response.data;
};

export const updateWine = async (wineId: number, data: WineUpdateRequest) => {
  const response = await client.patch<WineUpdateResponse>(
    `/admin/wine/${wineId}`,
    data
  );
  return response.data;
};

export const addToWishlist = async (wineId: number, vintageYear?: number) => {
  const response = await client.post<WishlistResponse>(
    `/wine-wishlist/${wineId}`,
    null,
    {
      params: { vintageYear },
    }
  );
  return response.data;
};

export const removeFromWishlist = async (
  wineId: number,
  vintageYear?: number
) => {
  const response = await client.delete<WishlistResponse>(
    `/wine-wishlist/${wineId}`,
    {
      params: { vintageYear },
    }
  );
  return response.data;
};

export const getWishlist = async () => {
  const response = await client.get<WishlistListResponse>("/wine-wishlist");
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
  wineNameEng?: string;
  vintageYear: number;
  imageUrl?: string;
  // 유저가 첨부한 대표 사진(1번째 사진). 없으면 imageUrl(라벨)로 폴백.
  thumbnailUrl?: string | null;
  tasteDate: string;
  rating: number;
  createdAt: string;
  sort: string;
}

export const getMyTastingNotes = async () => {
  const response = await client.get<TastingNoteListResponse>(
    "/tasting-note/my"
  );
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
  // 신 서버는 생성된 noteId(number)를, 구 서버는 안내 문자열을 내려준다.
  result: number | string;
}

export const createTastingNote = async (data: TastingNoteRequest) => {
  const response = await client.post<TastingNoteResponse>(
    "/tasting-note/new-note",
    data
  );
  return response.data;
};

export interface TastingNoteImageDTO {
  imageId: number;
  imageUrl: string;
}

export interface TastingNoteImagesResponse {
  isSuccess: boolean;
  code: string;
  message: string;
  result: TastingNoteImageDTO[];
}

// 노트에 사진 첨부(누적 최대 5장). 사진은 항상 JPEG로 재인코딩 후 호출할 것.
export const uploadTastingNoteImages = async (
  noteId: number,
  imageUris: string[]
) => {
  const formData = new FormData();
  imageUris.forEach((uri, index) => {
    formData.append("images", {
      uri,
      name: `note_photo_${index}.jpg`,
      type: "image/jpeg",
    } as any);
  });

  const response = await client.post<TastingNoteImagesResponse>(
    `/tasting-note/${noteId}/images`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 60000,
    }
  );
  return response.data;
};

export const deleteTastingNoteImage = async (
  noteId: number,
  imageId: number
) => {
  const response = await client.delete<TastingNoteImagesResponse>(
    `/tasting-note/${noteId}/images/${imageId}`
  );
  return response.data;
};

export const getTastingNoteDetail = async (noteId: number) => {
  const response = await client.get<TastingNoteDetailResponse>(
    `/tasting-note/${noteId}`
  );
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
  wineNameEng?: string;
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
  // 유저가 첨부한 사진 목록(정렬순). 구 서버 응답에는 없다.
  images?: TastingNoteImageDTO[];
}
export interface TastingNoteDeleteResponse {
  isSuccess: boolean;
  code: string;
  message: string;
  result: string;
}

export const deleteTastingNote = async (noteId: number) => {
  const response = await client.delete<TastingNoteDeleteResponse>(
    `/tasting-note/${noteId}`
  );
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
  varietyEng?: string;
  country: string;
  countryEng?: string;
  region: string;
  regionEng?: string;
}

export const getFoodPairingRecommendation = async (foodName: string) => {
  const response = await client.get<FoodRecommendationResponse>(
    "/wine/recommend/food",
    {
      params: { foodName },
    }
  );
  return response.data;
};

// ── Wine Registration Request (user-submitted wines) ──

export type WineRequestStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface WineRequestDTO {
  requestId: number;
  wineId: number;
  status: WineRequestStatus;
  name: string;
  nameEng: string;
  imageUrl: string;
  sort: string;
  country: string;
  region: string;
  variety: string;
  vintageYear: number;
  memo: string;
  createdAt: string;
  memberName?: string;
}

export interface WineRequestResponse {
  isSuccess: boolean;
  code: string;
  message: string;
  result: WineRequestDTO;
}

export interface WineRequestListResponse {
  isSuccess: boolean;
  code: string;
  message: string;
  result: {
    content: WineRequestDTO[];
    pageNumber: number;
    totalPages: number;
    totalElements: number;
  };
}

export const submitWineRequest = async (formData: FormData) => {
  const response = await client.post<WineRequestResponse>(
    "/wine/request",
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return response.data;
};

export const getMyWineRequests = async (status?: WineRequestStatus) => {
  const response = await client.get<WineRequestListResponse>(
    "/wine/request/my",
    { params: { status } }
  );
  return response.data;
};

export const getAdminWineRequests = async (params: {
  status?: WineRequestStatus;
  page?: number;
  size?: number;
}) => {
  const response = await client.get<WineRequestListResponse>(
    "/admin/wine/request",
    { params }
  );
  return response.data;
};

export const approveWineRequest = async (requestId: number) => {
  const response = await client.patch<WineRequestResponse>(
    `/admin/wine/request/${requestId}/approve`
  );
  return response.data;
};

export const rejectWineRequest = async (requestId: number, reason?: string) => {
  const response = await client.patch<WineRequestResponse>(
    `/admin/wine/request/${requestId}/reject`,
    { reason }
  );
  return response.data;
};
