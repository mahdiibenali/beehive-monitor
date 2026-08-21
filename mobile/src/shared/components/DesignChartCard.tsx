import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, softShadow } from "../theme/theme";
import { MobileSeries } from "../types/types";
import { TIME_FILTERS } from "../utils/constants";
import { hasSeriesData } from "../utils/helpers";
import { DesignLineChart } from "./DesignLineChart";

export function DesignChartCard({
      title,
      color,
      activeFilter = "Cette semaine",
      series,
      emptyText = "Aucune donnee",
      onFilterChange
    }: {
          title: string;
          color: string;
          activeFilter?: string;
          series?: MobileSeries;
          emptyText?: string;
          onFilterChange?: (filter: string) => void;
        }) {
    const [currentFilter, setCurrentFilter] = useState(activeFilter);
    useEffect(() => {
    if (activeFilter) setCurrentFilter(activeFilter);
    }, [activeFilter]);
    const displaySeries = useMemo(() => {
            if (!series) return undefined;
            
            // For Production venin, the backend already handles all filters accurately
            if (title === "Production venin") {
              return series;
            }
            
            let sliceLength = series.values.length;
            if (currentFilter === "Aujourd'hui") sliceLength = Math.max(1, Math.floor(series.values.length * 0.3));
            
            const newValues = series.values.slice(0, sliceLength);
            const newLabels = series.labels.slice(0, sliceLength);
            
            return {
              values: newValues.length > 0 ? newValues : series.values,
              labels: newLabels.length > 0 ? newLabels : series.labels
            };
          }, [series, currentFilter, title]);
    const hasData = hasSeriesData(displaySeries);
    return (
    <View style={styles.designChartCard}>
      <View style={styles.designChartHeader}>
        <Text style={styles.designChartTitle}>{title}</Text>
        <Text style={styles.designChartDate}>{hasData ? "Donnees backend" : "Non disponible"}</Text>
      </View>
      {hasData ? (
        <>
          <View style={styles.designTimeFilterRow}>
            {TIME_FILTERS.map((filter) => {
              const active = filter === currentFilter;
              return (
                <Pressable
                  key={filter}
                  onPress={() => {
                    setCurrentFilter(filter);
                    if (onFilterChange) onFilterChange(filter);
                  }}
                  style={[
                    styles.designTimeFilterChip,
                    active && styles.designTimeFilterChipActive
                  ]}
                >
                  <Text numberOfLines={1} style={[styles.designTimeFilterText, active && styles.designTimeFilterTextActive]}>
                    {filter}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <DesignLineChart color={color} series={displaySeries} />
        </>
      ) : (
        <View style={styles.designNoDataBox}>
          <Ionicons name="analytics-outline" size={20} color={colors.ink400} />
          <Text style={styles.designNoDataText}>{emptyText}</Text>
        </View>
      )}
    </View>
    );
}

const styles = StyleSheet.create({
  designChartCard: { borderRadius: 16, backgroundColor: colors.white, padding: 16, gap: 10 },
  designChartHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  designChartTitle: { color: colors.ink700, fontSize: 18, fontWeight: "500" },
  designChartDate: { color: colors.ink400, fontSize: 10, fontWeight: "400" },
  designTimeFilterRow: { flexDirection: "row", alignItems: "center", gap: 4, paddingBottom: 8 },
  designTimeFilterChip: { minHeight: 28, borderRadius: 4, backgroundColor: colors.primary100, alignItems: "center", justifyContent: "center", paddingHorizontal: 6, paddingVertical: 4 },
  designTimeFilterChipActive: { backgroundColor: "#808EE7" },
  designTimeFilterText: { color: "#808EE7", fontSize: 12, fontWeight: "600" },
  designTimeFilterTextActive: { color: colors.ink100 },
  designNoDataBox: {
        paddingVertical: 32,
        paddingHorizontal: 16,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.white,
        borderRadius: 16,
        ...softShadow
      },
  designNoDataText: {
        color: colors.ink400,
        fontSize: 14,
        fontWeight: "600",
        textAlign: "center"
      },
});

