export const colors = {
  primary: "#9231BF",
  primaryDark: "#7C2AA2",
  background: "#1A191B", // 거의 #1a1a1a에 가까운 아주 미세한 틴트
  surface1: "#2A292B", // 거의 #2a2a2a에 가까운 아주 미세한 틴트
  surface2: "#343335", // Elevated elements
  textPrimary: "#FCFBFF", // 퓨어 화이트에 가까운 아주 미세한 오프화이트
  textSecondary: "#8B8A8C", // 거의 #888888에 가까운 그레이
  // WCAG AA: 기존 #666567은 배경(#1A191B) 위 대비 3.02:1로 미달이라 상향(≈5.3:1).
  // placeholder/힌트 텍스트에도 이 색이 표준으로 쓰이므로 가독성에 직접 영향.
  textTertiary: "#8E8D90", // Icons/Disabled
  // 별점 골드 단일 소스 — 화면마다 4종(#E8C94A/#F5C518/#f1c40f/#FFD86B)이
  // 혼용되던 것을 통일. 별점/평점 표시에는 반드시 이 토큰을 쓴다.
  ratingGold: "#E8C94A",
  border: "#38363A", // Dividers
  white: "#FFFFFF",
  black: "#000000",
  error: "#e74c3c",
  success: "#2ecc71", // confirmations / approved status
  warning: "#f5a623", // pending / caution status
};
