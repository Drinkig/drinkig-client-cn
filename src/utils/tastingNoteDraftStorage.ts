import AsyncStorage from "@react-native-async-storage/async-storage";
import { NotePhoto } from "./notePhoto";

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
  // 첨부 사진(원본 URI + 선택적 크롭 정보). 캐시 정리로 파일이 사라질 수 있어
  // 복원은 best-effort — 렌더 실패한 항목은 깨짐 표시 후 사용자가 지우고 다시 첨부한다.
  photos?: NotePhoto[];
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
      const draft = JSON.parse(json) as TastingNoteDraft;
      // 크롭 도입 전 드래프트는 URI 문자열 배열이었다 — 객체 형태로 정규화
      if (draft.photos) {
        draft.photos = (draft.photos as unknown as (string | NotePhoto)[]).map(
          (photo) => (typeof photo === "string" ? { uri: photo } : photo)
        );
      }
      return draft;
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
