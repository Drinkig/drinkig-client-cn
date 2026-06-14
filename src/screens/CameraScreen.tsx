import React, { useRef, useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Dimensions,
  Platform,
  StatusBar,
  ActivityIndicator,
  Animated,
} from "react-native";
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
} from "react-native-vision-camera";
import Ionicons from "react-native-vector-icons/Ionicons";
import LinearGradient from "react-native-linear-gradient";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import PhotoManipulator, { MimeType } from "react-native-photo-manipulator";
import { launchImageLibrary } from "react-native-image-picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { colors } from "../constants/colors";
import { accent, radius, spacing } from "../constants/theme";
import { useGlobalUI } from "../context/GlobalUIContext";
import { useSubscription } from "../context/SubscriptionContext";
import { getScanRemaining } from "../api/subscription";

type ScanType = "label" | "list";

const DAILY_SCAN_LIMIT = 3;
const SCAN_USAGE_KEY = "scanDailyUsage";

// OCR 품질에 직결되므로 scanType에 따라 크롭 비율/해상도/품질을 다르게 가져간다.
// - label: 병 라벨 근접 촬영, 텍스트 양이 적어 2048로 충분
// - list: 메뉴판 전체, 작은 글씨가 수십 줄이라 3072 + 높은 품질 필요
// aspectW/aspectH는 화면의 가이드 프레임 비율과 동일해야 한다 (중앙 크롭 시 사용자가
// 프레임 안에 넣은 피사체만 서버로 전달되도록).
const SCAN_CONFIG: Record<
  ScanType,
  { aspectW: number; aspectH: number; maxEdge: number; quality: number }
> = {
  label: { aspectW: 1, aspectH: 1.1, maxEdge: 2048, quality: 90 },
  list: { aspectW: 1, aspectH: 1.45, maxEdge: 3072, quality: 92 },
};

/**
 * 사진의 중앙에서 scanType 프레임 비율에 맞는 영역을 잘라내고 maxEdge로 다운사이즈한다.
 * 화면의 가이드 프레임과 동일한 비율이어야 사용자가 "프레임 안"이라고 믿은 영역만
 * 서버에 전달된다. 프레임이 화면 중앙에서 약간 위쪽이긴 하지만 (dimOverlayTop flex 0.8
 * vs bottom flex 1.2) 실제 오차는 크지 않아 중앙 크롭으로 근사한다.
 */
async function cropToFrame(
  uri: string,
  photoWidth: number,
  photoHeight: number,
  type: ScanType
): Promise<string> {
  const { aspectW, aspectH, maxEdge, quality } = SCAN_CONFIG[type];
  const targetRatio = aspectW / aspectH; // width / height, 항상 < 1 (세로가 길다)
  const photoRatio = photoWidth / photoHeight;

  let cropW: number;
  let cropH: number;
  if (photoRatio > targetRatio) {
    // 사진이 프레임보다 가로로 넓다 → 좌우를 깎는다
    cropH = photoHeight;
    cropW = Math.round(cropH * targetRatio);
  } else {
    // 사진이 프레임보다 세로로 길다 → 위아래를 깎는다
    cropW = photoWidth;
    cropH = Math.round(cropW / targetRatio);
  }
  const cropX = Math.round((photoWidth - cropW) / 2);
  const cropY = Math.round((photoHeight - cropH) / 2);

  // 크롭 후 긴 변이 maxEdge가 되도록 축소 (원본보다 커지지 않도록)
  const scale = Math.min(1, maxEdge / cropH);
  const targetW = Math.max(1, Math.round(cropW * scale));
  const targetH = Math.max(1, Math.round(cropH * scale));

  return PhotoManipulator.batch(
    uri,
    [],
    { x: cropX, y: cropY, width: cropW, height: cropH },
    { width: targetW, height: targetH },
    quality,
    MimeType.JPEG
  );
}

async function getScanUsage(): Promise<{ date: string; count: number }> {
  const raw = await AsyncStorage.getItem(SCAN_USAGE_KEY);
  if (!raw) return { date: "", count: 0 };
  try {
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed.date === "string" &&
      typeof parsed.count === "number"
    ) {
      return parsed;
    }
    return { date: "", count: 0 };
  } catch {
    return { date: "", count: 0 };
  }
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
  await AsyncStorage.setItem(
    SCAN_USAGE_KEY,
    JSON.stringify({ date: today, count })
  );
}

const { width, height } = Dimensions.get("window");

type Props = NativeStackScreenProps<any, "Camera">;

