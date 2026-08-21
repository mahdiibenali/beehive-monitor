import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "../../shared/theme/theme";
import { Card, Muted } from "./ui";

export function RowCard({
      title,
      subtitle,
      badge,
      children
    }: {
          title: string;
          subtitle?: string;
          badge?: React.ReactNode;
          children?: React.ReactNode;
        }) {
    return (
    <Card style={{ gap: 10 }}>
      <View style={styles.rowTop}>
        <View style={{ flex: 1 }}>
          <Text style={styles.rowTitle}>{title}</Text>
          {subtitle ? <Muted>{subtitle}</Muted> : null}
        </View>
        {badge}
      </View>
      {children}
    </Card>
    );
}

const styles = StyleSheet.create({
  rowTop: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 10
      },
  rowTitle: {
        color: colors.ink700,
        fontSize: 16,
        fontWeight: "700"
      },
});

