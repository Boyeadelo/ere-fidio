import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(request: Request) {
  const access = await requireAdmin(request);
  if (!access) return NextResponse.json({ error: "Administrator access required." }, { status: 403 });
  const [products, orders, discounts] = await Promise.all([
    access.admin.from("products").select("*").order("created_at", { ascending: false }),
    access.admin.from("orders").select("id, customer_name, customer_email, status, total_kobo, paystack_reference, created_at").order("created_at", { ascending: false }).limit(50),
    access.admin.from("discount_codes").select("id, code, percentage_off, is_active, expires_at, created_at").order("created_at", { ascending: false }),
  ]);
  const error = products.error || orders.error || discounts.error;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ products: products.data, orders: orders.data, discounts: discounts.data });
}
