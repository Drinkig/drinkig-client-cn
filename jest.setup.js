/* eslint-env jest */
// App.tsx 렌더 테스트가 앱 전체 화면 트리를 import하므로, 네이티브 모듈은
// 전부 mock이 필요하다 (§7 2026-07-15 — 미등록 시 `NativeModule: ... is null`).

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

jest.mock("react-native-google-mobile-ads", () => ({
  __esModule: true,
  default: () => ({
    initialize: jest.fn(() => Promise.resolve([])),
    setRequestConfiguration: jest.fn(() => Promise.resolve()),
  }),
  MaxAdContentRating: {},
  BannerAd: () => null,
  BannerAdSize: {},
  TestIds: {},
}));

jest.mock("react-native-iap", () => ({
  initConnection: jest.fn(() => Promise.resolve(true)),
  endConnection: jest.fn(() => Promise.resolve()),
  getSubscriptions: jest.fn(() => Promise.resolve([])),
  requestSubscription: jest.fn(() => Promise.resolve()),
  finishTransaction: jest.fn(() => Promise.resolve()),
  purchaseUpdatedListener: jest.fn(() => ({ remove: jest.fn() })),
  purchaseErrorListener: jest.fn(() => ({ remove: jest.fn() })),
  getAvailablePurchases: jest.fn(() => Promise.resolve([])),
  getPendingPurchasesIOS: jest.fn(() => Promise.resolve([])),
  clearTransactionIOS: jest.fn(() => Promise.resolve()),
}));

jest.mock("@react-native-firebase/auth", () => () => ({
  signInWithCredential: jest.fn(() => Promise.resolve()),
  signOut: jest.fn(() => Promise.resolve()),
  onAuthStateChanged: jest.fn(() => jest.fn()),
  currentUser: null,
}));
jest.mock("@react-native-firebase/analytics", () => () => ({
  logEvent: jest.fn(() => Promise.resolve()),
  logScreenView: jest.fn(() => Promise.resolve()),
  setUserId: jest.fn(() => Promise.resolve()),
}));

jest.mock("@react-native-seoul/kakao-login", () => ({
  login: jest.fn(() => Promise.resolve({})),
  logout: jest.fn(() => Promise.resolve()),
}));

jest.mock("@invertase/react-native-apple-authentication", () => {
  const appleAuth = {
    isSupported: false,
    performRequest: jest.fn(() => Promise.resolve({})),
    Operation: { LOGIN: 1 },
    Scope: { EMAIL: 0, FULL_NAME: 1 },
  };
  return { __esModule: true, default: appleAuth, appleAuth };
});

jest.mock("react-native-keychain", () => ({
  setGenericPassword: jest.fn(() => Promise.resolve()),
  getGenericPassword: jest.fn(() => Promise.resolve(false)),
  resetGenericPassword: jest.fn(() => Promise.resolve(true)),
}));

jest.mock("react-native-vision-camera", () => ({
  Camera: () => null,
  useCameraDevice: jest.fn(() => null),
  useCameraPermission: jest.fn(() => ({
    hasPermission: false,
    requestPermission: jest.fn(),
  })),
}));

jest.mock("react-native-video", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("react-native-photo-manipulator", () => ({
  __esModule: true,
  default: { batch: jest.fn(() => Promise.resolve("file://mock.jpg")) },
  MimeType: { JPEG: "image/jpeg" },
}));

jest.mock("react-native-localize", () => ({
  getLocales: () => [
    {
      languageCode: "ko",
      countryCode: "KR",
      languageTag: "ko-KR",
      isRTL: false,
    },
  ],
  findBestLanguageTag: () => ({ languageTag: "ko-KR", isRTL: false }),
}));

jest.mock("react-native-image-picker", () => ({
  launchCamera: jest.fn(() => Promise.resolve({ didCancel: true })),
  launchImageLibrary: jest.fn(() => Promise.resolve({ didCancel: true })),
}));

jest.mock("@react-native-community/blur", () => ({ BlurView: () => null }));
jest.mock("react-native-linear-gradient", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("react-native-config", () => ({
  __esModule: true,
  default: {},
}));

jest.mock("react-native-device-info", () => ({
  __esModule: true,
  default: {
    getVersion: jest.fn(() => "1.0.0"),
    getBuildNumber: jest.fn(() => "1"),
    getUniqueId: jest.fn(() => Promise.resolve("mock-device")),
  },
}));

jest.mock("react-native-haptic-feedback", () => ({
  __esModule: true,
  default: { trigger: jest.fn() },
}));
