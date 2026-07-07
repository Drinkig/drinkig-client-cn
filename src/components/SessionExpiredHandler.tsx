import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { setOnSessionExpired } from "../api/client";
import { useUser } from "../context/UserContext";
import { useGlobalUI } from "../context/GlobalUIContext";

// 토큰 리프레시가 최종 실패(세션 만료)하면 안내 토스트와 함께 로그아웃시켜
// 로그인 화면으로 착지시킨다. UserProvider가 GlobalUIProvider 바깥에 있어
// UserContext에서 직접 토스트를 못 띄우므로, 두 컨텍스트 안쪽인 이 컴포넌트가
// api/client의 콜백을 구독한다.
const SessionExpiredHandler = () => {
  const { t } = useTranslation();
  const { logout, isLoggedIn } = useUser();
  const { showToast } = useGlobalUI();

  useEffect(() => {
    setOnSessionExpired(() => {
      if (!isLoggedIn) return;
      showToast(t("common.sessionExpired"), { type: "error" });
      logout(true);
    });
    return () => setOnSessionExpired(null);
  }, [isLoggedIn, logout, showToast, t]);

  return null;
};

export default SessionExpiredHandler;
