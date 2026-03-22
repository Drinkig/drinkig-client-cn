import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    Platform,
    StatusBar,
    Alert,
    ActivityIndicator,
    Animated,
} from 'react-native';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import ImageResizer from '@bam.tech/react-native-image-resizer';
import { launchImageLibrary } from 'react-native-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../constants/colors';

const DAILY_SCAN_LIMIT = 3;
const SCAN_USAGE_KEY = 'scanDailyUsage';

async function getScanUsage(): Promise<{ date: string; count: number }> {
    const raw = await AsyncStorage.getItem(SCAN_USAGE_KEY);
    if (!raw) return { date: '', count: 0 };
    return JSON.parse(raw);
}

async function getTodayScanCount(): Promise<number> {
    const usage = await getScanUsage();
    const today = new Date().toISOString().slice(0, 10);
    return usage.date === today ? usage.count : 0;
}

export async function incrementScanCount(): Promise<void> {
    const today = new Date().toISOString().slice(0, 10);
    const usage = await getScanUsage();
    const count = usage.date === today ? usage.count + 1 : 1;
    await AsyncStorage.setItem(SCAN_USAGE_KEY, JSON.stringify({ date: today, count }));
}

const { width, height } = Dimensions.get('window');

type ScanType = 'label' | 'list';

type Props = NativeStackScreenProps<any, 'Camera'>;

