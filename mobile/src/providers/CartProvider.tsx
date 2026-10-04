import AsyncStorage from "@react-native-async-storage/async-storage";
import type { User } from "@supabase/supabase-js";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Alert } from "react-native";
import { supabase } from "../lib/supabase";
import type { CartItem, Product } from "../lib/types";

const GUEST_CART_KEY = "ere-fidio-mobile-guest-cart";
const cartSelect =
  "quantity, products!inner(id, title, platform, price_kobo, description, stock, image_url, created_at)";

type CartContextValue = {
  cart: CartItem[];
  count: number;
  user: User | null;
  loading: boolean;
  addItem: (product: Product, quantity?: number) => Promise<void>;
  setQuantity: (id: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  refresh: () => Promise<void>;
};

const CartContext = createContext<CartContextValue | null>(null);

async function readGuestCart() {
  try {
    return JSON.parse((await AsyncStorage.getItem(GUEST_CART_KEY)) || "[]") as CartItem[];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const userRef = useRef<User | null>(null);

  const loadCloud = useCallback(async () => {
    if (!userRef.current) return;
    const { data, error } = await supabase
      .from("cart_items")
      .select(cartSelect)
      .eq("user_id", userRef.current.id)
      .order("created_at", { ascending: true });
    if (error) throw error;
    setCart(
      (data ?? []).flatMap((row) => {
        const product = Array.isArray(row.products) ? row.products[0] : row.products;
        return product ? [{ ...product, quantity: row.quantity } as CartItem] : [];
      }),
    );
  }, []);

  const activate = useCallback(async (nextUser: User | null) => {
    userRef.current = nextUser;
    setUser(nextUser);
    try {
      if (!nextUser) {
        setCart(await readGuestCart());
        return;
      }
      const guestCart = await readGuestCart();
      if (guestCart.length) {
        const { data, error } = await supabase.rpc("merge_guest_cart", {
          p_items: guestCart.map(({ id, quantity }) => ({ id, quantity })),
        });
        if (error) throw error;
        await AsyncStorage.removeItem(GUEST_CART_KEY);
        const result = data as { hadDuplicates?: boolean; duplicateTitles?: string[] } | null;
        if (result?.hadDuplicates) {
          Alert.alert(
            "Your carts were combined",
            "A game was in both carts, so its quantities were added together. Please review the quantities before checkout.",
          );
        }
      }
      await loadCloud();
    } finally {
      setLoading(false);
    }
  }, [loadCloud]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => activate(data.session?.user ?? null));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setTimeout(() => activate(session?.user ?? null), 0);
    });
    return () => data.subscription.unsubscribe();
  }, [activate]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`mobile-cart:${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "cart_items", filter: `user_id=eq.${user.id}` },
        loadCloud,
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [loadCloud, user]);

  const saveGuest = useCallback(async (next: CartItem[]) => {
    setCart(next);
    await AsyncStorage.setItem(GUEST_CART_KEY, JSON.stringify(next));
  }, []);

  const addItem = useCallback(async (product: Product, quantity = 1) => {
    if (!userRef.current) {
      const existing = cart.find((item) => item.id === product.id);
      await saveGuest(
        existing
          ? cart.map((item) => item.id === product.id
            ? { ...item, quantity: Math.min(item.quantity + quantity, product.stock) }
            : item)
          : [...cart, { ...product, quantity: Math.min(quantity, product.stock) }],
      );
      return;
    }
    const { error } = await supabase.rpc("set_cart_item", {
      p_product_id: product.id,
      p_quantity: quantity,
      p_mode: "increment",
    });
    if (error) throw error;
    await loadCloud();
  }, [cart, loadCloud, saveGuest]);

  const setQuantity = useCallback(async (id: string, quantity: number) => {
    if (!userRef.current) {
      await saveGuest(quantity <= 0
        ? cart.filter((item) => item.id !== id)
        : cart.map((item) => item.id === id ? { ...item, quantity: Math.min(quantity, item.stock) } : item));
      return;
    }
    const { error } = await supabase.rpc("set_cart_item", {
      p_product_id: id,
      p_quantity: quantity,
      p_mode: "set",
    });
    if (error) throw error;
    await loadCloud();
  }, [cart, loadCloud, saveGuest]);

  const clearCart = useCallback(async () => {
    if (!userRef.current) return saveGuest([]);
    const { error } = await supabase.from("cart_items").delete().eq("user_id", userRef.current.id);
    if (error) throw error;
    await loadCloud();
  }, [loadCloud, saveGuest]);

  const value = useMemo(() => ({
    cart,
    count: cart.reduce((sum, item) => sum + item.quantity, 0),
    user,
    loading,
    addItem,
    setQuantity,
    clearCart,
    refresh: loadCloud,
  }), [addItem, cart, clearCart, loadCloud, loading, setQuantity, user]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
}
