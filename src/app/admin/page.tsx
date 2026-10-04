"use client";

import { useCallback, useEffect, useState } from "react";
import AdminHeader from "@/components/AdminHeader";
import StoreFooter from "@/components/StoreFooter";
import { formatNaira } from "@/lib/store";
import { createClient } from "@/lib/supabase/client";
import { ADMIN_ORDER_STATUSES, orderStatusLabel } from "@/lib/orders";

type Product = {
  id: string; title: string; slug: string; platform: "PS5" | "PS4" | "Xbox";
  description: string; image_url: string | null; price_kobo: number; stock: number;
  is_published: boolean; is_archived: boolean;
};
type OrderItem = { id: string; title_snapshot: string; platform_snapshot: string; unit_price_kobo: number; quantity: number };
type Order = { id: string; customer_name: string; customer_email: string; customer_phone: string; delivery_address: string; status: string; subtotal_kobo: number; discount_kobo: number; total_kobo: number; discount_code: string | null; paystack_reference: string; created_at: string; order_items: OrderItem[] };
type Discount = { id: string; code: string; percentage_off: number; is_active: boolean };
type Overview = { products: Product[]; orders: Order[]; discounts: Discount[] };

const blankProduct: Omit<Product, "id"> = {
  title: "", slug: "", platform: "PS5", description: "", image_url: "",
  price_kobo: 0, stock: 0, is_published: true, is_archived: false,
};

