import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { palette } from '../theme/palette';
import { typography } from '../theme/typography';

function buildSegments(values, width, height, tint) {
  if (!values.length) {
    return { segments: [], points: [] };
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(max - min, 1);
  const stepX = values.length > 1 ? width / (values.length - 1) : width;

  const points = values.map((value, index) => ({
    x: index * stepX,
    y: height - ((value - min) / range) * height,
  }));

  const segments = points.slice(0, -1).map((point, index) => {
    const next = points[index + 1];
    const dx = next.x - point.x;
    const dy = next.y - point.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    const angle = `${(Math.atan2(dy, dx) * 180) / Math.PI}deg`;

    return {
      key: `${index}-${next.x}`,
      left: point.x,
      top: point.y,
      width: length,
      transform: [{ rotate: angle }],
      backgroundColor: tint,
    };
  });

  return { segments, points };
}

export function InsightLineChart({ label, suffix = '', tint, values }) {
  const [chartWidth, setChartWidth] = useState(0);
  const chartHeight = 132;
  const min = values.length ? Math.min(...values) : 0;
  const max = values.length ? Math.max(...values) : 0;
  const latest = values.length ? values[values.length - 1] : 0;
  const readyWidth = chartWidth > 24 ? chartWidth - 8 : 0;
  const { segments, points } = useMemo(
    () => buildSegments(values, readyWidth, chartHeight, tint),
    [chartHeight, readyWidth, tint, values],
  );
  const latestPoint = points[points.length - 1];

  const handleLayout = (event) => {
    const nextWidth = Math.floor(event.nativeEvent.layout.width);
    if (nextWidth && nextWidth !== chartWidth) {
      setChartWidth(nextWidth);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View>
          <Text style={styles.label}>{label}</Text>
          <Text style={[styles.latest, { color: tint }]}>
            {latest}
            {suffix}
          </Text>
        </View>
        <View style={styles.rangeWrap}>
          <Text style={styles.rangeText}>High {max}{suffix}</Text>
          <Text style={styles.rangeText}>Low {min}{suffix}</Text>
        </View>
      </View>
      <View style={styles.chartShell} onLayout={handleLayout}>
        <View style={[styles.chart, { height: chartHeight }]}>
        {[0, 1, 2, 3].map((line) => (
          <View key={line} style={[styles.gridLine, { top: line * 44 }]} />
        ))}
        <View
          style={[
            styles.ambientGlow,
            {
              backgroundColor: `${tint}20`,
            },
          ]}
        />
        {segments.map((segment) => (
          <View
            key={segment.key}
            style={[
              styles.segment,
              {
                left: segment.left,
                top: segment.top,
                width: segment.width,
                backgroundColor: segment.backgroundColor,
                transform: segment.transform,
              },
            ]}
          />
        ))}
        {latestPoint ? (
          <>
            <View
              style={[
                styles.latestDotGlow,
                {
                  left: latestPoint.x - 12,
                  top: latestPoint.y - 12,
                  backgroundColor: `${tint}33`,
                },
              ]}
            />
            <View
              style={[
                styles.latestDot,
                {
                  left: latestPoint.x - 5,
                  top: latestPoint.y - 5,
                  backgroundColor: tint,
                  borderColor: '#08111E',
                },
              ]}
            />
          </>
        ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: palette.border,
    padding: 18,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 12,
  },
  label: {
    ...typography.bodySmall,
    color: palette.subtext,
    marginBottom: 6,
  },
  latest: {
    ...typography.titleLarge,
  },
  rangeWrap: {
    alignItems: 'flex-end',
  },
  rangeText: {
    ...typography.caption,
    color: palette.subtext,
  },
  chart: {
    position: 'relative',
    overflow: 'hidden',
    width: '100%',
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  chartShell: {
    width: '100%',
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  segment: {
    position: 'absolute',
    height: 4,
    borderRadius: 999,
    transformOrigin: 'left center',
    shadowColor: '#FFFFFF',
    shadowOpacity: 0.16,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  ambientGlow: {
    position: 'absolute',
    right: -28,
    top: 12,
    width: 140,
    height: 140,
    borderRadius: 70,
  },
  latestDotGlow: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  latestDot: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
  },
});
