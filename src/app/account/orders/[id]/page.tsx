"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import StoreFooter from "@/components/StoreFooter";
import StoreHeader from "@/components/StoreHeader";
import { DELIVERY_STAGES, normalizeDeliveryStatus, orderStatusLabel } from "@/lib/orders";
import { formatNaira } from "@/lib/store";
import { createClient } from "@/lib/supabase/client";

type Order = {
  id: string; status: string; subtotal_kobo: number; discount_kobo: number; total_kobo: number;
  discount_code: string | null; paystack_reference: string; customer_name: string; customer_email: string;
  customer_phone: string; delivery_address: string; created_at: string; updated_at: string;
};
type Item = { id: string; title_snapshot: string; platform_snapshot: string; unit_price_kobo: number; quantity: number };
type History = { id: string; status: string; note: string | null; created_at: string };

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [history, setHistory] = useState<History[]>([]);
  const [message, setMessage] = useState("Loading order…");

  useEffect(() => {
    const supabase = createClient();
    Promise.all([
      supabase.from("orders").select("id, status, subtotal_kobo, discount_kobo, total_kobo, discount_code, paystack_reference, customer_name, customer_email, customer_phone, delivery_address, created_at, updated_at").eq("id", id).maybeSingle(),
      supabase.from("order_items").select("id, title_snapshot, platform_snapshot, unit_price_kobo, quantity").eq("order_id", id).order("created_at"),
      supabase.from("order_status_history").select("id, status, note, created_at").eq("order_id", id).order("created_at"),
    ]).then(([orderResult, itemResult, historyResult]) => {
      if (orderResult.error || !orderResult.data) { setMessage("This order could not be found for your account."); return; }
      setOrder(orderResult.data); setItems(itemResult.data || []); setHistory(historyResult.data || []); setMessage("");
    });
  }, [id]);

  if (!order) return <main className="site-shell"><StoreHeader /><section className="store-container account-page"><p>{message}</p></section><StoreFooter /></main>;
  const current = normalizeDeliveryStatus(order.status);
  const currentIndex = DELIVERY_STAGES.indexOf(current as (typeof DELIVERY_STAGES)[number]);
  const deliveredAt = history.find((entry) => normalizeDeliveryStatus(entry.status) === "DELIVERED")?.created_at;
  const journeyLabel = order.status === "DELIVERED" ? "Order-to-delivery time" : "Time since order";

  return <main className="site-shell"><StoreHeader /><section className="store-container account-page order-detail-page">
    <a className="order-back-link" href="/account/orders">← Back to orders</a>
    <header className="order-detail-heading"><span><p className="design-eyebrow">ORDER #{order.id.slice(0, 8)}</p><h1>{orderStatusLabel(order.status)}</h1><p>Placed {new Date(order.created_at).toLocaleString("en-NG")}</p></span><span className="order-total-block"><small>Total paid</small><strong>{formatNaira(order.total_kobo)}</strong></span></header>
    <section className="order-progress-panel"><div className="order-progress-intro"><span><small>Delivery progress</small><strong>{orderStatusLabel(order.status)}</strong></span><span><small>{journeyLabel}</small><strong>{formatDuration(order.created_at, deliveredAt)}</strong></span></div>
    {order.status === "CANCELLED" ? <p className="admin-message">This order was cancelled.</p> : <div className="delivery-timeline">{DELIVERY_STAGES.map((stage, index) => {
      const event = history.find((entry) => normalizeDeliveryStatus(entry.status) === stage);
      const complete = index <= currentIndex;
      return <div className={complete ? "timeline-step is-complete" : "timeline-step"} key={stage}><i>{complete ? "✓" : index + 1}</i><span><strong>{orderStatusLabel(stage)}</strong><small>{event ? new Date(event.created_at).toLocaleString("en-NG") : "Pending"}</small>{event?.note && <small>{event.note}</small>}</span></div>;
    })}</div>}</section>
    <div className="order-detail-grid"><section className="order-detail-card"><h2>Games</h2>{items.map((item) => <div className="order-line" key={item.id}><span><strong>{item.title_snapshot}</strong><small>{item.platform_snapshot} · Qty {item.quantity}</small></span><b>{formatNaira(item.unit_price_kobo * item.quantity)}</b></div>)}</section>
      <section className="order-detail-card"><h2>Payment summary</h2><Summary label="Subtotal" value={formatNaira(order.subtotal_kobo)} />{order.discount_kobo > 0 && <Summary label={`Discount${order.discount_code ? ` · ${order.discount_code}` : ""}`} value={`−${formatNaira(order.discount_kobo)}`} />}<Summary label="Total paid" value={formatNaira(order.total_kobo)} strong /><Summary label="Paystack reference" value={order.paystack_reference} /></section>
      <section className="order-detail-card"><h2>Delivery details</h2><p><strong>{order.customer_name}</strong><br />{order.customer_email}<br />{order.customer_phone}</p><p>{order.delivery_address}</p></section>
    </div>
  </section><StoreFooter /></main>;
}

function Summary({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return <div className="order-summary-line"><span>{label}</span>{strong ? <strong>{value}</strong> : <b>{value}</b>}</div>;
}

function formatDuration(start: string, end?: string) {
  const totalMinutes = Math.max(0, Math.round((new Date(end || Date.now()).getTime() - new Date(start).getTime()) / 60000));
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  return [days ? `${days}d` : "", hours ? `${hours}h` : "", !days && minutes ? `${minutes}m` : ""].filter(Boolean).join(" ") || "Just now";
}
