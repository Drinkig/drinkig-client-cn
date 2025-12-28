import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import LinearGradient from 'react-native-linear-gradient'; // [NEW] Import

interface Category {
    title: string;
    data: string[];
}

interface CategorizedSelectionStepProps {
    title: string;
    categories: Category[];
    selected: string[];
    onSelect: (value: string) => void;
    allowCustomInput?: boolean;
}

export const CategorizedSelectionStep = ({ title, categories, selected, onSelect, allowCustomInput }: CategorizedSelectionStepProps) => {
    const [isInputVisible, setIsInputVisible] = useState(false);
    const [inputText, setInputText] = useState('');

    // Collect all options flatly to check for custom value
    const allOptions = categories.flatMap(c => c.data);
    const customValue = selected.find(val => !allOptions.includes(val) && val !== '기타');

    const handleCustomSubmit = () => {
        if (inputText.trim()) {
            onSelect(inputText.trim());
            setInputText('');
        }
        setIsInputVisible(false);
    };

    return (
        <View style={styles.content}>
            <Text style={styles.stepTitle}>{title}</Text>
            <Text style={styles.stepDesc}>여러 개 선택 가능해요.</Text>

            {/* ScrollView Container with Gradients */}
            <View style={{ flex: 1 }}>
                <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 20 }}>
                    {categories.map((category, index) => (
                        <View key={category.title} style={styles.section}>
                            <Text style={styles.sectionTitle}>{category.title}</Text>
                            <View style={styles.grid}>
                                {category.data.map((opt) => {
                                    // Handle '기타' logic if needed
                                    if (allowCustomInput && opt === '기타') {
                                        if (customValue) {
                                            return (
                                                <TouchableOpacity
                                                    key="custom-value"
                                                    style={[styles.chip, styles.selectedChip]}
                                                    onPress={() => onSelect(customValue)}
                                                >
                                                    <Text style={[styles.chipText, styles.selectedChipText]}>{customValue}</Text>
                                                </TouchableOpacity>
                                            );
                                        }
                                        if (isInputVisible) {
                                            return (
                                                <View key="custom-input" style={[styles.chip, styles.inputChip]}>
                                                    <TextInput
                                                        style={styles.textInput}
                                                        value={inputText}
                                                        onChangeText={setInputText}
                                                        placeholder="직접 입력"
                                                        placeholderTextColor="#888"
                                                        autoFocus
                                                        onSubmitEditing={handleCustomSubmit}
                                                        onBlur={handleCustomSubmit}
                                                        returnKeyType="done"
                                                    />
                                                </View>
                                            );
                                        }
                                        return (
                                            <TouchableOpacity
                                                key={opt}
                                                style={styles.chip}
                                                onPress={() => setIsInputVisible(true)}
                                            >
                                                <Text style={styles.chipText}>{opt}</Text>
                                            </TouchableOpacity>
                                        );
                                    }

                                    return (
                                        <TouchableOpacity
                                            key={opt}
                                            style={[styles.chip, selected.includes(opt) && styles.selectedChip]}
                                            onPress={() => onSelect(opt)}
                                        >
                                            <Text style={[styles.chipText, selected.includes(opt) && styles.selectedChipText]}>{opt}</Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>
                    ))}
                    <View style={{ height: 40 }} />
                </ScrollView>

                {/* Top Gradient Fade */}
                <LinearGradient
                    colors={['#121212', '#12121200']}
                    style={styles.topGradient}
                    pointerEvents="none"
                />

                {/* Bottom Gradient Fade */}
                <LinearGradient
                    colors={['#12121200', '#121212']}
                    style={styles.bottomGradient}
                    pointerEvents="none"
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    content: {
        flex: 1,
        paddingTop: 20,
        backgroundColor: '#121212', // Ensure background matches gradient
    },
    stepTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 8,
    },
    stepDesc: {
        fontSize: 14,
        color: '#888',
        marginBottom: 10,
    },
    // Gradients
    topGradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 30, // Adjust height of fade
        zIndex: 1,
    },
    bottomGradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 50, // Bottom fade usually looks better slightly larger
        zIndex: 1,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#ddd',
        marginBottom: 12,
        marginTop: 4,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8, // 조금 더 촘촘하게 (10 -> 8)
    },
    chip: {
        paddingVertical: 10, // 세로 패딩 축소 (12 -> 10)
        paddingHorizontal: 14, // 가로 패딩 축소 (18 -> 14)
        backgroundColor: '#1a1a1a',
        borderRadius: 12, // 둥근 정도 대폭 축소 (30 -> 12) - 라운디드 렉탱글
        marginBottom: 4,
        borderWidth: 1.5,
        borderColor: '#333',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.15,
        shadowRadius: 3,
        elevation: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    selectedChip: {
        backgroundColor: '#3e204a',
        borderColor: '#8e44ad',
    },
    chipText: {
        color: '#bbb',
        fontSize: 14, // 폰트 사이즈 살짝 조정 (15 -> 14) 공간 확보
        fontWeight: '500',
        textAlign: 'center',
        includeFontPadding: false,
    },
    selectedChipText: {
        color: '#d4acfb',
        fontWeight: '700',
    },
    inputChip: {
        backgroundColor: '#1e1e1e',
        borderColor: '#8e44ad',
        paddingVertical: 0,
        paddingHorizontal: 0,
        minWidth: 80, // 최소 너비 축소 (100 -> 80)
        borderRadius: 12, // 입력창도 동일하게
    },
    textInput: {
        color: '#fff',
        fontSize: 14, // 폰트 사이즈 조정
        paddingVertical: 10,
        paddingHorizontal: 14,
        minWidth: 60,
    },
});
