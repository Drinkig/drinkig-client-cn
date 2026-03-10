import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as RNLocalize from 'react-native-localize';

import ko from './locales/ko.json';
import en from './locales/en.json';

const resources = {
    ko: { translation: ko },
    en: { translation: en },
};

export const getSystemLanguage = () => {
    const locales = RNLocalize.getLocales();
    if (locales && locales.length > 0) {
        const { countryCode, languageCode } = locales[0];
        if (countryCode === 'KR' || languageCode === 'ko') {
            return 'ko';
        }
    }
    return 'en';
};

i18n
    .use(initReactI18next)
    .init({
        resources,
        lng: getSystemLanguage(),
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false,
        },
        compatibilityJSON: 'v3' as any,
    });

export default i18n;
