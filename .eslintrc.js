module.exports = {
  root: true,
  extends: "@react-native",
  rules: {
    // 인라인 스타일 경고는 노이즈가 많아 비활성화 — 중요한 룰(react-hooks 등)이
    // 묻히지 않도록 한다. 필요 시 화면별로 다시 켜서 정리.
    "react-native/no-inline-styles": "off",
  },
};
