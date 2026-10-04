import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Image, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { supabase } from "../../lib/supabase";
import { formatNaira, type Product } from "../../lib/types";
import { useCart } from "../../providers/CartProvider";
import { colors } from "../../theme";

export default function GameScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCart();
  useEffect(() => {
    if (!id) return;
    supabase.from("products").select("id, title, platform, price_kobo, description, stock, image_url, created_at").eq("id", id).maybeSingle()
      .then(({ data }) => { setProduct(data as Product | null); setLoading(false); });
  }, [id]);
  if (loading) return <View style={styles.loader}><ActivityIndicator color={colors.terracotta} /></View>;
  if (!product) return <View style={styles.loader}><Text>Game not found.</Text></View>;
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.art}>{product.image_url ? <Image source={{ uri: product.image_url }} style={styles.image} alt={`${product.title} cover`} /> : <Text style={styles.mark}>{product.platform}</Text>}</View>
        <Text style={styles.badge}>{product.platform} · DISC</Text>
        <Text style={styles.title}>{product.title}</Text>
        <Text style={styles.price}>{formatNaira(product.price_kobo)}</Text>
        <Text style={styles.stock}>{product.stock > 0 ? "● In stock" : "Out of stock"}</Text>
        <Text style={styles.description}>{product.description}</Text>
        <View style={styles.purchase}>
          <View style={styles.quantity}>
            <Pressable onPress={() => setQuantity(Math.max(1, quantity - 1))}><Text style={styles.quantityButton}>−</Text></Pressable>
            <Text style={styles.quantityValue}>{quantity}</Text>
            <Pressable onPress={() => setQuantity(Math.min(product.stock || 1, quantity + 1))}><Text style={styles.quantityButton}>+</Text></Pressable>
          </View>
          <Pressable disabled={!product.stock} style={[styles.add, !product.stock && styles.disabled]} onPress={() => addItem(product, quantity)}><Text style={styles.addText}>Add to cart</Text></Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream }, loader: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.cream },
  content: { padding: 18, paddingBottom: 40 }, art: { height: 340, borderRadius: 20, backgroundColor: "#DED0C0", alignItems: "center", justifyContent: "center", overflow: "hidden" },
  image: { width: "100%", height: "100%", resizeMode: "cover" }, mark: { fontSize: 50, fontWeight: "900", color: colors.forest }, badge: { color: colors.forest, fontSize: 11, fontWeight: "900", marginTop: 22 },
  title: { color: colors.ink, fontSize: 34, lineHeight: 39, fontWeight: "900", marginTop: 8 }, price: { color: colors.ink, fontSize: 25, fontWeight: "900", marginTop: 16 }, stock: { color: colors.success, marginTop: 5 },
  description: { color: colors.muted, fontSize: 16, lineHeight: 25, marginTop: 18 }, purchase: { flexDirection: "row", gap: 12, marginTop: 26 },
  quantity: { flexDirection: "row", borderWidth: 1, borderColor: colors.border, borderRadius: 12, alignItems: "center", overflow: "hidden" }, quantityButton: { fontSize: 22, color: colors.forest, paddingHorizontal: 15, paddingVertical: 12 }, quantityValue: { minWidth: 28, textAlign: "center", fontWeight: "900" },
  add: { flex: 1, backgroundColor: colors.terracotta, borderRadius: 12, alignItems: "center", justifyContent: "center" }, addText: { color: "white", fontWeight: "900" }, disabled: { opacity: .45 },
});
