import { colors } from "./colors";

/**
 * Modern-minimal design tokens.
 *
 * Introduced during the home-screen redesign. Additive on top of `colors` so
 * existing screens keep working; new/redesigned surfaces should pull spacing,
 * radius, elevation and accent values from here for a consistent language.
 */

// 4pt spacing scale — generous whitespace is the backbone of the minimal look.
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const radius = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 28,
  pill: 999,
} as const;

// Layered neutral surfaces. Calm, low-contrast steps instead of heavy fills.
export const surfaces = {
  base: colors.background, // #1A191B — app background
  raised: "#201F23", // subtle raise off the background (search, banners)
  card: "#242327", // card / tile surface
  hairline: "rgba(255,255,255,0.08)", // 1px separators & borders
  hairlineStrong: "rgba(255,255,255,0.12)",
  // 와인 이미지 전용 밝은 표면. 데이터셋 이미지가 흰 배경의 라벨 위주라
  // 다크 표면 위에서는 흰 사각형이 뜬 것처럼 보임 — 웰 자체를 흰색으로
  // 맞춰 이미지와 배경이 이어져 보이게 한다. 폴백 아이콘은 onImageWell 사용.
  imageWell: "#FFFFFF",
  onImageWell: "#9C9BA1", // fallback icons/placeholders on the white well
  // 사진 위 다크 오버레이(평점 뱃지·사진 카운트 필 등) 공용 스크림.
  // 화면마다 rgba 리터럴이 0.55/0.6으로 갈라지던 것을 단일 토큰으로 통일.
  scrim: "rgba(0,0,0,0.55)",
  onScrimHairline: "rgba(255,255,255,0.2)", // 스크림 뱃지 위 1px 보더
} as const;

// hex 색상에 알파를 입힌 rgba 문자열을 만든다. 배경/토큰 색의 반투명 변형이
// 필요한 곳(그라디언트 스크림 등)에서 리터럴 복제 대신 사용해, 원본 토큰이
// 바뀌어도 함께 따라가게 한다.
export const withAlpha = (hex: string, alpha: number): string => {
  const raw = hex.replace("#", "");
  const r = parseInt(raw.slice(0, 2), 16);
  const g = parseInt(raw.slice(2, 4), 16);
  const b = parseInt(raw.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
};

// Vivid violet accent with explicit emphasis tiers. The old #B98CE6 lavender
// read washed-out and flat, so everything looked equally (un)important. These
// tiers let the UI signal hierarchy:
//   base   → solid fill for the ONE primary action on a screen (high emphasis)
//   strong → pressed / deepest fill
//   soft   → tinted surface for secondary affordances (icon chips, quiet cards)
//   border → hairline outline for secondary emphasis
//   text   → accent-tinted text & icons on dark surfaces
//   onAccent → content sitting on a solid `base` fill (white pops on the vivid hue)
// Brand violet — sampled straight from the app logo (#9231BF).
export const accent = {
  base: "#9231BF",
  strong: "#7C2AA2",
  soft: "rgba(146,49,191,0.18)",
  border: "rgba(146,49,191,0.45)",
  text: "#C795E5",
  onAccent: "#FFFFFF",
} as const;

// Soft, low-opacity elevation. Replaces the heavy 0.3 / radius-16 shadows that
// read as dated. Use sparingly — the minimal look leans on hairlines, not drop
// shadows.
export const elevation = {
  soft: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 2,
  },
} as const;
