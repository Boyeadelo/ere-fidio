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

export const formatNaira = (kobo: number) =>
  `₦${Math.round(kobo / 100).toLocaleString("en-NG")}`;
