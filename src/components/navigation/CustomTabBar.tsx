import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    Animated,
    Platform,
    LayoutChangeEvent,
    Alert,
} from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from '@react-native-community/blur';
import LinearGradient from 'react-native-linear-gradient';
import { colors } from '../../constants/colors';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { launchCamera, launchImageLibrary, ImagePickerResponse } from 'react-native-image-picker';
import ImageResizer from '@bam.tech/react-native-image-resizer';
import MenuScannerActionSheet from '../common/MenuScannerActionSheet';

const { width } = Dimensions.get('window');

// TAB BAR DIMENSIONS
const TAB_BAR_WIDTH_PERCENTAGE = 0.85;
const TAB_BAR_WIDTH = width * TAB_BAR_WIDTH_PERCENTAGE;
const TAB_BAR_HEIGHT = 60;
const TAB_BAR_BOTTOM_MARGIN = Platform.OS === 'ios' ? 25 : 15;
const CAMERA_BTN_SIZE = 58;
const CAMERA_BTN_OVERFLOW = 18; // how much it rises above the tab bar

// How many regular tabs on each side of the camera button
const LEFT_TABS = ['Home', 'Search'];
const RIGHT_TABS = ['MyWine', 'Profile'];
const ALL_TABS = [...LEFT_TABS, ...RIGHT_TABS];

