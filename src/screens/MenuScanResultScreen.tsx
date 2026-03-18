import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    FlatList,
    TouchableOpacity,
    SafeAreaView,
    ActivityIndicator,
    Animated,
    Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { colors } from '../constants/colors';
import client from '../api/client';

// --- Types ------------------------------------------------------------------

export interface ScannedWineItemDTO {
    wineId: number;
    nameEng: string;
    nameKor: string;
    imageUrl: string | null;
    vintageYear: number | null;
    menuPrice: string | null;
    sort: 'RED' | 'WHITE' | 'SPARKLING' | 'ROSE' | 'PORT' | 'OTHER';
    country: string;
    region: string;
    variety: string;
    flavorMatchScore: number; // 0–100
}

export interface MenuScanResultDTO {
    totalMatchedCount: number;
    matchedWines: ScannedWineItemDTO[];
    unmatchedWines: { rawText: string; vintageYear: number | null; menuPrice: string | null }[];
}

export interface MenuScanResponse {
    isSuccess: boolean;
    code: string;
    message: string;
    result: MenuScanResultDTO;
}

// --- Helpers ----------------------------------------------------------------

const SORT_COLORS: Record<string, string> = {
    RED: '#C0392B',
    WHITE: '#F1C40F',
    SPARKLING: '#AED6F1',
    ROSE: '#F1948A',
    PORT: '#922B21',
    OTHER: '#7F8C8D',
};

const SORT_LABELS: Record<string, string> = {
    RED: '레드',
    WHITE: '화이트',
    SPARKLING: '스파클링',
    ROSE: '로제',
    PORT: '포트',
    OTHER: '기타',
};

function ScoreRing({ score }: { score: number }) {
    const anim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(anim, { toValue: score / 100, duration: 700, useNativeDriver: false }).start();
    }, [score]);

    const bg =
        score >= 80 ? colors.primary : score >= 55 ? '#E67E22' : colors.textTertiary;

    return (
        <View style={[styles.scoreRing, { borderColor: bg }]}>
            <Text style={[styles.scoreText, { color: bg }]}>{score}%</Text>
        </View>
    );
}

// --- Main Screen ------------------------------------------------------------

type Props = NativeStackScreenProps<any, 'MenuScanResult'>;

