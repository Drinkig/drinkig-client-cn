import React from "react";
import Svg, { Path } from "react-native-svg";

interface KakaoIconProps {
  size?: number;
  color?: string;
}

/**
 * Official KakaoTalk speech-bubble symbol.
 * Defaults to the Kakao "label" black (#000000) for use on the yellow button.
 */
const KakaoIcon = ({ size = 18, color = "#000000" }: KakaoIconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path
      fill={color}
      d="M12 3C6.5 3 2 6.59 2 11.02c0 2.86 1.92 5.37 4.79 6.79-.21.74-.76 2.74-.87 3.17-.14.53.19.52.41.38.17-.11 2.69-1.83 3.78-2.57.61.09 1.24.13 1.89.13 5.5 0 10-3.59 10-8.02C22 6.59 17.5 3 12 3Z"
    />
  </Svg>
);

export default KakaoIcon;
