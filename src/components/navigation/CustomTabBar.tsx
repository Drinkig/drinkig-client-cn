import React, { useEffect, useRef, useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Dimensions, Animated, Platform, LayoutChangeEvent } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from '@react-native-community/blur';
import LinearGradient from 'react-native-linear-gradient';
import { colors } from '../../constants/colors';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';

const { width } = Dimensions.get('window');

// TAB BAR DIMENSIONS
const TAB_BAR_WIDTH_PERCENTAGE = 0.72; // Reduced width (was 0.9) to make it more compact like a floating pill
const TAB_BAR_WIDTH = width * TAB_BAR_WIDTH_PERCENTAGE;
const TAB_BAR_HEIGHT = 60; // Slightly shorter (was 65)
const TAB_BAR_BOTTOM_MARGIN = Platform.OS === 'ios' ? 25 : 15;

export const CustomTabBar = ({ state, descriptors, navigation }: BottomTabBarProps) => {
    // For the sliding animation
    const [containerWidth, setContainerWidth] = useState(0);
    const tabWidth = containerWidth / state.routes.length;
    const slideAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (tabWidth > 0) {
            Animated.spring(slideAnim, {
                toValue: state.index * tabWidth,
                useNativeDriver: true,
                friction: 8,
                tension: 60,
            }).start();
        }
    }, [state.index, tabWidth]);

    const handleLayout = (e: LayoutChangeEvent) => {
        setContainerWidth(e.nativeEvent.layout.width);
    };

    return (
        <View style={styles.container}>
            {/* 3D Glassmorphism Background Container */}
            <View style={styles.tabBarContainer}>
                {/* Flat Matte Background */}
                <View style={styles.glassContainer}>
                    <BlurView
                        style={styles.blurView}
                        blurType="dark"
                        blurAmount={10} // Reduced blur for flatter look
                        reducedTransparencyFallbackColor={colors.surface1}
                    />

                    {/* Tab buttons */}
                    <View style={styles.tabButtonsContainer} onLayout={handleLayout}>
                        {/* Sliding Active Background Circle */}
                        {tabWidth > 0 && (
                            <Animated.View
                                style={[
                                    styles.activeBackground,
                                    {
                                        width: tabWidth, // Center the circle within this tab width
                                        transform: [{ translateX: slideAnim }],
                                    },
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

                        {state.routes.map((route, index) => {
                            const { options } = descriptors[route.key];
                            const isFocused = state.index === index;

                            const onPress = () => {
                                const event = navigation.emit({
                                    type: 'tabPress',
                                    target: route.key,
                                    canPreventDefault: true,
                                });

                                if (!isFocused && !event.defaultPrevented) {
                                    navigation.navigate(route.name);
                                }
                            };

                            let iconName = '';
                            let IconComponent: any = Ionicons;

                            if (route.name === 'Home') {
                                iconName = isFocused ? 'home' : 'home-outline';
                            } else if (route.name === 'Search') {
                                iconName = isFocused ? 'search' : 'search-outline';
                            } else if (route.name === 'MyWine') {
                                IconComponent = MaterialCommunityIcons;
                                iconName = 'bottle-wine';
                            } else if (route.name === 'Profile') {
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
                                    {/* Icon is rendered on top, background is handled securely behind via zIndex if needed, 
                                        but since activeBackground is rendered First in the container, it sits behind implicitly. */}

                                    <IconComponent
                                        name={iconName}
                                        size={28}
                                        color={isFocused ? colors.white : colors.textSecondary}
                                    />
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>
            </View>
        </View>
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
        // Add a very subtle, soft shadow to emphasize the "floating" nature, but keep it matte
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.15, // Very soft opacity
        shadowRadius: 8,
        elevation: 6,
    },
    glassContainer: {
        width: '100%',
        height: '100%',
        borderRadius: TAB_BAR_HEIGHT / 2,
        overflow: 'hidden',
        backgroundColor: colors.surface1, // Solid matte background color matching app theme
        borderWidth: 1,
        borderColor: colors.border, // Very subtle border to distinguish it from the background slightly
    },
    blurView: {
        ...StyleSheet.absoluteFillObject,
        opacity: 0.8, // Add some opacity so the solid color shows through more clearly
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
    activeBackground: {
        position: 'absolute',
        top: 0,
        left: 0,
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    activeCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255, 255, 255, 0.12)',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.15)',
    },
});
