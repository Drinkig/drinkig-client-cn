import React from 'react';
import {
  View,
  StyleSheet,
  ViewProps,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { colors } from '../../constants/colors';

interface GlassCardProps extends ViewProps {
  style?: StyleProp<ViewStyle>;
  radius?: number;
  elevated?: boolean;
}

/**
 * Base glassmorphic surface used across the app.
 * - surface1 background
 * - 1px subtle border
 * - soft drop shadow (can be disabled via `elevated={false}`)
 */
const GlassCard = ({
  style,
  radius = 20,
  elevated = true,
  children,
  ...rest
}: GlassCardProps) => {
  return (
    <View
      style={[
        styles.base,
        { borderRadius: radius },
        elevated && styles.elevated,
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.surface1,
    borderWidth: 1,
    borderColor: colors.border,
  },
  elevated: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
});

export default GlassCard;
