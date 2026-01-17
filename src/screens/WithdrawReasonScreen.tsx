import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    TextInput,
    Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useUser } from '../context/UserContext';
import { useGlobalUI } from '../context/GlobalUIContext';
import { deleteMember, deleteAppleMember } from '../api/member';
import appleAuth from '@invertase/react-native-apple-authentication';

type WithdrawReasonRouteProp = RouteProp<{
    WithdrawReason: { authType: string };
}, 'WithdrawReason'>;

const WithdrawReasonScreen = () => {
    const navigation = useNavigation();
    const route = useRoute<WithdrawReasonRouteProp>();
    const { authType } = route.params;
    const { logout } = useUser();
    const { showLoading, hideLoading, showAlert, closeAlert } = useGlobalUI();

    const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
    const [otherReason, setOtherReason] = useState<string>('');

    const reasons = [
        '앱을 자주 사용하지 않아요',
        '원하는 정보가 부족해요',
        '오류가 잦아요',
        '다른 서비스를 이용할래요',
        '새 계정을 만들고 싶어요',
        '기타',
    ];

    const toggleReason = (reason: string) => {
        setSelectedReasons(prev => {
            if (prev.includes(reason)) {
                return prev.filter(r => r !== reason);
            } else {
                return [...prev, reason];
            }
        });
    };

    const handleWithdraw = () => {
        if (selectedReasons.length === 0) {
            showAlert({
                title: '알림',
                message: '탈퇴 사유를 하나 이상 선택해주세요.',
                singleButton: true,
            });
            return;
        }

        if (selectedReasons.includes('기타') && !otherReason.trim()) {
            showAlert({
                title: '알림',
                message: '기타 사유를 입력해주세요.',
                singleButton: true,
            });
            return;
        }

        showAlert({
            title: '회원 탈퇴',
            message: '정말 탈퇴하시겠습니까?\n삭제된 계정은 복구할 수 없습니다.',
            confirmText: '탈퇴하기',
            singleButton: false,
            onConfirm: () => {
                closeAlert();
                processWithdrawal();
            },
        });
    };

    const processWithdrawal = async () => {
        showLoading();
        try {
            if (authType === 'APPLE') {
                await handleAppleDelete();
            } else {

                let fullReason = selectedReasons.filter(r => r !== '기타').join(', ');
                if (selectedReasons.includes('기타') && otherReason.trim()) {
                    fullReason = fullReason ? `${fullReason}, ${otherReason.trim()}` : otherReason.trim();
                }

                const response = await deleteMember(fullReason);
                hideLoading();

                if (response.isSuccess) {
                    logout(true);
                } else {
                    showAlert({
                        title: '오류',
                        message: `회원 탈퇴 실패: ${response.message}`,
                        singleButton: true,
                    });
                }
            }
        } catch (error: any) {
            hideLoading();
            console.error('Delete member error:', error);
            showAlert({
                title: '오류',
                message: '회원 탈퇴 처리 중 문제가 발생했습니다.',
                singleButton: true,
            });
        }
    };



    const handleAppleDelete = async () => {
        try {
            const appleAuthRequestResponse = await appleAuth.performRequest({
                requestedOperation: appleAuth.Operation.REFRESH,
            });

            const authCode = appleAuthRequestResponse.authorizationCode;
            if (!authCode) throw new Error('Failed to get authorization code');

            const response = await deleteAppleMember(authCode);
            hideLoading();

            if (response.isSuccess) {
                logout(true);
            } else {
                showAlert({
                    title: '오류',
                    message: `회원 탈퇴 실패: ${response.message}`,
                    singleButton: true,
                });
            }
        } catch (error: any) {
            hideLoading();
            if (error.code === appleAuth.Error.CANCELED) return;
            console.error('Apple delete member error:', error);
            showAlert({
                title: '오류',
                message: `Apple 인증/탈퇴 실패: ${error.message || '알 수 없는 오류'}`,
                singleButton: true,
            });
            throw error;
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Icon name="chevron-back" size={28} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>회원 탈퇴</Text>
                <View style={{ width: 28 }} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <Text style={styles.questionText}>
                    떠나시는 이유를 알려주세요.{'\n'}
                    더 나은 서비스를 만드는 데 도움이 됩니다.
                </Text>

                <Text style={styles.subQuestionText}>(중복 선택 가능)</Text>

                <View style={styles.reasonsContainer}>
                    {reasons.map((reason, index) => {
                        const isSelected = selectedReasons.includes(reason);
                        return (
                            <View key={index}>
                                <TouchableOpacity
                                    style={styles.reasonItem}
                                    onPress={() => toggleReason(reason)}
                                >
                                    <View style={[
                                        styles.checkbox,
                                        isSelected && styles.checkboxSelected
                                    ]}>
                                        {isSelected && <Icon name="checkmark" size={16} color="#fff" />}
                                    </View>
                                    <Text style={styles.reasonText}>{reason}</Text>
                                </TouchableOpacity>
                                {reason === '기타' && isSelected && (
                                    <TextInput
                                        style={styles.otherInput}
                                        placeholder="이유를 입력해주세요"
                                        placeholderTextColor="#666"
                                        multiline
                                        value={otherReason}
                                        onChangeText={setOtherReason}
                                    />
                                )}
                            </View>
                        );
                    })}
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.withdrawButton, (!selectedReasons.length || (selectedReasons.includes('기타') && !otherReason.trim())) && styles.withdrawButtonDisabled]}
                    onPress={handleWithdraw}
                    disabled={!selectedReasons.length || (selectedReasons.includes('기타') && !otherReason.trim())}
                >
                    <Text style={styles.withdrawButtonText}>탈퇴하기</Text>
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
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    content: {
        flex: 1,
        padding: 24,
    },
    questionText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        lineHeight: 30,
        marginBottom: 32,
    },
    subQuestionText: {
        fontSize: 14,
        color: '#888',
        marginBottom: 24,
        marginTop: -20,
    },
    reasonsContainer: {
        gap: 8,
    },
    reasonItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        gap: 12,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 4,
        borderWidth: 2,
        borderColor: '#666',
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxSelected: {
        borderColor: '#8e44ad',
        backgroundColor: '#8e44ad',
    },
    reasonText: {
        fontSize: 16,
        color: '#eee',
    },
    otherInput: {
        backgroundColor: '#2a2a2a',
        borderRadius: 8,
        padding: 12,
        color: '#fff',
        fontSize: 14,
        marginTop: 4,
        marginLeft: 36,
        minHeight: 80,
        textAlignVertical: 'top',
    },
    footer: {
        padding: 24,
        borderTopWidth: 1,
        borderTopColor: '#333',
    },
    withdrawButton: {
        backgroundColor: '#e74c3c',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    withdrawButtonDisabled: {
        backgroundColor: '#555',
    },
    withdrawButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default WithdrawReasonScreen;
