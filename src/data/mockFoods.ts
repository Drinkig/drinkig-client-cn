export interface Food {
    id: number;
    name: string;
    category: string;
    icon: string;
    bestPairing: 'RED' | 'WHITE' | 'SPARKLING' | 'ROSE';
}

export const FOODS: Food[] = [
    { id: 1, name: '소고기/스테이크', category: 'Main', icon: 'food-steak', bestPairing: 'RED' },
    { id: 2, name: '피자', category: 'Main', icon: 'pizza', bestPairing: 'RED' },
    { id: 3, name: '파스타 (토마토)', category: 'Main', icon: 'pasta', bestPairing: 'RED' },
    { id: 4, name: '파스타 (크림)', category: 'Main', icon: 'noodles', bestPairing: 'WHITE' },
    { id: 5, name: '치킨/튀김', category: 'Main', icon: 'food-drumstick', bestPairing: 'SPARKLING' },
    { id: 6, name: '회/해산물', category: 'Main', icon: 'fish', bestPairing: 'WHITE' },
    { id: 7, name: '치즈', category: 'Snack', icon: 'cheese', bestPairing: 'RED' },
    { id: 8, name: '과일', category: 'Snack', icon: 'fruit-cherries', bestPairing: 'WHITE' },
    { id: 9, name: '디저트/케이크', category: 'Snack', icon: 'cupcake', bestPairing: 'SPARKLING' },
];
