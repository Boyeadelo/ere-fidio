"use client";

import { useEffect, useState } from "react";
import StoreFooter from "@/components/StoreFooter";
import StoreHeader from "@/components/StoreHeader";
import { orderStatusLabel } from "@/lib/orders";
import { formatNaira } from "@/lib/store";
import { createClient } from "@/lib/supabase/client";

type Order = { id: string; status: string; total_kobo: number; paystack_reference: string; created_at: string };

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [message, setMessage] = useState("Loading your orders…");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { setMessage("Sign in to view orders placed with your account."); return; }
      const { data: rows, error } = await supabase.from("orders").select("id, status, total_kobo, paystack_reference, created_at").order("created_at", { ascending: false });
      if (error) setMessage("We couldn’t load your orders right now.");
      else { setOrders(rows || []); setMessage(rows?.length ? "" : "No account orders yet. Guest orders are confirmed by email."); }
    });
  }, []);

  return <main className="site-shell"><StoreHeader /><section className="store-container account-page">
    <p className="design-eyebrow">YOUR ACCOUNT</p><h1>Your orders</h1>
    <p>Open an order to view its games, payment, delivery details and progress.</p>
    {message && <p>{message}</p>}
    <div className="admin-list order-list">{orders.map((order) =>
      <a className="order-card-link" href={`/account/orders/${order.id}`} key={order.id}>
        <span><strong>Order #{order.id.slice(0, 8)}</strong><small>{new Date(order.created_at).toLocaleDateString("en-NG")} · {order.paystack_reference}</small></span>
        <strong>{formatNaira(order.total_kobo)}</strong>
        <span className="status-pill active">{orderStatusLabel(order.status)}</span>
        <b aria-hidden="true">›</b>
      </a>
    )}</div>
  </section><StoreFooter /></main>;
}
