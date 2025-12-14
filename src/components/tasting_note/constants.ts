// 색상 팔레트 정의
export const COLOR_PALETTES: { [key: string]: { label: string; value: string; color: string }[] } = {
  WHITE: [
    { label: 'Water White', value: 'WATER_WHITE', color: '#FDFAF5' },
    { label: 'Pale Green', value: 'PALE_GREEN', color: '#F2F6DE' },
    { label: 'Straw', value: 'STRAW', color: '#F0EEC2' },
    { label: 'Pale Yellow', value: 'PALE_YELLOW', color: '#F4ECA6' },
    { label: 'Lemon', value: 'LEMON', color: '#F7E666' },
    { label: 'Butter Yellow', value: 'BUTTER_YELLOW', color: '#F4D355' },
    { label: 'Gold', value: 'GOLD', color: '#EBC046' },
    { label: 'Deep Gold', value: 'DEEP_GOLD', color: '#D9A934' },
    { label: 'Old Gold', value: 'OLD_GOLD', color: '#C49226' },
    { label: 'Pale Amber', value: 'PALE_AMBER', color: '#C78529' },
    { label: 'Amber', value: 'AMBER', color: '#B06D1F' },
    { label: 'Brown', value: 'BROWN', color: '#8C531B' },
  ],
  RED: [
    { label: 'Pinkish Purple', value: 'PINKISH_PURPLE', color: '#A63B6B' },
    { label: 'Bright Violet', value: 'BRIGHT_VIOLET', color: '#8C184E' },
    { label: 'Purple', value: 'PURPLE', color: '#750936' },
    { label: 'Deep Purple', value: 'DEEP_PURPLE', color: '#590526' },
    { label: 'Ruby', value: 'RUBY', color: '#8A0F1D' },
    { label: 'Deep Ruby', value: 'DEEP_RUBY', color: '#660A13' },
    { label: 'Blackish Red', value: 'BLACKISH_RED', color: '#3B040B' },
    { label: 'Garnet', value: 'GARNET', color: '#7B2618' },
    { label: 'Brick Red', value: 'BRICK_RED', color: '#8D361F' },
    { label: 'Tawny', value: 'TAWNY', color: '#934626' },
    { label: 'Mahogany', value: 'MAHOGANY', color: '#632D19' },
  ],
  ROSE: [
    { label: 'Grey Pink', value: 'GREY_PINK', color: '#FBE6E3' },
    { label: 'Pale Blush', value: 'PALE_BLUSH', color: '#FADADD' },
    { label: 'Shell Pink', value: 'SHELL_PINK', color: '#F7BFBE' },
    { label: 'Salmon', value: 'SALMON', color: '#F5A99B' },
    { label: 'Peach', value: 'PEACH', color: '#F5B695' },
    { label: 'Pink', value: 'PINK', color: '#F28E95' },
    { label: 'Rose', value: 'ROSE', color: '#E86A76' },
    { label: 'Deep Rose', value: 'DEEP_ROSE', color: '#D64858' },
    { label: 'Cherry', value: 'CHERRY', color: '#C93648' },
    { label: 'Onion Skin', value: 'ONION_SKIN', color: '#D47A60' },
  ],
  SPARKLING: [
    { label: 'Silver', value: 'SILVER', color: '#FAFBE6' },
    { label: 'Greenish Yellow', value: 'GREENISH_YELLOW', color: '#F4F6D4' },
    { label: 'Pale Gold', value: 'PALE_GOLD', color: '#F2E9AA' },
    { label: 'Rich Gold', value: 'RICH_GOLD', color: '#EAC65F' },
    { label: 'Deep Gold', value: 'DEEP_GOLD', color: '#D9A934' },
    { label: 'Old Gold', value: 'OLD_GOLD', color: '#C49226' },
    { label: 'Amber', value: 'AMBER', color: '#B06D1F' },
    { label: 'Rose Gold', value: 'ROSE_GOLD', color: '#D69562' },
  ],
  DESSERT: [
    { label: 'Honey', value: 'HONEY', color: '#E3B836' },
    { label: 'Topaz', value: 'TOPAZ', color: '#D69426' },
    { label: 'Amber', value: 'AMBER', color: '#BF731F' },
    { label: 'Caramel', value: 'CARAMEL', color: '#A65E1C' },
    { label: 'Rust', value: 'RUST', color: '#8F4217' },
    { label: 'Chestnut', value: 'CHESTNUT', color: '#703212' },
    { label: 'Coffee', value: 'COFFEE', color: '#54220E' },
    { label: 'Dark Brown', value: 'DARK_BROWN', color: '#3D1606' },
    { label: 'Ebony', value: 'EBONY', color: '#260D04' },
  ],
  FORTIFIED: [
    { label: 'Honey', value: 'HONEY', color: '#E3B836' },
    { label: 'Topaz', value: 'TOPAZ', color: '#D69426' },
    { label: 'Amber', value: 'AMBER', color: '#BF731F' },
    { label: 'Caramel', value: 'CARAMEL', color: '#A65E1C' },
    { label: 'Rust', value: 'RUST', color: '#8F4217' },
    { label: 'Chestnut', value: 'CHESTNUT', color: '#703212' },
    { label: 'Coffee', value: 'COFFEE', color: '#54220E' },
    { label: 'Dark Brown', value: 'DARK_BROWN', color: '#3D1606' },
    { label: 'Ebony', value: 'EBONY', color: '#260D04' },
  ],
};

// 도움말 정의
export const TASTE_TIPS: { [key: string]: { title: string; description: string } } = {
  sweetness: {
    title: '당도 (Sweetness)',
    description: '와인에서 느껴지는 단맛의 정도입니다.\n\n1점: 아주 드라이함 (단맛 없음)\n5점: 매우 달콤함'
  },
  acidity: {
    title: '산도 (Acidity)',
    description: '와인의 신맛으로, 침샘을 자극하는 정도입니다.\n\n높을수록 입안에 침이 많이 고이며 상큼한 느낌을 줍니다.'
  },
  tannin: {
    title: '탄닌 (Tannin)',
    description: '포도 껍질이나 씨에서 오는 떫은맛입니다.\n\n입안이 마르는 듯한 느낌이나 잇몸이 조여지는 느낌을 줍니다.'
  },
  body: {
    title: '바디 (Body)',
    description: '입안에서 느껴지는 와인의 무게감과 질감입니다.\n\n물(가벼움)과 우유(무거움)의 차이로 비유할 수 있습니다.'
  },
  alcohol: {
    title: '알코올 (Alcohol)',
    description: '알코올 도수에서 오는 볼륨감과 열감입니다.\n\n목을 넘길 때 느껴지는 따뜻함이나 후끈함의 정도입니다.'
  }
};

