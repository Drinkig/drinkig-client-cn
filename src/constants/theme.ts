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
} as const;

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
