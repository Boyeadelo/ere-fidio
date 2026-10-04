import { router } from "expo-router";
import { useState } from "react";
import { Pressable, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text } from "react-native";
import { supabase } from "../../lib/supabase";
import { useCart } from "../../providers/CartProvider";
import { colors } from "../../theme";

export default function AccountScreen() {
  const { user, refresh } = useCart();
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = async () => { setRefreshing(true); try { await supabase.auth.refreshSession(); await refresh(); } finally { setRefreshing(false); } };
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} tintColor={colors.terracotta} colors={[colors.terracotta]} />}>
        <Text style={styles.eyebrow}>YOUR ACCOUNT</Text>
        <Text style={styles.heading}>{user ? "You’re signed in." : "Take your cart everywhere."}</Text>
        <Text style={styles.copy}>{user ? user.email : "Use the same Google account as the website to sync cart changes in real time."}</Text>
        {user ? (
          <Pressable style={styles.secondary} onPress={() => supabase.auth.signOut()}><Text style={styles.secondaryText}>Sign out</Text></Pressable>
        ) : (
          <Pressable style={styles.primary} onPress={() => router.push("/login")}><Text style={styles.primaryText}>Continue with Google</Text></Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  content: { padding: 24, paddingTop: 70 },
  eyebrow: { color: colors.terracotta, fontSize: 11, fontWeight: "900", letterSpacing: 1.5 },
  heading: { color: colors.forest, fontSize: 34, lineHeight: 40, fontWeight: "900", marginTop: 10 },
  copy: { color: colors.muted, fontSize: 16, lineHeight: 24, marginTop: 14 },
  primary: { backgroundColor: colors.terracotta, padding: 16, borderRadius: 13, marginTop: 28, alignItems: "center" },
  primaryText: { color: "white", fontWeight: "900" },
  secondary: { borderWidth: 1, borderColor: colors.forest, padding: 16, borderRadius: 13, marginTop: 28, alignItems: "center" },
  secondaryText: { color: colors.forest, fontWeight: "900" },
});
