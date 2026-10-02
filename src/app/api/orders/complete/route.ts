import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createCheckoutQuote, type IncomingItem } from "@/lib/quote";

async function verifyPaystack(reference: string) {
  const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
    cache: "no-store",
  });
  const result = await response.json();
  if (!response.ok || !result.status || result.data?.status !== "success") return null;
  return result.data;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const reference = typeof body.reference === "string" ? body.reference : "";
    const customer = body.customer ?? {};
    const items = Array.isArray(body.items) ? body.items as IncomingItem[] : [];
    if (!reference || !customer.name || !customer.email || !customer.phone || !customer.address || !items.length) {
      return NextResponse.json({ error: "Incomplete order details." }, { status: 400 });
    }
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: "Order storage is not configured yet." }, { status: 503 });
    }

    const admin = createAdminClient();
    const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
    const authenticatedUser = token
      ? (await admin.auth.getUser(token)).data.user
      : null;
    const existing = await admin.from("orders").select("id, total_kobo, customer_email").eq("paystack_reference", reference).maybeSingle();
    if (existing.data) return NextResponse.json({ orderId: existing.data.id, reference, totalKobo: existing.data.total_kobo, customerEmail: existing.data.customer_email, emailSent: false, alreadyCompleted: true });

    const payment = await verifyPaystack(reference);
    if (!payment) return NextResponse.json({ error: "Payment could not be verified." }, { status: 400 });

    const quote = await createCheckoutQuote(items, typeof body.discountCode === "string" ? body.discountCode : "");
    if (Number(payment.amount) !== quote.totalKobo) return NextResponse.json({ error: "The verified payment amount does not match this order." }, { status: 409 });

    const { data: order, error: orderError } = await admin.from("orders").insert({
      user_id: authenticatedUser?.id ?? null,
      customer_name: customer.name, customer_email: customer.email, customer_phone: customer.phone,
      delivery_address: customer.address, status: "PAID", subtotal_kobo: quote.subtotalKobo, discount_kobo: quote.discountKobo,
      total_kobo: quote.totalKobo, discount_code: quote.discountCode, paystack_reference: reference,
    }).select("id, total_kobo").single();
    if (orderError || !order) return NextResponse.json({ error: "Payment was verified, but the order could not be saved." }, { status: 500 });

    const { error: itemError } = await admin.from("order_items").insert(quote.orderItems.map((item) => ({ ...item, order_id: order.id })));
    if (itemError) return NextResponse.json({ error: "Order items could not be saved." }, { status: 500 });

    for (const item of items) {
      const product = quote.products.find((entry) => entry.id === item.id)!;
      await admin.from("products").update({ stock: product.stock - item.quantity }).eq("id", item.id);
    }

    let emailSent = false;
    if (process.env.MAILGUN_API_KEY && process.env.MAILGUN_DOMAIN && process.env.MAILGUN_FROM_EMAIL) {
      const form = new URLSearchParams({
        from: process.env.MAILGUN_FROM_EMAIL, to: customer.email,
        subject: `Your èrè fídíò order #${order.id.slice(0, 8)}`,
        text: `Thank you for your order.\n\nOrder reference: ${reference}\nTotal: ₦${(quote.totalKobo / 100).toLocaleString("en-NG")}\n\nWe will contact you about delivery.`,
      });
      const mailResponse = await fetch(`https://api.mailgun.net/v3/${process.env.MAILGUN_DOMAIN}/messages`, { method: "POST", headers: { Authorization: `Basic ${Buffer.from(`api:${process.env.MAILGUN_API_KEY}`).toString("base64")}`, "Content-Type": "application/x-www-form-urlencoded" }, body: form });
      emailSent = mailResponse.ok;
    }

    return NextResponse.json({ orderId: order.id, reference, totalKobo: order.total_kobo, emailSent });
  } catch {
    return NextResponse.json({ error: "Unable to complete the order right now." }, { status: 500 });
  }
}
