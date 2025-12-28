import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';

export default function PlaceSelectionScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

    const handleSelect = (place: 'RESTAURANT' | 'SHOP') => {
        if (place === 'RESTAURANT') {
            navigation.navigate('CountrySelection', { place });
        } else {
            navigation.navigate('FoodSelection', { place });
        }
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
                <Text style={styles.title}>어디서 드시나요?</Text>
                <Text style={styles.subtitle}>장소에 따라 최적의 와인을 추천해드려요</Text>

                <View style={styles.selectionContainer}>
                    <TouchableOpacity
                        style={styles.selectionCard}
                        onPress={() => handleSelect('RESTAURANT')}
                        activeOpacity={0.9}
                    >
                        <View style={[styles.iconContainer, { backgroundColor: '#FF9F43' }]}>
                            <MaterialCommunityIcons name="silverware-fork-knife" size={40} color="#fff" />
                        </View>
                        <Text style={styles.cardTitle}>레스토랑</Text>
                        <Text style={styles.cardDesc}>음식과 분위기에{'\n'}딱 맞는 와인</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.selectionCard}
                        onPress={() => handleSelect('SHOP')}
                        activeOpacity={0.9}
                    >
                        <View style={[styles.iconContainer, { backgroundColor: '#8e44ad' }]}>
                            <MaterialCommunityIcons name="store" size={40} color="#fff" />
                        </View>
                        <Text style={styles.cardTitle}>와인샵/편의점</Text>
                        <Text style={styles.cardDesc}>가성비 좋고{'\n'}구매하기 쉬운</Text>
                    </TouchableOpacity>
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
        paddingTop: 20,
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
        marginBottom: 40,
    },
    selectionContainer: {
        flexDirection: 'row',
        gap: 16,
    },
    selectionCard: {
        flex: 1,
        backgroundColor: '#252525',
        borderRadius: 24,
        padding: 24,
        height: 220,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#333',
    },
    iconContainer: {
        width: 70,
        height: 70,
        borderRadius: 35,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 8,
    },
    cardDesc: {
        fontSize: 14,
        color: '#888',
        textAlign: 'center',
        lineHeight: 20,
    },
});
