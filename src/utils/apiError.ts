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

// 서버 에러 코드(BLOCK4004, NOTE4004 등)를 꺼낸다. axios가 4xx를 throw하면
// 코드가 error.response.data.code에 실려 오므로, 재시도해도 소용없는 정책성
// 실패(차단·한도 초과)를 일반 "다시 시도" 카피와 구분할 때 사용.
export const getApiErrorCode = (error: unknown): string | undefined => {
  const e = error as AxiosError<{ code?: string }>;
  if (!e || !e.isAxiosError || !e.response) return undefined;
  return e.response.data?.code;
};

// 소셜 로그인 시 "이미 다른 방식으로 가입된 이메일" 충돌.
// 백엔드가 /login/apple, /login/kakao/firebase에서 409 + code "MEMBER4091"로 내려준다.
// (status 409만으로 잡아도 되지만 code로 정확히 구분한다.)
export const isEmailAlreadyRegistered = (error: unknown): boolean => {
  const e = error as AxiosError<{ code?: string }>;
  if (!e || !e.isAxiosError || !e.response) return false;
  return e.response.data?.code === "MEMBER4091" || e.response.status === 409;
};
