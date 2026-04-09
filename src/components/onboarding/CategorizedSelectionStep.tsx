import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTranslation } from 'react-i18next';
import { colors } from '../../constants/colors';
import GlassChip from '../common/GlassChip';

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
    const { t } = useTranslation();
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
            <Text style={styles.stepDesc}>{t('onboarding.selection.multiDesc')}</Text>

            {/* ScrollView Container with Gradients */}
            <View style={{ flex: 1 }}>
                <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 20 }}>
                    {categories.map((category) => (
                        <View key={category.title} style={styles.section}>
                            <Text style={styles.sectionTitle}>{category.title}</Text>
                            <View style={styles.grid}>
                                {category.data.map((opt) => {
                                    if (allowCustomInput && opt === '기타') {
                                        if (customValue) {
                                            return (
                                                <GlassChip
                                                    key="custom-value"
                                                    label={customValue}
                                                    selected
                                                    onPress={() => onSelect(customValue)}
                                                />
                                            );
                                        }
                                        if (isInputVisible) {
                                            return (
                                                <View key="custom-input" style={styles.inputChip}>
                                                    <TextInput
                                                        style={styles.textInput}
                                                        value={inputText}
                                                        onChangeText={setInputText}
                                                        placeholder={t('onboarding.selection.customPlaceholder')}
                                                        placeholderTextColor={colors.textSecondary}
                                                        autoFocus
                                                        onSubmitEditing={handleCustomSubmit}
                                                        onBlur={handleCustomSubmit}
                                                        returnKeyType="done"
                                                    />
                                                </View>
                                            );
                                        }
                                        return (
                                            <GlassChip
                                                key={opt}
                                                label={opt}
                                                onPress={() => setIsInputVisible(true)}
                                            />
                                        );
                                    }

                                    return (
                                        <GlassChip
                                            key={opt}
                                            label={opt}
                                            selected={selected.includes(opt)}
                                            onPress={() => onSelect(opt)}
                                        />
                                    );
                                })}
                            </View>
                        </View>
                    ))}
                    <View style={{ height: 40 }} />
                </ScrollView>


                <LinearGradient
                    colors={[colors.background, `${colors.background}00`]}
                    style={styles.topGradient}
                    pointerEvents="none"
                />


                <LinearGradient
                    colors={[`${colors.background}00`, colors.background]}
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
        backgroundColor: colors.background,
    },
    stepTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: colors.textPrimary,
        marginBottom: 8,
    },
    stepDesc: {
        fontSize: 14,
        color: colors.textSecondary,
        marginBottom: 10,
    },

    topGradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 30,
        zIndex: 1,
    },
    bottomGradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 50,
        zIndex: 1,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.textPrimary,
        marginBottom: 12,
        marginTop: 4,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    inputChip: {
        backgroundColor: colors.surface1,
        borderColor: colors.primary,
        borderWidth: 1,
        borderRadius: 12,
        minWidth: 80,
        justifyContent: 'center',
    },
    textInput: {
        color: colors.textPrimary,
        fontSize: 14,
        paddingVertical: 10,
        paddingHorizontal: 14,
        minWidth: 60,
    },
});
