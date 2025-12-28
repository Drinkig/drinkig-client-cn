import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, StatusBar } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { FOOD_CATEGORIES } from '../data/mockFoodCategories';
import { COUNTRY_FOODS } from '../data/mockCountryFoods';

export default function FoodSelectionScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const route = useRoute();
    const { place, country } = route.params as { place: 'RESTAURANT' | 'SHOP'; country?: string };

    // Determine categories based on place
    const categories = React.useMemo(() => {
        if (place === 'RESTAURANT' && country && COUNTRY_FOODS[country]) {
            return [{
                title: country,
                data: COUNTRY_FOODS[country]
            }]
        }
        return FOOD_CATEGORIES;
    }, [place, country]);

    // Default to the first category
    const [selectedCategoryIndex, setSelectedCategoryIndex] = useState(0);

    const handleSelect = (foodName: string) => {
        navigation.navigate('FoodPairingResult', { place, foodName, country });
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            <View style={styles.topSection}>
                <Text style={styles.title}>어떤 음식과 드시나요?</Text>
                <Text style={styles.subtitle}>음식에 맞춰 와인을 추천해드릴게요</Text>
            </View>

            <View style={styles.contentContainer}>
                {/* Left Sidebar: Categories - Only show if we have multiple categories */}
                {categories.length > 1 && (
                    <View style={styles.sidebar}>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            {categories.map((category, index) => {
                                const isSelected = selectedCategoryIndex === index;
                                return (
                                    <TouchableOpacity
                                        key={index}
                                        style={[
                                            styles.categoryItem,
                                            isSelected && styles.categoryItemActive
                                        ]}
                                        onPress={() => setSelectedCategoryIndex(index)}
                                    >
                                        <Text style={[
                                            styles.categoryText,
                                            isSelected && styles.categoryTextActive
                                        ]}>
                                            {category.title}
                                        </Text>
                                        {isSelected && <View style={styles.activeIndicator} />}
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </View>
                )}

                {/* Right Content: Food Items */}
                <View style={styles.mainContent}>
                    <View style={styles.categoryHeader}>
                        <Text style={styles.selectedCategoryTitle}>
                            {categories[selectedCategoryIndex]?.title || ''}
                        </Text>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.itemsContainer}>
                        <View style={styles.grid}>
                            {categories[selectedCategoryIndex]?.data.map((food, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={styles.foodItem}
                                    onPress={() => handleSelect(food)}
                                >
                                    <Text style={styles.foodItemText}>{food}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <View style={{ height: 40 }} />
                    </ScrollView>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1a1a1a',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 10,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'flex-start',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#fff',
    },
    contentContainer: {
        flex: 1,
        flexDirection: 'row',
    },
    sidebar: {
        width: '30%',
        backgroundColor: '#222',
        borderRightWidth: 1,
        borderRightColor: '#333',
    },
    categoryItem: {
        paddingVertical: 20,
        paddingHorizontal: 12,
        justifyContent: 'center',
        position: 'relative',
    },
    categoryItemActive: {
        backgroundColor: '#1a1a1a',
    },
    categoryText: {
        color: '#888',
        fontSize: 14,
        fontWeight: '500',
        lineHeight: 20,
    },
    categoryTextActive: {
        color: '#fff',
        fontWeight: 'bold',
    },
    activeIndicator: {
        position: 'absolute',
        left: 0,
        top: 15,
        bottom: 15,
        width: 4,
        backgroundColor: '#8e44ad',
        borderTopRightRadius: 4,
        borderBottomRightRadius: 4,
    },
    mainContent: {
        flex: 1,
        backgroundColor: '#1a1a1a',
    },
    topSection: {
        paddingHorizontal: 24,
        paddingTop: 10,
        paddingBottom: 20,
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#aaa',
    },
    categoryHeader: {
        padding: 20,
        paddingBottom: 10,
    },
    selectedCategoryTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 6,
    },
    selectedCategorySubtitle: {
        fontSize: 14,
        color: '#888',
    },
    itemsContainer: {
        padding: 16,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    foodItem: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: '#252525',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#333',
        marginBottom: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    foodItemText: {
        color: '#ddd',
        fontSize: 15,
        textAlign: 'center',
    },
});
