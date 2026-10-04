import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { formatNaira } from "../lib/types";
import { useCart } from "../providers/CartProvider";
import { colors } from "../theme";

export default function CheckoutScreen() {
  const { cart, user } = useCart();
  const total = cart.reduce((sum, item) => sum + item.price_kobo * item.quantity, 0);
  const webUrl = process.env.EXPO_PUBLIC_WEB_URL || "https://ere-fidio.vercel.app";
  if (!user) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.content}>
          <Text style={styles.eyebrow}>KEEP YOUR CART</Text>
          <Text style={styles.heading}>Sign in before checkout.</Text>
          <Text style={styles.copy}>We’ll combine the games on this phone with any games already saved from the website or another device.</Text>
          <Pressable style={styles.primary} onPress={() => router.push("/login")}><Text style={styles.primaryText}>Continue with Google</Text></Pressable>
        </View>
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <Text style={styles.eyebrow}>SECURE CHECKOUT</Text>
        <Text style={styles.heading}>Finish on èrè fídíò web.</Text>
        <Text style={styles.copy}>Your signed-in cart is already synced. We’ll open the secure web checkout for delivery details and Paystack test payment.</Text>
        <View style={styles.summary}><Text style={styles.summaryLabel}>{cart.length} cart lines</Text><Text style={styles.total}>{formatNaira(total)}</Text></View>
        <Pressable style={styles.primary} onPress={() => WebBrowser.openBrowserAsync(`${webUrl}/checkout`)}><Text style={styles.primaryText}>Open secure checkout →</Text></Pressable>
        <Text style={styles.note}>If the browser asks you to sign in, use the same Google account. Your cart will appear automatically.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream }, content: { padding: 24, paddingTop: 56 }, eyebrow: { color: colors.terracotta, fontSize: 11, fontWeight: "900", letterSpacing: 1.5 },
  heading: { color: colors.forest, fontSize: 35, lineHeight: 41, fontWeight: "900", marginTop: 10 }, copy: { color: colors.muted, fontSize: 16, lineHeight: 25, marginTop: 14 },
  summary: { backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 18, marginTop: 24, flexDirection: "row", justifyContent: "space-between" }, summaryLabel: { color: colors.muted }, total: { color: colors.ink, fontSize: 20, fontWeight: "900" },
  primary: { backgroundColor: colors.terracotta, padding: 16, borderRadius: 13, alignItems: "center", marginTop: 22 }, primaryText: { color: "white", fontWeight: "900" }, note: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 16 },
});
