import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Review } from '../../../data/dummyWines';
import ReviewCard from '../ReviewCard';

type SortOption = 'latest' | 'rating_high' | 'rating_low';

interface ReviewTabProps {
  reviews: (Review & { vintageYear?: string })[];
  selectedVintageYear: string | undefined;
}

export default function ReviewTab({ reviews, selectedVintageYear }: ReviewTabProps) {
  const [sortOption, setSortOption] = useState<SortOption>('latest');

  const sortedReviews = useMemo(() => {
    const currentReviews = [...reviews];
    return currentReviews.sort((a, b) => {
      switch (sortOption) {
        case 'rating_high':
          return b.rating - a.rating;
        case 'rating_low':
          return a.rating - b.rating;
        case 'latest':
        default:
          return b.date.localeCompare(a.date);
      }
    });
  }, [reviews, sortOption]);

  const renderSortButton = (option: SortOption, label: string) => (
    <TouchableOpacity 
      style={[styles.sortButton, sortOption === option && styles.activeSortButton]}
      onPress={() => setSortOption(option)}
    >
      <Text style={[styles.sortButtonText, sortOption === option && styles.activeSortButtonText]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  if (sortedReviews.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateText}>아직 작성된 리뷰가 없습니다.</Text>
      </View>
    );
  }

  return (
    <View style={styles.tabContent}>
      <View style={styles.sectionContainer}>
        <View style={styles.reviewHeaderContainer}>
          <Text style={styles.sectionTitle}>
            {selectedVintageYear ? `${selectedVintageYear} 빈티지 리뷰` : '전체 리뷰'} ({sortedReviews.length})
          </Text>
          <View style={styles.sortContainer}>
            {renderSortButton('latest', '최신순')}
            {renderSortButton('rating_high', '별점높은순')}
            {renderSortButton('rating_low', '별점낮은순')}
          </View>
        </View>
        <View style={styles.reviewList}>
          {sortedReviews.map((review, index) => (
            <ReviewCard key={`${review.id}-${index}`} review={review} />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tabContent: {
    paddingTop: 24,
  },
  sectionContainer: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    color: '#666',
    fontSize: 16,
  },
  reviewHeaderContainer: {
    marginBottom: 16,
  },
  sortContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  sortButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#2a2a2a',
    borderWidth: 1,
    borderColor: '#444',
  },
  activeSortButton: {
    backgroundColor: '#333',
    borderColor: '#8e44ad',
  },
  sortButtonText: {
    color: '#888',
    fontSize: 12,
  },
  activeSortButtonText: {
    color: '#8e44ad',
    fontWeight: '600',
  },
  reviewList: {
    gap: 12,
  },
});

