import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

interface StarRatingProps {
  rating: number;
  onRatingChange: (rating: number) => void;
}

export default function StarRating({ rating, onRatingChange }: StarRatingProps) {
  const renderStar = (index: number) => {
    let iconName = 'star-outline';
    if (rating >= index) {
      iconName = 'star';
    } else if (rating >= index - 0.5) {
      iconName = 'star-half';
    }

    return (
      <View key={index} style={styles.starWrapper}>
        <Icon
          name={iconName}
          size={40}
          color={rating >= index - 0.5 ? "#8e44ad" : "#555"}
          style={styles.starIcon}
        />
        <View style={styles.touchOverlay}>
          <TouchableOpacity
            style={styles.halfStarTouch}
            onPress={() => onRatingChange(index - 0.5)}
            activeOpacity={0.5} // 터치 피드백을 위해 약간 투명하게
          />
          <TouchableOpacity
            style={styles.halfStarTouch}
            onPress={() => onRatingChange(index)}
            activeOpacity={0.5}
          />
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((index) => renderStar(index))}
      </View>
      <Text style={styles.ratingText}>
        {rating > 0 ? `${rating}점` : '별점을 선택해주세요'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 10,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 8,
  },
  starWrapper: {
    position: 'relative',
    marginHorizontal: 4,
    width: 40, // Icon size와 동일하게
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  starIcon: {

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  touchOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
  },
  halfStarTouch: {
    flex: 1,

  },
  ratingText: {
    color: '#ccc',
    fontSize: 14,
    fontWeight: '500',
  },
});
