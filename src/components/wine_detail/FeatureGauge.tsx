import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface FeatureGaugeProps {
  label: string;
  value: number;
}

export default function FeatureGauge({ label, value }: FeatureGaugeProps) {
  return (
    <View style={styles.featureRow}>
      <Text style={styles.featureLabel}>{label}</Text>
      <View style={styles.gaugeContainer}>
        {[1, 2, 3, 4, 5].map((step) => (
          <View 
            key={step} 
            style={[
              styles.gaugeStep, 
              step <= value ? styles.gaugeActive : styles.gaugeInactive
            ]} 
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureLabel: {
    width: 50,
    color: '#888',
    fontSize: 14,
    fontWeight: '500',
  },
  gaugeContainer: {
    flex: 1,
    flexDirection: 'row',
    gap: 4,
    height: 8,
  },
  gaugeStep: {
    flex: 1,
    borderRadius: 4,
  },
  gaugeActive: {
    backgroundColor: '#8e44ad',
  },
  gaugeInactive: {
    backgroundColor: '#333',
  },
});

