import { Tabs } from "expo-router";
import { type ColorValue, Text } from "react-native";
import { colors } from "../../theme";
import { useCart } from "../../providers/CartProvider";

const Icon = ({ text, color }: { text: string; color: ColorValue }) => <Text style={{ color, fontSize: 17, fontWeight: "900" }}>{text}</Text>;

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
      <Tabs.Screen name="index" options={{ title: "Shop", headerTitle: "èrè fídíò", tabBarIcon: ({ color }) => <Icon text="◈" color={color} /> }} />
      <Tabs.Screen name="cart" options={{ title: "Cart", tabBarBadge: count || undefined, tabBarIcon: ({ color }) => <Icon text="▣" color={color} /> }} />
      <Tabs.Screen name="account" options={{ title: "Account", tabBarIcon: ({ color }) => <Icon text="●" color={color} /> }} />
    </Tabs>
  );
}
