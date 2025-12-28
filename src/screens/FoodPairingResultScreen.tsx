import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, ActivityIndicator, Image } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { FOODS } from '../data/mockFoods';



export default function FoodPairingResultScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const route = useRoute();
    const { place, foodId, foodName, country } = route.params as {
        place: 'RESTAURANT' | 'SHOP',
        foodId?: number,
        foodName?: string,
        country?: string
    };

    const [loading, setLoading] = useState(true);
    const [food, setFood] = useState<any>(null);

    useEffect(() => {
        // Simulate API setup
        setTimeout(() => {
            if (place === 'SHOP') {
                if (foodName) {
                    setFood({ name: foodName });
                } else if (foodId) {
                    const selectedFood = FOODS.find(f => f.id === foodId);
                    setFood(selectedFood);
                }
            }
            setLoading(false);
        }, 1000); // Reduced delay
    }, [foodId, foodName, country, place]);

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#8e44ad" />
                <Text style={styles.loadingText}>
                    {place === 'RESTAURANT' ? '요리와 어울리는 와인을\n찾고 있어요...' : '음식과 어울리는 와인을\n찾고 있어요...'}
                </Text>
            </View>
        );
    }

    const renderHeaderContent = () => {
        if (place === 'RESTAURANT') {
            return (
                <>
                    <Text style={styles.subTitle}>선택하신</Text>
                    <View style={styles.foodBadge}>
                        <Text style={styles.foodName}>{country}</Text>
                    </View>
                    <Text style={styles.subTitle}>맛집의</Text>
                    {foodName && (
                        <View style={[styles.foodBadge, { marginTop: 4 }]}>
                            <Text style={styles.foodName}>{foodName}</Text>
                        </View>
                    )}
                    <Text style={styles.subTitle}>{foodName ? '와/과' : '에서'}</Text>
                    <Text style={styles.mainTitle}>가장 잘 어울리는 와인은?</Text>
                </>
            )
        }
        return (
            <>
                <Text style={styles.subTitle}>선택하신</Text>
                <View style={styles.foodBadge}>
                    {food?.icon && <MaterialCommunityIcons name={food.icon} size={20} color="#fff" style={{ marginRight: 6 }} />}
                    <Text style={styles.foodName}>{food?.name}</Text>
                </View>
                <Text style={styles.subTitle}>와/과</Text>
                <Text style={styles.mainTitle}>가장 잘 어울리는 와인은?</Text>
            </>
        )
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <MaterialCommunityIcons name="close" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>추천 결과</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.resultHeader}>
                    {renderHeaderContent()}
                </View>

                <View style={styles.bestTypeContainer}>
                    <Text style={styles.bestTypeLabel}>RECOMMENDATION</Text>
                    <Text style={[styles.bestType, { color: place === 'RESTAURANT' ? '#fff' : getWineColor(food?.bestPairing), fontSize: place === 'RESTAURANT' ? 28 : 32 }]}>
                        {place === 'RESTAURANT' ? '오늘의 추천 와인' : getWineTypeKorean(food?.bestPairing)}
                    </Text>
                    <Text style={styles.bestTypeDesc}>
                        {place === 'RESTAURANT'
                            ? `${country} 요리의 풍미를\n더욱 살려줄 와인입니다.`
                            : `${food?.name}의 맛을 가장 잘 살려주는\n${getWineTypeKorean(food?.bestPairing)}를 추천해요.`}
                    </Text>
                </View>



            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.button}
                    onPress={() => navigation.navigate('Main')}
                >
                    <Text style={styles.buttonText}>확인</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const getWineColor = (type: string) => {
    switch (type) {
        case 'RED': return '#e74c3c';
        case 'WHITE': return '#f1c40f'; // Yellowish
        case 'SPARKLING': return '#3498db';
        case 'ROSE': return '#e91e63';
        default: return '#fff';
    }
};

const getWineTypeKorean = (type: string) => {
    switch (type) {
        case 'RED': return '레드 와인';
        case 'WHITE': return '화이트 와인';
        case 'SPARKLING': return '스파클링 와인';
        case 'ROSE': return '로제 와인';
        default: return '와인';
    }
};


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1a1a1a',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#1a1a1a',
    },
    loadingText: {
        color: '#fff',
        marginTop: 20,
        fontSize: 18,
        textAlign: 'center',
        lineHeight: 26,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
    scrollContent: {
        paddingBottom: 40,
    },
    resultHeader: {
        paddingHorizontal: 24,
        marginTop: 10,
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        marginBottom: 30,
    },
    subTitle: {
        fontSize: 20,
        color: '#aaa',
        marginRight: 6,
    },
    foodBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#333',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        marginRight: 6,
    },
    foodName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    mainTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        width: '100%',
        marginTop: 8,
    },
    bestTypeContainer: {
        alignItems: 'center',
        marginBottom: 40,
        backgroundColor: '#252525',
        marginHorizontal: 24,
        borderRadius: 20,
        padding: 24,
        borderWidth: 1,
        borderColor: '#333',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 6,
    },
    bestTypeLabel: {
        color: '#888',
        fontSize: 12,
        letterSpacing: 1,
        marginBottom: 8,
        fontWeight: 'bold',
    },
    bestType: {
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    bestTypeDesc: {
        color: '#aaa',
        textAlign: 'center',
        lineHeight: 20,
    },
    listContainer: {
        paddingHorizontal: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 16,
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
    wineTypeBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        marginBottom: 6,
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
        marginBottom: 4,
    },
    wineCountry: {
        fontSize: 12,
        color: '#888',
        marginBottom: 4,
    },
    winePrice: {
        fontSize: 14,
        color: '#ccc',
        fontWeight: '500',
    },
    scoreBadge: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#333',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 12,
        borderWidth: 1,
        borderColor: '#8e44ad',
    },
    scoreText: {
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
});
