import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  TouchableOpacityProps,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors } from '../../constants/colors';

interface GlassChipProps extends TouchableOpacityProps {
  label: string;
  selected?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

/**
 * Pill-shaped selectable chip matching the glassmorphism surface system.
 */
const GlassChip = ({
  label,
  selected,
  style,
  textStyle,
  ...rest
}: GlassChipProps) => {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      style={[styles.chip, selected && styles.selectedChip, style]}
      {...rest}
    >
      <Text
        style={[
          styles.chipText,
          selected && styles.selectedChipText,
          textStyle,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: colors.surface1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedChip: {
    backgroundColor: colors.surface2,
    borderColor: colors.primary,
  },
  chipText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    includeFontPadding: false,
  },
  selectedChipText: {
    color: '#d4acfb',
    fontWeight: '700',
  },
});

export default GlassChip;
