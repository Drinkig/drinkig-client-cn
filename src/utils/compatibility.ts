import { FlavorProfile } from '../components/onboarding/FlavorProfileStep';
import { TFunction } from 'i18next';

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
    wineStats: Partial<FlavorProfile> | null,
    t?: TFunction
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

const getFeedback = (key: keyof FlavorProfile, diff: number, t?: TFunction): string => {
    if (diff === 0) return t ? t('wineCompatibility.detailFeedback.perfect') : '취향에 딱 맞아요!';

    const isHigher = diff > 0;
    const absDiff = Math.abs(diff);
    const intensity = absDiff >= 2 ? 'Much' : 'Little';
    const direction = isHigher ? 'High' : 'Low';

    const feedbackKey = `wineCompatibility.detailFeedback.${key}${direction}${intensity}`;
    return t ? t(feedbackKey) : feedbackKey;
};
