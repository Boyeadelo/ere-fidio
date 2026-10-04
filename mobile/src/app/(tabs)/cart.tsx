import { router } from "expo-router";
import { FlatList, Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { useCart } from "../../providers/CartProvider";
import { colors } from "../../theme";
import { formatNaira } from "../../lib/types";

export default function CartScreen() {
  const { cart, count, setQuantity, loading } = useCart();
  const subtotal = cart.reduce((sum, item) => sum + item.price_kobo * item.quantity, 0);
  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={cart}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        ListHeaderComponent={<>
          <Text style={styles.eyebrow}>A GOOD CHOICE</Text>
          <Text style={styles.heading}>Your cart</Text>
          <Text style={styles.subheading}>{count ? `${count} ${count === 1 ? "game" : "games"}. One good decision.` : "Your shelf starts here."}</Text>
        </>}
        renderItem={({ item }) => (
          <View style={styles.line}>
            <View style={styles.copy}>
              <Text style={styles.badge}>{item.platform} · DISC</Text>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.price}>{formatNaira(item.price_kobo * item.quantity)}</Text>
              <Pressable onPress={() => setQuantity(item.id, 0)}><Text style={styles.remove}>Remove</Text></Pressable>
            </View>
            <View style={styles.quantity}>
              <Pressable onPress={() => setQuantity(item.id, item.quantity - 1)}><Text style={styles.quantityButton}>−</Text></Pressable>
              <Text style={styles.quantityValue}>{item.quantity}</Text>
              <Pressable onPress={() => setQuantity(item.id, item.quantity + 1)}><Text style={styles.quantityButton}>+</Text></Pressable>
            </View>
          </View>
        )}
        ListEmptyComponent={!loading ? <View style={styles.empty}><Text style={styles.emptyTitle}>Your cart is empty.</Text><Pressable style={styles.secondary} onPress={() => router.replace("/(tabs)")}><Text style={styles.secondaryText}>Explore games</Text></Pressable></View> : null}
        ListFooterComponent={cart.length ? <View style={styles.summary}>
          <View style={styles.totalRow}><Text style={styles.totalLabel}>Subtotal</Text><Text style={styles.total}>{formatNaira(subtotal)}</Text></View>
          <Text style={styles.note}>Sign in at checkout to merge this cart with games saved on your other devices.</Text>
          <Pressable style={styles.checkout} onPress={() => router.push("/checkout")}><Text style={styles.checkoutText}>Proceed to checkout →</Text></Pressable>
        </View> : null}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  content: { padding: 18, paddingBottom: 36 },
  eyebrow: { color: colors.terracotta, fontSize: 11, fontWeight: "900", letterSpacing: 1.5, marginTop: 10 },
  heading: { color: colors.forest, fontSize: 36, fontWeight: "900", marginTop: 6 },
  subheading: { color: colors.muted, fontSize: 15, marginTop: 6, marginBottom: 20 },
  line: { flexDirection: "row", justifyContent: "space-between", gap: 12, padding: 16, borderRadius: 16, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.border, marginBottom: 12 },
  copy: { flex: 1 },
  badge: { color: colors.forest, fontSize: 10, fontWeight: "900" },
  title: { color: colors.ink, fontSize: 18, fontWeight: "800", marginTop: 6 },
  price: { color: colors.ink, fontSize: 16, fontWeight: "900", marginTop: 8 },
  remove: { color: colors.terracotta, fontWeight: "700", marginTop: 10 },
  quantity: { flexDirection: "row", alignItems: "center", alignSelf: "center", borderWidth: 1, borderColor: colors.border, borderRadius: 12, overflow: "hidden" },
  quantityButton: { color: colors.forest, fontSize: 20, fontWeight: "900", paddingHorizontal: 12, paddingVertical: 8 },
  quantityValue: { minWidth: 30, textAlign: "center", color: colors.ink, fontWeight: "800" },
  summary: { backgroundColor: colors.forest, borderRadius: 18, padding: 18, marginTop: 8 },
  totalRow: { flexDirection: "row", justifyContent: "space-between" },
  totalLabel: { color: "#D8E4DF", fontSize: 15 },
  total: { color: "white", fontSize: 23, fontWeight: "900" },
  note: { color: "#D8E4DF", lineHeight: 20, marginTop: 12 },
  checkout: { backgroundColor: colors.terracotta, padding: 15, borderRadius: 12, marginTop: 16, alignItems: "center" },
  checkoutText: { color: "white", fontWeight: "900" },
  empty: { alignItems: "center", paddingVertical: 60 },
  emptyTitle: { color: colors.forest, fontSize: 22, fontWeight: "800" },
  secondary: { borderWidth: 1, borderColor: colors.forest, borderRadius: 12, padding: 13, marginTop: 18 },
  secondaryText: { color: colors.forest, fontWeight: "800" },
});
