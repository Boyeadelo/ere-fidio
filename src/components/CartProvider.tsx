"use client";

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
import { createClient } from "@/lib/supabase/client";
import {
  CART_EVENT,
  CART_KEY,
  readCart,
  type CartItem,
  type Product,
  writeCart,
} from "@/lib/store";

type MergeNotice = { message: string; duplicateTitles: string[] } | null;
type CartContextValue = {
  cart: CartItem[];
  cartCount: number;
  user: User | null;
  loading: boolean;
  mergeNotice: MergeNotice;
  dismissMergeNotice: () => void;
  addItem: (product: Product, quantity?: number) => Promise<void>;
  setQuantity: (productId: string, quantity: number) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
};

const CartContext = createContext<CartContextValue | null>(null);

const cartSelect =
  "quantity, products!inner(id, title, platform, price_kobo, description, stock, image_url, created_at)";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => createClient(), []);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [mergeNotice, setMergeNotice] = useState<MergeNotice>(null);
  const userRef = useRef<User | null>(null);

  const loadCloudCart = useCallback(async () => {
    if (!userRef.current) return;
    const { data, error } = await supabase
      .from("cart_items")
      .select(cartSelect)
      .eq("user_id", userRef.current.id)
      .order("created_at", { ascending: true });
    if (error) throw error;
    const next = (data ?? []).flatMap((row) => {
      const product = Array.isArray(row.products) ? row.products[0] : row.products;
      return product ? [{ ...product, quantity: row.quantity } as CartItem] : [];
    });
    setCart(next);
  }, [supabase]);

  const mergeGuestIntoCloud = useCallback(
    async (signedInUser: User) => {
      const guestCart = readCart();
      if (!guestCart.length) return;
      const { data, error } = await supabase.rpc("merge_guest_cart", {
        p_items: guestCart.map(({ id, quantity }) => ({ id, quantity })),
      });
      if (error) throw error;
      window.localStorage.removeItem(CART_KEY);
      window.dispatchEvent(new CustomEvent(CART_EVENT));
      const result = data as {
        hadDuplicates?: boolean;
        duplicateTitles?: string[];
      } | null;
      if (result?.hadDuplicates) {
        const titles = result.duplicateTitles ?? [];
        setMergeNotice({
          duplicateTitles: titles,
          message:
            titles.length === 1
              ? `${titles[0]} was already in your saved cart, so we added the quantities together. Please review the quantity before checkout.`
              : "Some games were already in your saved cart, so we added their quantities together. Please review the quantities before checkout.",
        });
      }
      userRef.current = signedInUser;
    },
    [supabase],
  );

  const activateUser = useCallback(
    async (nextUser: User | null) => {
      userRef.current = nextUser;
      setUser(nextUser);
      if (!nextUser) {
        setCart(readCart());
        setLoading(false);
        return;
      }
      try {
        await mergeGuestIntoCloud(nextUser);
        await loadCloudCart();
      } finally {
        setLoading(false);
      }
    },
    [loadCloudCart, mergeGuestIntoCloud],
  );

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => activateUser(data.session?.user ?? null));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      window.setTimeout(() => activateUser(session?.user ?? null), 0);
    });
    return () => data.subscription.unsubscribe();
  }, [activateUser, supabase]);

  useEffect(() => {
    if (!user) {
      const syncGuest = () => setCart(readCart());
      window.addEventListener("storage", syncGuest);
      window.addEventListener(CART_EVENT, syncGuest);
      return () => {
        window.removeEventListener("storage", syncGuest);
        window.removeEventListener(CART_EVENT, syncGuest);
      };
    }
    const channel = supabase
      .channel(`cart:${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "cart_items", filter: `user_id=eq.${user.id}` },
        () => loadCloudCart(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadCloudCart, supabase, user]);

  const saveGuest = useCallback((next: CartItem[]) => {
    setCart(next);
    writeCart(next);
  }, []);

  const addItem = useCallback(
    async (product: Product, quantity = 1) => {
      if (!userRef.current) {
        const current = readCart();
        const existing = current.find((item) => item.id === product.id);
        saveGuest(
          existing
            ? current.map((item) =>
                item.id === product.id
                  ? { ...item, quantity: Math.min(item.quantity + quantity, product.stock) }
                  : item,
              )
            : [...current, { ...product, quantity: Math.min(quantity, product.stock) }],
        );
        return;
      }
      const { error } = await supabase.rpc("set_cart_item", {
        p_product_id: product.id,
        p_quantity: quantity,
        p_mode: "increment",
      });
      if (error) throw error;
      await loadCloudCart();
    },
    [loadCloudCart, saveGuest, supabase],
  );

  const setQuantity = useCallback(
    async (productId: string, quantity: number) => {
      if (!userRef.current) {
        const current = readCart();
        saveGuest(
          quantity <= 0
            ? current.filter((item) => item.id !== productId)
            : current.map((item) =>
                item.id === productId
                  ? { ...item, quantity: Math.min(quantity, item.stock) }
                  : item,
              ),
        );
        return;
      }
      const { error } = await supabase.rpc("set_cart_item", {
        p_product_id: productId,
        p_quantity: quantity,
        p_mode: "set",
      });
      if (error) throw error;
      await loadCloudCart();
    },
    [loadCloudCart, saveGuest, supabase],
  );

  const clearCart = useCallback(async () => {
    if (!userRef.current) {
      saveGuest([]);
      return;
    }
    const { error } = await supabase
      .from("cart_items")
      .delete()
      .eq("user_id", userRef.current.id);
    if (error) throw error;
    await loadCloudCart();
  }, [loadCloudCart, saveGuest, supabase]);

  const value = useMemo<CartContextValue>(
    () => ({
      cart,
      cartCount: cart.reduce((sum, item) => sum + item.quantity, 0),
      user,
      loading,
      mergeNotice,
      dismissMergeNotice: () => setMergeNotice(null),
      addItem,
      setQuantity,
      removeItem: (productId) => setQuantity(productId, 0),
      clearCart,
      refreshCart: loadCloudCart,
    }),
    [addItem, cart, clearCart, loadCloudCart, loading, mergeNotice, setQuantity, user],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
}
