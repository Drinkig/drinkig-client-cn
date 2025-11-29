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

export const searchWines = async (params: SearchParams) => {
  const response = await client.get<WineSearchResponse>('/admin/wine', {
    params,
  });
  return response.data;
};

