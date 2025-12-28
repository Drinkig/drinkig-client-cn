import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';

const CARD_HEIGHT = 42;
const GAP = 10;
const VISIBLE_ITEMS = 5;

export default function RollingCandidates() {
    const scrollAnim = useRef(new Animated.Value(0)).current;

    const candidates = Array.from({ length: 15 }, (_, i) => ({
        id: i + 1,
        text: `Analysis Candidate ${String(i + 1).padStart(2, '0')}`,
        subtext: `Matching Score...`
    }));

    const items = [...candidates, ...candidates, ...candidates];

    useEffect(() => {
        const totalHeight = candidates.length * (CARD_HEIGHT + GAP);

        Animated.loop(
            Animated.timing(scrollAnim, {
                toValue: -totalHeight,
                duration: 2000,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        ).start();
    }, []);

    return (
        <View style={styles.container}>
            <View style={styles.mask}>
                <Animated.View
                    style={[
                        styles.listContainer,
                        { transform: [{ translateY: scrollAnim }] }
                    ]}
                >
                    {items.map((item, index) => (
                        <View key={index} style={styles.card}>
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>{String(item.id).padStart(2, '0')}</Text>
                            </View>
                            <View style={styles.content}>
                                <Text style={styles.text}>추천 후보군 분석 중...</Text>
                                <Text style={styles.subtext}>ID: {item.text.split(' ')[2]}</Text>
                            </View>
                        </View>
                    ))}
                </Animated.View>

                <View style={styles.gradientTop} pointerEvents="none" />
                <View style={styles.gradientBottom} pointerEvents="none" />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        height: (CARD_HEIGHT + GAP) * 3.5,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    mask: {
        height: '100%',
        width: 280,
        overflow: 'hidden',
        position: 'relative',
    },
    listContainer: {
        width: '100%',
    },
    card: {
        height: CARD_HEIGHT,
        marginBottom: GAP,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    badge: {
        width: 24,
        height: 24,
        borderRadius: 4,
        backgroundColor: '#333',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    badgeText: {
        fontSize: 10,
        color: '#8e44ad',
        fontWeight: 'bold',
    },
    content: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    text: {
        color: '#ccc',
        fontSize: 13,
        fontWeight: '500',
    },
    subtext: {
        color: '#666',
        fontSize: 10,
        fontFamily: 'Courier',
    },
    gradientTop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 50,
        backgroundColor: '#1a1a1a',
        opacity: 0.8,
    },
    gradientBottom: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 50,
        backgroundColor: '#1a1a1a',
        opacity: 0.8,
    }
});