export default function CameraScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const { isPremium } = useSubscription();
  const { showToast } = useGlobalUI();
  const insets = useSafeAreaInsets();
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice("back");
  const cameraRef = useRef<Camera>(null);

  const [flashOn, setFlashOn] = useState(false);
  const [scanType, setScanType] = useState<ScanType>("label");
  const [capturing, setCapturing] = useState(false);
  const [remainingScans, setRemainingScans] = useState(DAILY_SCAN_LIMIT);
  const [timeUntilReset, setTimeUntilReset] = useState("");
  const [focusPoint, setFocusPoint] = useState<{ x: number; y: number } | null>(
    null
  );
  const focusIndicatorAnim = useRef(new Animated.Value(0)).current;
  const focusHideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isPremium) {
      setRemainingScans(-1); // unlimited
    } else {
      getScanRemaining()
        .then((res) => {
          if (res.isSuccess) {
            setRemainingScans(
              res.result.isUnlimited ? -1 : res.result.remaining
            );
          }
        })
        .catch(() => {
          // Fallback to local count
          getTodayScanCount().then((count) =>
            setRemainingScans(DAILY_SCAN_LIMIT - count)
          );
        });
    }
  }, [isPremium]);

  useEffect(() => {
    if (isPremium || remainingScans === -1 || remainingScans > 0) {
      setTimeUntilReset("");
      return;
    }
    const updateTime = () => {
      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0);
      const diff = midnight.getTime() - now.getTime();
      const h = Math.floor(diff / (60 * 60 * 1000));
      const m = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
      setTimeUntilReset(t("camera.resetTimer", { hours: h, minutes: m }));
    };
    updateTime();
    const interval = setInterval(updateTime, 60 * 1000);
    return () => clearInterval(interval);
  }, [remainingScans, t]);

  // Toggle sliding animation
  const toggleAnim = useRef(new Animated.Value(0)).current;
  // Frame size animation (label vs list have different aspect ratios)
  const frameHeightAnim = useRef(
    new Animated.Value(FRAME_LABEL_HEIGHT)
  ).current;

  useEffect(() => {
    const toValue = scanType === "label" ? 0 : 1;
    const frameHeight =
      scanType === "label" ? FRAME_LABEL_HEIGHT : FRAME_LIST_HEIGHT;
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
    if (isPremium) return true; // Premium users have unlimited scans

    // Free users can only use the "label" scan type.
    if (scanType === "list") {
      showToast(t("camera.listPremiumOnly"), { type: "error" });
      navigation.navigate("Paywall" as never);
      return false;
    }

    const count = await getTodayScanCount();
    if (count >= DAILY_SCAN_LIMIT) {
      showToast(t("camera.limitAlertMessage", { limit: DAILY_SCAN_LIMIT }), {
        type: "error",
      });
      return false;
    }
    return true;
  }, [t, isPremium, showToast, scanType, navigation]);

  const handleSelectList = useCallback(() => {
    if (!isPremium) {
      showToast(t("camera.listPremiumOnly"), { type: "info" });
      navigation.navigate("Paywall" as never);
      return;
    }
    setScanType("list");
  }, [isPremium, navigation, showToast, t]);

  const handleCapture = useCallback(async () => {
    if (capturing) return;
    if (!(await checkDailyLimit())) return;

    // Simulator: no real camera, just show alert
    if (__DEV__ && !cameraRef.current) {
      const mode =
        scanType === "label"
          ? t("camera.scanTypeLabel")
          : t("camera.scanTypeList");
      showToast(t("camera.simulatorMessage", { mode }), { type: "info" });
      return;
    }

    if (!cameraRef.current) return;
    try {
      setCapturing(true);
      const photo = await cameraRef.current.takePhoto({
        flash: flashOn ? "on" : "off",
      });

      // file:// prefix needed on Android
      const uri =
        Platform.OS === "android" ? `file://${photo.path}` : photo.path;

      const croppedUri = await cropToFrame(
        uri,
        photo.width,
        photo.height,
        scanType
      );

      navigation.replace("MenuScanResult", {
        imageUri: croppedUri,
        scanType,
      });
    } catch (e) {
      showToast(t("camera.captureError"), { type: "error" });
    } finally {
      setCapturing(false);
    }
  }, [capturing, flashOn, navigation, scanType, showToast, t]);

  const handleGallery = useCallback(async () => {
    if (!(await checkDailyLimit())) return;
    const result = await launchImageLibrary({ mediaType: "photo" });
    const asset = result.assets?.[0];
    if (!asset?.uri || !asset.width || !asset.height) return;
    try {
      const croppedUri = await cropToFrame(
        asset.uri,
        asset.width,
        asset.height,
        scanType
      );
      navigation.replace("MenuScanResult", {
        imageUri: croppedUri,
        scanType,
      });
    } catch (e) {
      showToast(t("camera.captureError"), { type: "error" });
    }
  }, [checkDailyLimit, navigation, scanType, t, showToast]);

  // 탭 지점에 카메라 포커스를 맞춘다. 라벨/리스트 모두 근접 촬영이라
  // 포커스가 안 맞으면 OCR 인식률이 치명적으로 떨어진다.
  const handleFocusTap = useCallback(
    (e: { nativeEvent: { locationX: number; locationY: number } }) => {
      if (!cameraRef.current || !device?.supportsFocus) return;
      const { locationX, locationY } = e.nativeEvent;
      setFocusPoint({ x: locationX, y: locationY });
      focusIndicatorAnim.setValue(0);
      Animated.sequence([
        Animated.timing(focusIndicatorAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.delay(600),
        Animated.timing(focusIndicatorAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
      if (focusHideTimer.current) clearTimeout(focusHideTimer.current);
      focusHideTimer.current = setTimeout(() => setFocusPoint(null), 1000);
      cameraRef.current.focus({ x: locationX, y: locationY }).catch(() => {
        // focus can throw if the point is out of bounds; swallow silently.
      });
    },
    [device?.supportsFocus, focusIndicatorAnim]
  );

  useEffect(() => {
    return () => {
      if (focusHideTimer.current) clearTimeout(focusHideTimer.current);
    };
  }, []);

  const handleRequestPermission = useCallback(async () => {
    const granted = await requestPermission();
    if (!granted) {
      showToast(t("camera.permissionAlertMessage"), { type: "error" });
    }
  }, [requestPermission, showToast, t]);

  if (!hasPermission) {
    return (
      <View style={styles.permissionContainer}>
        <StatusBar
          barStyle="light-content"
          backgroundColor="transparent"
          translucent
        />
        <Ionicons
          name="camera-outline"
          size={64}
          color={colors.textSecondary}
        />
        <Text style={styles.permissionText}>
          {t("camera.permissionRequired")}
        </Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={handleRequestPermission}
        >
          <Text style={styles.permissionButtonText}>
            {t("camera.permissionAllow")}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // In dev mode without camera device (simulator), show mock UI
  const isSimulator = __DEV__ && !device;

  // Premium users (remainingScans === -1) are never capped.
  const scanDisabled =
    !isPremium && remainingScans !== -1 && remainingScans <= 0;

  if (!device && !__DEV__) {
    return (
      <View style={styles.permissionContainer}>
        <StatusBar
          barStyle="light-content"
          backgroundColor="transparent"
          translucent
        />
        <ActivityIndicator color={colors.primary} size="large" />
        <TouchableOpacity
          style={[
            styles.closeButton,
            { position: "absolute", top: 56, left: 20 },
          ]}
          onPress={handleClose}
        >
          <Ionicons name="close" size={28} color={colors.white} />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

      {/* Camera Preview (or mock background for simulator) */}
      {isSimulator ? (
        <View style={[StyleSheet.absoluteFill, styles.mockCamera]}>
          <Ionicons name="camera" size={48} color="rgba(255,255,255,0.15)" />
          <Text style={styles.mockText}>{t("camera.simulatorPreview")}</Text>
        </View>
      ) : (
        <>
          <Camera
            ref={cameraRef}
            style={StyleSheet.absoluteFill}
            device={device!}
            isActive={true}
            photo={true}
            photoQualityBalance="quality"
            torch={flashOn ? "on" : "off"}
          />
          {/* Tap-to-focus layer — must sit above the preview but below
              controls. pointerEvents="box-only" lets us catch taps without
              blocking child touchables (there are none here anyway). */}
          <TouchableWithoutFeedback onPress={handleFocusTap}>
            <View style={StyleSheet.absoluteFill} />
          </TouchableWithoutFeedback>
          {focusPoint && (
            <Animated.View
              pointerEvents="none"
              style={[
                styles.focusIndicator,
                {
                  left: focusPoint.x - FOCUS_INDICATOR_SIZE / 2,
                  top: focusPoint.y - FOCUS_INDICATOR_SIZE / 2,
                  opacity: focusIndicatorAnim,
                  transform: [
                    {
                      scale: focusIndicatorAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1.3, 1],
                      }),
                    },
                  ],
                },
              ]}
            />
          )}
        </>
      )}

      {/* Dimmed overlay with cutout frame */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {/* Semi-transparent background around the frame */}
        <View style={styles.dimOverlayTop} />
        {/* Center row: dim | frame | dim */}
        <View style={styles.frameCenterRow}>
          <View style={styles.dimSide} />
          <Animated.View
            style={[
              styles.frameCutout,
              { width: FRAME_WIDTH, height: frameHeightAnim },
            ]}
          >
            {/* Corner brackets */}
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
            {/* Guide text */}
            <View style={styles.guidePill}>
              <Text style={styles.guideText}>
                {scanType === "label"
                  ? t("camera.guideLabel")
                  : t("camera.guideList")}
              </Text>
            </View>
          </Animated.View>
          <View style={styles.dimSide} />
        </View>
        <View style={styles.dimOverlayBottom} />
      </View>

      {/* Cinematic top scrim behind the controls */}
      <LinearGradient
        pointerEvents="none"
        colors={["rgba(0,0,0,0.65)", "transparent"]}
        style={[styles.topScrim, { height: insets.top + 96 }]}
      />

      {/* Top Controls */}
      <View style={[styles.topBar, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity style={styles.topButton} onPress={handleClose}>
          <Ionicons name="close" size={28} color={colors.white} />
        </TouchableOpacity>

        <View style={styles.topRight}>
          {isPremium ? (
            <View style={styles.premiumBadge}>
              <Ionicons name="sparkles" size={12} color={colors.white} />
              <Text style={styles.premiumBadgeText}>
                {t("camera.premiumBadge")}
              </Text>
            </View>
          ) : (
            <View style={styles.scanCountBadge}>
              <Ionicons
                name="scan-outline"
                size={14}
                color={remainingScans > 0 ? colors.white : colors.textSecondary}
              />
              <Text
                style={[
                  styles.scanCountText,
                  remainingScans === 0 && { color: colors.textSecondary },
                ]}
              >
                {remainingScans}/{DAILY_SCAN_LIMIT}
              </Text>
            </View>
          )}
          <TouchableOpacity
            style={styles.topButton}
            onPress={() => setFlashOn((v) => !v)}
          >
            <Ionicons
              name={flashOn ? "flash" : "flash-off"}
              size={26}
              color={flashOn ? "#FFD700" : colors.white}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom Controls */}
      <View style={styles.bottomBar}>
        <LinearGradient
          pointerEvents="none"
          colors={["transparent", "rgba(0,0,0,0.55)", "rgba(0,0,0,0.9)"]}
          locations={[0, 0.45, 1]}
          style={StyleSheet.absoluteFill}
        />
        {/* Scan Type Toggle */}
        <View style={styles.toggleContainer}>
          {/* Sliding pill indicator */}
          <Animated.View
            style={[
              styles.togglePill,
              {
                transform: [
                  {
                    translateX: toggleAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, TOGGLE_BTN_WIDTH],
                    }),
                  },
                ],
              },
            ]}
          />
          <TouchableOpacity
            style={styles.toggleButton}
            onPress={() => setScanType("label")}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.toggleText,
                scanType === "label" && styles.toggleTextActive,
              ]}
            >
              {t("camera.scanTypeLabel")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.toggleButton}
            onPress={handleSelectList}
            activeOpacity={0.8}
          >
            <View style={styles.toggleLabelRow}>
              <Text
                style={[
                  styles.toggleText,
                  scanType === "list" && styles.toggleTextActive,
                ]}
              >
                {t("camera.scanTypeList")}
              </Text>
              {!isPremium && (
                <Ionicons
                  name="lock-closed"
                  size={12}
                  color="rgba(255,255,255,0.7)"
                  style={styles.toggleLockIcon}
                />
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* Shutter row */}
        <View style={styles.shutterRow}>
          <TouchableOpacity
            style={[
              styles.galleryButton,
              scanDisabled && styles.galleryButtonDisabled,
            ]}
            onPress={handleGallery}
            activeOpacity={0.7}
            disabled={scanDisabled}
          >
            <Ionicons
              name="images-outline"
              size={26}
              color={scanDisabled ? colors.textTertiary : colors.white}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.shutterButton,
              (capturing || scanDisabled) && styles.shutterButtonDisabled,
            ]}
            onPress={handleCapture}
            activeOpacity={0.8}
            disabled={capturing || scanDisabled}
          >
            {capturing ? (
              <ActivityIndicator color={colors.primary} size="small" />
            ) : (
              <View
                style={[
                  styles.shutterInner,
                  scanDisabled && styles.shutterInnerDisabled,
                ]}
              />
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

const BOTTOM_BAR_HEIGHT = Platform.OS === "ios" ? 200 : 180;
const SHUTTER_SIZE = 72;
const SHUTTER_INNER_SIZE = 58;

// Frame dimensions
const FRAME_WIDTH = width * 0.78;
const FRAME_LABEL_HEIGHT = FRAME_WIDTH * 1.1; // label: slightly taller than wide
const FRAME_LIST_HEIGHT = FRAME_WIDTH * 1.45; // list: much taller for menus
const CORNER_SIZE = 32;
const CORNER_THICKNESS = 3;

// Toggle dimensions
const TOGGLE_BTN_WIDTH = 104;
const TOGGLE_PADDING = 4;

// Tap-to-focus indicator
const FOCUS_INDICATOR_SIZE = 72;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
  },
  mockCamera: {
    backgroundColor: "#1a1a2e",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  mockText: {
    color: "rgba(255,255,255,0.25)",
    fontSize: 14,
  },
  focusIndicator: {
    position: "absolute",
    width: FOCUS_INDICATOR_SIZE,
    height: FOCUS_INDICATOR_SIZE,
    borderRadius: FOCUS_INDICATOR_SIZE / 2,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.9)",
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  permissionText: {
    color: colors.textSecondary,
    fontSize: 16,
    textAlign: "center",
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
    fontWeight: "600",
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
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  dimOverlayBottom: {
    flex: 1.2,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  frameCenterRow: {
    flexDirection: "row",
  },
  dimSide: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  frameCutout: {
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: spacing.xl,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },
  guidePill: {
    backgroundColor: "rgba(0,0,0,0.45)",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.pill,
  },
  guideText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  // Corner brackets
  corner: {
    position: "absolute",
    width: CORNER_SIZE,
    height: CORNER_SIZE,
  },
  cornerTL: {
    top: -1,
    left: -1,
    borderTopWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
    borderColor: colors.white,
    borderTopLeftRadius: radius.lg,
  },
  cornerTR: {
    top: -1,
    right: -1,
    borderTopWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
    borderColor: colors.white,
    borderTopRightRadius: radius.lg,
  },
  cornerBL: {
    bottom: -1,
    left: -1,
    borderBottomWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
    borderColor: colors.white,
    borderBottomLeftRadius: radius.lg,
  },
  cornerBR: {
    bottom: -1,
    right: -1,
    borderBottomWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
    borderColor: colors.white,
    borderBottomRightRadius: radius.lg,
  },
  topScrim: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
  // Top bar
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  topButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.pill,
    backgroundColor: "rgba(20,18,22,0.55)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  topRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  scanCountBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  scanCountText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "600",
  },
  premiumBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  premiumBadgeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  // Bottom bar
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    minHeight: BOTTOM_BAR_HEIGHT,
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: Platform.OS === "ios" ? 44 : 24,
    paddingTop: 16,
    gap: 20,
  },
  // Scan type toggle
  toggleContainer: {
    flexDirection: "row",
    backgroundColor: "rgba(20,18,22,0.55)",
    borderRadius: radius.pill,
    padding: TOGGLE_PADDING,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },
  togglePill: {
    position: "absolute",
    top: TOGGLE_PADDING,
    left: TOGGLE_PADDING,
    width: TOGGLE_BTN_WIDTH,
    height: 34,
    borderRadius: radius.pill,
    backgroundColor: accent.base,
  },
  toggleButton: {
    width: TOGGLE_BTN_WIDTH,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  toggleText: {
    fontSize: 14,
    fontWeight: "500",
    color: "rgba(255,255,255,0.6)",
  },
  toggleTextActive: {
    color: colors.white,
    fontWeight: "600",
  },
  toggleLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  toggleLockIcon: {
    marginLeft: 4,
  },
  // Shutter row
  shutterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 48,
  },
  galleryButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
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
    alignItems: "center",
    justifyContent: "center",
  },
  shutterButtonDisabled: {
    opacity: 0.4,
    borderColor: colors.textTertiary,
  },
  shutterInner: {
    width: SHUTTER_INNER_SIZE,
    height: SHUTTER_INNER_SIZE,
    borderRadius: SHUTTER_INNER_SIZE / 2,
    backgroundColor: colors.white,
  },
  shutterInnerDisabled: {
    backgroundColor: colors.textTertiary,
  },
  galleryButtonDisabled: {
    opacity: 0.4,
  },
  resetTimerText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: "500",
    textAlign: "center",
    marginTop: -8,
  },
});
