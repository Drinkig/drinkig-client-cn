export const colors = {
  primary: "#9231BF",
  primaryDark: "#7C2AA2",
  // 앱 로고 PNG(Drinkig-App-Logo)에 박힌 라운드 사각형 타일과 '동일한' 보라색.
  // 스플래시 배경에 이 값을 써야 로고 타일이 배경에 녹아들어 네모 이음새가 안 보인다.
  logoTile: "#7E13B1",
  background: "#1A191B", // 거의 #1a1a1a에 가까운 아주 미세한 틴트
  surface1: "#2A292B", // 거의 #2a2a2a에 가까운 아주 미세한 틴트
  surface2: "#343335", // Elevated elements
  textPrimary: "#FCFBFF", // 퓨어 화이트에 가까운 아주 미세한 오프화이트
  textSecondary: "#8B8A8C", // 거의 #888888에 가까운 그레이
  // WCAG AA: 기존 #666567은 배경(#1A191B) 위 대비 3.02:1로 미달이라 상향(≈5.3:1).
  // placeholder/힌트 텍스트에도 이 색이 표준으로 쓰이므로 가독성에 직접 영향.
  textTertiary: "#8E8D90", // Icons/Disabled
  // 별점 단일 소스 — 별점/평점 표시에는 반드시 이 토큰을 쓴다.
  // 골드(#E8C94A)에서 브랜드 라이트 바이올렛으로 교체(2026-08-11, accent.text와 동일값.
  // theme.ts가 colors를 import하므로 순환 참조 방지 위해 값을 직접 기재).
  ratingStar: "#C795E5",
  border: "#38363A", // Dividers
  white: "#FFFFFF",
  black: "#000000",
  error: "#e74c3c",
  success: "#2ecc71", // confirmations / approved status
  warning: "#f5a623", // pending / caution status
};
