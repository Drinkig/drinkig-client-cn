import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, Image, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';

type WithdrawRetentionRouteProp = RouteProp<{
    WithdrawRetention: { authType: string };
}, 'WithdrawRetention'>;

const WithdrawRetentionScreen = () => {
    const navigation = useNavigation();
    const route = useRoute<WithdrawRetentionRouteProp>();
    const { authType } = route.params;

    const handleStay = () => {
        navigation.goBack();
    };

    const handleLeave = () => {
        navigation.navigate('WithdrawReason', { authType });
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <Image
                    source={require('../assets/Drinky-cry.png')}
                    style={styles.image}
                    resizeMode="contain"
                />
                <Text style={styles.title}>잠시만요!{'\n'}정말 떠나시나요?</Text>
                <Text style={styles.subtitle}>
                    지금 탈퇴하시면{'\n'}드링키지와 함께한 추억이 모두 사라져요...
                </Text>
            </View>

            <View style={styles.footer}>
                <TouchableOpacity style={styles.stayButton} onPress={handleStay}>
                    <Text style={styles.stayButtonText}>다음에 하기</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.leaveButton} onPress={handleLeave}>
                    <Text style={styles.leaveButtonText}>탈퇴할래요</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1a1a1a',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    image: {
        width: 280,
        height: 280,
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 12,
        lineHeight: 32,
    },
    subtitle: {
        fontSize: 16,
        color: '#aaa',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 30,
    },
    footer: {
        padding: 24,
        gap: 8,
    },
    stayButton: {
        backgroundColor: '#8e44ad',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    stayButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    leaveButton: {
        marginTop: 4,
        paddingVertical: 12,
        alignItems: 'center',
    },
    leaveButtonText: {
        color: '#666',
        fontSize: 14,
        fontWeight: '500',
        textDecorationLine: 'underline',
    },
});

export default WithdrawRetentionScreen;
