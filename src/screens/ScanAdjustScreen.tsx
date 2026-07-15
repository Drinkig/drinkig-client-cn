import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { colors } from "../constants/colors";
import { radius, spacing } from "../constants/theme";
import { useGlobalUI } from "../context/GlobalUIContext";
import { RootStackParamList } from "../types";
import { SCAN_CONFIG, cropRegionAndResize } from "../utils/scanImage";

// 갤러리에서 고른 사진은 촬영과 달리 프레임 구도가 없어 그대로 보내면 라벨/리스트가
// 이미지의 일부에 불과해 OCR 인식률이 떨어진다. 이 화면에서 사용자가 핀치 줌/이동으로
// 피사체를 프레임에 채우면, 프레임에 보이는 영역만 잘라 서버로 전달한다.
// 줌/팬은 iOS ScrollView의 네이티브 핀치 줌을 그대로 사용한다 (별도 제스처 라이브러리 불필요).

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const FRAME_WIDTH = SCREEN_WIDTH * 0.78;
const CORNER_SIZE = 26;
const CORNER_THICKNESS = 3;
const MAX_ZOOM = 5;

type Props = NativeStackScreenProps<any, "ScanAdjust">;

const ScanAdjustScreen = ({ navigation, route }: Props) => {
  const { imageUri, imageWidth, imageHeight, scanType } =
    route.params as RootStackParamList["ScanAdjust"];
  const { t } = useTranslation();
  const { showToast } = useGlobalUI();
  const insets = useSafeAreaInsets();

  const { aspectW, aspectH } = SCAN_CONFIG[scanType];
  const frameHeight = FRAME_WIDTH * (aspectH / aspectW);

  // 프레임을 이미지가 완전히 덮는 최소 배율(cover)을 기준 크기로 잡는다.
  const baseScale = Math.max(
    FRAME_WIDTH / imageWidth,
    frameHeight / imageHeight
  );
  const baseW = imageWidth * baseScale;
  const baseH = imageHeight * baseScale;

  // ScrollView의 현재 줌/오프셋. 리렌더가 필요 없으므로 ref로만 추적한다.
  const scrollState = useRef({
    offsetX: (baseW - FRAME_WIDTH) / 2,
    offsetY: (baseH - frameHeight) / 2,
    zoom: 1,
  });
  const [isProcessing, setIsProcessing] = useState(false);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, zoomScale } = e.nativeEvent;
    scrollState.current = {
      offsetX: contentOffset.x,
      offsetY: contentOffset.y,
      zoom: zoomScale || 1,
    };
  };

  const handleConfirm = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      const { offsetX, offsetY, zoom } = scrollState.current;
      // 화면(프레임) 좌표 → 원본 픽셀 좌표
      const pxPerPoint = 1 / (baseScale * zoom);
      const rect = {
        x: offsetX * pxPerPoint,
        y: offsetY * pxPerPoint,
        width: FRAME_WIDTH * pxPerPoint,
        height: frameHeight * pxPerPoint,
      };
      const croppedUri = await cropRegionAndResize(
        imageUri,
        imageWidth,
        imageHeight,
        rect,
        scanType
      );
      navigation.replace("MenuScanResult", {
        imageUri: croppedUri,
        scanType,
      });
    } catch {
      setIsProcessing(false);
      showToast(t("camera.captureError"), { type: "error" });
    }
  };

  return (
    <View style={styles.container}>
      {/* 크롭 프레임(=줌 가능한 ScrollView 창) */}
      <View style={styles.frameWrapper}>
        <View
          style={{ width: FRAME_WIDTH, height: frameHeight }}
          testID="scan-adjust-frame"
        >
          <ScrollView
            style={StyleSheet.absoluteFill}
            contentContainerStyle={{ width: baseW, height: baseH }}
            contentOffset={{
              x: scrollState.current.offsetX,
              y: scrollState.current.offsetY,
            }}
            minimumZoomScale={1}
            maximumZoomScale={MAX_ZOOM}
            bouncesZoom
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            onScroll={onScroll}
            scrollEventThrottle={16}
          >
            <Image
              source={{ uri: imageUri }}
              style={{ width: baseW, height: baseH }}
              resizeMode="cover"
            />
          </ScrollView>
          {/* 모서리 브래킷 (카메라 프레임과 동일한 시각 언어) */}
          <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            <View style={styles.frameBorder} />
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
          </View>
        </View>
        <View style={styles.guidePill}>
          <Text style={styles.guideText}>
            {scanType === "label"
              ? t("camera.adjustGuideLabel")
              : t("camera.adjustGuideList")}
          </Text>
        </View>
      </View>

      {/* 상단 닫기 */}
      <View style={[styles.topBar, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.topButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel={t("common.close")}
        >
          <Ionicons name="close" size={26} color={colors.white} />
        </TouchableOpacity>
      </View>

      {/* 하단 확인 버튼 */}
      <View
        style={[
          styles.bottomBar,
          { paddingBottom: Math.max(insets.bottom, 16) },
        ]}
      >
        <TouchableOpacity
          style={[styles.confirmButton, isProcessing && styles.confirmDisabled]}
          onPress={handleConfirm}
          disabled={isProcessing}
          accessibilityRole="button"
        >
          {isProcessing ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Text style={styles.confirmText}>{t("camera.adjustConfirm")}</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
    justifyContent: "center",
  },
  frameWrapper: {
    alignItems: "center",
  },
  frameBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },
  guidePill: {
    marginTop: spacing.lg,
    backgroundColor: "rgba(255,255,255,0.1)",
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
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    paddingHorizontal: spacing.lg,
  },
  topButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.xxl,
  },
  confirmButton: {
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmDisabled: {
    opacity: 0.6,
  },
  confirmText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default ScanAdjustScreen;
