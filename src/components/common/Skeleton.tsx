import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  DimensionValue,
  Easing,
  StyleProp,
  StyleSheet,
  ViewStyle,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { colors } from "../../constants/colors";

interface SkeletonProps {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
  /** 밝은 표면(흰 이미지 웰 등) 위에 놓일 때만 라이트 톤으로 오버라이드 */
  baseColor?: string;
  highlightColor?: string;
}

/**
 * 로딩 중 콘텐츠 자리를 잡아주는 셔머 placeholder 블록 (토스 스타일).
 * 어두운 surface 톤 배경 위로 은은한 하이라이트 밴드가 좌→우로 흐른다.
 * 네이티브 드라이버 애니메이션은 시작 시점에 붙어있는 뷰에만 적용되므로,
 * 폭이 측정되어 밴드가 마운트된 뒤에 루프를 시작한다 (PaywallScreen CTA 셔머와 동일 패턴).
 */
const Skeleton = ({
  width,
  height,
  borderRadius = 8,
  style,
  baseColor = colors.surface1,
  highlightColor = "rgba(255,255,255,0.07)",
}: SkeletonProps) => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const [measuredWidth, setMeasuredWidth] = useState(0);
  const shimmerVisible = measuredWidth > 0;

  useEffect(() => {
    if (!shimmerVisible) return;
    shimmerAnim.setValue(0);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1100,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.delay(700),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [shimmerAnim, shimmerVisible]);

  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-measuredWidth * 0.6, measuredWidth],
  });

  return (
    <Animated.View
      style={[
        styles.base,
        { width, height, borderRadius, backgroundColor: baseColor },
        style,
      ]}
      onLayout={(e) => setMeasuredWidth(e.nativeEvent.layout.width)}
    >
      {shimmerVisible && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.band,
            {
              width: measuredWidth * 0.5,
              transform: [{ translateX }],
            },
          ]}
        >
          <LinearGradient
            colors={[
              "rgba(255,255,255,0)",
              highlightColor,
              "rgba(255,255,255,0)",
            ]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFillObject}
          />
        </Animated.View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  base: {
    overflow: "hidden",
  },
  band: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
  },
});

export default Skeleton;
