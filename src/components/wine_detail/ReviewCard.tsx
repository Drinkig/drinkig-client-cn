import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { ReviewDTO } from '../../api/wine';
import { sendReportEmail } from '../../utils/reportUtils';

interface ReviewCardProps {
  review: ReviewDTO;
}

export default function ReviewCard({ review }: ReviewCardProps) {

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return dateString.split('T')[0];
  };

  const displayDate = formatDate(review.tasteDate || review.createdAt);


  const getCleanReview = (text: string) => {
    if (!text) return '';

    let processed = text.replace(/^\[Finish\].*?\n\n/s, '');


    if (processed.startsWith('[Finish]')) {
      return '';
    }

    return processed;
  };

  const cleanReview = getCleanReview(review.review);

  return (
    <View style={styles.reviewItem}>
      <View style={styles.reviewHeader}>
        <View style={styles.reviewUserContainer}>
          <Text style={styles.reviewUser}>{review.name}</Text>
          {review.vintageYear ? (
            review.vintageYear > 0 ? (
              <View style={styles.vintageBadge}>
                <Text style={styles.vintageBadgeText}>{review.vintageYear}</Text>
              </View>
            ) : null
          ) : null}
        </View>
        <View style={styles.ratingContainer}>
          <Ionicons name="star" size={14} color="#f1c40f" />
          <Text style={styles.ratingText}>{review.rating.toFixed(1)}</Text>
        </View>
      </View>
      {cleanReview !== '' && (
        <Text style={styles.reviewComment}>{cleanReview}</Text>
      )}
      <View style={styles.reviewDateContainer}>
        <Text style={styles.reviewDate}>시음일: {displayDate}</Text>
        <TouchableOpacity
          style={styles.reportButton}
          onPress={() => sendReportEmail('REVIEW', {
            writerName: review.name,
            reviewDate: displayDate,
            reviewContent: cleanReview
          })}
        >
          <MaterialCommunityIcons name="alarm-light-outline" size={16} color="#666" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  reviewItem: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  reviewUserContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reviewUser: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  vintageBadge: {
    backgroundColor: '#333',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  vintageBadgeText: {
    color: '#aaa',
    fontSize: 10,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  reviewComment: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 6,
    lineHeight: 20,
  },
  reviewDateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  reviewDate: {
    color: '#666',
    fontSize: 12,
  },
  reportButton: {
    padding: 4,
  },
});

