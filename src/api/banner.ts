import client from './client';

export interface BannerResponse {
    isSuccess: boolean;
    code: string;
    message: string;
    result: BannerDTO[];
}

export interface BannerDTO {
    bannerId: number;
    imageUrl: string;
    postUrl: string;
}

// 홈 화면 배너 목록 조회 API
export const getBanners = async () => {
    const response = await client.get<BannerResponse>('/banner');
    return response.data;
};
