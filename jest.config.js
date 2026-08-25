module.exports = {
  preset: "react-native",
  setupFiles: ["./jest.setup.js"],
  // RN 생태계 패키지는 미트랜스파일 배포가 많아 변환 대상에 포함해야 한다
  transformIgnorePatterns: [
    "node_modules/(?!(jest-)?react-native|@react-native(-community)?|@react-native-firebase|@react-navigation|@react-native-seoul|@invertase|react-native-.*)",
  ],
};
