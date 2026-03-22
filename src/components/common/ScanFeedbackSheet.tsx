import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    ActivityIndicator,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import { colors } from '../../constants/colors';
import client from '../../api/client';

type Rating = 'GOOD' | 'NORMAL' | 'BAD';
type Issue = 'WRONG_WINE' | 'MISSING_WINE' | 'NO_RESULT' | 'WRONG_INFO' | 'OTHER';

interface ScanFeedbackSheetProps {
    visible: boolean;
    onClose: () => void;
    scanType: 'label' | 'list';
}

const RATING_OPTIONS: { key: Rating; icon: string; color: string }[] = [
    { key: 'GOOD', icon: 'thumbs-up-outline', color: '#4CAF50' },
    { key: 'NORMAL', icon: 'hand-right-outline', color: '#E67E22' },
    { key: 'BAD', icon: 'thumbs-down-outline', color: '#E74C3C' },
];

const ISSUE_OPTIONS: Issue[] = ['WRONG_WINE', 'MISSING_WINE', 'NO_RESULT', 'WRONG_INFO', 'OTHER'];

const ScanFeedbackSheet = ({ visible, onClose, scanType }: ScanFeedbackSheetProps) => {
    const { t } = useTranslation();
    const [isVisible, setIsVisible] = useState(visible);
    const animation = useRef(new Animated.Value(0)).current;

    const [rating, setRating] = useState<Rating | null>(null);
    const [selectedIssues, setSelectedIssues] = useState<Issue[]>([]);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [thankYou, setThankYou] = useState(false);

    useEffect(() => {
        if (visible) {
            setIsVisible(true);
            setRating(null);
            setSelectedIssues([]);
            setComment('');
            setThankYou(false);
            Animated.timing(animation, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }).start();
        } else {
            Animated.timing(animation, {
                toValue: 0,
                duration: 250,
                useNativeDriver: true,
            }).start(() => setIsVisible(false));
        }
    }, [visible, animation]);

    if (!isVisible) return null;

    const toggleIssue = (issue: Issue) => {
        setSelectedIssues(prev =>
            prev.includes(issue) ? prev.filter(i => i !== issue) : [...prev, issue],
        );
    };

    const handleRating = async (selected: Rating) => {
        setRating(selected);
        if (selected === 'GOOD') {
            setSubmitting(true);
            try {
                await client.post('/scan-feedback', { scanType, rating: selected, issues: [], comment: null });
            } catch {}
            setSubmitting(false);
            setThankYou(true);
            setTimeout(onClose, 1200);
        }
    };

    const handleSubmit = async () => {
        if (!rating) return;
        Keyboard.dismiss();
        setSubmitting(true);
        try {
            await client.post('/scan-feedback', {
                scanType,
                rating,
                issues: selectedIssues,
                comment: comment.trim() || null,
            });
        } catch {}
        setSubmitting(false);
        setThankYou(true);
        setTimeout(onClose, 1200);
    };

    const backdropOpacity = animation.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 0.5],
    });
    const translateY = animation.interpolate({
        inputRange: [0, 1],
        outputRange: [400, 0],
    });

    const showIssueStep = rating && rating !== 'GOOD' && !thankYou;

    return (
        <View style={styles.overlay}>
            <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
                <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} />
            </Animated.View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.keyboardAvoid}
            >
                <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
                    {thankYou ? (
                        <View style={styles.thankYouContainer}>
                            <Ionicons name="checkmark-circle" size={48} color="#4CAF50" />
                            <Text style={styles.thankYouText}>{t('scanFeedback.thankYou')}</Text>
                        </View>
                    ) : !showIssueStep ? (
                        <>
                            <Text style={styles.title}>{t('scanFeedback.ratingTitle')}</Text>
                            <View style={styles.ratingRow}>
                                {RATING_OPTIONS.map(opt => (
                                    <TouchableOpacity
                                        key={opt.key}
                                        style={[
                                            styles.ratingButton,
                                            rating === opt.key && { borderColor: opt.color },
                                        ]}
                                        onPress={() => handleRating(opt.key)}
                                        disabled={submitting}
                                    >
                                        {submitting && rating === opt.key ? (
                                            <ActivityIndicator color={opt.color} size="small" />
                                        ) : (
                                            <Ionicons name={opt.icon} size={32} color={opt.color} />
                                        )}
                                        <Text style={[styles.ratingLabel, { color: opt.color }]}>
                                            {t(`scanFeedback.rating.${opt.key}`)}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </>
                    ) : (
                        <>
                            <Text style={styles.title}>{t('scanFeedback.issueTitle')}</Text>
                            <View style={styles.issueList}>
                                {ISSUE_OPTIONS.map(issue => {
                                    const selected = selectedIssues.includes(issue);
                                    return (
                                        <TouchableOpacity
                                            key={issue}
                                            style={[styles.issueChip, selected && styles.issueChipSelected]}
                                            onPress={() => toggleIssue(issue)}
                                        >
                                            <Ionicons
                                                name={selected ? 'checkmark-circle' : 'ellipse-outline'}
                                                size={18}
                                                color={selected ? colors.primary : colors.textSecondary}
                                                style={{ marginRight: 6 }}
                                            />
                                            <Text style={[styles.issueText, selected && styles.issueTextSelected]}>
                                                {t(`scanFeedback.issues.${issue}`)}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>

                            {selectedIssues.includes('OTHER') && (
                                <TextInput
                                    style={styles.commentInput}
                                    placeholder={t('scanFeedback.commentPlaceholder')}
                                    placeholderTextColor={colors.textTertiary}
                                    value={comment}
                                    onChangeText={setComment}
                                    maxLength={500}
                                    multiline
                                    numberOfLines={3}
                                />
                            )}

                            <TouchableOpacity
                                style={[styles.submitButton, selectedIssues.length === 0 && styles.submitButtonDisabled]}
                                onPress={handleSubmit}
                                disabled={selectedIssues.length === 0 || submitting}
                            >
                                {submitting ? (
                                    <ActivityIndicator color={colors.white} size="small" />
                                ) : (
                                    <Text style={styles.submitText}>{t('scanFeedback.submit')}</Text>
                                )}
                            </TouchableOpacity>
                        </>
                    )}
                </Animated.View>
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'flex-end',
        zIndex: 1000,
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: colors.black,
    },
    keyboardAvoid: {
        justifyContent: 'flex-end',
    },
    sheet: {
        backgroundColor: colors.background,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingTop: 24,
        paddingBottom: 40,
        paddingHorizontal: 20,
    },
    title: {
        fontSize: 17,
        fontWeight: '700',
        color: colors.white,
        textAlign: 'center',
        marginBottom: 20,
    },
    // Rating step
    ratingRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 16,
    },
    ratingButton: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 90,
        height: 80,
        borderRadius: 16,
        backgroundColor: colors.surface1,
        borderWidth: 2,
        borderColor: 'transparent',
        gap: 6,
    },
    ratingLabel: {
        fontSize: 13,
        fontWeight: '600',
    },
    // Issue step
    issueList: {
        gap: 8,
        marginBottom: 16,
    },
    issueChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRadius: 12,
        backgroundColor: colors.surface1,
        borderWidth: 1,
        borderColor: colors.border,
    },
    issueChipSelected: {
        borderColor: colors.primary,
        backgroundColor: 'rgba(142, 68, 173, 0.1)',
    },
    issueText: {
        fontSize: 15,
        color: colors.textSecondary,
        fontWeight: '500',
    },
    issueTextSelected: {
        color: colors.white,
    },
    commentInput: {
        backgroundColor: colors.surface1,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 14,
        color: colors.white,
        fontSize: 14,
        minHeight: 80,
        textAlignVertical: 'top',
        marginBottom: 16,
    },
    submitButton: {
        backgroundColor: colors.primary,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    submitButtonDisabled: {
        opacity: 0.4,
    },
    submitText: {
        color: colors.white,
        fontSize: 16,
        fontWeight: '700',
    },
    // Thank you
    thankYouContainer: {
        alignItems: 'center',
        paddingVertical: 20,
        gap: 12,
    },
    thankYouText: {
        fontSize: 17,
        fontWeight: '600',
        color: colors.white,
    },
});

export default ScanFeedbackSheet;
