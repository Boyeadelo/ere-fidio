import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, SafeAreaView, StyleSheet, Text, TextInput, View } from "react-native";
import { ProductCard } from "../../components/ProductCard";
import { supabase } from "../../lib/supabase";
import type { Platform, Product } from "../../lib/types";
import { colors } from "../../theme";

export default function ShopScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [platform, setPlatform] = useState<Platform | "All">("All");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const loadProducts = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    setError("");
    const { data, error: queryError } = await supabase.from("products")
      .select("id, title, platform, price_kobo, description, stock, image_url, created_at")
      .eq("is_published", true).eq("is_archived", false).order("created_at", { ascending: false });
    if (queryError) setError("We couldn’t load the catalogue. Pull down to try again.");
    setProducts((data as Product[] | null) ?? []);
    setLoading(false); setRefreshing(false);
  }, []);
  useEffect(() => { void loadProducts(); }, [loadProducts]);

  const visible = useMemo(() => products.filter((product) =>
    (platform === "All" || product.platform === platform) &&
    `${product.title} ${product.description}`.toLowerCase().includes(search.trim().toLowerCase()),
  ), [platform, products, search]);

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={visible}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void loadProducts(true)} tintColor={colors.terracotta} colors={[colors.terracotta]} />}
        renderItem={({ item }) => <ProductCard product={item} />}
        ListHeaderComponent={<>
          <Text style={styles.eyebrow}>THE JOY OF THE PHYSICAL GAME</Text>
          <Text style={styles.heading}>A great game.{"\n"}<Text style={styles.accent}>Yours to keep.</Text></Text>
          <Text style={styles.intro}>Sealed PlayStation and Xbox games, with the same cart on web and mobile.</Text>
          <TextInput style={styles.search} placeholder="Search games" placeholderTextColor={colors.muted} value={search} onChangeText={setSearch} />
          <View style={styles.tabs}>{(["All", "PS5", "PS4", "Xbox"] as const).map((item) => (
            <Pressable key={item} onPress={() => setPlatform(item)} style={[styles.tab, platform === item && styles.tabActive]}>
              <Text style={[styles.tabText, platform === item && styles.tabTextActive]}>{item}</Text>
            </Pressable>
          ))}</View>
          <Text style={styles.count}>{visible.length} {visible.length === 1 ? "game" : "games"}</Text>
          {loading && <ActivityIndicator color={colors.terracotta} size="large" />}
          {!!error && <Text style={styles.error}>{error}</Text>}
        </>}
        ListEmptyComponent={!loading && !error ? <Text style={styles.empty}>No games found.</Text> : null}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  content: { padding: 18, paddingBottom: 36 },
  eyebrow: { color: colors.terracotta, fontSize: 11, fontWeight: "900", letterSpacing: 1.5, marginTop: 10 },
  heading: { color: colors.forest, fontSize: 38, lineHeight: 43, fontWeight: "900", marginTop: 10 },
  accent: { color: colors.terracotta },
  intro: { color: colors.muted, fontSize: 16, lineHeight: 24, marginTop: 12, marginBottom: 18 },
  search: { backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.border, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, color: colors.ink },
  tabs: { flexDirection: "row", gap: 8, marginVertical: 14 },
  tab: { paddingHorizontal: 15, paddingVertical: 10, borderRadius: 999, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.paper },
  tabActive: { backgroundColor: colors.forest, borderColor: colors.forest },
  tabText: { color: colors.forest, fontWeight: "800" },
  tabTextActive: { color: "white" },
  count: { color: colors.muted, marginBottom: 12 },
  error: { color: colors.danger, marginVertical: 20 },
  empty: { color: colors.muted, textAlign: "center", padding: 36 },
});
