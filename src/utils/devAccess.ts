import DeviceInfo from "react-native-device-info";

/**
 * 개발자 모드 노출 여부.
 *
 * - 로컬 개발 빌드(`__DEV__`)에서는 항상 true.
 * - iOS TestFlight 빌드에서도 true → 내부 테스터가 dev 기능을 사용할 수 있도록 허용.
 *   (react-native-device-info는 TestFlight 빌드에서 installer package name으로
 *    "TestFlight" 문자열을 반환한다.)
 * - App Store 정식 배포 빌드에서는 false.
 *
 * 앱 실행 중에는 값이 바뀌지 않으므로 모듈 로드 시 한 번만 계산한다.
 */
const computeDevAccess = (): boolean => {
  if (__DEV__) return true;
  try {
    return DeviceInfo.getInstallerPackageNameSync() === "TestFlight";
  } catch {
    return false;
  }
};

export const isDevAccessEnabled: boolean = computeDevAccess();