export default function AdminPage() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [active, setActive] = useState<"products" | "orders" | "discounts">("products");
  const [editing, setEditing] = useState<Product | null>(null);
  const [message, setMessage] = useState("Checking administrator access…");
  const [token, setToken] = useState("");

  const load = useCallback(async (accessToken: string) => {
    const response = await fetch("/api/admin/overview", { headers: { Authorization: `Bearer ${accessToken}` } });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Unable to load the dashboard.");
    setOverview(result);
    setMessage("");
  }, []);

  useEffect(() => {
    createClient().auth.getSession().then(async ({ data }) => {
      if (!data.session) { setMessage("Sign in with the administrator Google account to continue."); return; }
      setToken(data.session.access_token);
      try { await load(data.session.access_token); } catch (error) { setMessage(error instanceof Error ? error.message : "Administrator access required."); }
    });
  }, [load]);

  async function saveProduct(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = {
      ...(editing ? { id: editing.id } : {}),
      title: String(form.get("title")), slug: String(form.get("slug")), platform: String(form.get("platform")),
      description: String(form.get("description")), image_url: String(form.get("image_url")),
      price_kobo: Math.round(Number(form.get("price_naira")) * 100), stock: Number(form.get("stock")),
      is_published: form.get("is_published") === "on", is_archived: form.get("is_archived") === "on",
    };
    setMessage("Saving product…");
    const response = await fetch("/api/admin/products", { method: editing ? "PATCH" : "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) });
    const result = await response.json();
    if (!response.ok) { setMessage(result.error || "Product could not be saved."); return; }
    setEditing(null); setMessage("Product saved."); await load(token);
    event.currentTarget.reset();
  }

  async function updateOrder(id: string, status: string) {
    setMessage("Updating order…");
    const response = await fetch("/api/admin/orders", { method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ id, status }) });
    const result = await response.json();
    if (!response.ok) { setMessage(result.error || "Order could not be updated."); return; }
    setMessage("Order updated."); await load(token);
  }

  async function saveDiscount(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    setMessage("Saving discount…");
    const response = await fetch("/api/admin/discounts", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ code: form.get("code"), percentage_off: form.get("percentage_off"), is_active: form.get("is_active") === "on" }) });
    const result = await response.json();
    if (!response.ok) { setMessage(result.error || "Discount could not be saved."); return; }
    setMessage("Discount saved."); await load(token); event.currentTarget.reset();
  }

  const productDefaults = editing || blankProduct;
  return <main className="site-shell">
    <AdminHeader />
    <section className="store-container admin-page">
      <p className="design-eyebrow">STORE OPERATIONS</p><h1>Admin dashboard</h1><p>Manage the demonstration catalogue, discounts and orders.</p>
      {message && <p className="admin-message" role="status">{message}</p>}
      {overview && <>
        <div className="admin-tabs" role="tablist">
          {(["products", "orders", "discounts"] as const).map((tab) => <button key={tab} className={active === tab ? "is-active" : ""} onClick={() => setActive(tab)}>{tab[0].toUpperCase() + tab.slice(1)} <span>{overview[tab].length}</span></button>)}
        </div>
        {active === "products" && <div className="admin-grid">
          <form className="admin-form" onSubmit={saveProduct} key={editing?.id || "new"}>
            <h2>{editing ? "Edit product" : "Add product"}</h2>
            <label>Title<input name="title" required defaultValue={productDefaults.title} /></label>
            <label>Slug<input name="slug" required pattern="[a-z0-9-]+" defaultValue={productDefaults.slug} /></label>
            <div className="field-grid"><label>Platform<select name="platform" defaultValue={productDefaults.platform}><option>PS5</option><option>PS4</option><option>Xbox</option></select></label><label>Stock<input name="stock" type="number" min="0" required defaultValue={productDefaults.stock} /></label></div>
            <label>Price (₦)<input name="price_naira" type="number" min="1" required defaultValue={productDefaults.price_kobo / 100} /></label>
            <label>Product image URL<input name="image_url" type="url" defaultValue={productDefaults.image_url || ""} /></label>
            <label>Description<textarea name="description" rows={4} defaultValue={productDefaults.description} /></label>
            <div className="admin-checks"><label><input name="is_published" type="checkbox" defaultChecked={productDefaults.is_published} /> Published</label><label><input name="is_archived" type="checkbox" defaultChecked={productDefaults.is_archived} /> Archived</label></div>
            <div className="admin-actions"><button className="primary-button" type="submit">Save product</button>{editing && <button className="secondary-button" type="button" onClick={() => setEditing(null)}>Cancel</button>}</div>
          </form>
          <div className="admin-list">{overview.products.map((product) => <article key={product.id}><span><strong>{product.title}</strong><small>{product.platform} · {formatNaira(product.price_kobo)} · {product.stock} in stock</small></span><span className={product.is_published && !product.is_archived ? "status-pill active" : "status-pill"}>{product.is_archived ? "Archived" : product.is_published ? "Live" : "Draft"}</span><button className="secondary-button" onClick={() => setEditing(product)}>Edit</button></article>)}</div>
        </div>}
        {active === "orders" && <div className="admin-list admin-order-list">{overview.orders.map((order) => <article key={order.id} className="admin-order-card">
          <div className="admin-order-main">
            <span><strong>Order #{order.id.slice(0, 8)} · {order.customer_name}</strong><small>{order.customer_email} · {order.customer_phone}</small><small>{new Date(order.created_at).toLocaleString("en-NG")} · {order.paystack_reference}</small></span>
            <strong className="admin-order-total">{formatNaira(order.total_kobo)}</strong>
            <label>Delivery stage<select value={order.status === "SHIPPED" ? "DISPATCHED" : order.status} onChange={(event) => updateOrder(order.id, event.target.value)}>{ADMIN_ORDER_STATUSES.map((status) => <option key={status} value={status}>{orderStatusLabel(status)}</option>)}</select></label>
          </div>
          <details className="admin-order-details"><summary>View order details</summary><div className="admin-order-detail-grid"><p><b>Deliver to</b><span>{order.delivery_address}</span></p><p><b>Games</b><span>{order.order_items.map((item) => `${item.title_snapshot} × ${item.quantity}`).join(", ")}</span></p><p><b>Payment</b><span>Subtotal {formatNaira(order.subtotal_kobo)}{order.discount_code ? ` · ${order.discount_code} −${formatNaira(order.discount_kobo)}` : " · No discount"}</span></p></div></details>
        </article>)}</div>}
        {active === "discounts" && <div className="admin-grid"><form className="admin-form" onSubmit={saveDiscount}><h2>Add or update a code</h2><label>Code<input name="code" required placeholder="WELCOME10" /></label><label>Percentage off<input name="percentage_off" type="number" min="1" max="100" required placeholder="10" /></label><label className="checkbox-label"><input name="is_active" type="checkbox" defaultChecked /> Active</label><button className="primary-button" type="submit">Save discount</button></form><div className="admin-list">{overview.discounts.map((discount) => <article key={discount.id}><span><strong>{discount.code}</strong><small>{discount.percentage_off}% off</small></span><span className={discount.is_active ? "status-pill active" : "status-pill"}>{discount.is_active ? "Active" : "Inactive"}</span></article>)}</div></div>}
      </>}
    </section><StoreFooter />
  </main>;
}
