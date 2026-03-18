import React, { useEffect, useRef, useState } from "react";
import {
    Animated,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { colors } from '../../constants/colors';

interface MenuScannerActionSheetProps {
    visible: boolean;
    onClose: () => void;
    onSelectLibrary: () => void;
    onSelectCamera: () => void;
}

const MenuScannerActionSheet = ({
    visible,
    onClose,
    onSelectLibrary,
    onSelectCamera,
}: MenuScannerActionSheetProps) => {
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
        <View style={styles.overlay}>
            <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
                <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} />
            </Animated.View>

            <Animated.View
                style={[styles.sheetContainer, { transform: [{ translateY }] }]}
            >
                <View style={styles.header}>
                    <Text style={styles.title}>와인 메뉴판 스캔하기</Text>
                </View>

                <View style={styles.optionsContainer}>
                    <TouchableOpacity
                        style={styles.optionButton}
                        onPress={() => {
                            onClose();
                            setTimeout(() => {
                                onSelectCamera();
                            }, 300);
                        }}
                    >
                        <Ionicons
                            name="camera-outline"
                            size={24}
                            color={colors.white}
                            style={styles.icon}
                        />
                        <Text style={styles.optionText}>카메라로 촬영하기</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.optionButton}
                        onPress={() => {
                            onClose();
                            setTimeout(() => {
                                onSelectLibrary();
                            }, 300);
                        }}
                    >
                        <Ionicons
                            name="images-outline"
                            size={24}
                            color={colors.white}
                            style={styles.icon}
                        />
                        <Text style={styles.optionText}>사진첩에서 선택하기</Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                    <Text style={styles.cancelButtonText}>취소</Text>
                </TouchableOpacity>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    overlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: "flex-end",
        zIndex: 999, // Ensure it sits above the CustomTabBar
    },
    backdrop: {
        flex: 1,
        ...StyleSheet.absoluteFillObject,
        backgroundColor: colors.black,
    },
    sheetContainer: {
        backgroundColor: colors.background,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingVertical: 20,
        paddingHorizontal: 16,
    },
    header: {
        alignItems: "center",
        marginBottom: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    title: {
        fontSize: 18,
        fontWeight: "bold",
        color: colors.white,
    },
    optionsContainer: {
        marginBottom: 20,
    },
    optionButton: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 16,
        paddingHorizontal: 12,
    },
    icon: {
        marginRight: 16,
    },
    optionText: {
        fontSize: 16,
        color: colors.white,
        fontWeight: "500",
    },
    cancelButton: {
        backgroundColor: colors.border,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: "center",
        marginBottom: 10,
    },
    cancelButtonText: {
        color: colors.white,
        fontSize: 16,
        fontWeight: "bold",
    },
});

export default MenuScannerActionSheet;
