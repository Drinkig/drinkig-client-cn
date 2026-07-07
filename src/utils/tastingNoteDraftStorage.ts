import AsyncStorage from "@react-native-async-storage/async-storage";

// 특정 와인으로 바로 진입한 작성(딥링크/상세→작성)과 일반 진입 작성이
// 서로의 드래프트를 덮어쓰지 않도록 와인별로 키를 분리한다.
// draftId 없음 = 일반 진입("tasting_note_draft", 기존 키와 호환).
const DRAFT_KEY_PREFIX = "tasting_note_draft";

const keyFor = (draftId?: number): string =>
  draftId ? `${DRAFT_KEY_PREFIX}_${draftId}` : DRAFT_KEY_PREFIX;

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

export const saveDraft = async (
  draft: TastingNoteDraft,
  draftId?: number
): Promise<void> => {
  try {
    await AsyncStorage.setItem(keyFor(draftId), JSON.stringify(draft));
  } catch (error) {
    console.error("Failed to save tasting note draft", error);
  }
};

export const loadDraft = async (
  draftId?: number
): Promise<TastingNoteDraft | null> => {
  try {
    const json = await AsyncStorage.getItem(keyFor(draftId));
    if (json) {
      return JSON.parse(json) as TastingNoteDraft;
    }
    return null;
  } catch (error) {
    console.error("Failed to load tasting note draft", error);
    return null;
  }
};

export const clearDraft = async (draftId?: number): Promise<void> => {
  try {
    await AsyncStorage.removeItem(keyFor(draftId));
  } catch (error) {
    console.error("Failed to clear tasting note draft", error);
  }
};
