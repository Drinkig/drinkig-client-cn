import React, { useEffect, useRef, useState } from "react";
import {
    Animated,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";

export interface MenuOption {
    label: string;
    icon?: string;
    onPress: () => void;
    isDestructive?: boolean;
}

interface MenuBottomSheetProps {
    visible: boolean;
    onClose: () => void;
    title?: string;
    options: MenuOption[];
}

const MenuBottomSheet = ({
    visible,
    onClose,
    title,
    options,
}: MenuBottomSheetProps) => {
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
                {title && (
                    <View style={styles.header}>
                        <Text style={styles.title}>{title}</Text>
                    </View>
                )}

                <View style={styles.optionsContainer}>
                    {options.map((option, index) => (
                        <TouchableOpacity
                            key={index}
                            style={styles.optionButton}
                            onPress={() => {
                                onClose();
                                // Close animation takes some time, but we might want to trigger action immediately or after close
                                // Usually better to trigger after close or concurrently
                                setTimeout(() => {
                                    option.onPress();
                                }, 200);
                            }}
                        >
                            <Ionicons
                                name={option.icon || "ellipse-outline"}
                                size={24}
                                color={option.isDestructive ? "#e74c3c" : "#fff"}
                                style={styles.icon}
                            />
                            <Text
                                style={[
                                    styles.optionText,
                                    option.isDestructive && styles.deleteText,
                                ]}
                            >
                                {option.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
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
        zIndex: 1000,
    },
    backdrop: {
        flex: 1,
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "#000",
    },
    sheetContainer: {
        backgroundColor: "#1a1a1a",
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
        borderBottomColor: "#333",
    },
    title: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#fff",
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
        color: "#fff",
        fontWeight: "500",
    },
    deleteText: {
        color: "#e74c3c",
    },
    cancelButton: {
        backgroundColor: "#333",
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: "center",
        marginBottom: 10,
    },
    cancelButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
    },
});

export default MenuBottomSheet;
