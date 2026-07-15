import { FlavorProfile } from "../components/onboarding/FlavorProfileStep";
import { TFunction } from "i18next";

export interface CompatibilityResult {
  score: number;
  details: CompatibilityDetail[];
}

export interface CompatibilityDetail {
  key: keyof FlavorProfile;
  label: string;
  userValue: number;
  wineValue: number;
  feedback: string;
  diff: number;
}

// 서버 공식과 동일한 5축. 순서는 상세 표시 순서이기도 하다.
export const COMPATIBILITY_KEYS: (keyof FlavorProfile)[] = [
  "sweetness",
  "acidity",
  "tannin",
  "body",
  "alcohol",
];

/**
 * 취향 궁합 점수 — 서버 공식과 동일: 5축(당도/산미/타닌/바디/알코올),
 * `100 - Σ|diff| × 5` (0 클램프). 값이 없는 축은 기존 동작대로 중간값(3)으로
 * 간주해 계산한다. 서버(flavorMatchScore)와 클라 계산이 항상 같은 결과를
 * 내도록 여기 외의 곳에서 공식을 재정의하지 않는다.
 */
export const calculateCompatibilityScore = (
  userProfile: FlavorProfile | null,
  wineStats: Partial<FlavorProfile> | null,
  t?: TFunction
): CompatibilityResult | null => {
  if (!userProfile || !wineStats) return null;

  let totalPenalty = 0;
  const details: CompatibilityDetail[] = [];

  COMPATIBILITY_KEYS.forEach((key) => {
    const userVal = userProfile[key] || 3;
    const wineVal = wineStats[key] || 3;

    const safeUserVal = Math.max(1, Math.min(5, userVal));
    const safeWineVal = Math.max(1, Math.min(5, wineVal));

    const diff = safeWineVal - safeUserVal;
    const absDiff = Math.abs(diff);

    totalPenalty += absDiff * 5;

    const label = t ? t(`wineCompatibility.attribute.${key}`) : key;

    details.push({
      key,
      label,
      userValue: safeUserVal,
      wineValue: safeWineVal,
      feedback: getFeedback(key, diff, t),
      diff,
    });
  });

  const score = Math.max(0, 100 - totalPenalty);

  return { score, details };
};

export const getScoreColor = (score: number): string => {
  if (score >= 90) return "#b06ad6";
  if (score >= 80) return "#2ecc71";
  if (score >= 60) return "#f39c12";
  return "#95a5a6";
};

const getFeedback = (
  key: keyof FlavorProfile,
  diff: number,
  t?: TFunction
): string => {
  if (diff === 0)
    return t
      ? t("wineCompatibility.detailFeedback.perfect")
      : "취향에 딱 맞아요!";

  const isHigher = diff > 0;
  const absDiff = Math.abs(diff);
  const intensity = absDiff >= 2 ? "Much" : "Little";
  const direction = isHigher ? "High" : "Low";

  const feedbackKey = `wineCompatibility.detailFeedback.${key}${direction}${intensity}`;
  return t ? t(feedbackKey) : feedbackKey;
};