export default function MenuScanResultScreen({ route, navigation }: Props) {
    const { imageUri } = route.params as { imageUri: string };
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<MenuScanResultDTO | null>(null);
    const [error, setError] = useState<string | null>(null);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const dotsAnim = useRef(new Animated.Value(0)).current;

    // Dots loading animation
    useEffect(() => {
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(dotsAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
                Animated.timing(dotsAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
            ]),
        );
        loop.start();
        return () => loop.stop();
    }, []);

    // Call the API
    useEffect(() => {
        const scanMenu = async () => {
            try {
                const formData = new FormData();
                formData.append('image', {
                    uri: imageUri,
                    name: 'menu_scan.jpg',
                    type: 'image/jpeg',
                } as any);

                const response = await client.post<MenuScanResponse>('/wine/menu-scan', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                    timeout: 60000,
                });

                setData(response.data.result);
            } catch (e: any) {
                const msg =
                    e?.response?.status === 429
                        ? '오늘 스캔 횟수를 모두 사용했습니다.\n내일 다시 시도해 주세요.'
                        : '메뉴판을 인식하지 못했습니다.\n사진을 더 또렷하게 찍어 다시 시도해 주세요.';
                setError(msg);
            } finally {
                setLoading(false);
                Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
            }
        };
        scanMenu();
    }, [imageUri]);

    // ----- Render helpers -----

    const renderWineItem = ({ item, index }: { item: ScannedWineItemDTO; index: number }) => {
        const isBest = item.flavorMatchScore >= 80;
        return (
            <TouchableOpacity
                style={[styles.wineCard, isBest && styles.wineCardHighlight]}
                activeOpacity={0.75}
                onPress={() => navigation.navigate('WineDetail', { wineId: item.wineId })}
            >
                {isBest && (
                    <View style={styles.bestBadge}>
                        <Ionicons name="star" size={11} color={colors.white} />
                        <Text style={styles.bestBadgeText}> 취향 저격</Text>
                    </View>
                )}
                <View style={styles.wineCardRow}>
                    {item.imageUrl ? (
                        <Image source={{ uri: item.imageUrl }} style={styles.wineImage} resizeMode="cover" />
                    ) : (
                        <View style={[styles.wineImage, styles.wineImagePlaceholder]}>
                            <Ionicons name="wine-outline" size={28} color={colors.border} />
                        </View>
                    )}

                    <View style={styles.wineInfo}>
                        <View style={styles.wineNameRow}>
                            <View style={[styles.sortBadge, { backgroundColor: SORT_COLORS[item.sort] }]}>
                                <Text style={styles.sortBadgeText}>{SORT_LABELS[item.sort]}</Text>
                            </View>
                        </View>
                        <Text style={styles.wineNameEng} numberOfLines={1}>{item.nameEng}</Text>
                        <Text style={styles.wineNameKor} numberOfLines={1}>{item.nameKor}</Text>
                        <Text style={styles.wineMeta} numberOfLines={1}>
                            {[item.country, item.region, item.variety].filter(Boolean).join(' · ')}
                        </Text>

                    </View>

                    <ScoreRing score={item.flavorMatchScore} />
                </View>
            </TouchableOpacity>
        );
    };

    // ----- Loading state -----
    if (loading) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} style={{ marginBottom: 24 }} />
                    <Text style={styles.loadingTitle}>AI가 메뉴판을 분석 중이에요</Text>
                    <Text style={styles.loadingSubtitle}>취향에 맞는 와인을 찾고 있어요...</Text>
                </View>
            </SafeAreaView>
        );
    }

    // ----- Error state -----
    if (error || !data) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={colors.white} />
                </TouchableOpacity>
                <View style={styles.loadingContainer}>
                    <Ionicons name="alert-circle-outline" size={56} color={colors.error} style={{ marginBottom: 16 }} />
                    <Text style={[styles.loadingTitle, { textAlign: 'center' }]}>{error ?? '알 수 없는 오류가 발생했습니다.'}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={() => navigation.goBack()}>
                        <Text style={styles.retryButtonText}>돌아가기</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    // ----- Result state -----
    const sorted = [...data.matchedWines].sort((a, b) => b.flavorMatchScore - a.flavorMatchScore);
    const hasUnmatched = data.unmatchedWines && data.unmatchedWines.length > 0;

    return (
        <SafeAreaView style={styles.safeArea}>
            <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={colors.white} />
                    </TouchableOpacity>
                    <View style={styles.headerCenter}>
                        <Text style={styles.headerTitle}>메뉴판 스캔 결과</Text>
                        <Text style={styles.headerSubtitle}>{data.totalMatchedCount}개의 와인을 찾았어요</Text>
                    </View>
                </View>

                <FlatList
                    data={sorted}
                    keyExtractor={item => String(item.wineId)}
                    renderItem={renderWineItem}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    ListHeaderComponent={
                        sorted.length === 0 ? (
                            <View style={styles.emptyContainer}>
                                <Ionicons name="search-outline" size={48} color={colors.textTertiary} />
                                <Text style={styles.emptyText}>DB에서 일치하는 와인을 찾지 못했어요</Text>
                            </View>
                        ) : null
                    }
                    ListFooterComponent={
                        hasUnmatched ? (
                            <View style={styles.unmatchedSection}>
                                <View style={styles.unmatchedDivider} />
                                <Text style={styles.unmatchedTitle}>
                                    정보를 찾지 못한 와인 ({data.unmatchedWines.length}개)
                                </Text>
                                <Text style={styles.unmatchedSubtitle}>
                                    메뉴판에서 인식했지만 상세 정보를 찾지 못했어요.
                                </Text>
                                {data.unmatchedWines.map((w, i) => (
                                    <View key={i} style={styles.unmatchedItem}>

                                        <Text style={styles.unmatchedText}>{w.rawText}</Text>

                                    </View>
                                ))}
                            </View>
                        ) : null
                    }
                />
            </Animated.View>
        </SafeAreaView>
    );
}

