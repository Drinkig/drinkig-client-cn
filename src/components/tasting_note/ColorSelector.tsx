import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLOR_PALETTES } from './constants';
import { colors } from '../../constants/colors';
import { useTranslation } from 'react-i18next';

interface ColorSelectorProps {
  wineType?: string;
  selectedColor: string;
  onSelectColor: (color: string) => void;
}

export default function ColorSelector({ wineType, selectedColor, onSelectColor }: ColorSelectorProps) {
  const { t } = useTranslation();

  const getPaletteType = (type?: string) => {
    if (!type) return 'RED';
    const upper = type.toUpperCase();
    if (upper === 'RED' || upper === '레드') return 'RED';
    if (upper === 'WHITE' || upper === '화이트') return 'WHITE';
    if (upper === 'ROSE' || upper === '로제') return 'ROSE';
    if (upper === 'SPARKLING' || upper === '스파클링') return 'SPARKLING';
    if (upper === 'DESSERT' || upper === '디저트') return 'DESSERT';
    if (upper === 'FORTIFIED' || upper === '주정강화') return 'FORTIFIED';
    return 'RED';
  };

  const paletteType = getPaletteType(wineType);
  const palette = COLOR_PALETTES[paletteType] || COLOR_PALETTES['WHITE'];

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{t('tastingNoteWrite.color.title')}</Text>
      <View style={styles.colorPaletteContainer}>
        {palette.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.colorOption,
              selectedColor === option.value && styles.colorOptionSelected
            ]}
            onPress={() => onSelectColor(option.value)}
          >
            <View style={[styles.colorCircle, { backgroundColor: option.color }]} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    paddingLeft: 10,
  },
  colorPaletteContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    justifyContent: 'center',
  },
  colorOption: {
    width: '14.5%', // 6 items per row approx
    marginHorizontal: '1%',
    marginBottom: 8,
    alignItems: 'center',
    padding: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  colorOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(142, 68, 173, 0.1)',
  },
  colorCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: '#444',
  },
});

