import { Ionicons } from "@expo/vector-icons";
import { router, Tabs } from "expo-router";
import { Pressable } from "react-native";
import { colors } from "../../theme";
import { useCart } from "../../providers/CartProvider";

export default function TabsLayout() {
  const { count } = useCart();
  return (
    <Tabs screenOptions={{
      headerStyle: { backgroundColor: colors.cream },
      headerTintColor: colors.forest,
      headerTitleStyle: { fontWeight: "900" },
      tabBarActiveTintColor: colors.terracotta,
      tabBarInactiveTintColor: colors.muted,
      tabBarStyle: { backgroundColor: colors.paper, borderTopColor: colors.border, height: 68, paddingBottom: 8 },
    }}>
      <Tabs.Screen name="index" options={{ title: "Shop", headerTitle: "èrè fídíò", tabBarIcon: ({ color, size }) => <Ionicons name="game-controller-outline" color={color} size={size} /> }} />
      <Tabs.Screen name="cart" options={{ title: "Cart", tabBarBadge: count || undefined, tabBarIcon: ({ color, size }) => <Ionicons name="cart-outline" color={color} size={size} /> }} />
      <Tabs.Screen name="orders" options={{ title: "Orders", tabBarIcon: ({ color, size }) => <Ionicons name="receipt-outline" color={color} size={size} /> }} />
      <Tabs.Screen name="account" options={{ title: "Account", tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" color={color} size={size} /> }} />
      <Tabs.Screen name="game/[id]" options={{
        href: null,
        title: "Game details",
        headerLeft: () => (
          <Pressable accessibilityLabel="Back to shop" onPress={() => router.back()} style={{ paddingHorizontal: 16 }}>
            <Ionicons name="arrow-back" color={colors.forest} size={24} />
          </Pressable>
        ),
      }} />
      <Tabs.Screen name="checkout" options={{
        href: null,
        title: "Secure checkout",
        headerLeft: () => (
          <Pressable accessibilityLabel="Back to cart" onPress={() => router.back()} style={{ paddingHorizontal: 16 }}>
            <Ionicons name="arrow-back" color={colors.forest} size={24} />
          </Pressable>
        ),
      }} />
      <Tabs.Screen name="order-success" options={{ href: null, title: "Order confirmed", headerLeft: () => null }} />
      <Tabs.Screen name="order/[id]" options={{
        href: null,
        title: "Order details",
        headerLeft: () => <Pressable accessibilityLabel="Back to orders" onPress={() => router.back()} style={{ paddingHorizontal: 16 }}><Ionicons name="arrow-back" color={colors.forest} size={24} /></Pressable>,
      }} />
    </Tabs>
  );
}
