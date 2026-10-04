import * as AuthSession from "expo-auth-session";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { formatNaira } from "../../lib/types";
import { supabase } from "../../lib/supabase";
import { useCart } from "../../providers/CartProvider";
import { colors } from "../../theme";

type Quote = { subtotalKobo: number; discountKobo: number; totalKobo: number; discountCode: string | null };
const webUrl = process.env.EXPO_PUBLIC_WEB_URL || "https://ere-fidio.vercel.app";

export default function CheckoutScreen() {
  const { cart, user, clearCart } = useCart();
  const [name, setName] = useState(user?.user_metadata?.full_name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [discountCode, setDiscountCode] = useState("");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const items = useMemo(() => cart.map(({ id, quantity }) => ({ id, quantity })), [cart]);
  const fallbackTotal = cart.reduce((sum, item) => sum + item.price_kobo * item.quantity, 0);

  useEffect(() => {
    setQuote(null);
    if (!cart.length) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      fetch(`${webUrl}/api/checkout/quote`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items, discountCode }), signal: controller.signal,
      }).then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error);
        setQuote(result); setStatus("");
      }).catch((error: Error) => {
        if (error.name !== "AbortError") { setQuote(null); setStatus(error.message); }
      });
    }, 250);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [discountCode, items, cart.length]);

  const pay = async () => {
    if (!user) { router.push("/login"); return; }
    if (!name.trim() || !email.trim() || !phone.trim() || !address.trim()) { setStatus("Complete all customer and delivery fields."); return; }
    if (!cart.length) { setStatus("Your cart is empty."); return; }
    setLoading(true); setStatus("Opening secure Paystack test checkout…");
    try {
      const callbackUrl = AuthSession.makeRedirectUri({ scheme: "erefidio", path: "payment/callback" });
      const initializeResponse = await fetch(`${webUrl}/api/paystack/initialize`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), items, discountCode, callbackUrl }),
      });
      const initialized = await initializeResponse.json();
      if (!initializeResponse.ok) throw new Error(initialized.error || "Could not start Paystack.");
      const payment = await WebBrowser.openAuthSessionAsync(initialized.authorizationUrl, callbackUrl);
      if (payment.type !== "success" || !payment.url) { setStatus("Payment was cancelled. Your cart is unchanged."); return; }
      const returnedUrl = new URL(payment.url);
      const reference = returnedUrl.searchParams.get("reference") || returnedUrl.searchParams.get("trxref");
      if (!reference) throw new Error("Paystack did not return a payment reference.");
      setStatus("Confirming payment and placing your order…");
      const { data } = await supabase.auth.getSession();
      const completeResponse = await fetch(`${webUrl}/api/orders/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(data.session?.access_token ? { Authorization: `Bearer ${data.session.access_token}` } : {}) },
        body: JSON.stringify({ reference, customer: { name: name.trim(), email: email.trim(), phone: phone.trim(), address: address.trim() }, items, discountCode }),
      });
      const completed = await completeResponse.json();
      if (!completeResponse.ok) throw new Error(completed.error || "Could not complete the order.");
      await clearCart();
      router.replace({ pathname: "/order-success", params: { reference, orderId: completed.orderId, totalKobo: String(completed.totalKobo), emailSent: completed.emailSent ? "1" : "0" } });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Checkout could not continue.";
      setStatus(message); Alert.alert("Checkout could not continue", message);
    } finally { setLoading(false); }
  };

  if (!user) return (
    <SafeAreaView style={styles.safe} edges={["left", "right"]}><View style={styles.centered}>
      <Text style={styles.eyebrow}>KEEP YOUR CART</Text><Text style={styles.heading}>Sign in before checkout.</Text>
      <Text style={styles.copy}>We’ll combine this cart with games saved on your other devices.</Text>
      <Pressable style={styles.primary} onPress={() => router.push("/login")}><Text style={styles.primaryText}>Continue with Google</Text></Pressable>
    </View></SafeAreaView>
  );

  return (
    <SafeAreaView style={styles.safe} edges={["left", "right"]}><KeyboardAvoidingView style={styles.safe} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.eyebrow}>THE FINAL STEP</Text><Text style={styles.heading}>Make it yours.</Text>
        <Text style={styles.copy}>Add your delivery details, then complete a Paystack test payment.</Text>
        <View style={styles.panel}><Text style={styles.sectionTitle}>Customer details</Text>
          <Field label="Full name" value={name} onChangeText={setName} autoComplete="name" />
          <Field label="Email address" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
          <Field label="Phone number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" autoComplete="tel" />
          <Field label="Delivery address" value={address} onChangeText={setAddress} multiline autoComplete="street-address" />
        </View>
        <View style={styles.panel}><Text style={styles.sectionTitle}>Order summary</Text>
          {cart.map((item) => <View key={item.id} style={styles.row}><Text style={styles.itemText}>{item.title} × {item.quantity}</Text><Text style={styles.itemTotal}>{formatNaira(item.price_kobo * item.quantity)}</Text></View>)}
          <Field label="Discount code (optional)" value={discountCode} onChangeText={(value) => setDiscountCode(value.toUpperCase())} autoCapitalize="characters" />
          {!!quote?.discountKobo && <View style={styles.row}><Text style={styles.discount}>Discount ({formatDiscountPercent(quote)}%)</Text><Text style={styles.discount}>−{formatNaira(quote.discountKobo)}</Text></View>}
          <View style={[styles.row, styles.totalRow]}><Text style={styles.totalLabel}>Total</Text><Text style={styles.total}>{formatNaira(quote?.totalKobo ?? fallbackTotal)}</Text></View>
        </View>
        {!!status && <Text style={styles.status}>{status}</Text>}
        <Pressable disabled={loading || !cart.length} style={[styles.primary, (loading || !cart.length) && styles.disabled]} onPress={pay}>
          {loading ? <ActivityIndicator color="white" /> : <Text style={styles.primaryText}>Pay securely with Paystack →</Text>}
        </Pressable>
        <Text style={styles.note}>Test mode only. No real card will be charged.</Text>
      </ScrollView>
    </KeyboardAvoidingView></SafeAreaView>
  );
}

type FieldProps = React.ComponentProps<typeof TextInput> & { label: string };
function Field({ label, ...props }: FieldProps) {
  return <View style={styles.fieldWrap}><Text style={styles.label}>{label}</Text><TextInput placeholderTextColor="#897F73" style={[styles.input, props.multiline && styles.multiline]} {...props} /></View>;
}

function formatDiscountPercent(quote: Quote) {
  const percentage = (quote.discountKobo / quote.subtotalKobo) * 100;
  return Number.isInteger(percentage) ? percentage.toFixed(0) : percentage.toFixed(1);
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream }, content: { padding: 18, paddingBottom: 38 }, centered: { padding: 24, paddingTop: 72 },
  eyebrow: { color: colors.terracotta, fontSize: 11, fontWeight: "900", letterSpacing: 1.5 }, heading: { color: colors.forest, fontSize: 35, lineHeight: 41, fontWeight: "900", marginTop: 8 }, copy: { color: colors.muted, fontSize: 15, lineHeight: 23, marginTop: 10 },
  panel: { backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.border, borderRadius: 18, padding: 16, marginTop: 20 }, sectionTitle: { color: colors.forest, fontSize: 21, fontWeight: "900", marginBottom: 4 },
  fieldWrap: { marginTop: 14 }, label: { color: colors.ink, fontSize: 13, fontWeight: "800", marginBottom: 7 }, input: { backgroundColor: "white", color: colors.ink, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 13, paddingVertical: 12, fontSize: 16 }, multiline: { minHeight: 84, textAlignVertical: "top" },
  row: { flexDirection: "row", justifyContent: "space-between", gap: 14, paddingVertical: 10 }, itemText: { color: colors.ink, flex: 1 }, itemTotal: { color: colors.ink, fontWeight: "800" }, discount: { color: colors.success, fontWeight: "800" }, totalRow: { borderTopWidth: 1, borderTopColor: colors.border, marginTop: 5, paddingTop: 15 }, totalLabel: { color: colors.forest, fontSize: 17, fontWeight: "900" }, total: { color: colors.forest, fontSize: 22, fontWeight: "900" },
  primary: { backgroundColor: colors.terracotta, minHeight: 52, padding: 15, borderRadius: 13, alignItems: "center", justifyContent: "center", marginTop: 20 }, primaryText: { color: "white", fontWeight: "900" }, disabled: { opacity: 0.55 }, status: { color: colors.terracotta, fontWeight: "700", lineHeight: 20, marginTop: 16 }, note: { color: colors.muted, fontSize: 12, textAlign: "center", marginTop: 12 },
});
