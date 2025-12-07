import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useUser } from '../context/UserContext';
import { getOnboardingRecommendation, OnboardingRecommendationDTO } from '../api/wine';

const RANK_BADGES = ['🥇', '🥈', '🥉'];
const RANK_TITLES = [
  "회원님에게 가장 강력 추천하는 스타일이에요!",
  "이런 스타일도 입맛에 맞으실 거예요.",
  "색다른 시도를 원하신다면?"
];

const RecommendationResultScreen = () => {
  const { completeOnboarding, setRecommendations: saveRecommendations } = useUser();
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState<OnboardingRecommendationDTO[]>([]);

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      const response = await getOnboardingRecommendation();
      if (response.isSuccess) {
        setRecommendations(response.result);
        saveRecommendations(response.result);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = () => {
    completeOnboarding();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8e44ad" />
        <Text style={styles.loadingText}>회원님의 취향을 분석 중입니다...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>취향 분석 결과</Text>
        <Text style={styles.subtitle}>회원님께 딱 맞는 와인 스타일을 찾았어요!</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {recommendations.map((item, index) => (
          <View key={index} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.rankBadge}>{RANK_BADGES[index]}</Text>
              <Text style={styles.cardTitle}>{RANK_TITLES[index]}</Text>
            </View>
            
            <View style={styles.cardBody}>
              <View style={styles.iconContainer}>
                <MaterialCommunityIcons 
                  name={item.sort === '레드' ? 'glass-wine' : 'glass-tulip'} 
                  size={40} 
                  color={item.sort === '레드' ? '#e74c3c' : '#f1c40f'} 
                />
              </View>
              <View style={styles.textContainer}>
                <Text style={styles.styleText}>
                  {item.country} {item.region}
                </Text>
                <Text style={styles.varietyText}>
                  {item.variety}
                </Text>
              </View>
            </View>

            <View style={styles.tagContainer}>
              <View style={styles.tag}>
                <Text style={styles.tagText}>#{item.sort}</Text>
              </View>
              <View style={styles.tag}>
                <Text style={styles.tagText}>#{item.country}</Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.button} onPress={handleComplete}>
          <Text style={styles.buttonText}>드링키지 시작하기</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  loadingText: {
    color: '#fff',
    marginTop: 16,
    fontSize: 16,
  },
  header: {
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#aaa',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 0,
    gap: 20,
  },
  card: {
    backgroundColor: '#1e1e1e',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  cardHeader: {
    marginBottom: 16,
  },
  rankBadge: {
    fontSize: 24,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  cardBody: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  styleText: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 4,
  },
  varietyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#333',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  tagText: {
    fontSize: 13,
    color: '#ccc',
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#222',
  },
  button: {
    backgroundColor: '#8e44ad',
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default RecommendationResultScreen;

