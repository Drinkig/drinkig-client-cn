import { useRef } from "react";
import { useNavigation, usePreventRemove } from "@react-navigation/native";

// 작성 중 데이터가 있을 때 Android 하드웨어 백, iOS 스와이프 백, 헤더 백을
// 한 곳에서 가로채는 공통 가드.
//
// onAttemptExit(proceed)에서 확인 다이얼로그를 띄우고, 사용자가 이탈을
// 선택했을 때 proceed()를 호출하면 가로챘던 내비게이션 액션이 재개된다.
//
// 반환된 skipGuardRef.current = true 로 두면 다음 제거 시도 1회를 가드 없이
// 통과시킨다 (제출 성공 후 programmatic goBack 등).
export function useExitGuard(
  hasUnsavedData: boolean,
  onAttemptExit: (proceed: () => void) => void
) {
  const navigation = useNavigation();
  const skipGuardRef = useRef(false);

  usePreventRemove(hasUnsavedData, ({ data }) => {
    const proceed = () => navigation.dispatch(data.action);
    if (skipGuardRef.current) {
      skipGuardRef.current = false;
      proceed();
      return;
    }
    onAttemptExit(proceed);
  });

  return skipGuardRef;
}
