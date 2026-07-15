import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  ImageResizeMode,
  ImageStyle,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";
import Skeleton from "./Skeleton";

interface WineImageProps {
  uri?: string | null;
  /** 기존 Image에 주던 스타일 그대로 전달 (크기/absoluteFill 등) */
  style?: StyleProp<ImageStyle>;
  resizeMode?: ImageResizeMode;
  /** 로드 실패/URL 없음 시 표시 — 각 사용처의 기존 폴백 아이콘 유지용 */
  fallbackIcon?: React.ReactNode;
  skeletonBorderRadius?: number;
}

// 흰 이미지 웰(surfaces.imageWell) 위에 놓이므로 스켈레톤은 라이트 톤을 쓴다.
const SKELETON_BASE_LIGHT = "rgba(0,0,0,0.06)";
const SKELETON_HIGHLIGHT_LIGHT = "rgba(255,255,255,0.6)";

/**
 * 공용 와인 이미지 래퍼: 로딩 중 스켈레톤 셔머 → 로드 완료 시 250ms 페이드인,
 * 실패/URL 없음 시 폴백 아이콘. 사용처마다 흩어져 있던
 * failedImageIds/imageLoadFailed 패턴을 대체한다.
 */
const WineImage = ({
  uri,
  style,
  resizeMode = "contain",
  fallbackIcon,
  skeletonBorderRadius = 0,
}: WineImageProps) => {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const opacity = useRef(new Animated.Value(0)).current;

  // 리스트 셀 재사용 등으로 uri가 바뀌면 로딩 상태부터 다시 시작한다.
  useEffect(() => {
    setFailed(false);
    setLoaded(false);
    opacity.setValue(0);
  }, [uri, opacity]);

  const handleLoad = () => {
    setLoaded(true);
    Animated.timing(opacity, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
  };

  if (!uri || failed) {
    return (
      <View style={[styles.fallback, style as StyleProp<ViewStyle>]}>
        {fallbackIcon}
      </View>
    );
  }

  return (
    <View style={style as StyleProp<ViewStyle>}>
      {!loaded && (
        <Skeleton
          style={StyleSheet.absoluteFill}
          borderRadius={skeletonBorderRadius}
          baseColor={SKELETON_BASE_LIGHT}
          highlightColor={SKELETON_HIGHLIGHT_LIGHT}
        />
      )}
      <Animated.Image
        source={{ uri }}
        style={[StyleSheet.absoluteFillObject, { opacity }]}
        resizeMode={resizeMode}
        onLoad={handleLoad}
        onError={() => setFailed(true)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  fallback: {
    alignItems: "center",
    justifyContent: "center",
  },
});

export default WineImage;
