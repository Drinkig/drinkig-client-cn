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

export const getBanners = async () => {
    const response = await client.get<BannerResponse>('/banner');
    return response.data;
};
