import { AxiosError } from "axios";

// API 에러를 사용자에게 보여줄 i18n 키로 변환한다.
// 네트워크/타임아웃/서버 오류를 구분해 "결과 없음"으로 뭉개지 않기 위한 공통 레이어.
// 사용: showToast(t(getErrorMessageKey(e))) 또는 ListStateView subtitle에 전달.
export const getErrorMessageKey = (error: unknown): string => {
  const e = error as AxiosError;
  if (e && e.isAxiosError) {
    if (e.code === "ECONNABORTED") return "common.error.timeout";
    if (!e.response) return "common.error.network";
    if (e.response.status >= 500) return "common.error.server";
  }
  return "common.error.generic";
};
