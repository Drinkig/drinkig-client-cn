import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

interface TasteLevelSelectorProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  onHelpPress?: () => void;
}

export default function TasteLevelSelector({ label, value, onChange, onHelpPress }: TasteLevelSelectorProps) {
  return (
    <View style={styles.levelContainer}>
      <View style={styles.labelRow}>
        <Text style={styles.levelLabel}>{label}</Text>
        {onHelpPress && (
          <TouchableOpacity onPress={onHelpPress} style={styles.helpIconContainer}>
            <Icon name="help-circle-outline" size={18} color="#888" />
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.levelButtonsWrapper}>
        <View style={styles.levelButtons}>
          {[1, 2, 3, 4, 5].map((level) => (
            <TouchableOpacity
              key={level}
              style={[
                styles.levelButton,
                value === level && styles.levelButtonSelected,
              ]}
              onPress={() => onChange(level)}
            >
              <Text style={[styles.levelButtonText, value === level && { color: '#fff' }]}>{level}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.levelRangeLabels}>
          <View style={styles.levelRangeLabelContainer}>
            <Text style={styles.levelRangeText}>약함</Text>
          </View>
          <View style={styles.levelRangeLabelContainer}>
            <Text style={styles.levelRangeText}>강함</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  levelContainer: {
    marginBottom: 24,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  levelLabel: {
    color: '#ccc',
    fontSize: 14,
  },
  helpIconContainer: {
    marginLeft: 6,
    padding: 2,
  },
  levelButtonsWrapper: {
    paddingHorizontal: 4,
  },
  levelButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  levelButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#333',
  },
  levelButtonSelected: {
    backgroundColor: '#8e44ad',
  },
  levelButtonText: {
    color: '#888',
    fontSize: 18,
    fontWeight: 'bold',
  },
  levelRangeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  levelRangeLabelContainer: {
    width: 48,
    alignItems: 'center',
  },
  levelRangeText: {
    color: '#666',
    fontSize: 12,
  },
});

