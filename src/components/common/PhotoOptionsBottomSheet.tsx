import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';

interface PhotoOptionsBottomSheetProps {
    visible: boolean;
    onClose: () => void;
    onSelectLibrary: () => void;
    onDelete: () => void;
    hasProfileImage: boolean;
}

const PhotoOptionsBottomSheet = ({
    visible,
    onClose,
    onSelectLibrary,
    onDelete,
    hasProfileImage,
}: PhotoOptionsBottomSheetProps) => {
    const [isVisible, setIsVisible] = useState(visible);
    const animation = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            setIsVisible(true);
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
            }).start(() => {
                setIsVisible(false);
            });
        }
    }, [visible, animation]);

    if (!isVisible) return null;

    const backdropOpacity = animation.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 0.5],
    });

    const translateY = animation.interpolate({
        inputRange: [0, 1],
        outputRange: [300, 0],
    });

    return (
        <Modal
            visible={isVisible}
            transparent={true}
            animationType="none"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <Animated.View
                    style={[
                        styles.backdrop,
                        { opacity: backdropOpacity }
                    ]}
                >
                    <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} />
                </Animated.View>

                <Animated.View style={[styles.sheetContainer, { transform: [{ translateY }] }]}>
                    <SafeAreaView>
                        <View style={styles.header}>
                            <Text style={styles.title}>프로필 사진 설정</Text>
                        </View>

                        <View style={styles.optionsContainer}>
                            <TouchableOpacity
                                style={styles.optionButton}
                                onPress={() => {
                                    onClose();
                                    setTimeout(() => {
                                        onSelectLibrary();
                                    }, 300);
                                }}
                            >
                                <Ionicons name="images-outline" size={24} color="#fff" style={styles.icon} />
                                <Text style={styles.optionText}>라이브러리에서 선택</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.optionButton, !hasProfileImage && styles.disabledButton]}
                                onPress={() => {
                                    if (hasProfileImage) {
                                        onDelete();
                                        onClose();
                                    }
                                }}
                                disabled={!hasProfileImage}
                            >
                                <Ionicons
                                    name="trash-outline"
                                    size={24}
                                    color={hasProfileImage ? "#e74c3c" : "#666"}
                                    style={styles.icon}
                                />
                                <Text style={[styles.optionText, styles.deleteText, !hasProfileImage && styles.disabledText]}>
                                    기본 이미지로 변경
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                            <Text style={styles.cancelButtonText}>취소</Text>
                        </TouchableOpacity>
                    </SafeAreaView>
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#000',
    },
    sheetContainer: {
        backgroundColor: '#1a1a1a',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingVertical: 20,
        paddingHorizontal: 16,
    },
    header: {
        alignItems: 'center',
        marginBottom: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    optionsContainer: {
        marginBottom: 20,
    },
    optionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 12,
    },
    disabledButton: {
        opacity: 0.5,
    },
    icon: {
        marginRight: 16,
    },
    optionText: {
        fontSize: 16,
        color: '#fff',
        fontWeight: '500',
    },
    deleteText: {
        color: '#e74c3c',
    },
    disabledText: {
        color: '#666',
    },
    cancelButton: {
        backgroundColor: '#333',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 10,
    },
    cancelButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default PhotoOptionsBottomSheet;
