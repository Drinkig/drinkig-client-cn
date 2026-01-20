import { FlavorProfile } from '../components/onboarding/FlavorProfileStep';

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

const ATTRIBUTE_LABELS: Partial<Record<keyof FlavorProfile, string>> = {
    acidity: '산미',
    sweetness: '당도',
    tannin: '타닌',
    body: '바디감',
};

const getPenalty = (diff: number): number => {
    switch (diff) {
        case 0: return 0;
        case 1: return 4;
        case 2: return 7;
        case 3: return 12;
        case 4: return 17;
        default: return 17;
    }
};

export const calculateCompatibilityScore = (
    userProfile: FlavorProfile | null,
    wineStats: Partial<FlavorProfile> | null
): CompatibilityResult | null => {
    if (!userProfile || !wineStats) return null;

    let totalPenalty = 0;
    const details: CompatibilityDetail[] = [];

    const keys: (keyof FlavorProfile)[] = ['sweetness', 'acidity', 'tannin', 'body'];

    keys.forEach((key) => {
        const userVal = userProfile[key] || 3;
        const wineVal = wineStats[key] || 3;

        const safeUserVal = Math.max(1, Math.min(5, userVal));
        const safeWineVal = Math.max(1, Math.min(5, wineVal));

        const diff = safeWineVal - safeUserVal;
        const absDiff = Math.abs(diff);

        totalPenalty += getPenalty(absDiff);

        const label = ATTRIBUTE_LABELS[key] || key;

        details.push({
            key,
            label,
            userValue: safeUserVal,
            wineValue: safeWineVal,
            feedback: getFeedback(key, diff),
            diff,
        });
    });

    const score = Math.max(0, 100 - totalPenalty);

    return { score, details };
};

const getFeedback = (key: keyof FlavorProfile, diff: number): string => {
    if (diff === 0) return '취향에 딱 맞아요!';

    const isHigher = diff > 0;
    const absDiff = Math.abs(diff);

    const intensity = absDiff >= 2 ? '훨씬 ' : '조금 ';

    switch (key) {
        case 'sweetness':
            return isHigher
                ? `취향보다 ${intensity}달게 느껴질 수 있어요.`
                : `취향보다 ${intensity}덜 달아요.`;
        case 'acidity':
            return isHigher
                ? `취향보다 산미가 ${intensity}강해요.`
                : `취향보다 산미가 ${intensity}약해요.`;
        case 'tannin':
            return isHigher
                ? `취향보다 ${intensity}떫을 수 있어요.`
                : `취향보다 ${intensity}덜 떫고 부드러워요.`;
        case 'body':
            return isHigher
                ? `취향보다 ${intensity}묵직해요.`
                : `취향보다 ${intensity}가벼워요.`;
        default:
            return '';
    }
};