export const CustomTabBar = ({ state, descriptors, navigation }: BottomTabBarProps) => {
    const [containerWidth, setContainerWidth] = useState(0);
    const [showActionSheet, setShowActionSheet] = useState(false);
    const slideAnim = useRef(new Animated.Value(0)).current;
    const cameraScale = useRef(new Animated.Value(1)).current;

    const numRegularTabs = ALL_TABS.length; // 4
    const tabWidth = containerWidth > 0 ? (containerWidth - CAMERA_BTN_SIZE) / numRegularTabs : 0;

    // Map route name to its visual position index (0-based among regular tabs)
    const getTabVisualIndex = (routeName: string) => {
        const idx = ALL_TABS.indexOf(routeName);
        return idx;
    };

    // Calculate slide target: left side tabs (0,1) sit in first half, right side tabs (2,3) after camera gap
    const getSlideTarget = (routeName: string) => {
        const idx = getTabVisualIndex(routeName);
        if (idx < LEFT_TABS.length) {
            return idx * tabWidth;
        } else {
            const rightIdx = idx - LEFT_TABS.length;
            return LEFT_TABS.length * tabWidth + CAMERA_BTN_SIZE + rightIdx * tabWidth;
        }
    };

    useEffect(() => {
        if (tabWidth > 0) {
            const currentRoute = state.routes[state.index]?.name;
            const target = getSlideTarget(currentRoute);
            Animated.spring(slideAnim, {
                toValue: target,
                useNativeDriver: true,
                friction: 8,
                tension: 60,
            }).start();
        }
    }, [state.index, tabWidth]);

    const handleLayout = (e: LayoutChangeEvent) => {
        setContainerWidth(e.nativeEvent.layout.width);
    };

    // Camera FAB press animation
    const handleCameraPress = () => {
        Animated.sequence([
            Animated.timing(cameraScale, { toValue: 0.88, duration: 100, useNativeDriver: true }),
            Animated.spring(cameraScale, { toValue: 1, friction: 4, useNativeDriver: true }),
        ]).start();
        setShowActionSheet(true);
    };

    const processAndNavigate = async (uri: string) => {
        try {
            const resized = await ImageResizer.createResizedImage(
                uri,
                1920, // maxWidth
                1920, // maxHeight
                'JPEG',
                80,   // quality
                0,    // rotation
            );
            (navigation as any).navigate('MenuScanResult', { imageUri: resized.uri });
        } catch (e) {
            Alert.alert('오류', '이미지 처리 중 오류가 발생했습니다.');
        }
    };

    const handleSelectCamera = async () => {
        const result: ImagePickerResponse = await launchCamera({
            mediaType: 'photo',
            saveToPhotos: false,
        });
        if (result.assets && result.assets[0]?.uri) {
            await processAndNavigate(result.assets[0].uri);
        }
    };

    const handleSelectLibrary = async () => {
        const result: ImagePickerResponse = await launchImageLibrary({
            mediaType: 'photo',
        });
        if (result.assets && result.assets[0]?.uri) {
            await processAndNavigate(result.assets[0].uri);
        }
    };

    const renderTab = (routeName: string) => {
        const route = state.routes.find(r => r.name === routeName);
        if (!route) return null;
        const { options } = descriptors[route.key];
        const isFocused = state.routes[state.index]?.name === routeName;

        const onPress = () => {
            const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(routeName);
            }
        };

        let iconName = '';
        let IconComponent: any = Ionicons;

        if (routeName === 'Home') {
            iconName = isFocused ? 'home' : 'home-outline';
        } else if (routeName === 'Search') {
            iconName = isFocused ? 'search' : 'search-outline';
        } else if (routeName === 'MyWine') {
            IconComponent = MaterialCommunityIcons;
            iconName = 'bottle-wine';
        } else if (routeName === 'Profile') {
            iconName = isFocused ? 'person' : 'person-outline';
        }

        return (
            <TouchableOpacity
                key={route.key}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={options.tabBarAccessibilityLabel}
                onPress={onPress}
                style={styles.tabButton}
                activeOpacity={0.8}
            >
                <IconComponent
                    name={iconName}
                    size={26}
                    color={isFocused ? colors.white : colors.textSecondary}
                />
            </TouchableOpacity>
        );
    };

    return (
        <>
            <View style={styles.container}>
                {/* Main pill tab bar */}
                <View style={styles.tabBarContainer}>
                    <View style={styles.glassContainer}>
                        <BlurView
                            style={styles.blurView}
                            blurType="dark"
                            blurAmount={10}
                            reducedTransparencyFallbackColor={colors.surface1}
                        />

                        {/* Tab buttons row with camera gap in center */}
                        <View style={styles.tabButtonsContainer} onLayout={handleLayout}>
                            {/* Sliding active background */}
                            {tabWidth > 0 && (
                                <Animated.View
                                    style={[
                                        styles.activeBackground,
                                        { width: tabWidth, transform: [{ translateX: slideAnim }] },
                                    ]}
                                >
                                    <View style={styles.activeCircle}>
                                        <LinearGradient
                                            colors={['rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0.05)']}
                                            style={StyleSheet.absoluteFill}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 1 }}
                                        />
                                    </View>
                                </Animated.View>
                            )}

                            {/* Left tabs */}
                            {LEFT_TABS.map(renderTab)}

                            {/* Camera button placeholder gap */}
                            <View style={styles.cameraGap} />

                            {/* Right tabs */}
                            {RIGHT_TABS.map(renderTab)}
                        </View>
                    </View>
                </View>

                {/* Floating camera button (raised above the tab bar) */}
                <Animated.View style={[styles.cameraButtonWrapper, { transform: [{ scale: cameraScale }] }]}>
                    <TouchableOpacity
                        onPress={handleCameraPress}
                        activeOpacity={0.85}
                        style={styles.cameraButton}
                    >
                        <LinearGradient
                            colors={['#b06fd8', colors.primary, colors.primaryDark]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.cameraGradient}
                        >
                            <Ionicons name="scan-outline" size={28} color={colors.white} />
                        </LinearGradient>
                    </TouchableOpacity>
                </Animated.View>
            </View>

            {/* Action sheet rendered outside the pill so it covers full screen */}
            <MenuScannerActionSheet
                visible={showActionSheet}
                onClose={() => setShowActionSheet(false)}
                onSelectCamera={handleSelectCamera}
                onSelectLibrary={handleSelectLibrary}
            />
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: TAB_BAR_BOTTOM_MARGIN,
        left: 0,
        right: 0,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
    },
    tabBarContainer: {
        width: TAB_BAR_WIDTH,
        height: TAB_BAR_HEIGHT,
        borderRadius: TAB_BAR_HEIGHT / 2,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.18,
        shadowRadius: 10,
        elevation: 8,
    },
    glassContainer: {
        width: '100%',
        height: '100%',
        borderRadius: TAB_BAR_HEIGHT / 2,
        overflow: 'hidden',
        backgroundColor: colors.surface1,
        borderWidth: 1,
        borderColor: colors.border,
    },
    blurView: {
        ...StyleSheet.absoluteFillObject,
        opacity: 0.8,
    },
    tabButtonsContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    tabButton: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
    },
    cameraGap: {
        width: CAMERA_BTN_SIZE,
    },
    activeBackground: {
        position: 'absolute',
        top: 0,
        left: 0,
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    activeCircle: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: 'rgba(255, 255, 255, 0.12)',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.15)',
    },
    // Floating camera button
    cameraButtonWrapper: {
        position: 'absolute',
        bottom: CAMERA_BTN_OVERFLOW,
        alignSelf: 'center',
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.55,
        shadowRadius: 12,
        elevation: 14,
    },
    cameraButton: {
        width: CAMERA_BTN_SIZE,
        height: CAMERA_BTN_SIZE,
        borderRadius: CAMERA_BTN_SIZE / 2,
        overflow: 'hidden',
    },
    cameraGradient: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