// --- Styles -----------------------------------------------------------------

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: colors.background,
        paddingTop: Platform.OS === 'android' ? 24 : 0,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    backButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerCenter: {
        flex: 1,
        marginLeft: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.textPrimary,
    },
    headerSubtitle: {
        fontSize: 13,
        color: colors.textSecondary,
        marginTop: 2,
    },
    listContent: {
        padding: 16,
        paddingBottom: 40,
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
    },
    loadingTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.textPrimary,
        marginBottom: 8,
    },
    loadingSubtitle: {
        fontSize: 14,
        color: colors.textSecondary,
    },
    // Wine card
    wineCard: {
        backgroundColor: colors.surface1,
        borderRadius: 14,
        padding: 14,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: colors.border,
    },
    wineCardHighlight: {
        borderColor: colors.primary,
        backgroundColor: 'rgba(142, 68, 173, 0.08)',
    },
    bestBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        backgroundColor: colors.primary,
        borderRadius: 10,
        paddingHorizontal: 8,
        paddingVertical: 3,
        marginBottom: 10,
    },
    bestBadgeText: {
        color: colors.white,
        fontSize: 11,
        fontWeight: '700',
    },
    wineCardRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    wineImage: {
        width: 60,
        height: 80,
        borderRadius: 8,
        marginRight: 12,
        backgroundColor: colors.surface2,
    },
    wineImagePlaceholder: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    wineInfo: {
        flex: 1,
    },
    wineNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    sortBadge: {
        borderRadius: 6,
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    sortBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: colors.white,
    },
    wineNameEng: {
        fontSize: 15,
        fontWeight: '700',
        color: colors.textPrimary,
        marginBottom: 2,
    },
    wineNameKor: {
        fontSize: 13,
        color: colors.textSecondary,
        marginBottom: 4,
    },
    wineMeta: {
        fontSize: 11,
        color: colors.textTertiary,
    },
    winePrice: {
        fontSize: 12,
        color: colors.textSecondary,
        marginTop: 4,
        fontWeight: '600',
    },
    // Score ring
    scoreRing: {
        width: 52,
        height: 52,
        borderRadius: 26,
        borderWidth: 2.5,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 10,
        flexShrink: 0,
    },
    scoreText: {
        fontSize: 12,
        fontWeight: '800',
    },
    // Empty
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 48,
    },
    emptyText: {
        marginTop: 12,
        fontSize: 15,
        color: colors.textSecondary,
        textAlign: 'center',
    },
    // Unmatched section
    unmatchedSection: {
        marginTop: 8,
        paddingTop: 16,
    },
    unmatchedDivider: {
        height: 1,
        backgroundColor: colors.border,
        marginBottom: 16,
    },
    unmatchedTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: colors.textSecondary,
        marginBottom: 4,
    },
    unmatchedSubtitle: {
        fontSize: 12,
        color: colors.textTertiary,
        marginBottom: 12,
    },
    unmatchedItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    unmatchedText: {
        flex: 1,
        fontSize: 13,
        color: colors.textSecondary,
    },
    unmatchedPrice: {
        fontSize: 12,
        color: colors.textTertiary,
        marginLeft: 8,
    },
    retryButton: {
        marginTop: 24,
        paddingHorizontal: 28,
        paddingVertical: 12,
        borderRadius: 24,
        backgroundColor: colors.primary,
    },
    retryButtonText: {
        color: colors.white,
        fontWeight: '700',
        fontSize: 15,
    },
});
