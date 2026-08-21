import React, { useState } from "react";
import { StyleSheet, View, Image } from "react-native";
import { useAuth } from "src/core/providers/AuthContext";
import { Button, ErrorBanner, H1, Input, Screen } from "src/shared/components/ui";
import { messageFromError } from "src/shared/utils/helpers";
import { shadow } from "../../shared/theme/theme";

export function LoginScreen() {
    const { login } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function submit() {
        setLoading(true);
        setError(null);
        try {
          await login(email.trim(), password);
        } catch (err) {
          setError(messageFromError(err));
        } finally {
          setLoading(false);
        }
    }

    return (
    <Screen keyboard style={styles.loginScreen}>
      {/* Background Image */}
      <Image
        source={require("../../../assets/images/bg-login.png")}
        style={StyleSheet.absoluteFillObject}
        resizeMode="cover"
      />

      <View style={styles.loginCard}>
        <H1 style={{ textAlign: "center", color: "#4A527E", marginBottom: 12 }}>Bienvenue !</H1>
        {error ? <ErrorBanner message={error} /> : null}
        <Input
          label="Adresse Email"
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Input
          label="Mot de passe"
          value={password}
          onChangeText={setPassword}
          placeholder="Mot de passe"
          secureTextEntry
        />
        <Button onPress={submit} disabled={loading} style={{ marginTop: 12, backgroundColor: "#FF870A", borderRadius: 30, height: 56 }}>
          {loading ? "Connexion..." : "Se connecter"}
        </Button>
      </View>
    </Screen>
    );
}

const styles = StyleSheet.create({
  loginScreen: {
        flexGrow: 1,
        justifyContent: "center",
        backgroundColor: "#FFE7CD",
        padding: 24,
      },
  loginCard: {
        backgroundColor: "#F2F3F5",
        borderRadius: 26,
        padding: 32,
        gap: 16,
        ...shadow
      },
});

