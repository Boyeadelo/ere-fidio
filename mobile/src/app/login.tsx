import { makeRedirectUri } from "expo-auth-session";
import * as QueryParams from "expo-auth-session/build/QueryParams";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useState } from "react";
import { ActivityIndicator, Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { supabase } from "../lib/supabase";
import { colors } from "../theme";

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const redirectTo = makeRedirectUri({ path: "auth/callback" });

  const signIn = async () => {
    setLoading(true);
    setError("");
    try {
      const { data, error: startError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo, skipBrowserRedirect: true },
      });
      if (startError) throw startError;
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      if (result.type !== "success") throw new Error("Google sign-in was cancelled.");
      const { params, errorCode } = QueryParams.getQueryParams(result.url);
      if (errorCode) throw new Error(errorCode);
      if (params.code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(params.code);
        if (exchangeError) throw exchangeError;
      } else if (params.access_token && params.refresh_token) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: params.access_token,
          refresh_token: params.refresh_token,
        });
        if (sessionError) throw sessionError;
      } else {
        throw new Error("The sign-in response did not contain a session.");
      }
      router.back();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Google sign-in could not be completed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <Text style={styles.wordmark}>èrè fídíò<Text style={styles.dot}>.</Text></Text>
        <Text style={styles.title}>One cart. Every screen.</Text>
        <Text style={styles.copy}>Sign in with the same Google account you use on the website. Any guest games on this phone will be merged into your saved cart.</Text>
        <Pressable style={styles.button} disabled={loading} onPress={signIn}>
          {loading ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>Continue with Google</Text>}
        </Pressable>
        <Text style={styles.redirect}>Mobile redirect URL:{"\n"}{redirectTo}</Text>
        {!!error && <Text style={styles.error}>{error}</Text>}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream }, content: { padding: 26, paddingTop: 70 }, wordmark: { color: colors.forest, fontSize: 21, fontWeight: "900" }, dot: { color: colors.terracotta },
  title: { color: colors.forest, fontSize: 36, lineHeight: 42, fontWeight: "900", marginTop: 34 }, copy: { color: colors.muted, fontSize: 16, lineHeight: 25, marginTop: 14 },
  button: { backgroundColor: colors.terracotta, borderRadius: 13, padding: 16, alignItems: "center", marginTop: 28 }, buttonText: { color: "white", fontWeight: "900" },
  redirect: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 22 }, error: { color: colors.danger, lineHeight: 21, marginTop: 16 },
});
