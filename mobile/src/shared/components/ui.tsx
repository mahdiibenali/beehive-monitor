import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleProp,
    StyleSheet,
    Text,
    TextInput,
    TextStyle,
    View,
    ViewStyle
} from "react-native";
import { colors, radius, softShadow } from "../theme/theme";

export function Screen({
  children,
  scroll = true,
  keyboard = false,
  style
}: {
  children: React.ReactNode;
  scroll?: boolean;
  keyboard?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const body = scroll ? (
    <ScrollView
      contentContainerStyle={[styles.screenContent, style]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.screenContent, style]}>{children}</View>
  );

  if (!keyboard) return <View style={styles.screen}>{body}</View>;
  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {body}
    </KeyboardAvoidingView>
  );
}

export function H1({ children, style }: { children: React.ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text style={[styles.h1, style]}>{children}</Text>;
}

export function H2({ children, style }: { children: React.ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text style={[styles.h2, style]}>{children}</Text>;
}

export function Muted({ children, style }: { children: React.ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text style={[styles.muted, style]}>{children}</Text>;
}

export function Card({
  children,
  style
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Button({
  children,
  onPress,
  variant = "primary",
  disabled = false,
  icon
}: {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  const palette = {
    primary: styles.buttonPrimary,
    secondary: styles.buttonSecondary,
    ghost: styles.buttonGhost,
    danger: styles.buttonDanger
  }[variant];
  const text = variant === "ghost" ? styles.buttonTextGhost : styles.buttonText;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        palette,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed
      ]}
    >
      {icon ? (
        <Ionicons
          name={icon}
          size={18}
          color={variant === "ghost" ? colors.brandPurple : colors.white}
        />
      ) : null}
      <Text style={text}>{children}</Text>
    </Pressable>
  );
}

export function Input({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType = "default",
  multiline = false
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: "default" | "email-address" | "numeric" | "phone-pad";
  multiline?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.ink400}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        multiline={multiline}
        style={[styles.input, multiline && styles.textarea]}
      />
    </View>
  );
}

export function Badge({
  children,
  tone = "purple"
}: {
  children: React.ReactNode;
  tone?: "purple" | "orange" | "green" | "red" | "gray";
}) {
  const toneStyle = {
    purple: styles.badgePurple,
    orange: styles.badgeOrange,
    green: styles.badgeGreen,
    red: styles.badgeRed,
    gray: styles.badgeGray
  }[tone];
  return (
    <View style={[styles.badge, toneStyle]}>
      <Text style={styles.badgeText}>{children}</Text>
    </View>
  );
}

export function Header({
  title,
  subtitle,
  action
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <View style={styles.header}>
      <View style={{ flex: 1 }}>
        <H1>{title}</H1>
        {subtitle ? <Muted>{subtitle}</Muted> : null}
      </View>
      {action}
    </View>
  );
}

export function EmptyState({ text }: { text: string }) {
  return (
    <Card style={styles.empty}>
      <Ionicons name="folder-open-outline" size={26} color={colors.ink400} />
      <Muted style={{ textAlign: "center" }}>{text}</Muted>
    </Card>
  );
}

export function Loading() {
  return (
    <View style={styles.loading}>
      <ActivityIndicator color={colors.brandPurple} />
      <Muted>Chargement...</Muted>
    </View>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <View style={styles.errorBanner}>
      <Ionicons name="alert-circle-outline" size={18} color={colors.danger} />
      <Text style={styles.errorText}>{message}</Text>
    </View>
  );
}

export const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.ink50
  },
  screenContent: {
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 132,
    gap: 20
  },
  h1: {
    color: colors.ink900,
    fontSize: 32,
    lineHeight: 38,
    fontWeight: "600"
  },
  h2: {
    color: colors.ink900,
    fontSize: 24,
    lineHeight: 28,
    fontWeight: "600"
  },
  muted: {
    color: colors.ink500,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "500"
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    padding: 24,
    ...softShadow
  },
  button: {
    minHeight: 56,
    paddingHorizontal: 22,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8
  },
  buttonPrimary: { backgroundColor: colors.brandOrange },
  buttonSecondary: { backgroundColor: colors.brandPurple },
  buttonGhost: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.brandOrange
  },
  buttonDanger: { backgroundColor: colors.danger },
  buttonText: { color: colors.white, fontSize: 16, fontWeight: "600" },
  buttonTextGhost: { color: colors.brandOrange, fontSize: 16, fontWeight: "600" },
  disabled: { opacity: 0.6 },
  pressed: { opacity: 0.82 },
  field: { gap: 8 },
  label: {
    color: colors.ink700,
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 4
  },
  input: {
    minHeight: 52,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: "transparent",
    backgroundColor: colors.white,
    paddingHorizontal: 20,
    color: colors.ink700,
    fontSize: 16,
    ...softShadow
  },
  textarea: {
    minHeight: 112,
    borderRadius: 20,
    paddingTop: 16,
    textAlignVertical: "top"
  },
  badge: {
    alignSelf: "flex-start",
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5
  },
  badgePurple: { backgroundColor: colors.primary100 },
  badgeOrange: { backgroundColor: colors.accent100 },
  badgeGreen: { backgroundColor: "#E8F6EF" },
  badgeRed: { backgroundColor: "#FFEEEC" },
  badgeGray: { backgroundColor: colors.ink100 },
  badgeText: {
    color: colors.ink700,
    fontSize: 12,
    fontWeight: "700"
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 2
  },
  empty: {
    alignItems: "center",
    gap: 8,
    paddingVertical: 28
  },
  loading: {
    padding: 24,
    alignItems: "center",
    gap: 10
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 12,
    padding: 12,
    backgroundColor: "#FFEEEC"
  },
  errorText: {
    flex: 1,
    color: colors.danger,
    fontSize: 13,
    fontWeight: "700"
  }
});
