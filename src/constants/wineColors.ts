/**
 * Single source of truth for wine-type accent colors.
 *
 * Before this, ~13 screens each defined their own `getWineTypeColor` /
 * `getTypeColor` / `getWineColor` with diverging hex values, so the same wine
 * could change color between screens (e.g. white was both #F4D03F and #f1c40f,
 * rosé both #F1948A and #e91e63). Everything now resolves through `getWineTypeColor`.
 *
 * The label can arrive as Korean ("레드", "스파클링"), English ("Red",
 * "Sparkling"), or a longer phrase that contains one ("레드 와인"), so matching
 * is case-insensitive substring matching rather than an exact switch.
 */
export const wineTypeColors = {
  red: "#EF5350",
  white: "#F4D03F",
  sparkling: "#5DADE2",
  rose: "#F1948A",
  dessert: "#F5B041", // also fortified / 주정강화
  default: "#95A5A6",
} as const;

export function getWineTypeColor(type?: string | null): string {
  if (!type) return wineTypeColors.default;
  const t = type.toLowerCase();
  if (t.includes("레드") || t.includes("red")) return wineTypeColors.red;
  if (t.includes("화이트") || t.includes("white")) return wineTypeColors.white;
  if (t.includes("스파클링") || t.includes("sparkling"))
    return wineTypeColors.sparkling;
  if (t.includes("로제") || t.includes("rosé") || t.includes("rose"))
    return wineTypeColors.rose;
  if (
    t.includes("디저트") ||
    t.includes("dessert") ||
    t.includes("주정강화") ||
    t.includes("fortified")
  )
    return wineTypeColors.dessert;
  return wineTypeColors.default;
}
