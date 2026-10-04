import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { DELIVERY_STAGES, normalizeDeliveryStatus, orderStatusLabel } from "../../../lib/orders";
import { supabase } from "../../../lib/supabase";
import { formatNaira } from "../../../lib/types";
import { colors } from "../../../theme";

type Order = { id: string; status: string; subtotal_kobo: number; discount_kobo: number; total_kobo: number; discount_code: string | null; paystack_reference: string; customer_name: string; customer_email: string; customer_phone: string; delivery_address: string; created_at: string };
type Item = { id: string; title_snapshot: string; platform_snapshot: string; unit_price_kobo: number; quantity: number };
type History = { id: string; status: string; note: string | null; created_at: string };

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null); const [items, setItems] = useState<Item[]>([]); const [history, setHistory] = useState<History[]>([]); const [loading, setLoading] = useState(true); const [refreshing, setRefreshing] = useState(false);
  const loadOrder = useCallback(async (isRefresh = false) => {
    if (!id) return;
    if (isRefresh) setRefreshing(true);
    const [orderResult, itemResult, historyResult] = await Promise.all([
      supabase.from("orders").select("id, status, subtotal_kobo, discount_kobo, total_kobo, discount_code, paystack_reference, customer_name, customer_email, customer_phone, delivery_address, created_at").eq("id", id).maybeSingle(),
      supabase.from("order_items").select("id, title_snapshot, platform_snapshot, unit_price_kobo, quantity").eq("order_id", id).order("created_at"),
      supabase.from("order_status_history").select("id, status, note, created_at").eq("order_id", id).order("created_at"),
    ]);
    setOrder(orderResult.data); setItems(itemResult.data || []); setHistory(historyResult.data || []); setLoading(false); setRefreshing(false);
  }, [id]);
  useEffect(() => {
    if (!id) return;
    void loadOrder();
    const channel = supabase.channel(`mobile-order:${id}`).on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${id}` }, () => { void loadOrder(); }).subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [id, loadOrder]);
  if (loading) return <View style={styles.loader}><ActivityIndicator color={colors.terracotta} /></View>;
  if (!order) return <View style={styles.loader}><Text>Order not found for this account.</Text></View>;
  const current = normalizeDeliveryStatus(order.status); const currentIndex = DELIVERY_STAGES.indexOf(current as (typeof DELIVERY_STAGES)[number]);
  const deliveredAt = history.find((entry) => normalizeDeliveryStatus(entry.status) === "DELIVERED")?.created_at;
  const journeyLabel = order.status === "DELIVERED" ? "Order-to-delivery time" : "Time since order";
  return <SafeAreaView style={styles.safe} edges={["left", "right"]}><ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void loadOrder(true)} tintColor={colors.terracotta} colors={[colors.terracotta]} />}>
    <Text style={styles.eyebrow}>ORDER #{order.id.slice(0, 8)}</Text><Text style={styles.heading}>{orderStatusLabel(order.status)}</Text><Text style={styles.copy}>Placed {new Date(order.created_at).toLocaleString("en-NG")}{"\n"}{journeyLabel}: {formatDuration(order.created_at, deliveredAt)}</Text>
    {order.status === "CANCELLED" ? <Text style={styles.cancelled}>This order was cancelled.</Text> : <View style={styles.timeline}>{DELIVERY_STAGES.map((stage, index) => { const event = history.find((entry) => normalizeDeliveryStatus(entry.status) === stage); const complete = index <= currentIndex; return <View style={styles.stage} key={stage}><View style={[styles.dot, complete && styles.dotComplete]}><Text style={[styles.dotText, complete && styles.dotTextComplete]}>{complete ? "✓" : index + 1}</Text></View><View style={styles.stageCopy}><Text style={[styles.stageTitle, complete && styles.stageTitleComplete]}>{orderStatusLabel(stage)}</Text><Text style={styles.stageTime}>{event ? new Date(event.created_at).toLocaleString("en-NG") : "Pending"}</Text>{index < DELIVERY_STAGES.length - 1 && <View style={[styles.line, complete && styles.lineComplete]} />}</View></View>; })}</View>}
    <Card title="Games">{items.map((item) => <View style={styles.row} key={item.id}><View style={styles.flex}><Text style={styles.itemTitle}>{item.title_snapshot}</Text><Text style={styles.muted}>{item.platform_snapshot} · Qty {item.quantity}</Text></View><Text style={styles.value}>{formatNaira(item.unit_price_kobo * item.quantity)}</Text></View>)}</Card>
    <Card title="Payment summary"><Row label="Subtotal" value={formatNaira(order.subtotal_kobo)} />{order.discount_kobo > 0 && <Row label={`Discount${order.discount_code ? ` · ${order.discount_code}` : ""}`} value={`−${formatNaira(order.discount_kobo)}`} />}<Row label="Total paid" value={formatNaira(order.total_kobo)} strong /><Row label="Paystack reference" value={order.paystack_reference} /></Card>
    <Card title="Delivery details"><Text style={styles.itemTitle}>{order.customer_name}</Text><Text style={styles.muted}>{order.customer_email}{"\n"}{order.customer_phone}</Text><Text style={styles.address}>{order.delivery_address}</Text></Card>
  </ScrollView></SafeAreaView>;
}

function Card({ title, children }: { title: string; children: React.ReactNode }) { return <View style={styles.card}><Text style={styles.cardTitle}>{title}</Text>{children}</View>; }
function Row({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) { return <View style={styles.row}><Text style={styles.muted}>{label}</Text><Text style={strong ? styles.total : styles.value}>{value}</Text></View>; }
function formatDuration(start: string, end?: string) { const totalMinutes = Math.max(0, Math.round((new Date(end || Date.now()).getTime() - new Date(start).getTime()) / 60000)); const days = Math.floor(totalMinutes / 1440); const hours = Math.floor((totalMinutes % 1440) / 60); const minutes = totalMinutes % 60; return [days ? `${days}d` : "", hours ? `${hours}h` : "", !days && minutes ? `${minutes}m` : ""].filter(Boolean).join(" ") || "Just now"; }
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream }, loader: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.cream }, content: { padding: 18, paddingBottom: 40 }, eyebrow: { color: colors.terracotta, fontSize: 11, fontWeight: "900", letterSpacing: 1.3 }, heading: { color: colors.forest, fontSize: 32, fontWeight: "900", marginTop: 8 }, copy: { color: colors.muted, marginTop: 6 }, cancelled: { backgroundColor: "#F8EAE3", color: colors.danger, padding: 14, borderRadius: 12, marginTop: 20 },
  timeline: { marginTop: 24, marginBottom: 8 }, stage: { flexDirection: "row", minHeight: 70 }, dot: { width: 30, height: 30, borderRadius: 15, borderWidth: 2, borderColor: colors.border, backgroundColor: colors.paper, alignItems: "center", justifyContent: "center", zIndex: 2 }, dotComplete: { backgroundColor: colors.forest, borderColor: colors.forest }, dotText: { color: colors.muted, fontSize: 12, fontWeight: "900" }, dotTextComplete: { color: "white" }, stageCopy: { flex: 1, paddingLeft: 12, position: "relative" }, stageTitle: { color: colors.muted, fontSize: 16, fontWeight: "800" }, stageTitleComplete: { color: colors.forest }, stageTime: { color: colors.muted, fontSize: 12, marginTop: 3 }, line: { position: "absolute", width: 2, backgroundColor: colors.border, left: -3, top: 30, bottom: 0 }, lineComplete: { backgroundColor: colors.forest },
  card: { backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.border, borderRadius: 17, padding: 16, marginTop: 14 }, cardTitle: { color: colors.forest, fontSize: 20, fontWeight: "900", marginBottom: 8 }, row: { flexDirection: "row", justifyContent: "space-between", gap: 12, paddingVertical: 9 }, flex: { flex: 1 }, itemTitle: { color: colors.ink, fontWeight: "800" }, muted: { color: colors.muted, lineHeight: 20 }, value: { color: colors.ink, fontWeight: "800", maxWidth: "55%", textAlign: "right" }, total: { color: colors.forest, fontSize: 18, fontWeight: "900" }, address: { color: colors.ink, lineHeight: 21, marginTop: 12 },
});
