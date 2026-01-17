import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { COUNTRIES } from '../data/mockCountries';

export default function CountrySelectionScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const route = useRoute();
    // Pass along the place type if needed, though we know it's RESTAURANT
    const { place } = route.params as { place: 'RESTAURANT' };

    const handleSelect = (country: string) => {
        // For now, we can reuse the pairing result or creating a specific one if needed.
        // The user said "use the country sorting from onboarding", implies we might recommend based on country.
        // I will navigate to a result screen (reused or new). reusing FoodPairingResult for now with 'country' param.
        // However, FoodPairingResult expects 'foodId'. I might need to adapt it.
        // Or maybe the next step after country is "Menu Selection" (Food Selection)?
        // The prompt saying "Restaurant selection -> Country selection ->..." implies the country is the "Food Category" equivalent.

        // Let's assume Country IS the food selection for Restaurant flow.
        // Passing 'country' as a param. catch is, FoodPairingResult logic relies on foodId currently.
        // I will modify FoodPairingResult to handle 'country' as well or 'foodName'.
        navigation.navigate('FoodSelection', { place: 'RESTAURANT', country: country });
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                <Text style={styles.title}>어떤 종류의 음식점인가요?</Text>
                <Text style={styles.subtitle}>음식 종류에 맞춰 와인을 추천해드릴게요</Text>

                <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                    <View style={styles.grid}>
                        {COUNTRIES.map((item) => (
                            <TouchableOpacity
                                key={item.name}
                                style={styles.chip}
                                onPress={() => handleSelect(item.name)}
                            >
                                <Text style={styles.flagText}>{item.flag}</Text>
                                <Text style={styles.chipText}>
                                    {item.name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </ScrollView>
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
        paddingHorizontal: 20,
        paddingVertical: 10,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'flex-start',
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 10,
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
        marginBottom: 24,
    },
    scrollView: {
        flex: 1,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        paddingBottom: 40,
    },
    chip: {
        paddingVertical: 12,
        paddingHorizontal: 10,
        backgroundColor: '#252525',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#333',
        minWidth: '30%',
        height: 56,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    flagText: {
        fontSize: 18,
    },
    chipText: {
        color: '#ddd',
        fontSize: 14, // Slightly smaller for better fit
        fontWeight: '500',
        textAlign: 'center',
        flexShrink: 1, // Allow text to shrink/wrap if needed, staying within bounds
    },
});
