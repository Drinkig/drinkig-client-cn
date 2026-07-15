import { calculateCompatibilityScore } from "../compatibility";
import { FlavorProfile } from "../../components/onboarding/FlavorProfileStep";

const profile = (
  sweetness: number | null,
  acidity: number | null,
  tannin: number | null,
  body: number | null,
  alcohol: number | null
): FlavorProfile => ({ sweetness, acidity, tannin, body, alcohol });

describe("calculateCompatibilityScore (서버 공식: 100 - Σ|diff|×5)", () => {
  it("완전 일치면 100점", () => {
    const user = profile(3, 4, 2, 5, 1);
    const result = calculateCompatibilityScore(user, { ...user });
    expect(result?.score).toBe(100);
    expect(result?.details.every((d) => d.diff === 0)).toBe(true);
  });

  it("축당 |diff|×5 페널티를 5축 전체에 합산한다", () => {
    // diffs: 1+2+0+1+3 = 7 → 100 - 35 = 65
    const user = profile(3, 3, 3, 3, 4);
    const wine = profile(4, 1, 3, 2, 1);
    const result = calculateCompatibilityScore(user, wine);
    expect(result?.score).toBe(65);
  });

  it("최대 격차에서도 0 미만으로 내려가지 않는다 (0 클램프)", () => {
    // 5축 모두 diff 4 → 100 - 100 = 0 (클램프 경계)
    const result = calculateCompatibilityScore(
      profile(1, 1, 1, 1, 1),
      profile(5, 5, 5, 5, 5)
    );
    expect(result?.score).toBe(0);
  });

  it("값이 없는 축은 중간값(3)으로 간주한다", () => {
    // 유저 alcohol null → 3, 와인 alcohol 없음 → 3, diff 0
    const user = profile(3, 3, 3, 3, null);
    const result = calculateCompatibilityScore(user, {
      sweetness: 3,
      acidity: 3,
      tannin: 3,
      body: 3,
    });
    expect(result?.score).toBe(100);
  });

  it("범위 밖 값은 1~5로 클램프해 계산한다", () => {
    // 와인 sweetness 9 → 5로 클램프, diff 2 → 90
    const result = calculateCompatibilityScore(
      profile(3, 3, 3, 3, 3),
      profile(9, 3, 3, 3, 3)
    );
    expect(result?.score).toBe(90);
    expect(result?.details[0].wineValue).toBe(5);
  });

  it("details는 5축(alcohol 포함)을 모두 담는다", () => {
    const result = calculateCompatibilityScore(
      profile(3, 3, 3, 3, 3),
      profile(3, 3, 3, 3, 5)
    );
    expect(result?.details.map((d) => d.key)).toEqual([
      "sweetness",
      "acidity",
      "tannin",
      "body",
      "alcohol",
    ]);
    const alcoholDetail = result?.details.find((d) => d.key === "alcohol");
    expect(alcoholDetail?.diff).toBe(2);
    // t 미주입 시 피드백 키를 그대로 반환한다
    expect(alcoholDetail?.feedback).toBe(
      "wineCompatibility.detailFeedback.alcoholHighMuch"
    );
  });

  it("프로필이 없으면 null", () => {
    expect(
      calculateCompatibilityScore(null, profile(3, 3, 3, 3, 3))
    ).toBeNull();
    expect(
      calculateCompatibilityScore(profile(3, 3, 3, 3, 3), null)
    ).toBeNull();
  });
});
