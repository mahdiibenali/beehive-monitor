import React, { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "../../shared/theme/theme";

export function MiniLineChart({ data, labels }: { data: number[]; labels: string[] }) {
    const [plotWidth, setPlotWidth] = useState(0);
    const plotHeight = 118;
    const dMax = data.length > 0 ? Math.max(...data) : 60;
    const dMin = data.length > 0 ? Math.min(...data) : -60;
    const padding = (dMax - dMin) * 0.1 || 10;
    const max = Math.ceil(dMax + padding);
    const min = Math.floor(dMin - padding);
    const range = max - min || 1;
    const yTicks = [
            max,
            Math.round(max - range * 0.33),
            Math.round(max - range * 0.66),
            min
          ];
    const points = useMemo(() => {
            if (plotWidth <= 0 || data.length === 0) return [];
            return data.map((value, index) => {
              const x = data.length === 1 ? 0 : (plotWidth / (data.length - 1)) * index;
              const clamped = Math.max(min, Math.min(max, value));
              const y = ((max - clamped) / (max - min)) * plotHeight;
              return { x, y };
            });
          }, [data, plotWidth]);
    return (
    <View style={styles.miniChart}>
      <View style={styles.chartYAxis}>
        {yTicks.map((tick) => (
          <Text key={tick} style={styles.chartTick}>
            {tick}
          </Text>
        ))}
      </View>
      <View style={styles.chartBody}>
        <View
          style={styles.chartPlot}
          onLayout={(event) => setPlotWidth(event.nativeEvent.layout.width)}
        >
          {yTicks.map((tick) => (
            <View
              key={tick}
              style={[
                styles.chartGridLine,
                { top: ((max - tick) / (max - min)) * plotHeight }
              ]}
            />
          ))}
          {points.slice(0, -1).map((point, index) => {
            const next = points[index + 1];
            const dx = next.x - point.x;
            const dy = next.y - point.y;
            const length = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx);
            return (
              <View
                key={`${point.x}-${next.x}`}
                style={[
                  styles.chartLineSegment,
                  {
                    width: length,
                    left: point.x,
                    top: point.y,
                    transform: [{ rotateZ: `${angle}rad` }]
                  }
                ]}
              />
            );
          })}
          {points.map((point, index) => (
            <View
              key={`${point.x}-${index}`}
              style={[styles.chartPoint, { left: point.x - 3, top: point.y - 3 }]}
            />
          ))}
        </View>
        <View style={styles.chartXLabels}>
          {labels.map((label) => (
            <Text key={label} style={styles.chartXLabel}>
              {label}
            </Text>
          ))}
        </View>
      </View>
    </View>
    );
}

const styles = StyleSheet.create({
  miniChart: {
        flexDirection: "row",
        height: 150,
        gap: 8,
        paddingTop: 4
      },
  chartYAxis: {
        width: 26,
        height: 118,
        justifyContent: "space-between",
        alignItems: "flex-start"
      },
  chartTick: {
        color: colors.ink400,
        fontSize: 9,
        lineHeight: 11,
        fontWeight: "700"
      },
  chartBody: {
        flex: 1
      },
  chartPlot: {
        height: 118,
        overflow: "visible"
      },
  chartGridLine: {
        position: "absolute",
        left: 0,
        right: 0,
        height: 1,
        backgroundColor: "#EEF0FC"
      },
  chartLineSegment: {
        position: "absolute",
        height: 2.5,
        borderRadius: 2,
        backgroundColor: colors.brandOrange
      },
  chartPoint: {
        position: "absolute",
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: colors.white,
        borderWidth: 2,
        borderColor: colors.brandOrange
      },
  chartXLabels: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 8
      },
  chartXLabel: {
        color: colors.ink400,
        fontSize: 9,
        lineHeight: 12,
        fontWeight: "700"
      },
});