export default function CameraScreen({ navigation }: Props) {
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    const { hasPermission, requestPermission } = useCameraPermission();
    const device = useCameraDevice('back');
    const cameraRef = useRef<Camera>(null);

    const [flashOn, setFlashOn] = useState(false);
    const [scanType, setScanType] = useState<ScanType>('label');
    const [capturing, setCapturing] = useState(false);
    const [remainingScans, setRemainingScans] = useState(DAILY_SCAN_LIMIT);
    const [timeUntilReset, setTimeUntilReset] = useState('');

    useEffect(() => {
        getTodayScanCount().then(count => setRemainingScans(DAILY_SCAN_LIMIT - count));
    }, []);

    useEffect(() => {
        if (remainingScans > 0) {
            setTimeUntilReset('');
            return;
        }
        const updateTime = () => {
            const now = new Date();
            const midnight = new Date(now);
            midnight.setHours(24, 0, 0, 0);
            const diff = midnight.getTime() - now.getTime();
            const h = Math.floor(diff / (60 * 60 * 1000));
            const m = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
            setTimeUntilReset(t('camera.resetTimer', { hours: h, minutes: m }));
        };
        updateTime();
        const interval = setInterval(updateTime, 60 * 1000);
        return () => clearInterval(interval);
    }, [remainingScans, t]);

    // Toggle sliding animation
    const toggleAnim = useRef(new Animated.Value(0)).current;
    // Frame size animation (label vs list have different aspect ratios)
    const frameHeightAnim = useRef(new Animated.Value(FRAME_LABEL_HEIGHT)).current;

    useEffect(() => {
        const toValue = scanType === 'label' ? 0 : 1;
        const frameHeight = scanType === 'label' ? FRAME_LABEL_HEIGHT : FRAME_LIST_HEIGHT;
        Animated.parallel([
            Animated.spring(toggleAnim, {
                toValue,
                useNativeDriver: true,
                friction: 8,
                tension: 70,
            }),
            Animated.spring(frameHeightAnim, {
                toValue: frameHeight,
                useNativeDriver: false,
                friction: 8,
                tension: 70,
            }),
        ]).start();
    }, [scanType]);

    const handleClose = useCallback(() => {
        navigation.goBack();
    }, [navigation]);

    const checkDailyLimit = useCallback(async (): Promise<boolean> => {
        const count = await getTodayScanCount();
        if (count >= DAILY_SCAN_LIMIT) {
            Alert.alert(
                t('camera.limitAlertTitle'),
                t('camera.limitAlertMessage', { limit: DAILY_SCAN_LIMIT }),
            );
            return false;
        }
        return true;
    }, [t]);

    const handleCapture = useCallback(async () => {
        if (capturing) return;
        if (!(await checkDailyLimit())) return;

        // Simulator: no real camera, just show alert
        if (__DEV__ && !cameraRef.current) {
            const mode = scanType === 'label' ? t('camera.scanTypeLabel') : t('camera.scanTypeList');
            Alert.alert(t('camera.simulatorTitle'), t('camera.simulatorMessage', { mode }));
            return;
        }

        if (!cameraRef.current) return;
        try {
            setCapturing(true);
            const photo = await cameraRef.current.takePhoto({
                flash: flashOn ? 'on' : 'off',
            });

            // file:// prefix needed on Android
            const uri = Platform.OS === 'android' ? `file://${photo.path}` : photo.path;

            const resized = await ImageResizer.createResizedImage(
                uri,
                1920,
                1920,
                'JPEG',
                80,
                0,
            );

            navigation.replace('MenuScanResult', {
                imageUri: resized.uri,
                scanType,
            });
        } catch (e) {
            Alert.alert(t('camera.errorTitle'), t('camera.captureError'));
        } finally {
            setCapturing(false);
        }
    }, [capturing, flashOn, navigation, scanType]);

    const handleGallery = useCallback(async () => {
        if (!(await checkDailyLimit())) return;
        const result = await launchImageLibrary({ mediaType: 'photo' });
        if (result.assets && result.assets[0]?.uri) {
            try {
                const resized = await ImageResizer.createResizedImage(
                    result.assets[0].uri,
                    1920,
                    1920,
                    'JPEG',
                    80,
                    0,
                );
                navigation.replace('MenuScanResult', {
                    imageUri: resized.uri,
                    scanType,
                });
            } catch (e) {
                Alert.alert(t('camera.errorTitle'), t('camera.captureError'));
            }
        }
    }, [navigation, scanType, t]);

    const handleRequestPermission = useCallback(async () => {
        const granted = await requestPermission();
        if (!granted) {
            Alert.alert(t('camera.permissionAlertTitle'), t('camera.permissionAlertMessage'));
        }
    }, [requestPermission]);

    if (!hasPermission) {
        return (
            <View style={styles.permissionContainer}>
                <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
                <Ionicons name="camera-outline" size={64} color={colors.textSecondary} />
                <Text style={styles.permissionText}>{t('camera.permissionRequired')}</Text>
                <TouchableOpacity style={styles.permissionButton} onPress={handleRequestPermission}>
                    <Text style={styles.permissionButtonText}>{t('camera.permissionAllow')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.permissionClose} onPress={handleClose}>
                    <Text style={styles.permissionCloseText}>{t('camera.close')}</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // In dev mode without camera device (simulator), show mock UI
    const isSimulator = __DEV__ && !device;

    if (!device && !__DEV__) {
        return (
            <View style={styles.permissionContainer}>
                <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
                <ActivityIndicator color={colors.primary} size="large" />
                <TouchableOpacity style={[styles.closeButton, { position: 'absolute', top: 56, left: 20 }]} onPress={handleClose}>
                    <Ionicons name="close" size={28} color={colors.white} />
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

            {/* Camera Preview (or mock background for simulator) */}
            {isSimulator ? (
                <View style={[StyleSheet.absoluteFill, styles.mockCamera]}>
                    <Ionicons name="camera" size={48} color="rgba(255,255,255,0.15)" />
                    <Text style={styles.mockText}>{t('camera.simulatorPreview')}</Text>
                </View>
            ) : (
                <Camera
                    ref={cameraRef}
                    style={StyleSheet.absoluteFill}
                    device={device!}
                    isActive={true}
                    photo={true}
                    torch={flashOn ? 'on' : 'off'}
                />
            )}

            {/* Dimmed overlay with cutout frame */}
            <View style={StyleSheet.absoluteFill} pointerEvents="none">
                {/* Semi-transparent background around the frame */}
                <View style={styles.dimOverlayTop} />
                {/* Center row: dim | frame | dim */}
                <View style={styles.frameCenterRow}>
                    <View style={styles.dimSide} />
                    <Animated.View style={[styles.frameCutout, { width: FRAME_WIDTH, height: frameHeightAnim }]}>
                        {/* Corner brackets */}
                        <View style={[styles.corner, styles.cornerTL]} />
                        <View style={[styles.corner, styles.cornerTR]} />
                        <View style={[styles.corner, styles.cornerBL]} />
                        <View style={[styles.corner, styles.cornerBR]} />
                        {/* Guide text */}
                        <Text style={styles.guideText}>
                            {scanType === 'label' ? t('camera.guideLabel') : t('camera.guideList')}
                        </Text>
                    </Animated.View>
                    <View style={styles.dimSide} />
                </View>
                <View style={styles.dimOverlayBottom} />
            </View>

            {/* Top Controls */}
            <View style={[styles.topBar, { paddingTop: insets.top + 12 }]}>
                <TouchableOpacity style={styles.topButton} onPress={handleClose}>
                    <Ionicons name="close" size={28} color={colors.white} />
                </TouchableOpacity>

                <View style={styles.topRight}>
                    <View style={styles.scanCountBadge}>
                        <Ionicons name="scan-outline" size={14} color={remainingScans > 0 ? colors.white : '#888'} />
                        <Text style={[styles.scanCountText, remainingScans === 0 && { color: '#888' }]}>
                            {remainingScans}/{DAILY_SCAN_LIMIT}
                        </Text>
                    </View>
                    <TouchableOpacity style={styles.topButton} onPress={() => setFlashOn(v => !v)}>
                        <Ionicons
                            name={flashOn ? 'flash' : 'flash-off'}
                            size={26}
                            color={flashOn ? '#FFD700' : colors.white}
                        />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Bottom Controls */}
            <View style={styles.bottomBar}>
                {/* Scan Type Toggle */}
                <View style={styles.toggleContainer}>
                    {/* Sliding pill indicator */}
                    <Animated.View
                        style={[
                            styles.togglePill,
                            {
                                transform: [{
                                    translateX: toggleAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [0, TOGGLE_BTN_WIDTH],
                                    }),
                                }],
                            },
                        ]}
                    />
                    <TouchableOpacity
                        style={styles.toggleButton}
                        onPress={() => setScanType('label')}
                        activeOpacity={0.8}
                    >
                        <Text style={[styles.toggleText, scanType === 'label' && styles.toggleTextActive]}>
                            {t('camera.scanTypeLabel')}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.toggleButton}
                        onPress={() => setScanType('list')}
                        activeOpacity={0.8}
                    >
                        <Text style={[styles.toggleText, scanType === 'list' && styles.toggleTextActive]}>
                            {t('camera.scanTypeList')}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Shutter row */}
                <View style={styles.shutterRow}>
                    <TouchableOpacity
                        style={[styles.galleryButton, remainingScans <= 0 && styles.galleryButtonDisabled]}
                        onPress={handleGallery}
                        activeOpacity={0.7}
                        disabled={remainingScans <= 0}
                    >
                        <Ionicons name="images-outline" size={26} color={remainingScans <= 0 ? '#555' : colors.white} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.shutterButton, (capturing || remainingScans <= 0) && styles.shutterButtonDisabled]}
                        onPress={handleCapture}
                        activeOpacity={0.8}
                        disabled={capturing || remainingScans <= 0}
                    >
                        {capturing ? (
                            <ActivityIndicator color={colors.primary} size="small" />
                        ) : (
                            <View style={[styles.shutterInner, remainingScans <= 0 && styles.shutterInnerDisabled]} />
                        )}
                    </TouchableOpacity>

                    <View style={styles.shutterSpacer} />
                </View>
                {timeUntilReset ? (
                    <Text style={styles.resetTimerText}>{timeUntilReset}</Text>
                ) : null}
            </View>
        </View>
    );
}

