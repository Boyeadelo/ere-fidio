import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { formatNaira } from "../../lib/types";
import { colors } from "../../theme";

export default function OrderSuccessScreen() {
  const params = useLocalSearchParams<{ reference?: string; orderId?: string; totalKobo?: string; emailSent?: string }>();
  return <SafeAreaView style={styles.safe} edges={["left", "right"]}><View style={styles.content}>
    <View style={styles.icon}><Ionicons name="checkmark" size={38} color="white" /></View>
    <Text style={styles.eyebrow}>ORDER CONFIRMED</Text><Text style={styles.heading}>Thank you for your order.</Text>
    <Text style={styles.copy}>Your Paystack test payment was verified and your order has been placed.</Text>
    <View style={styles.card}>
      <Row label="Order" value={params.orderId?.slice(0, 8) || "Confirmed"} />
      <Row label="Reference" value={params.reference || "Verified"} />
      <Row label="Total paid" value={formatNaira(Number(params.totalKobo || 0))} />
      <Row label="Email" value={params.emailSent === "1" ? "Confirmation sent" : "Confirmation pending"} />
    </View>
    <Pressable style={styles.primary} onPress={() => router.replace("/(tabs)")}><Text style={styles.primaryText}>Continue shopping</Text></Pressable>
  </View></SafeAreaView>;
}

function Row({ label, value }: { label: string; value: string }) { return <View style={styles.row}><Text style={styles.label}>{label}</Text><Text style={styles.value}>{value}</Text></View>; }

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream }, content: { flex: 1, padding: 24, justifyContent: "center" }, icon: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.success, alignItems: "center", justifyContent: "center", marginBottom: 24 },
  eyebrow: { color: colors.terracotta, fontSize: 11, fontWeight: "900", letterSpacing: 1.5 }, heading: { color: colors.forest, fontSize: 34, lineHeight: 40, fontWeight: "900", marginTop: 8 }, copy: { color: colors.muted, fontSize: 16, lineHeight: 24, marginTop: 12 },
  card: { backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.border, borderRadius: 18, padding: 16, marginTop: 24 }, row: { flexDirection: "row", justifyContent: "space-between", gap: 16, paddingVertical: 10 }, label: { color: colors.muted }, value: { color: colors.ink, fontWeight: "800", flex: 1, textAlign: "right" },
  primary: { backgroundColor: colors.terracotta, padding: 16, borderRadius: 13, alignItems: "center", marginTop: 22 }, primaryText: { color: "white", fontWeight: "900" },
});
