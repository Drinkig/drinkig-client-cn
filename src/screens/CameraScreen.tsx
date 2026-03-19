import React, { useRef, useState, useCallback } from 'react';
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
} from 'react-native';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import ImageResizer from '@bam.tech/react-native-image-resizer';
import { colors } from '../constants/colors';

const { width, height } = Dimensions.get('window');

type ScanType = 'label' | 'list';

type Props = NativeStackScreenProps<any, 'Camera'>;

export default function CameraScreen({ navigation }: Props) {
    const { hasPermission, requestPermission } = useCameraPermission();
    const device = useCameraDevice('back');
    const cameraRef = useRef<Camera>(null);

    const [flashOn, setFlashOn] = useState(false);
    const [scanType, setScanType] = useState<ScanType>('label');
    const [capturing, setCapturing] = useState(false);

    const handleClose = useCallback(() => {
        navigation.goBack();
    }, [navigation]);

    const handleCapture = useCallback(async () => {
        if (!cameraRef.current || capturing) return;
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
            Alert.alert('오류', '사진 촬영 중 오류가 발생했습니다.');
        } finally {
            setCapturing(false);
        }
    }, [capturing, flashOn, navigation, scanType]);

    const handleRequestPermission = useCallback(async () => {
        const granted = await requestPermission();
        if (!granted) {
            Alert.alert('카메라 권한 필요', '설정에서 카메라 접근을 허용해 주세요.');
        }
    }, [requestPermission]);

    if (!hasPermission) {
        return (
            <View style={styles.permissionContainer}>
                <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
                <Ionicons name="camera-outline" size={64} color={colors.textSecondary} />
                <Text style={styles.permissionText}>카메라 접근 권한이 필요합니다</Text>
                <TouchableOpacity style={styles.permissionButton} onPress={handleRequestPermission}>
                    <Text style={styles.permissionButtonText}>권한 허용</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.permissionClose} onPress={handleClose}>
                    <Text style={styles.permissionCloseText}>닫기</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (!device) {
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

            {/* Camera Preview */}
            <Camera
                ref={cameraRef}
                style={StyleSheet.absoluteFill}
                device={device}
                isActive={true}
                photo={true}
                torch={flashOn ? 'on' : 'off'}
            />

            {/* Grid Overlay */}
            <View style={styles.gridOverlay} pointerEvents="none">
                {/* Horizontal lines */}
                <View style={[styles.gridLine, styles.gridLineHorizontal, { top: height / 3 }]} />
                <View style={[styles.gridLine, styles.gridLineHorizontal, { top: (height / 3) * 2 }]} />
                {/* Vertical lines */}
                <View style={[styles.gridLine, styles.gridLineVertical, { left: width / 3 }]} />
                <View style={[styles.gridLine, styles.gridLineVertical, { left: (width / 3) * 2 }]} />
            </View>

            {/* Top Controls */}
            <View style={styles.topBar}>
                <TouchableOpacity style={styles.topButton} onPress={handleClose}>
                    <Ionicons name="close" size={28} color={colors.white} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.topButton} onPress={() => setFlashOn(v => !v)}>
                    <Ionicons
                        name={flashOn ? 'flash' : 'flash-off'}
                        size={26}
                        color={flashOn ? '#FFD700' : colors.white}
                    />
                </TouchableOpacity>
            </View>

            {/* Bottom Controls */}
            <View style={styles.bottomBar}>
                {/* Scan Type Toggle */}
                <View style={styles.toggleContainer}>
                    <TouchableOpacity
                        style={[styles.toggleButton, scanType === 'label' && styles.toggleButtonActive]}
                        onPress={() => setScanType('label')}
                        activeOpacity={0.8}
                    >
                        <Text style={[styles.toggleText, scanType === 'label' && styles.toggleTextActive]}>
                            와인 라벨
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.toggleButton, scanType === 'list' && styles.toggleButtonActive]}
                        onPress={() => setScanType('list')}
                        activeOpacity={0.8}
                    >
                        <Text style={[styles.toggleText, scanType === 'list' && styles.toggleTextActive]}>
                            와인 리스트
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Shutter */}
                <View style={styles.shutterRow}>
                    <TouchableOpacity
                        style={[styles.shutterButton, capturing && styles.shutterButtonDisabled]}
                        onPress={handleCapture}
                        activeOpacity={0.8}
                        disabled={capturing}
                    >
                        {capturing ? (
                            <ActivityIndicator color={colors.primary} size="small" />
                        ) : (
                            <View style={styles.shutterInner} />
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const TOP_BAR_HEIGHT = Platform.OS === 'ios' ? 100 : 70;
const BOTTOM_BAR_HEIGHT = Platform.OS === 'ios' ? 200 : 180;
const SHUTTER_SIZE = 72;
const SHUTTER_INNER_SIZE = 58;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
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
    // Grid
    gridOverlay: {
        ...StyleSheet.absoluteFillObject,
    },
    gridLine: {
        position: 'absolute',
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
    },
    gridLineHorizontal: {
        width: '100%',
        height: 1,
    },
    gridLineVertical: {
        height: '100%',
        width: 1,
    },
    // Top bar
    topBar: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: TOP_BAR_HEIGHT,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        paddingHorizontal: 20,
        paddingBottom: 12,
        backgroundColor: 'rgba(0,0,0,0.35)',
    },
    topButton: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 22,
        backgroundColor: 'rgba(0,0,0,0.4)',
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
        height: BOTTOM_BAR_HEIGHT,
        alignItems: 'center',
        justifyContent: 'flex-end',
        paddingBottom: Platform.OS === 'ios' ? 44 : 24,
        backgroundColor: 'rgba(0,0,0,0.5)',
        gap: 20,
    },
    // Scan type toggle
    toggleContainer: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.12)',
        borderRadius: 24,
        padding: 4,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    toggleButton: {
        paddingHorizontal: 24,
        paddingVertical: 8,
        borderRadius: 20,
    },
    toggleButtonActive: {
        backgroundColor: colors.primary,
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
    // Shutter
    shutterRow: {
        alignItems: 'center',
        justifyContent: 'center',
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
        opacity: 0.6,
    },
    shutterInner: {
        width: SHUTTER_INNER_SIZE,
        height: SHUTTER_INNER_SIZE,
        borderRadius: SHUTTER_INNER_SIZE / 2,
        backgroundColor: colors.white,
    },
});
