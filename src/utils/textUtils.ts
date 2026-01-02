export const getParticle = (word: string, type: 'wa' | 'eun' | 'i' | 'ul') => {
    if (!word) return '';

    const lastChar = word.charCodeAt(word.length - 1);

    // Check if it's Korean
    if (lastChar < 0xAC00 || lastChar > 0xD7A3) {
        // Fallback or simple logic for non-Korean (assume vowel ending usually safer or strict match)
        // For simplicity, treat as vowel ending unless specific chars
        // Or just return the first option for now
        switch (type) {
            case 'wa': return '와';
            case 'eun': return '는';
            case 'i': return '가';
            case 'ul': return '를';
        }
    }

    const hasBatchim = (lastChar - 0xAC00) % 28 > 0;

    switch (type) {
        case 'wa':
            return hasBatchim ? '과' : '와';
        case 'eun':
            return hasBatchim ? '은' : '는';
        case 'i':
            return hasBatchim ? '이' : '가';
        case 'ul':
            return hasBatchim ? '을' : '를';
        default:
            return '';
    }
};

export const appendParticle = (word: string, type: 'wa' | 'eun' | 'i' | 'ul') => {
    return `${word}${getParticle(word, type)}`;
};
