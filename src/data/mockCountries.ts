export interface Country {
    name: string;
    flag: string;
}

export const COUNTRIES: Country[] = [
    { name: '한식', flag: '🇰🇷' },
    { name: '중식', flag: '🇨🇳' },
    { name: '일식', flag: '🇯🇵' },
    { name: '양식', flag: '🍝' },
    { name: '스페인', flag: '🇪🇸' }, // Swapped to appear earlier
    { name: '프랑스', flag: '🇫🇷' },
    { name: '베트남', flag: '🇻🇳' },
    { name: '태국', flag: '🇹🇭' },
    { name: '인도', flag: '🇮🇳' },
    { name: '멕시코', flag: '🇲🇽' },
    { name: '남미', flag: '🌎' },

    { name: '이탈리아', flag: '🇮🇹' }, // Swapped to appear later (or as requested "Spain Italy order swap")
    { name: '아메리칸 차이니즈', flag: '🥡' },
];
