import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useRoute } from '@react-navigation/native'; // useRoute 추가
import { useUser } from '../context/UserContext';
import { getOnboardingRecommendation, OnboardingRecommendationDTO } from '../api/wine';
import PentagonRadarChart from '../components/common/PentagonRadarChart'; // 차트 컴포넌트 import


const RANK_TITLES = [
  "가장 추천하는 스타일",
  "이런 스타일도 좋아요",
  "색다른 시도라면"
];

const getWineTypeColor = (type: string) => {
  switch (type) {
    case '레드':
      return '#C0392B';
    case '화이트':
      return '#D4AC0D';
    case '스파클링':
      return '#2980B9';
    case '로제':
      return '#C2185B';
    case '디저트':
    case '주정강화':
      return '#D35400';
    default:
      return '#7F8C8D';
  }
};

const RecommendationResultScreen = () => {
  const navigation = useNavigation();
  const route = useRoute(); // route 훅 사용
  const { user, completeOnboarding, setRecommendations: saveRecommendations, setFlavorProfile: saveFlavorProfile } = useUser(); // user 추가
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState<OnboardingRecommendationDTO[]>([]);

  const flavorProfile = (route.params as any)?.flavorProfile;
  const nickname = (route.params as any)?.nickname;

  const [animations, setAnimations] = useState<Animated.Value[]>([]);

  useEffect(() => {

    if (flavorProfile) {
      saveFlavorProfile(flavorProfile);
    }
  }, [flavorProfile]);

  useEffect(() => {
    if (!loading && recommendations.length > 0) {
      const totalItems = (flavorProfile ? 1 : 0) + recommendations.length;
      const anims = Array.from({ length: totalItems }, () => new Animated.Value(0));
      setAnimations(anims);
    }
  }, [loading, recommendations.length, flavorProfile]);

  useEffect(() => {
    if (animations.length > 0) {
      Animated.stagger(200, animations.map(anim =>
        Animated.timing(anim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        })
      )).start();
    }
  }, [animations]);

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

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {flavorProfile && (
          <Animated.View
            style={[
              styles.chartContainer,
              animations[0] && {
                opacity: animations[0],
                transform: [{
                  translateY: animations[0].interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0]
                  })
                }]
              }
            ]}
          >
            <Text style={styles.chartTitle}>{nickname || user?.nickname}님의 입맛 취향</Text>
            <PentagonRadarChart data={flavorProfile} size={220} />
            <Text style={styles.chartHelperText}>
              와인 고를 때 고민된다면{'\n'}
              소믈리에나 직원에게 보여주세요
            </Text>
          </Animated.View>
        )}

        {recommendations.map((item, index) => {
          const animIndex = (flavorProfile ? 1 : 0) + index;
          const anim = animations[animIndex];

          return (
            <Animated.View
              key={index}
              style={[
                styles.card,
                anim && {
                  opacity: anim,
                  transform: [{
                    translateY: anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0]
                    })
                  }]
                }
              ]}
            >
              <View style={styles.cardHeader}>
                <View style={styles.headerTitleContainer}>
                  <Text style={styles.cardTitle}>{RANK_TITLES[index]}</Text>
                </View>
              </View>

              <View style={styles.cardBody}>
                <View style={styles.textContainer}>
                  <Text style={styles.styleText}>
                    {item.country} {item.region}
                  </Text>
                  <Text style={styles.varietyText}>
                    {item.variety}
                  </Text>
                </View>
                <View style={[styles.typeChip, { backgroundColor: getWineTypeColor(item.sort) }]}>
                  <Text style={styles.typeChipText}>{item.sort}</Text>
                </View>
              </View>


            </Animated.View>
          );
        })}
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
    paddingTop: 40,
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
    gap: 12,
  },
  chartContainer: {
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: '#1a1a1a',
    paddingTop: 24,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  chartTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  chartHelperText: {
    color: '#888',
    fontSize: 13,
    marginTop: 4,
    marginBottom: 8,
    textAlign: 'center',
    fontWeight: '500',
  },
  card: {
    backgroundColor: '#1e1e1e',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 15,
    paddingBottom: 15,
    borderWidth: 1,
    borderColor: '#333',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  typeChip: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 12,
  },
  typeChipText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rankBadge: {
    fontSize: 20,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 10,
  },
  cardBody: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginBottom: 0,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  styleText: {
    fontSize: 13,
    color: '#aaa',
    marginBottom: 6,
  },
  varietyText: {
    fontSize: 16,
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

