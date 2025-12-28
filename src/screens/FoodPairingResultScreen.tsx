import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, ActivityIndicator, Animated, Easing } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { getFoodPairingRecommendation, FoodRecommendationDTO } from '../api/wine';
import { useUser } from '../context/UserContext';
import { FlavorProfile } from '../components/onboarding/FlavorProfileStep';
import AnalyzingRadarChart from '../components/common/AnalyzingRadarChart';
import RollingCandidates from '../components/common/RollingCandidates';

const RANK_BADGES = ['🥇', '🥈', '🥉'];

export default function FoodPairingResultScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const route = useRoute();
    const { foodName, country } = route.params as {
        foodName?: string,
        country?: string
    };

    const { user, flavorProfile } = useUser();

    const [loading, setLoading] = useState(true);
    const [recommendations, setRecommendations] = useState<FoodRecommendationDTO[]>([]);

    const [analysisStep, setAnalysisStep] = useState(0);
    const [showAnalysis, setShowAnalysis] = useState(true);
    const [pairingProfile, setPairingProfile] = useState<FlavorProfile | null>(null);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const chartOpacityAnim = useRef(new Animated.Value(0)).current;
    const progressBarAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const fetchRecommendations = async () => {
            try {
                const query = foodName || country;
                if (query) {
                    const response = await getFoodPairingRecommendation(query);
                    if (response.isSuccess) {
                        const { foodFlavor, recommendWines } = response.result;
                        setRecommendations(recommendWines);

                        if (foodFlavor) {
                            setPairingProfile(foodFlavor);
                        }
                    }
                }
            } catch (error) {
                console.error('Failed to fetch recommendations:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchRecommendations();
    }, [foodName, country]);

    useEffect(() => {
        startAnalysisSequence();
    }, []);

    const startAnalysisSequence = () => {
        Animated.sequence([
            Animated.timing(progressBarAnim, {
                toValue: 0.3,
                duration: 1500,
                easing: Easing.out(Easing.ease),
                useNativeDriver: false,
            }),
            Animated.timing(progressBarAnim, {
                toValue: 0.45,
                duration: 4500,
                easing: Easing.linear,
                useNativeDriver: false,
            }),
            Animated.timing(progressBarAnim, {
                toValue: 0.85,
                duration: 3000,
                easing: Easing.in(Easing.ease),
                useNativeDriver: false,
            }),
            Animated.timing(progressBarAnim, {
                toValue: 1,
                duration: 3500,
                easing: Easing.out(Easing.ease),
                useNativeDriver: false,
            })
        ]).start();

        animateStep(0);

        setTimeout(() => {
            setAnalysisStep(1);
            Animated.timing(chartOpacityAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }).start();
        }, 2000);

        setTimeout(() => {
            setAnalysisStep(2);
        }, 6000);

        setTimeout(() => {
            setAnalysisStep(3);
        }, 9000);

        setTimeout(() => {
            finishAnalysis();
        }, 12500);
    };

    const heroAnim = useRef(new Animated.Value(0)).current;
    const chartAnim = useRef(new Animated.Value(0)).current;
    const listAnim = useRef(new Animated.Value(0)).current;

    const heroY = heroAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] });
    const chartY = chartAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] });
    const listY = listAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] });

    const animateStep = (step: number) => {
        if (step === 0) {
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }).start();
        }
    };

    const startResultAnimation = () => {
        Animated.stagger(200, [
            Animated.timing(heroAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
            Animated.timing(chartAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
            Animated.timing(listAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ]).start();
    };

    const finishAnalysis = () => {
        Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
        }).start(() => {
            setShowAnalysis(false);
            setTimeout(startResultAnimation, 100);
        });
    };

    const getAnalysisText = (step: number) => {
        switch (step) {
            case 0: return `${foodName || country}와 가장 잘 어울리는\n와인 스타일을 분석 중이에요`;
            case 1: return `${user?.nickname || '회원'}님의 취향을 확인 중이에요`;
            case 2: return `${foodName || country}와 ${user?.nickname || '회원'}님의 취향을\n정밀하게 매칭하고 있어요`;
            case 3: return "가장 잘 어울리는 와인을 찾는 중...";
            default: return "";
        }
    };

    if (showAnalysis) {
        const progressWidth = progressBarAnim.interpolate({
            inputRange: [0, 1],
            outputRange: ['0%', '100%']
        });

        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.analysisContainer}>
                    <Animated.View style={[styles.analysisContent, { opacity: fadeAnim }]}>
                        <View style={styles.iconWrapper}>
                            {analysisStep === 0 && <Text style={{ fontSize: 80 }}>🍽️</Text>}
                            {analysisStep < 3 && analysisStep >= 1 && flavorProfile && (
                                <Animated.View style={{
                                    opacity: chartOpacityAnim,
                                    alignItems: 'center'
                                }}>
                                    <View style={styles.chartBg}>
                                        <AnalyzingRadarChart
                                            data={flavorProfile}
                                            size={220}
                                            mode={analysisStep === 1 ? 'grow' : 'jitter'}
                                        />
                                    </View>

                                </Animated.View>
                            )}
                            {analysisStep < 3 && analysisStep >= 1 && !flavorProfile && (
                                <Text style={{ fontSize: 80 }}>🍷</Text>
                            )}
                            {analysisStep === 3 && (
                                <View style={{ height: 240, justifyContent: 'center' }}>
                                    <RollingCandidates />
                                </View>
                            )}
                        </View>

                        <Text style={styles.analysisText}>
                            {getAnalysisText(analysisStep)}
                        </Text>
                    </Animated.View>

                    <View style={styles.progressContainer}>
                        <Animated.View style={[styles.progressBar, { width: progressWidth }]} />
                    </View>
                </View>
            </SafeAreaView>
        );
    }

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#8e44ad" />
            </SafeAreaView>
        )
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
                </TouchableOpacity>
                <View />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Animated.View style={[styles.heroContainer, { opacity: heroAnim, transform: [{ translateY: heroY }] }]}>
                    <Text style={styles.heroTitle}>{foodName || country}</Text>
                    <Text style={styles.heroSubtitle}>
                        {user?.nickname || '회원'}님의 취향을 기반으로{'\n'}
                        <Text style={{ color: '#8e44ad', fontWeight: 'bold' }}>완벽한 페어링</Text>을 찾았습니다.
                    </Text>
                </Animated.View>

                {pairingProfile && (
                    <Animated.View style={[styles.chartContainer, { opacity: chartAnim, transform: [{ translateY: chartY }] }]}>
                        <Text style={styles.chartTitle}>최종 매칭 결과 그래프</Text>
                        <View style={styles.chartWrapper}>
                            <AnalyzingRadarChart
                                data={pairingProfile}
                                size={160}
                                mode="fixed"
                            />
                        </View>
                        <Text style={styles.chartDescription}>
                            추천된 품종이 없다면, 이 그래프를{'\n'}
                            <Text style={{ color: '#fff', fontWeight: 'bold' }}>소믈리에나 샵 직원</Text>에게 보여주세요.
                        </Text>
                    </Animated.View>
                )}

                <Animated.View style={{ opacity: listAnim, transform: [{ translateY: listY }] }}>
                    {recommendations.length > 0 ? (
                        recommendations.map((item, index) => (
                            <View key={index} style={styles.wineCard}>
                                <View style={styles.wineInfo}>
                                    <View style={styles.infoHeader}>
                                        <View style={[styles.wineTypeBadge, { backgroundColor: getWineColor(item.sort) }]}>
                                            <Text style={styles.wineTypeText}>{item.sort}</Text>
                                        </View>
                                        <Text style={styles.wineName}>{item.variety}</Text>
                                    </View>
                                    <Text style={styles.wineCountry}>{item.country} {item.region && `· ${item.region}`}</Text>
                                </View>
                                <View style={styles.rankBadge}>
                                    {index < 3 ? (
                                        <Text style={{ fontSize: 20 }}>{RANK_BADGES[index]}</Text>
                                    ) : (
                                        <Text style={styles.rankText}>{index + 1}</Text>
                                    )}
                                </View>
                            </View>
                        ))
                    ) : (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>추천 결과가 없습니다.</Text>
                        </View>
                    )}
                </Animated.View>
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.button}
                    onPress={() => navigation.navigate('Main')}
                >
                    <Text style={styles.buttonText}>홈으로 돌아가기</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const getWineColor = (type: string) => {
    if (type.includes('레드') || type.toUpperCase().includes('RED')) return '#e74c3c';
    if (type.includes('화이트') || type.toUpperCase().includes('WHITE')) return '#f1c40f';
    if (type.includes('스파클링') || type.toUpperCase().includes('SPARKLING')) return '#3498db';
    if (type.includes('로제') || type.toUpperCase().includes('ROSE')) return '#e91e63';
    return '#888';
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1a1a1a',
    },
    analysisContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    analysisContent: {
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        width: '100%',
    },
    iconWrapper: {
        height: 250,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 40,
        width: '100%',
    },
    chartBg: {
        width: 240,
        height: 240,
        justifyContent: 'center',
        alignItems: 'center',
    },
    analysisText: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
        lineHeight: 30,
    },

    progressContainer: {
        width: '100%',
        height: 4,
        backgroundColor: '#333',
        borderRadius: 2,
        marginTop: 40,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        backgroundColor: '#8e44ad',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#1a1a1a',
    },
    backButton: {
        marginRight: 16,
    },
    headerTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    headerSubtitle: {
        color: '#888',
        fontSize: 13,
        marginTop: 2,
    },
    scrollContent: {
        padding: 20,
    },
    wineCard: {
        backgroundColor: '#252525',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    wineInfo: {
        flex: 1,
    },
    infoHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    wineTypeBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        marginRight: 8,
    },
    wineTypeText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#fff',
    },
    wineName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
        flex: 1,
    },
    wineCountry: {
        fontSize: 12,
        color: '#888',
    },
    rankBadge: {
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 12,
        borderRadius: 16,
        backgroundColor: '#333',
        borderWidth: 1,
        borderColor: '#8e44ad',
    },
    rankText: {
        color: '#8e44ad',
        fontWeight: 'bold',
        fontSize: 14,
    },
    footer: {
        padding: 24,
        borderTopWidth: 1,
        borderTopColor: '#222',
    },
    button: {
        backgroundColor: '#8e44ad',
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        color: '#888',
        fontSize: 16,
    },
    heroContainer: {
        marginBottom: 30,
        marginTop: 10,
    },
    heroTitle: {
        fontSize: 34,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 10,
    },
    heroSubtitle: {
        fontSize: 16,
        color: '#ccc',
        lineHeight: 24,
    },
    chartContainer: {
        alignItems: 'center',
        marginBottom: 30,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 16,
        padding: 20,
    },
    chartTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 15,
        letterSpacing: 0.5,
    },
    chartWrapper: {
        marginVertical: 5,
    },
    chartDescription: {
        textAlign: 'center',
        color: '#888',
        fontSize: 13,
        lineHeight: 20,
        marginTop: 10,
    },
});
