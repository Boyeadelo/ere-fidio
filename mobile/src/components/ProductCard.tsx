import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useCart } from "../providers/CartProvider";
import { colors } from "../theme";
import { formatNaira, type Product } from "../lib/types";

export function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  return (
    <View style={styles.card}>
      <Pressable style={styles.art} onPress={() => router.push(`/game/${product.id}`)}>
        {product.image_url ? (
          <Image source={{ uri: product.image_url }} style={styles.image} resizeMode="cover" alt={`${product.title} cover`} />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.platformMark}>{product.platform}</Text>
            <Text style={styles.placeholderText}>PHYSICAL DISC</Text>
          </View>
        )}
      </Pressable>
      <View style={styles.copy}>
        <Text style={styles.badge}>{product.platform} · DISC</Text>
        <Pressable onPress={() => router.push(`/game/${product.id}`)}>
          <Text style={styles.title}>{product.title}</Text>
        </Pressable>
        <Text style={styles.description} numberOfLines={2}>{product.description}</Text>
        <View style={styles.bottom}>
          <View>
            <Text style={styles.price}>{formatNaira(product.price_kobo)}</Text>
            <Text style={product.stock > 0 ? styles.stock : styles.out}>
              {product.stock > 0 ? "● In stock" : "Out of stock"}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            disabled={product.stock < 1 || adding}
            style={({ pressed }) => [styles.button, pressed && styles.pressed, (product.stock < 1 || adding) && styles.disabled]}
            onPress={async () => {
              setAdding(true);
              setAdded(false);
              try {
                await addItem(product);
                setAdded(true);
                setTimeout(() => setAdded(false), 1800);
              } catch {
                Alert.alert("Could not update cart", "Please try again.");
              } finally {
                setAdding(false);
              }
            }}
          >
            {adding ? <ActivityIndicator color="white" size="small" /> : <Text style={styles.buttonText}>{added ? "Added ✓" : "Add +"}</Text>}
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.paper, borderRadius: 20, borderWidth: 1, borderColor: colors.border, overflow: "hidden", marginBottom: 18 },
  art: { height: 190, backgroundColor: "#E9DED0" },
  image: { width: "100%", height: "100%" },
  placeholder: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#DED0C0" },
  platformMark: { fontSize: 34, fontWeight: "900", color: colors.forest },
  placeholderText: { marginTop: 6, fontSize: 11, letterSpacing: 2, color: colors.forestSoft },
  copy: { padding: 18 },
  badge: { alignSelf: "flex-start", color: colors.forest, fontSize: 11, fontWeight: "800", backgroundColor: "#E8EFEA", paddingHorizontal: 9, paddingVertical: 5, borderRadius: 999 },
  title: { color: colors.ink, fontSize: 21, fontWeight: "800", marginTop: 10 },
  description: { color: colors.muted, fontSize: 14, lineHeight: 20, marginTop: 6 },
  bottom: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", marginTop: 18 },
  price: { color: colors.ink, fontSize: 20, fontWeight: "900" },
  stock: { color: colors.success, fontSize: 12, marginTop: 4 },
  out: { color: colors.danger, fontSize: 12, marginTop: 4 },
  button: { backgroundColor: colors.terracotta, paddingHorizontal: 18, paddingVertical: 12, borderRadius: 12 },
  buttonText: { color: "white", fontWeight: "800" },
  pressed: { opacity: .82 },
  disabled: { opacity: .45 },
});
