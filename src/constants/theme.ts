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

// A single refined accent. Softer, less muddy than the legacy flat #8e44ad,
// used sparingly (primary action, active states, icon chips).
export const accent = {
  base: "#B98CE6",
  soft: "rgba(185,140,230,0.14)",
  text: "#CBABEC",
  onAccent: "#1A1320",
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
