import React, { useMemo } from "react";
import { StyleSheet } from "react-native";
import { WebView } from "react-native-webview";
import { colors } from "../../shared/theme/theme";
import { MobileSeries } from "../types/types";
import { CHART_LABELS } from "../utils/constants";
import { buildDesignLineChartHtml } from "../utils/helpers";

export function DesignLineChart({
      color,
      series
    }: {
          color: string;
          series?: MobileSeries;
        }) {
    const values = series?.values ?? [];
    const labels = series?.labels ?? CHART_LABELS;
    const html = useMemo(() => buildDesignLineChartHtml(color, values, labels), [color, labels, values]);
    return (
    <WebView
      style={styles.designLineChartWebView}
      source={{ html }}
      originWhitelist={["*"]}
      javaScriptEnabled={false}
      scrollEnabled={false}
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
      bounces={false}
    />
    );
}

const styles = StyleSheet.create({
  designLineChartWebView: { height: 118, width: "100%", backgroundColor: colors.white },
});

