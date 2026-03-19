import AsyncStorage from '@react-native-async-storage/async-storage';

const DRAFT_KEY = 'tasting_note_draft';

export interface TastingNoteDraft {
  wineId?: number;
  wineName?: string;
  wineNameEng?: string;
  wineImage?: string;
  wineType?: string;
  vintageYear: string;
  color: string;
  tasteDate: string;
  sweetness: number;
  acidity: number;
  tannin: number;
  body: number;
  alcohol: number;
  nose: string;
  finish: string;
  rating: number;
  review: string;
  savedAt: string;
}

export const saveDraft = async (draft: TastingNoteDraft): Promise<void> => {
  try {
    await AsyncStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch (error) {
    console.error('Failed to save tasting note draft', error);
  }
};

export const loadDraft = async (): Promise<TastingNoteDraft | null> => {
  try {
    const json = await AsyncStorage.getItem(DRAFT_KEY);
    if (json) {
      return JSON.parse(json) as TastingNoteDraft;
    }
    return null;
  } catch (error) {
    console.error('Failed to load tasting note draft', error);
    return null;
  }
};

export const clearDraft = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(DRAFT_KEY);
  } catch (error) {
    console.error('Failed to clear tasting note draft', error);
  }
};
