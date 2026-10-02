"use client";

import { useEffect, useState } from "react";
import { LockIcon, ShieldIcon } from "@/components/Icons";
import ProductCover from "@/components/ProductCover";
import {
  CART_KEY,
  DISCOUNT_KEY,
  formatNaira,
  readCart,
  type CartItem,
} from "@/lib/store";
import { createClient } from "@/lib/supabase/client";

type Quote = {
  subtotalKobo: number;
  discountKobo: number;
  totalKobo: number;
  discountCode: string | null;
};

export default function CheckoutPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const current = readCart();
    setCart(current);
    if (current.length)
      fetch("/api/checkout/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: current.map(({ id, quantity }) => ({ id, quantity })),
          discountCode: window.localStorage.getItem(DISCOUNT_KEY) || "",
        }),
      })
        .then(async (response) => {
          const result = await response.json();
          if (!response.ok) throw new Error(result.error);
          setQuote(result);
        })
        .catch((error: Error) => setStatus(error.message));
    const reference = new URLSearchParams(window.location.search).get(
      "reference",
    );
    if (reference) {
      const pending = window.localStorage.getItem("gamevault-pending-order");
      if (!pending) {
        setStatus("Payment was verified, but the order details are missing.");
        return;
      }
      setIsLoading(true);
      setStatus("Confirming your payment and placing your order…");
      const pendingOrder = JSON.parse(pending);
      createClient().auth.getSession().then(({ data }) =>
        fetch("/api/orders/complete", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(data.session?.access_token
              ? { Authorization: `Bearer ${data.session.access_token}` }
              : {}),
          },
          body: JSON.stringify({ reference, ...pendingOrder }),
        }),
      )
        .then(async (response) => {
          const result = await response.json();
          if (!response.ok)
            throw new Error(result.error || "Payment verification failed.");
          window.localStorage.setItem(
            "gamevault-completed-order",
            JSON.stringify({
              ...result,
              customerEmail: pendingOrder.customer.email,
            }),
          );
          window.localStorage.removeItem(CART_KEY);
          window.localStorage.removeItem(DISCOUNT_KEY);
          window.localStorage.removeItem("gamevault-pending-order");
          window.location.replace("/order/success");
        })
        .catch((error: Error) => {
          setStatus(error.message);
          setIsLoading(false);
        });
    }
  }, []);

  const fallbackSubtotal = cart.reduce(
    (sum, item) => sum + item.price_kobo * item.quantity,
    0,
  );
  const subtotal = quote?.subtotalKobo ?? fallbackSubtotal;
  const total = quote?.totalKobo ?? subtotal;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("");
    setIsLoading(true);
    const formData = new FormData(event.currentTarget);
    const address = [
      formData.get("street"),
      formData.get("apartment"),
      formData.get("city"),
      formData.get("state"),
      formData.get("postal"),
      formData.get("country"),
    ]
      .map(String)
      .map((value) => value.trim())
      .filter(Boolean)
      .join(", ");
    const customer = {
      name: String(formData.get("name") || ""),
      email: String(formData.get("email") || ""),
      phone: String(formData.get("phone") || ""),
      address,
    };
    const items = cart.map(({ id, quantity }) => ({ id, quantity }));
    const discountCode =
      quote?.discountCode || window.localStorage.getItem(DISCOUNT_KEY) || "";
    try {
      window.localStorage.setItem(
        "gamevault-pending-order",
        JSON.stringify({ customer, items, discountCode }),
      );
      const response = await fetch("/api/paystack/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: customer.email,
          items,
          discountCode,
        }),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Could not start Paystack checkout.");
      window.location.href = result.authorizationUrl;
    } catch (error) {
      setStatus(
        error instanceof Error
          ? error.message
          : "Could not start Paystack checkout.",
      );
      setIsLoading(false);
    }
  };

  return (
    <main className="secure-page">
      <header className="secure-header">
        <div className="store-container">
          <a className="wordmark" href="/">
            èrè fídíò<span>.</span>
          </a>
          <span>
            <LockIcon size={17} /> Secure checkout
          </span>
        </div>
      </header>
      <div className="store-container checkout-page">
        <section className="checkout-heading">
          <p className="design-eyebrow">THE FINAL STEP</p>
          <h1>Make it yours.</h1>
          <p>Just a few details, then you’re ready to play.</p>
          <div className="checkout-trail">
            <a href="/cart">Cart</a>
            <b>›</b>
            <strong>Details &amp; payment</strong>
            <b>›</b>
            <span>Confirmation</span>
          </div>
        </section>
        <div className="checkout-layout">
          <form className="customer-panel" onSubmit={handleSubmit}>
            <section>
              <h2>Customer details</h2>
              <p>Your order updates will come here.</p>
              <label>
                Full name
                <input
                  required
                  name="name"
                  autoComplete="name"
                  placeholder="Tomi Adeyemi"
                />
              </label>
              <div className="field-grid">
                <label>
                  Email address
                  <input
                    required
                    type="email"
                    name="email"
                    autoComplete="email"
                    placeholder="tomi@example.com"
                  />
                </label>
                <label>
                  Phone number
                  <input
                    required
                    type="tel"
                    name="phone"
                    autoComplete="tel"
                    placeholder="+234 800 000 0000"
                  />
                  <small>For delivery updates.</small>
                </label>
              </div>
            </section>
            <hr />
            <section>
              <h2>Delivery address</h2>
              <p>Where should your next adventure arrive?</p>
              <label>
                Street address
                <input
                  required
                  name="street"
                  autoComplete="street-address"
                  placeholder="12 Example Street"
                />
              </label>
              <label>
                Apartment, suite or landmark (optional)
                <input name="apartment" placeholder="Near Example Junction" />
              </label>
              <div className="field-grid">
                <label>
                  State
                  <select required name="state" defaultValue="">
                    <option value="" disabled>
                      Select state
                    </option>
                    <option>Lagos</option>
                    <option>Abuja FCT</option>
                    <option>Ogun</option>
                    <option>Oyo</option>
                    <option>Rivers</option>
                    <option>Other</option>
                  </select>
                </label>
                <label>
                  City / LGA
                  <input required name="city" placeholder="Ikeja" />
                </label>
              </div>
              <div className="field-grid">
                <label>
                  Postal code (optional)
                  <input
                    name="postal"
                    inputMode="numeric"
                    placeholder="100001"
                  />
                </label>
                <label>
                  Country
                  <select name="country" defaultValue="Nigeria">
                    <option>Nigeria</option>
                  </select>
                </label>
              </div>
              <p className="address-note">
                ⓘ &nbsp; Delivery fee is not configured yet. Review your details
                before paying.
              </p>
            </section>
            {status && (
              <p className="payment-error" role="status">
                {status}
              </p>
            )}
          </form>
          <aside className="checkout-order-panel">
            <h2>Your order</h2>
            <div className="checkout-products">
              {cart.map((item) => (
                <div className="checkout-product" key={item.id}>
                  <div>
                    <ProductCover product={item} />
                  </div>
                  <span>
                    <strong>{item.title}</strong>
                    <small>
                      {item.platform} · Physical disc · Qty {item.quantity}
                    </small>
                  </span>
                  <b>{formatNaira(item.price_kobo * item.quantity)}</b>
                </div>
              ))}
            </div>
            <dl className="checkout-totals">
              <div>
                <dt>
                  Subtotal ·{" "}
                  {cart.reduce((sum, item) => sum + item.quantity, 0)} items
                </dt>
                <dd>{formatNaira(subtotal)}</dd>
              </div>
              {(quote?.discountKobo || 0) > 0 && (
                <div>
                  <dt>Discount · {quote?.discountCode}</dt>
                  <dd>− {formatNaira(quote!.discountKobo)}</dd>
                </div>
              )}
              <div>
                <dt>Delivery</dt>
                <dd>At checkout</dd>
              </div>
            </dl>
            <div className="checkout-total">
              <span>Total to pay</span>
              <strong>{formatNaira(total)}</strong>
            </div>
            <div className="paystack-panel">
              <ShieldIcon size={30} />
              <span>
                <strong>Secure payment with Paystack</strong>
                <small>Choose your payment method securely.</small>
              </span>
            </div>
            <button
              className="primary-button paystack-button real-payment-button"
              type="button"
              disabled={cart.length === 0 || isLoading}
              onClick={() =>
                document
                  .querySelector<HTMLFormElement>(".customer-panel")
                  ?.requestSubmit()
              }
            >
              {isLoading && <span className="button-spinner" aria-hidden="true" />}
              {cart.length === 0
                ? "Cart is empty"
                : isLoading
                  ? "Opening secure payment…"
                  : "Pay with Paystack"}{" "}
              <LockIcon size={17} />
            </button>
            <p className="terms-copy">
              By placing your order, you agree to our
              <br />
              <a href="/help#terms">terms of service</a> and{" "}
              <a href="/help#privacy">privacy policy</a>.
            </p>
          </aside>
        </div>
        <div className="checkout-bottom">
          <a href="/cart">← Back to cart</a>
          <a href="/help#support">Need a hand? Contact support</a>
          <span>
            <LockIcon size={16} /> Your details are kept secure
          </span>
        </div>
      </div>
    </main>
  );
}
