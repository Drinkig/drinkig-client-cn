import React from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  TouchableOpacityProps,
  StyleProp,
  ViewStyle,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { colors } from '../../constants/colors';

interface SelectableCardProps extends TouchableOpacityProps {
  selected: boolean;
  style?: StyleProp<ViewStyle>;
  radius?: number;
}

/**
 * Glassmorphic card that reflects a selected state:
 * - unselected: surface1 + subtle border
 * - selected: primary border + soft purple gradient overlay
 */
const SelectableCard = ({
  selected,
  style,
  radius = 16,
  children,
  ...rest
}: SelectableCardProps) => {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      style={[
        styles.base,
        { borderRadius: radius },
        selected && styles.selected,
        style,
      ]}
      {...rest}
    >
      {selected && (
        <LinearGradient
          colors={['rgba(142,68,173,0.25)', 'rgba(142,68,173,0.06)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFillObject, { borderRadius: radius }]}
          pointerEvents="none"
        />
      )}
      {children}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.surface1,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
  selected: {
    borderColor: colors.primary,
  },
});

export default SelectableCard;
