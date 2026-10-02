export type Platform = "PS5" | "PS4" | "Xbox";

export type Product = {
  id: string;
  title: string;
  platform: Platform;
  price_kobo: number;
  description: string;
  stock: number;
  image_url: string | null;
  created_at?: string;
};

export type CartItem = Product & { quantity: number };

export const CART_KEY = "gamevault-cart";
export const DISCOUNT_KEY = "gamevault-discount-code";
export const CART_EVENT = "ere-fidio-cart-updated";

export const formatNaira = (kobo: number) =>
  `₦${Math.round(kobo / 100).toLocaleString("en-NG")}`;

export const readCart = (): CartItem[] => {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(CART_KEY) || "[]") as CartItem[];
  } catch {
    return [];
  }
};

export const writeCart = (items: CartItem[]) => {
  window.localStorage.setItem(CART_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent(CART_EVENT));
};

export const addProductToCart = (product: Product, quantity = 1) => {
  const current = readCart();
  const existing = current.find((item) => item.id === product.id);
  const next = existing
    ? current.map((item) =>
        item.id === product.id
          ? { ...item, quantity: Math.min(item.quantity + quantity, product.stock) }
          : item,
      )
    : [...current, { ...product, quantity: Math.min(quantity, product.stock) }];
  writeCart(next);
  return next;
};

export const platformName = (platform: Platform | string) => {
  if (platform === "PS5") return "PlayStation 5";
  if (platform === "PS4") return "PlayStation 4";
  return "Xbox";
};
