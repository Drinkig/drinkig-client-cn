export const getVintageLabel = (year: number | null | undefined): string => {
  if (!year || year === 0) return "ALL";
  return year.toString();
};

// 산지 표기 조합. 신규 마스터 데이터의 region에는 국가가 섞여 있는 경우가 있어
// ("샤블리, 프랑스") country와 그대로 이어 붙이면 "프랑스 · 샤블리, 프랑스"로
// 중복된다. region 안의 국가 세그먼트를 걷어낸 뒤 조합한다.
export const formatOrigin = (
  country?: string | null,
  region?: string | null
): string => {
  const c = (country || "").trim();
  let r = (region || "").trim();
  if (c && r) {
    r = r
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s && s !== c)
      .join(", ");
  }
  return [c, r].filter(Boolean).join(" · ");
};
