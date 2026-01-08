import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';

interface NewbieCheckStepProps {
  isNewbie: boolean | null;
  onSelect: (isNewbie: boolean) => void;
  name: string;
}

const NewbieCheckStep = ({ isNewbie, onSelect, name }: NewbieCheckStepProps) => {
  return (
    <View style={styles.content}>
      <Text style={styles.stepTitle}>
        {name}님은{'\n'}와인에 대해 얼마나 알고 계신가요?
      </Text>

      <TouchableOpacity
        style={[styles.selectionCard, isNewbie === true && styles.selectedCard]}
        onPress={() => onSelect(true)}
      >
        <View style={styles.cardTextContainer}>
          <Text style={styles.cardTitle}>아직 잘 모르겠어요</Text>
          <Text style={styles.cardDesc}>내 취향을 알아가고 싶어요.</Text>
        </View>
        <Image
          source={require('../../assets/onboarding/Drinky_onboarding_2.1.png')}
          style={styles.cardImage}
          resizeMode="contain"
        />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.selectionCard, isNewbie === false && styles.selectedCard]}
        onPress={() => onSelect(false)}
      >
        <View style={styles.cardTextContainer}>
          <Text style={styles.cardTitle}>즐겨 마시는 편이에요</Text>
          <Text style={styles.cardDesc}>좋아하는 품종이나 국가가 확실해요.</Text>
        </View>
        <Image
          source={require('../../assets/onboarding/Drinky_onboarding_2.png')}
          style={styles.cardImage}
          resizeMode="contain"
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingTop: 20,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 24,
    lineHeight: 32,
  },
  selectionCard: {
    width: '100%',
    height: 110,
    padding: 20,
    backgroundColor: '#1e1e1e',
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  selectedCard: {
    borderColor: '#8e44ad',
    backgroundColor: '#2a1a2a',
  },
  cardTextContainer: {
    flex: 1,
    marginRight: 80,
    zIndex: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 13,
    color: '#aaa',
    lineHeight: 18,
  },
  cardImage: {
    position: 'absolute',
    right: -10,
    bottom: -15,
    width: 100,
    height: 100,
    opacity: 0.9,
    zIndex: 1,
  },
});

export default NewbieCheckStep;
