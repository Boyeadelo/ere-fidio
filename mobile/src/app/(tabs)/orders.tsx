import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../lib/supabase";
import { formatNaira } from "../../lib/types";
import { orderStatusLabel } from "../../lib/orders";
import { useCart } from "../../providers/CartProvider";
import { colors } from "../../theme";

type Order = { id: string; status: string; total_kobo: number; created_at: string; paystack_reference: string };

export default function OrdersScreen() {
  const { user } = useCart();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState("");

  const loadOrders = useCallback(async (isRefresh = false) => {
    if (!user) return;
    if (isRefresh) setRefreshing(true);
    const { data, error } = await supabase
      .from("orders")
      .select("id, status, total_kobo, created_at, paystack_reference")
      .order("created_at", { ascending: false });
    setOrders(data || []);
    setMessage(error ? "We couldn’t load your orders." : data?.length ? "" : "No orders yet.");
    setLoading(false);
    setRefreshing(false);
  }, [user]);

  useEffect(() => {
    if (!user) {
      setOrders([]);
      setLoading(false);
      setMessage("Sign in to view orders placed with your account.");
      return;
    }

    setLoading(true);
    void loadOrders();
    const channel = supabase
      .channel(`mobile-orders:${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "orders", filter: `user_id=eq.${user.id}` }, () => { void loadOrders(); })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [loadOrders, user]);

  return <SafeAreaView style={styles.safe} edges={["left", "right"]}><FlatList data={orders} keyExtractor={(item) => item.id} contentContainerStyle={styles.content}
    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void loadOrders(true)} tintColor={colors.terracotta} colors={[colors.terracotta]} />}
    ListHeaderComponent={<><Text style={styles.eyebrow}>YOUR ACCOUNT</Text><Text style={styles.heading}>Your orders</Text><Text style={styles.copy}>Track delivery progress and open an order for full details.</Text>{loading && <ActivityIndicator color={colors.terracotta} />}{message && <Text style={styles.message}>{message}</Text>}{!user && <Pressable style={styles.primary} onPress={() => router.push("/login")}><Text style={styles.primaryText}>Continue with Google</Text></Pressable>}</>}
    renderItem={({ item }) => <Pressable style={styles.card} onPress={() => router.push(`/order/${item.id}`)}><View><Text style={styles.title}>Order #{item.id.slice(0, 8)}</Text><Text style={styles.meta}>{new Date(item.created_at).toLocaleDateString("en-NG")} · {orderStatusLabel(item.status)}</Text></View><View style={styles.right}><Text style={styles.total}>{formatNaira(item.total_kobo)}</Text><Text style={styles.arrow}>›</Text></View></Pressable>}
  /></SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream }, content: { padding: 18, paddingBottom: 36 }, eyebrow: { color: colors.terracotta, fontSize: 11, fontWeight: "900", letterSpacing: 1.5, marginTop: 10 }, heading: { color: colors.forest, fontSize: 36, fontWeight: "900", marginTop: 6 }, copy: { color: colors.muted, lineHeight: 22, marginTop: 7, marginBottom: 18 }, message: { color: colors.muted, marginVertical: 20 },
  card: { backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 17, marginBottom: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }, title: { color: colors.ink, fontSize: 17, fontWeight: "900" }, meta: { color: colors.muted, marginTop: 5 }, right: { alignItems: "flex-end" }, total: { color: colors.forest, fontWeight: "900" }, arrow: { color: colors.terracotta, fontSize: 25, marginTop: 3 }, primary: { backgroundColor: colors.terracotta, padding: 15, borderRadius: 12, alignItems: "center" }, primaryText: { color: "white", fontWeight: "900" },
});
