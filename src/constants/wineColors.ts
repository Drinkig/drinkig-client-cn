import { ImageSourcePropType } from "react-native";

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

// 타입 색상 배경 위에 얹는 텍스트 색 — 밝은 타입색(화이트/디저트 등) 위에서
// 흰 텍스트는 최악 1.5:1로 판독 불가라 어두운 색으로 통일 (6종 전부 AA 통과).
export const WINE_TYPE_ON_COLOR = "#1A191B";

// 타입 라벨 i18n — 서버 데이터가 한글("레드")로 오므로 다른 언어 UI에서
// 그대로 노출되지 않도록 공용 매핑으로 번역한다. 매칭 실패 시 원문 유지.
// (색상과 달리 라벨은 주정강화/디저트를 구분한다)
export function getWineTypeLabel(
  type: string | null | undefined,
  t: (key: string) => string
): string {
  if (!type) return "";
  const s = type.toLowerCase();
  if (s.includes("레드") || s.includes("red")) return t("wineType.red");
  if (s.includes("화이트") || s.includes("white")) return t("wineType.white");
  if (s.includes("스파클링") || s.includes("sparkling"))
    return t("wineType.sparkling");
  if (s.includes("로제") || s.includes("rosé") || s.includes("rose"))
    return t("wineType.rose");
  if (
    s.includes("주정강화") ||
    s.includes("fortified") ||
    s.includes("포트") ||
    s.includes("port")
  )
    return t("wineType.fortified");
  if (s.includes("디저트") || s.includes("dessert"))
    return t("wineType.dessert");
  return type;
}

// 이미지 없는 와인에 쓰는 기본 병 일러스트 — 흰 웰 + 아이콘 폴백을 대체한다.
// 전용 에셋은 레드/화이트/스파클링 3종뿐이라 로제·포트·주정강화는 레드,
// 디저트는 화이트로 폴백하고, 타입 미상이면 가장 흔한 레드를 쓴다.
const winePlaceholderImages = {
  red: require("../assets/wine_placeholder/red.png"),
  white: require("../assets/wine_placeholder/white.png"),
  sparkling: require("../assets/wine_placeholder/sparkling.png"),
} as const;

export function getWinePlaceholderImage(
  type?: string | null
): ImageSourcePropType {
  if (!type) return winePlaceholderImages.red;
  const t = type.toLowerCase();
  if (t.includes("스파클링") || t.includes("sparkling"))
    return winePlaceholderImages.sparkling;
  if (
    t.includes("화이트") ||
    t.includes("white") ||
    t.includes("디저트") ||
    t.includes("dessert")
  )
    return winePlaceholderImages.white;
  return winePlaceholderImages.red;
}

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
    t.includes("fortified") ||
    t.includes("포트") ||
    t.includes("port")
  )
    return wineTypeColors.dessert;
  return wineTypeColors.default;
}
