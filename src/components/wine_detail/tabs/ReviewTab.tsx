import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import ReviewCard from '../ReviewCard';
import { getWineReviews, ReviewDTO } from '../../../api/wine';

type SortOption = 'latest' | 'rating_high' | 'rating_low';

interface ReviewTabProps {
  wineId: number;
  selectedVintageYear: string | undefined;
}

export default function ReviewTab({ wineId, selectedVintageYear }: ReviewTabProps) {
  const [reviews, setReviews] = useState<ReviewDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [sortOption, setSortOption] = useState<SortOption>('latest');
  const [totalElements, setTotalElements] = useState(0);
  const [isSortDropdownOpen, setSortDropdownOpen] = useState(false);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true);

        const vintageYear = selectedVintageYear && !isNaN(Number(selectedVintageYear))
          ? Number(selectedVintageYear)
          : undefined;

        const response = await getWineReviews(wineId, {
          vintageYear: vintageYear,
          sortType: '최신순',
          page: 0,
          size: 100,
        });

        if (response.isSuccess) {
          setReviews(response.result.content);
          setTotalElements(response.result.content.length);
        } else {
          setReviews([]);
          setTotalElements(0);
        }
      } catch (error) {
        console.error('Failed to fetch reviews:', error);
        setReviews([]);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [wineId, selectedVintageYear]);

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
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
  }, [reviews, sortOption]);

  const getSortLabel = (option: SortOption) => {
    switch (option) {
      case 'rating_high': return '별점높은순';
      case 'rating_low': return '별점낮은순';
      case 'latest': default: return '최신순';
    }
  };

  const handleSortSelect = (option: SortOption) => {
    setSortOption(option);
    setSortDropdownOpen(false);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color="#8e44ad" />
      </View>
    );
  }

  if (reviews.length === 0) {
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
          <View style={styles.headerRow}>
            <Text style={styles.sectionTitle}>
              {selectedVintageYear && selectedVintageYear !== 'ALL' && selectedVintageYear !== 'NV' ? `${selectedVintageYear} 빈티지 리뷰` : '전체 리뷰'} ({totalElements})
            </Text>

            <TouchableOpacity
              style={styles.sortDropdownHeader}
              onPress={() => setSortDropdownOpen(!isSortDropdownOpen)}
              activeOpacity={0.8}
            >
              <Text style={styles.sortDropdownHeaderText}>{getSortLabel(sortOption)}</Text>
              <Ionicons
                name={isSortDropdownOpen ? 'chevron-up' : 'chevron-down'}
                size={16}
                color="#ccc"
              />
            </TouchableOpacity>
          </View>

          {isSortDropdownOpen && (
            <View style={styles.sortDropdownList}>
              {(['latest', 'rating_high', 'rating_low'] as SortOption[]).map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.sortDropdownItem,
                    sortOption === option && styles.sortDropdownItemSelected
                  ]}
                  onPress={() => handleSortSelect(option)}
                >
                  <Text style={[
                    styles.sortDropdownItemText,
                    sortOption === option && styles.sortDropdownItemTextSelected
                  ]}>
                    {getSortLabel(option)}
                  </Text>
                  {sortOption === option && (
                    <Ionicons name="checkmark" size={16} color="#8e44ad" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={styles.reviewList}>
          {sortedReviews.map((review, index) => (
            <ReviewCard key={`${index}`} review={review} />
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
  reviewHeaderContainer: {
    marginBottom: 16,
    zIndex: 100, // Increased zIndex for floating dropdown
    position: 'relative',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    zIndex: 101,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },

  sortDropdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#444',
    minWidth: 110,
    justifyContent: 'space-between',
  },
  sortDropdownHeaderText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
    marginRight: 4,
  },
  sortDropdownList: {
    position: 'absolute',
    top: 40,
    right: 0,
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#444',
    overflow: 'hidden',
    width: 140,
    zIndex: 1000,
    elevation: 5,
  },
  sortDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  sortDropdownItemSelected: {
    backgroundColor: '#333',
  },
  sortDropdownItemText: {
    color: '#aaa',
    fontSize: 13,
  },
  sortDropdownItemTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },

  reviewList: {
    gap: 12,
    zIndex: 1,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    color: '#666',
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
});
