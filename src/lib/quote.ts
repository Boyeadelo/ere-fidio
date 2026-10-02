import { createAdminClient } from "@/lib/supabase/admin";

export type IncomingItem = { id: string; quantity: number };

export async function createCheckoutQuote(items: IncomingItem[], discountCode = "") {
  if (!Array.isArray(items) || !items.length) throw new Error("Your cart is empty.");
  const cleanItems = items.map((item) => ({ id: String(item.id), quantity: Number(item.quantity) }));
  if (cleanItems.some((item) => !item.id || !Number.isInteger(item.quantity) || item.quantity < 1)) throw new Error("Your cart contains an invalid quantity.");
  const admin = createAdminClient();
  const ids = [...new Set(cleanItems.map((item) => item.id))];
  const { data: products, error } = await admin.from("products").select("id, title, platform, price_kobo, stock").in("id", ids).eq("is_published", true).eq("is_archived", false);
  if (error || !products || products.length !== ids.length) throw new Error("One or more products are no longer available.");
  const byId = new Map(products.map((product) => [product.id, product]));
  let subtotalKobo = 0;
  const orderItems = cleanItems.map((item) => {
    const product = byId.get(item.id);
    if (!product || product.stock < item.quantity) throw new Error("A product is out of stock or has an invalid quantity.");
    subtotalKobo += product.price_kobo * item.quantity;
    return { product_id: product.id, title_snapshot: product.title, platform_snapshot: product.platform, unit_price_kobo: product.price_kobo, quantity: item.quantity };
  });
  const code = discountCode.trim().toUpperCase();
  let discountKobo = 0;
  let appliedCode: string | null = null;
  if (code) {
    const { data: discount } = await admin.from("discount_codes").select("code, percentage_off, is_active, expires_at").eq("code", code).maybeSingle();
    const valid = discount?.is_active && (!discount.expires_at || new Date(discount.expires_at).getTime() > Date.now());
    if (!valid) throw new Error("This code couldn’t be applied. Check the code and try again.");
    discountKobo = Math.round(subtotalKobo * Number(discount.percentage_off) / 100);
    appliedCode = discount.code;
  }
  return { subtotalKobo, discountKobo, totalKobo: Math.max(0, subtotalKobo - discountKobo), discountCode: appliedCode, orderItems, products };
}
