import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    TouchableOpacity,
    StatusBar,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types';
import { calculateCompatibilityScore, CompatibilityResult } from '../utils/compatibility';
import { useUser } from '../context/UserContext';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { colors } from '../constants/colors';
import { useTranslation } from 'react-i18next';

type WineCompatibilityRouteProp = RouteProp<RootStackParamList, 'WineCompatibility'>;

const getScoreColor = (score: number) => {
    if (score >= 90) return '#2ecc71';
    if (score >= 80) return colors.primary;
    if (score >= 60) return '#f39c12';
    return '#95a5a6';
};

const WineCompatibilityScreen = () => {
    const { t } = useTranslation();
    const navigation = useNavigation();
    const route = useRoute<WineCompatibilityRouteProp>();
    const { userProfile, wineStats, wineName } = route.params;
    const { user } = useUser();

    const nickname = user?.nickname || t('wineCompatibility.defaultNickname');

    const getOverallFeedback = (score: number) => {
        if (score >= 90) return t('wineCompatibility.feedback.excellent', { nickname });
        if (score >= 80) return t('wineCompatibility.feedback.good');
        if (score >= 60) return t('wineCompatibility.feedback.average');
        return t('wineCompatibility.feedback.poor', { nickname });
    };

    const result: CompatibilityResult | null = React.useMemo(() => {
        return calculateCompatibilityScore(userProfile, wineStats, t);
    }, [userProfile, wineStats, t]);

    const [isLoading, setIsLoading] = useState(true);
    const [loadingDots, setLoadingDots] = useState('');

    const headerOpacity = useRef(new Animated.Value(0)).current;
    const scoreOpacity = useRef(new Animated.Value(0)).current;
    const detailsContainerOpacity = useRef(new Animated.Value(0)).current;

    const detailsAnims = useRef(result ? result.details.map(() => new Animated.Value(0)) : []).current;
    const [displayedFeedback, setDisplayedFeedback] = useState('');
    const [isTypingStarted, setIsTypingStarted] = useState(false);
    const [isButtonEnabled, setIsButtonEnabled] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            setLoadingDots(prev => prev.length >= 3 ? '' : prev + ' .');
        }, 500);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (!isLoading && isTypingStarted && result) {
            const fullFeedback = getOverallFeedback(result.score);
            const feedbackChars = Array.from(fullFeedback);
            setDisplayedFeedback('');

            let currentIndex = 0;
            const typingInterval = setInterval(() => {
                if (currentIndex < feedbackChars.length) {
                    currentIndex++;
                    setDisplayedFeedback(feedbackChars.slice(0, currentIndex).join(''));

                    const char = feedbackChars[currentIndex - 1];
                    if (char && char !== ' ' && char !== '\n') {
                        ReactNativeHapticFeedback.trigger('impactLight', {
                            enableVibrateFallback: true,
                            ignoreAndroidSystemSettings: false,
                        });
                    }
                } else {
                    clearInterval(typingInterval);
                    Animated.timing(detailsContainerOpacity, {
                        toValue: 1,
                        duration: 300,
                        useNativeDriver: true,
                    }).start(() => {
                        Animated.stagger(200, detailsAnims.map(anim => Animated.timing(anim, {
                            toValue: 1,
                            duration: 500,
                            useNativeDriver: true,
                        }))).start(() => {
                            setIsButtonEnabled(true);
                        });
                    });
                }
            }, 50);

            return () => clearInterval(typingInterval);
        }
    }, [isLoading, isTypingStarted, result, user]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(false);

            Animated.sequence([
                Animated.timing(headerOpacity, {
                    toValue: 1,
                    duration: 600,
                    useNativeDriver: true,
                }),
                Animated.timing(scoreOpacity, {
                    toValue: 1,
                    duration: 600,
                    useNativeDriver: true,
                }),
            ]).start(() => {
                setIsTypingStarted(true);
            });

        }, 3500);

        return () => clearTimeout(timer);
    }, []);

    const handleClose = () => {
        navigation.goBack();
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <StatusBar barStyle="light-content" backgroundColor={colors.background} />
                <Image
                    source={require('../assets/onboarding/Drinky-search.png')}
                    style={styles.loadingImage}
                    resizeMode="contain"
                />
                <Text style={styles.loadingText}>
                    <Text style={styles.highlightText}>{wineName}</Text>{'\n'}
                    {t('wineCompatibility.loading', { nickname })}{loadingDots}
                </Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={colors.background} />
            <View style={styles.content}>
                <View style={styles.header}>
                    <View style={styles.headerRight} />
                    <Text style={styles.headerTitle}>{t('wineCompatibility.headerTitle')}</Text>
                    <View style={styles.headerRight} />
                </View>

                <View style={styles.mainContainer}>
                    <Animated.View style={[styles.headerSection, { opacity: headerOpacity }]}>
                        <Text style={styles.reportTitle}>
                            <Text style={styles.highlightText}>{wineName}</Text>{'\n'}
                            <Text style={styles.highlightText}>{nickname}</Text>{t('wineCompatibility.questionTitle')}
                        </Text>
                    </Animated.View>

                    <View style={styles.conversationSection}>
                        <View style={styles.bubbleContainer}>
                            <Animated.View style={[styles.scoreRow, { opacity: scoreOpacity }]}>
                                <Text style={[styles.scoreBigText, { color: getScoreColor(result?.score || 0) }]}>
                                    {Math.round(result?.score || 0)}
                                </Text>
                                <Text style={styles.scoreUnitText}>{t('wineCompatibility.scoreUnit')}</Text>
                            </Animated.View>
                            <Text style={styles.bubbleText}>
                                {displayedFeedback}
                            </Text>
                            <View style={styles.bubbleArrow} />
                        </View>
                        <Image
                            source={require('../assets/onboarding/Drinky_smart_organize.png')}
                            style={styles.characterImage}
                            resizeMode="contain"
                        />
                    </View>

                    {result && (
                        <Animated.View style={[styles.detailsContainer, { opacity: detailsContainerOpacity }]}>
                            {result.details.map((item, index) => (
                                <Animated.View
                                    key={item.key}
                                    style={[
                                        styles.detailItem,
                                        {
                                            opacity: detailsAnims[index],
                                            transform: [{
                                                translateY: detailsAnims[index].interpolate({
                                                    inputRange: [0, 1],
                                                    outputRange: [20, 0]
                                                })
                                            }]
                                        }
                                    ]}
                                >
                                    <Text style={styles.detailLabel}>{item.label}</Text>
                                    <Text style={[
                                        styles.feedbackText,
                                        item.diff === 0 ? styles.feedbackPositive : styles.feedbackNeutral
                                    ]}>
                                        {item.feedback}
                                    </Text>
                                </Animated.View>
                            ))}
                        </Animated.View>
                    )}
                </View>

                <View style={styles.bottomContainer}>
                    <TouchableOpacity
                        style={[
                            styles.ctaButton,
                            !isButtonEnabled && styles.ctaButtonDisabled
                        ]}
                        onPress={handleClose}
                        activeOpacity={0.8}
                        disabled={!isButtonEnabled}
                    >
                        <Text style={styles.ctaButtonText}>{t('wineCompatibility.confirmButton')}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingImage: {
        width: 250,
        height: 250,
        marginBottom: 32,
    },
    loadingText: {
        color: colors.white,
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
        lineHeight: 24,
    },
    highlightText: {
        color: colors.primary,
    },
    content: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.white,
    },
    headerRight: {
        width: 32,
    },
    mainContainer: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    headerSection: {
        marginBottom: 20,
    },
    reportTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.white,
        lineHeight: 28,
    },
    conversationSection: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginTop: 10,
        marginBottom: 0,
        height: 150,
    },
    characterImage: {
        width: 170,
        height: 220,
        position: 'absolute',
        right: -30,
        bottom: 0,
    },
    bubbleContainer: {
        flex: 1,
        backgroundColor: colors.surface1,
        borderRadius: 20,
        borderTopRightRadius: 4,
        padding: 16,
        marginRight: 110,
        position: 'relative',
        borderWidth: 1,
        borderColor: colors.primary,
        zIndex: 1,
    },
    bubbleArrow: {
        position: 'absolute',
        right: -10,
        top: 20,
        width: 0,
        height: 0,
        backgroundColor: 'transparent',
        borderStyle: 'solid',
        borderLeftWidth: 10,
        borderRightWidth: 0,
        borderBottomWidth: 10,
        borderLeftColor: colors.primary,
        borderRightColor: 'transparent',
        borderBottomColor: 'transparent',
    },
    scoreRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginBottom: 8,
    },
    scoreBigText: {
        fontSize: 30,
        fontWeight: 'bold',
        color: colors.primary,
    },
    scoreUnitText: {
        fontSize: 18,
        color: '#ccc',
        marginLeft: 4,
        fontWeight: '600',
    },
    bubbleText: {
        fontSize: 14,
        color: '#eee',
        lineHeight: 20,
        minHeight: 60,
    },
    detailsContainer: {
        marginTop: 10,
        backgroundColor: colors.surface1,
        borderRadius: 16,
        padding: 20,
        marginHorizontal: 0,
        gap: 16,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    detailLabel: {
        fontSize: 15,
        fontWeight: 'bold',
        color: colors.white,
        width: 60,
    },
    feedbackText: {
        flex: 1,
        fontSize: 14,
        color: '#ccc',
        textAlign: 'right',
    },
    feedbackPositive: {
        color: '#a569bd',
        fontWeight: 'bold',
    },
    feedbackNeutral: {
        color: colors.textSecondary,
    },
    bottomContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 24,
        paddingBottom: 34,
    },
    ctaButton: {
        backgroundColor: colors.primary,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: colors.black,
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
        elevation: 8,
    },
    ctaButtonDisabled: {
        opacity: 0.3,
    },
    ctaButtonText: {
        color: colors.white,
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default WineCompatibilityScreen;
