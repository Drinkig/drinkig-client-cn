import client from "./client";
import { submitWineRequest, WineRequestResponse } from "./wine";

// --- Types ------------------------------------------------------------------

/** 와인 공식 5축 프로파일 (1~5). 서버 미배포 시 응답에 없을 수 있다. */
export interface WineFlavorProfileDTO {
  sweetness: number;
  acidity: number;
  tannin: number;
  body: number;
  alcohol: number;
}

export type WineSort =
  | "RED"
  | "WHITE"
  | "SPARKLING"
  | "ROSE"
  | "PORT"
  | "OTHER";

export type AiEstimateConfidence = "HIGH" | "MEDIUM" | "LOW";

/** DB 미매칭 와인에 대한 AI 추정 정보. 서버 미배포 시 없을 수 있다. */
export interface AiEstimateDTO {
  sort: WineSort;
  variety: string | null;
  country: string | null;
  sweetness: number;
  acidity: number;
  tannin: number;
  body: number;
  alcohol: number;
  confidence: AiEstimateConfidence;
  /** 0~100, 서버 공식(100 - Σ|diff|×5) */
  flavorMatchScore: number;
  /** 요청 lang 언어로 된 한 줄 이유 */
  reason: string;
}

export interface ScannedWineItemDTO {
  wineId: number;
  nameEng: string;
  nameKor: string;
  imageUrl: string | null;
  vintageYear: number | null;
  menuPrice: string | null;
  sort: WineSort;
  country: string;
  region: string;
  variety: string;
  flavorMatchScore: number; // 0–100
  /** 와인 공식 5축(1~5). 서버 미배포 시 undefined/null → 기존 표시로 폴백 */
  profile?: WineFlavorProfileDTO | null;
}

export interface UnmatchedWineDTO {
  rawText: string;
  vintageYear: number | null;
  menuPrice: string | null;
  /** AI 추정. 서버 미배포 시 undefined/null → 기존 표시로 폴백 */
  aiEstimate?: AiEstimateDTO | null;
}

export interface MenuScanResultDTO {
  totalMatchedCount: number;
  matchedWines: ScannedWineItemDTO[];
  unmatchedWines: UnmatchedWineDTO[];
}

export interface MenuScanResponse {
  isSuccess: boolean;
  code: string;
  message: string;
  result: MenuScanResultDTO;
}

export type ScanType = "label" | "list";

export type ScanLang = "ko" | "en" | "zh";

/** i18n.language → 서버 lang 파라미터 (ko/en/zh) */
export const toScanLang = (language: string | undefined): ScanLang => {
  const lang = (language || "").toLowerCase();
  if (lang.startsWith("ko")) return "ko";
  if (lang.startsWith("zh")) return "zh";
  return "en";
};

// --- API --------------------------------------------------------------------

/**
 * 라벨/메뉴판 이미지 스캔.
 * OCR + 매칭이 오래 걸릴 수 있어 60초 타임아웃, AbortSignal로 중단 가능.
 */
export const scanWineImage = async (params: {
  imageUri: string;
  scanType: ScanType;
  lang: ScanLang;
  signal?: AbortSignal;
}): Promise<MenuScanResponse> => {
  const formData = new FormData();
  formData.append("image", {
    uri: params.imageUri,
    name: "menu_scan.jpg",
    type: "image/jpeg",
  } as any);
  formData.append("scanType", params.scanType);
  formData.append("lang", params.lang);

  const response = await client.post<MenuScanResponse>(
    "/wine/menu-scan",
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 60000,
      signal: params.signal,
    }
  );
  return response.data;
};

// AI 추정 sort(enum) → 기존 /wine/request가 받는 표기(WineRegisterScreen과 동일 계열)
const SORT_TO_REQUEST_LABEL: Record<WineSort, string> = {
  RED: "Red",
  WHITE: "White",
  SPARKLING: "Sparkling",
  ROSE: "Rose",
  PORT: "Port",
  OTHER: "",
};

/**
 * 스캔에서 DB 매칭에 실패한 와인을 등록 요청으로 보낸다.
 * AI 추정값이 있으면 종류/품종/국가를 함께 전달해 운영자 검토를 돕는다.
 */
export const requestWineFromScan = async (
  item: UnmatchedWineDTO
): Promise<WineRequestResponse> => {
  const est = item.aiEstimate;
  const formData = new FormData();
  formData.append(
    "wineRegisterRequest",
    JSON.stringify({
      name: item.rawText,
      nameEng: "",
      sort: est ? SORT_TO_REQUEST_LABEL[est.sort] ?? "" : "",
      country: est?.country ?? "",
      region: "",
      variety: est?.variety ?? "",
      vintageYear: item.vintageYear ?? 0,
      // 운영자 검토용 메타(비노출 데이터) — 스캔 유입 표시 + 메뉴 가격
      memo: ["[scan]", item.menuPrice ?? ""].filter(Boolean).join(" "),
    })
  );
  return submitWineRequest(formData);
};
