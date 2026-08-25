import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/Ionicons";
import { useTranslation } from "react-i18next";
import { colors } from "../../constants/colors";
import { spacing, radius, accent, withAlpha } from "../../constants/theme";
import { useGlobalUI } from "../../context/GlobalUIContext";
import {
  cropNotePhoto,
  NOTE_PHOTO_GRID_ASPECT,
  NotePhotoRegion,
} from "../../utils/notePhoto";

interface PhotoCropModalProps {
  visible: boolean;
  /** 크롭 기준이 되는 원본 URI — 이미 크롭된 사진이 아닌 원본을 넘겨야 재크롭이 된다 */
  uri: string | null;
  /** 이전에 적용한 크롭 영역 — 있으면 그 프레이밍에서 이어서 조정한다 */
  initialRegion?: NotePhotoRegion | null;
  onClose: () => void;
  /** 크롭이 적용된 새 로컬 JPEG URI와 원본 픽셀 기준 영역을 돌려준다. */
  onApply: (croppedUri: string, region: NotePhotoRegion) => void;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

/**
 * 그리드(3:4)에 보일 영역을 인스타그램처럼 드래그로 맞추는 크롭 모달.
 * 사진은 프레임을 cover로 채우고, 넘치는 축으로만 이동할 수 있다.
 */
export default function PhotoCropModal({
  visible,
  uri,
  initialRegion,
  onClose,
  onApply,
}: PhotoCropModalProps) {
  const { t } = useTranslation();
  const { showToast } = useGlobalUI();

  const [frameWidth, setFrameWidth] = useState(0);
  const [imageSize, setImageSize] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isCropping, setIsCropping] = useState(false);

  const offsetRef = useRef({ x: 0, y: 0 });
  const panStartRef = useRef({ x: 0, y: 0 });
  const boundsRef = useRef({ minX: 0, minY: 0 });

  const frameHeight = frameWidth / NOTE_PHOTO_GRID_ASPECT;

  // 프레임을 cover로 채우는 표시 배율과 드래그 가능 범위(음수 오프셋 한계)
  const layout = useMemo(() => {
    if (!imageSize || frameWidth <= 0) return null;
    const scale = Math.max(
      frameWidth / imageSize.width,
      frameHeight / imageSize.height
    );
    const displayWidth = imageSize.width * scale;
    const displayHeight = imageSize.height * scale;
    return {
      scale,
      displayWidth,
      displayHeight,
      minX: frameWidth - displayWidth,
      minY: frameHeight - displayHeight,
    };
  }, [imageSize, frameWidth, frameHeight]);

  useEffect(() => {
    if (!visible || !uri) {
      setImageSize(null);
      return;
    }
    let cancelled = false;
    Image.getSize(
      uri,
      (width, height) => {
        if (!cancelled) setImageSize({ width, height });
      },
      () => {
        if (!cancelled) {
          showToast(t("tastingNoteWrite.photoCrop.fail"), { type: "error" });
          onClose();
        }
      }
    );
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, uri]);

  // 새 사진/새 레이아웃마다 초기 위치 잡기 — 이전 크롭 영역이 있으면 그
  // 프레이밍을 복원하고, 없으면 중앙 정렬로 시작
  useEffect(() => {
    if (!layout) return;
    boundsRef.current = { minX: layout.minX, minY: layout.minY };
    const start = initialRegion
      ? {
          x: clamp(-initialRegion.x * layout.scale, layout.minX, 0),
          y: clamp(-initialRegion.y * layout.scale, layout.minY, 0),
        }
      : { x: layout.minX / 2, y: layout.minY / 2 };
    offsetRef.current = start;
    setOffset(start);
  }, [layout, initialRegion]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        panStartRef.current = { ...offsetRef.current };
      },
      onPanResponderMove: (_, gesture) => {
        const next = {
          x: clamp(
            panStartRef.current.x + gesture.dx,
            boundsRef.current.minX,
            0
          ),
          y: clamp(
            panStartRef.current.y + gesture.dy,
            boundsRef.current.minY,
            0
          ),
        };
        offsetRef.current = next;
        setOffset(next);
      },
    })
  ).current;

  const handleApply = async () => {
    if (!uri || !imageSize || !layout || isCropping) return;

    setIsCropping(true);
    try {
      // 화면 오프셋 → 원본 픽셀 크롭 영역
      const x = clamp(
        Math.round(-offsetRef.current.x / layout.scale),
        0,
        imageSize.width - 1
      );
      const y = clamp(
        Math.round(-offsetRef.current.y / layout.scale),
        0,
        imageSize.height - 1
      );
      const width = clamp(
        Math.round(frameWidth / layout.scale),
        1,
        imageSize.width - x
      );
      const height = clamp(
        Math.round(frameHeight / layout.scale),
        1,
        imageSize.height - y
      );

      const region = { x, y, width, height };
      const croppedUri = await cropNotePhoto(uri, region);
      onApply(croppedUri, region);
    } catch (error) {
      console.error("Note photo crop failed:", error);
      showToast(t("tastingNoteWrite.photoCrop.fail"), { type: "error" });
    } finally {
      setIsCropping(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={onClose}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel={t("common.cancel")}
          >
            <Icon name="close" size={26} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {t("tastingNoteWrite.photoCrop.title")}
          </Text>
          <TouchableOpacity
            onPress={handleApply}
            disabled={!layout || isCropping}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel={t("tastingNoteWrite.photoCrop.apply")}
          >
            {isCropping ? (
              <ActivityIndicator size="small" color={accent.text} />
            ) : (
              <Text style={styles.applyText}>
                {t("tastingNoteWrite.photoCrop.apply")}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.body}>
          <View
            style={styles.frameWrap}
            onLayout={(e) => setFrameWidth(e.nativeEvent.layout.width)}
          >
            {frameWidth > 0 && (
              <View
                style={[styles.frame, { height: frameHeight }]}
                {...panResponder.panHandlers}
              >
                {uri && layout ? (
                  <>
                    <Image
                      source={{ uri }}
                      style={{
                        position: "absolute",
                        left: offset.x,
                        top: offset.y,
                        width: layout.displayWidth,
                        height: layout.displayHeight,
                      }}
                    />
                    <View pointerEvents="none" style={styles.gridOverlay}>
                      <View style={[styles.gridLineV, { left: "33.33%" }]} />
                      <View style={[styles.gridLineV, { left: "66.66%" }]} />
                      <View style={[styles.gridLineH, { top: "33.33%" }]} />
                      <View style={[styles.gridLineH, { top: "66.66%" }]} />
                    </View>
                  </>
                ) : (
                  <ActivityIndicator size="small" color={accent.text} />
                )}
              </View>
            )}
          </View>

          <Text style={styles.hint}>
            {t("tastingNoteWrite.photoCrop.hint")}
          </Text>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "700",
  },
  applyText: {
    color: accent.text,
    fontSize: 15,
    fontWeight: "700",
  },
  body: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },
  frameWrap: {
    width: "100%",
  },
  frame: {
    width: "100%",
    borderRadius: radius.sm,
    overflow: "hidden",
    backgroundColor: colors.black,
    alignItems: "center",
    justifyContent: "center",
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  gridLineV: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: StyleSheet.hairlineWidth,
    backgroundColor: withAlpha(colors.white, 0.35),
  },
  gridLineH: {
    position: "absolute",
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: withAlpha(colors.white, 0.35),
  },
  hint: {
    color: colors.textTertiary,
    fontSize: 13,
    textAlign: "center",
    marginTop: spacing.lg,
  },
});