const BOTTOM_BAR_HEIGHT = Platform.OS === 'ios' ? 200 : 180;
const SHUTTER_SIZE = 72;
const SHUTTER_INNER_SIZE = 58;

// Frame dimensions
const FRAME_WIDTH = width * 0.78;
const FRAME_LABEL_HEIGHT = FRAME_WIDTH * 1.1;  // label: slightly taller than wide
const FRAME_LIST_HEIGHT = FRAME_WIDTH * 1.45;  // list: much taller for menus
const CORNER_SIZE = 28;
const CORNER_THICKNESS = 3;

// Toggle dimensions
const TOGGLE_BTN_WIDTH = 104;
const TOGGLE_PADDING = 4;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    mockCamera: {
        backgroundColor: '#1a1a2e',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    mockText: {
        color: 'rgba(255,255,255,0.25)',
        fontSize: 14,
    },
    permissionContainer: {
        flex: 1,
        backgroundColor: colors.background,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
    },
    permissionText: {
        color: colors.textSecondary,
        fontSize: 16,
        textAlign: 'center',
        marginTop: 8,
    },
    permissionButton: {
        backgroundColor: colors.primary,
        paddingHorizontal: 32,
        paddingVertical: 12,
        borderRadius: 24,
        marginTop: 8,
    },
    permissionButtonText: {
        color: colors.white,
        fontSize: 16,
        fontWeight: '600',
    },
    permissionClose: {
        marginTop: 4,
        paddingVertical: 8,
    },
    permissionCloseText: {
        color: colors.textSecondary,
        fontSize: 14,
    },
    // Frame overlay
    dimOverlayTop: {
        flex: 0.8,
        backgroundColor: 'rgba(0,0,0,0.55)',
    },
    dimOverlayBottom: {
        flex: 1.2,
        backgroundColor: 'rgba(0,0,0,0.55)',
    },
    frameCenterRow: {
        flexDirection: 'row',
    },
    dimSide: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.55)',
    },
    frameCutout: {
        alignItems: 'center',
        justifyContent: 'flex-end',
        paddingBottom: 20,
        borderRadius: 12,
    },
    guideText: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 13,
        fontWeight: '500',
    },
    // Corner brackets
    corner: {
        position: 'absolute',
        width: CORNER_SIZE,
        height: CORNER_SIZE,
    },
    cornerTL: {
        top: 0,
        left: 0,
        borderTopWidth: CORNER_THICKNESS,
        borderLeftWidth: CORNER_THICKNESS,
        borderColor: colors.white,
        borderTopLeftRadius: 12,
    },
    cornerTR: {
        top: 0,
        right: 0,
        borderTopWidth: CORNER_THICKNESS,
        borderRightWidth: CORNER_THICKNESS,
        borderColor: colors.white,
        borderTopRightRadius: 12,
    },
    cornerBL: {
        bottom: 0,
        left: 0,
        borderBottomWidth: CORNER_THICKNESS,
        borderLeftWidth: CORNER_THICKNESS,
        borderColor: colors.white,
        borderBottomLeftRadius: 12,
    },
    cornerBR: {
        bottom: 0,
        right: 0,
        borderBottomWidth: CORNER_THICKNESS,
        borderRightWidth: CORNER_THICKNESS,
        borderColor: colors.white,
        borderBottomRightRadius: 12,
    },
    // Top bar
    topBar: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 12,
    },
    topButton: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 22,
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    topRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    scanCountBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 16,
    },
    scanCountText: {
        color: colors.white,
        fontSize: 13,
        fontWeight: '600',
    },
    closeButton: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 22,
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    // Bottom bar
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        minHeight: BOTTOM_BAR_HEIGHT,
        alignItems: 'center',
        justifyContent: 'flex-end',
        paddingBottom: Platform.OS === 'ios' ? 44 : 24,
        paddingTop: 16,
        backgroundColor: 'rgba(0,0,0,0.5)',
        gap: 20,
    },
    // Scan type toggle
    toggleContainer: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.12)',
        borderRadius: 24,
        padding: TOGGLE_PADDING,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    togglePill: {
        position: 'absolute',
        top: TOGGLE_PADDING,
        left: TOGGLE_PADDING,
        width: TOGGLE_BTN_WIDTH,
        height: 34,
        borderRadius: 20,
        backgroundColor: colors.primary,
    },
    toggleButton: {
        width: TOGGLE_BTN_WIDTH,
        paddingVertical: 8,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    toggleText: {
        fontSize: 14,
        fontWeight: '500',
        color: 'rgba(255,255,255,0.6)',
    },
    toggleTextActive: {
        color: colors.white,
        fontWeight: '600',
    },
    // Shutter row
    shutterRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        paddingHorizontal: 48,
    },
    galleryButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255,255,255,0.15)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    shutterSpacer: {
        width: 48,
    },
    shutterButton: {
        width: SHUTTER_SIZE,
        height: SHUTTER_SIZE,
        borderRadius: SHUTTER_SIZE / 2,
        borderWidth: 3,
        borderColor: colors.white,
        alignItems: 'center',
        justifyContent: 'center',
    },
    shutterButtonDisabled: {
        opacity: 0.4,
        borderColor: '#555',
    },
    shutterInner: {
        width: SHUTTER_INNER_SIZE,
        height: SHUTTER_INNER_SIZE,
        borderRadius: SHUTTER_INNER_SIZE / 2,
        backgroundColor: colors.white,
    },
    shutterInnerDisabled: {
        backgroundColor: '#555',
    },
    galleryButtonDisabled: {
        opacity: 0.4,
    },
    resetTimerText: {
        color: '#aaa',
        fontSize: 13,
        fontWeight: '500',
        textAlign: 'center',
        marginTop: -8,
    },
});
