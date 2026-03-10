import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Polygon, Line, Text as SvgText, Circle, G } from 'react-native-svg';
import { FlavorProfile } from '../onboarding/FlavorProfileStep';
import { colors } from '../../constants/colors';
import { useTranslation } from 'react-i18next';

interface PentagonRadarChartProps {
  data: FlavorProfile;
  size?: number;
}

const PentagonRadarChart = ({ data, size = 200 }: PentagonRadarChartProps) => {
  const { t, i18n } = useTranslation();
  const isEn = i18n.language === 'en';

  const LABELS = [
    { key: 'acidity', label: t('taste.acidity') },
    { key: 'sweetness', label: t('taste.sweetness') },
    { key: 'tannin', label: t('taste.tannin') },
    { key: 'body', label: t('taste.body') },
    { key: 'alcohol', label: t('taste.alcohol') },
  ];

  const center = size / 2;
  const radiusRatio = isEn ? 0.52 : 0.6; // Keep Korean large, shrink English slightly to fit labels
  const radius = (size / 2) * radiusRatio;
  const angleStep = (Math.PI * 2) / 5;

  // 점수 매핑 (null/undefined는 0 또는 최소값 처리, 여기선 0으로 처리하여 중앙에 찍히게 하거나 1로 처리)
  // 1~5점 척도. 2.5(모름)는 중간.
  const getDataValue = (key: keyof FlavorProfile) => {
    const val = data[key];
    if (val === null || val === undefined) return 0; // 데이터 없음
    return val;
  };


  const getCoordinates = (value: number, index: number) => {
    const angle = index * angleStep - Math.PI / 2; // -90도부터 시작 (12시 방향)
    // 값은 0~5. 5가 radius 끝.
    const distance = (value / 5) * radius;
    const x = center + distance * Math.cos(angle);
    const y = center + distance * Math.sin(angle);
    return { x, y };
  };


  const dataPoints = LABELS.map((item, index) => {
    const val = getDataValue(item.key as keyof FlavorProfile);
    return getCoordinates(val, index);
  });

  const pointsString = dataPoints.map(p => `${p.x},${p.y}`).join(' ');


  const renderGrid = () => {
    return [1, 2, 3, 4, 5].map((step) => {
      const gridPoints = LABELS.map((_, index) => getCoordinates(step, index));
      const gridString = gridPoints.map(p => `${p.x},${p.y}`).join(' ');
      return (
        <Polygon
          key={`grid-${step}`}
          points={gridString}
          stroke={colors.border}
          strokeWidth="1"
          fill="none"
        />
      );
    });
  };


  const renderAxes = () => {
    return LABELS.map((_, index) => {
      const endPoint = getCoordinates(5, index);
      return (
        <Line
          key={`axis-${index}`}
          x1={center}
          y1={center}
          x2={endPoint.x}
          y2={endPoint.y}
          stroke={colors.border}
          strokeWidth="1"
        />
      );
    });
  };


  const renderLabels = () => {
    return LABELS.map((item, index) => {
      const angle = index * angleStep - Math.PI / 2;
      const labelMargin = isEn ? 14 : 16;
      const labelRadius = radius + labelMargin;
      const x = center + labelRadius * Math.cos(angle);
      const y = center + labelRadius * Math.sin(angle);

      return (
        <SvgText
          key={`label-${index}`}
          x={x}
          y={y}
          fontSize={isEn ? "9" : "11"}
          fill="#aaa"
          textAnchor="middle"
          alignmentBaseline="middle"
          fontWeight="bold"
        >
          {item.label}
        </SvgText>
      );
    });
  };

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} style={{ overflow: 'visible' }}>

        {renderGrid()}


        {renderAxes()}


        <Polygon
          points={pointsString}
          fill="rgba(142, 68, 173, 0.4)" // #8e44ad with opacity
          stroke={colors.primary}
          strokeWidth="2"
        />


        {renderLabels()}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    overflow: 'visible',
  },
});

export default PentagonRadarChart;

