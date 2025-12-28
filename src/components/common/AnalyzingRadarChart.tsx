import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Polygon, Line, Text as SvgText } from 'react-native-svg';
import { FlavorProfile } from '../onboarding/FlavorProfileStep';

interface AnalyzingRadarChartProps {
    data: FlavorProfile;
    size?: number;
    mode?: 'grow' | 'jitter' | 'fixed';
}

const LABELS = [
    { key: 'acidity', label: '산도' },
    { key: 'sweetness', label: '당도' },
    { key: 'tannin', label: '타닌' },
    { key: 'body', label: '바디' },
    { key: 'alcohol', label: '알코올' },
];

const AnalyzingRadarChart = ({ data, size = 200, mode = 'jitter' }: AnalyzingRadarChartProps) => {
    const center = size / 2;
    const radius = (size / 2) * 0.6;
    const angleStep = (Math.PI * 2) / 5;

    const [offsets, setOffsets] = useState<number[]>([0, 0, 0, 0, 0]);

    const growthProgress = useRef(mode === 'grow' ? 0 : 1);
    const [forceUpdate, setForceUpdate] = useState(0);

    const requestRef = useRef<number>(0);
    const previousTimeRef = useRef<number>(0);
    const startTimeRef = useRef<number | null>(null);

    const JITTER_INTENSITY = 0.8;
    const GROW_DURATION = 3000;
    const PULSE_DURATION = 600;

    const targetOffsets = useRef(LABELS.map(() => (Math.random() - 0.5) * 2 * JITTER_INTENSITY)).current;

    const animate = (time: number) => {
        if (startTimeRef.current === null) startTimeRef.current = time;
        const elapsed = time - startTimeRef.current;

        let needsUpdate = false;

        if (mode === 'grow') {
            const p = Math.min(1, elapsed / GROW_DURATION);
            const easedP = 1 - Math.pow(1 - p, 3);

            if (Math.abs(growthProgress.current - easedP) > 0.001) {
                growthProgress.current = easedP;
                needsUpdate = true;
            }
            if (offsets[0] !== 0) setOffsets([0, 0, 0, 0, 0]);
        } else {
            if (growthProgress.current !== 1) {
                growthProgress.current = 1;
                needsUpdate = true;
            }
        }

        if (mode === 'jitter') {
            const activeIndex = Math.floor(elapsed / PULSE_DURATION);

            if (activeIndex >= 5) {
                if (offsets[4] !== targetOffsets[4]) {
                    setOffsets([...targetOffsets]);
                    needsUpdate = true;
                }
            } else {
                const stepProgress = (elapsed % PULSE_DURATION) / PULSE_DURATION;
                const easedStep = Math.sin(stepProgress * Math.PI / 2);
                const newOffsets = [...offsets];

                for (let i = 0; i < activeIndex; i++) {
                    newOffsets[i] = targetOffsets[i];
                }

                newOffsets[activeIndex] = targetOffsets[activeIndex] * easedStep;

                for (let i = activeIndex + 1; i < 5; i++) {
                    newOffsets[i] = 0;
                }

                setOffsets(newOffsets);
                needsUpdate = true;
            }
        }

        if (needsUpdate) {
            setForceUpdate(prev => prev + 1);
        }

        previousTimeRef.current = time;
        requestRef.current = requestAnimationFrame(animate);
    };

    useEffect(() => {
        startTimeRef.current = null;
        if (mode === 'grow') {
            growthProgress.current = 0;
        }
    }, [mode]);

    useEffect(() => {
        requestRef.current = requestAnimationFrame(animate);
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [mode]);

    const getDataValue = (key: keyof FlavorProfile, index: number) => {
        const baseVal = data[key] || 0;
        const jitterVal = mode === 'jitter' ? offsets[index] : 0;

        let val = (baseVal * growthProgress.current) + jitterVal;
        return Math.max(0, Math.min(5, val));
    };

    const getCoordinates = (value: number, index: number) => {
        const angle = index * angleStep - Math.PI / 2;
        const distance = (value / 5) * radius;
        const x = center + distance * Math.cos(angle);
        const y = center + distance * Math.sin(angle);
        return { x, y };
    };

    const dataPoints = LABELS.map((item, index) => {
        const val = getDataValue(item.key as keyof FlavorProfile, index);
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
                    stroke="#333"
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
                    stroke="#333"
                    strokeWidth="1"
                    fill="none"
                />
            );
        });
    };

    const renderLabels = () => {
        return LABELS.map((item, index) => {
            const angle = index * angleStep - Math.PI / 2;
            const labelRadius = radius + 16;
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
                {renderGrid()}
                {renderAxes()}
                <Polygon
                    points={pointsString}
                    fill="rgba(142, 68, 173, 0.4)"
                    stroke="#8e44ad"
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
    },
});

export default AnalyzingRadarChart;
