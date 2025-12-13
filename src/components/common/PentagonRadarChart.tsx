import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Polygon, Line, Text as SvgText, Circle, G } from 'react-native-svg';
import { FlavorProfile } from '../onboarding/FlavorProfileStep';

interface PentagonRadarChartProps {
  data: FlavorProfile;
  size?: number;
}

const LABELS = [
  { key: 'acidity', label: '산도' },
  { key: 'sweetness', label: '당도' },
  { key: 'tannin', label: '타닌' },
  { key: 'body', label: '바디' },
  { key: 'alcohol', label: '알코올' },
];

const PentagonRadarChart = ({ data, size = 200 }: PentagonRadarChartProps) => {
  const center = size / 2;
  const radius = (size / 2) * 0.6; // 라벨 공간 확보를 위해 반지름 축소 (0.65 -> 0.6)
  const angleStep = (Math.PI * 2) / 5;

  // 점수 매핑 (null/undefined는 0 또는 최소값 처리, 여기선 0으로 처리하여 중앙에 찍히게 하거나 1로 처리)
  // 1~5점 척도. 2.5(모름)는 중간.
  const getDataValue = (key: keyof FlavorProfile) => {
    const val = data[key];
    if (val === null || val === undefined) return 0; // 데이터 없음
    return val;
  };

  // 각 축의 좌표 계산
  const getCoordinates = (value: number, index: number) => {
    const angle = index * angleStep - Math.PI / 2; // -90도부터 시작 (12시 방향)
    // 값은 0~5. 5가 radius 끝.
    const distance = (value / 5) * radius;
    const x = center + distance * Math.cos(angle);
    const y = center + distance * Math.sin(angle);
    return { x, y };
  };

  // 데이터 다각형 좌표
  const dataPoints = LABELS.map((item, index) => {
    const val = getDataValue(item.key as keyof FlavorProfile);
    return getCoordinates(val, index);
  });

  const pointsString = dataPoints.map(p => `${p.x},${p.y}`).join(' ');

  // 배경 그리드 (1~5단계 오각형)
  const renderGrid = () => {
    return [1, 2, 3, 4, 5].map((step) => {
      const gridPoints = LABELS.map((_, index) => getCoordinates(step, index));
      const gridString = gridPoints.map(p => `${p.x},${p.y}`).join(' ');
      return (
        <Polygon
          key={`grid-${step}`}
          points={gridString}
          stroke="#333"
          strokeWidth="1"
          fill="none"
        />
      );
    });
  };

  // 축 라인
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
          stroke="#333"
          strokeWidth="1"
        />
      );
    });
  };

  // 라벨 렌더링
  const renderLabels = () => {
    return LABELS.map((item, index) => {
      const angle = index * angleStep - Math.PI / 2;
      const labelRadius = radius + 16; // 그래프보다 조금 더 바깥
      const x = center + labelRadius * Math.cos(angle);
      const y = center + labelRadius * Math.sin(angle);
      
      return (
        <SvgText
          key={`label-${index}`}
          x={x}
          y={y}
          fontSize="11"
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
      <Svg width={size} height={size}>
        {/* 배경 그리드 */}
        {renderGrid()}
        
        {/* 축 */}
        {renderAxes()}

        {/* 데이터 영역 */}
        <Polygon
          points={pointsString}
          fill="rgba(142, 68, 173, 0.4)" // #8e44ad with opacity
          stroke="#8e44ad"
          strokeWidth="2"
        />

        {/* 라벨 */}
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
  },
});

export default PentagonRadarChart;

