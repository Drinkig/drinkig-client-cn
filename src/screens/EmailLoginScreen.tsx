import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Image, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import auth from '@react-native-firebase/auth';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
const localTheme = {
    colors: {
        background: '#121212',
        primary: '#7A28CB', // Purple from screenshot
    }
};

export default function EmailLoginScreen() {
    const navigation = useNavigation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const onEmailLoginPress = async () => {
        if (loading) return;
        if (!email || !password) {
            Alert.alert('알림', '이메일과 비밀번호를 입력해주세요.');
            return;
        }

        setLoading(true);
        try {
            console.log('Trying Email Login...');
            await auth().signInWithEmailAndPassword(email, password);
            console.log('Firebase Email Login Success');
            // UserContext will handle navigation to Main
        } catch (error: any) {
            console.error('Email Login Error:', error);
            let message = '이메일 로그인에 실패했습니다.';
            if (error.code === 'auth/invalid-email') message = '유효하지 않은 이메일 형식입니다.';
            if (error.code === 'auth/user-not-found') message = '등록되지 않은 사용자입니다.';
            if (error.code === 'auth/wrong-password') message = '비밀번호가 일치하지 않습니다.';
            if (error.code === 'auth/invalid-credential') message = '인증 정보가 유효하지 않습니다.';

            Alert.alert('로그인 오류', message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Icon name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>이메일 로그인</Text>
            </View>

            <View style={styles.content}>
                <Text style={styles.label}>이메일</Text>
                <TextInput
                    style={styles.input}
                    placeholder="이메일을 입력하세요"
                    placeholderTextColor="#666"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                />

                <Text style={styles.label}>비밀번호</Text>
                <TextInput
                    style={styles.input}
                    placeholder="비밀번호를 입력하세요"
                    placeholderTextColor="#666"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                />

                <TouchableOpacity
                    style={[styles.loginButton, loading && { opacity: 0.7 }]}
                    onPress={onEmailLoginPress}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <Text style={styles.loginButtonText}>로그인</Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: localTheme.colors.background, // #121212 assuming dark theme from context
        paddingHorizontal: 20,
        paddingTop: 60,
    },
    header: {
        marginBottom: 40,
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButton: {
        padding: 8,
        marginLeft: -8,
        marginRight: 10,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFF',
    },
    content: {
        flex: 1,
    },
    label: {
        color: '#CCC',
        marginBottom: 8,
        fontSize: 14,
    },
    input: {
        backgroundColor: '#333',
        color: '#FFF',
        padding: 16,
        borderRadius: 8,
        marginBottom: 20,
        fontSize: 16,
    },
    loginButton: {
        backgroundColor: localTheme.colors.primary, // Using theme color
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 20,
    },
    loginButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
