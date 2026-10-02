"use client";

import { useEffect, useState } from "react";
import {
  BagIcon,
  CheckIcon,
  LockIcon,
  TrashIcon,
  TruckIcon,
} from "@/components/Icons";
import ProductCover from "@/components/ProductCover";
import StoreFooter from "@/components/StoreFooter";
import StoreHeader from "@/components/StoreHeader";
import {
  DISCOUNT_KEY,
  formatNaira,
  readCart,
  type CartItem,
  writeCart,
} from "@/lib/store";

type Quote = {
  subtotalKobo: number;
  discountKobo: number;
  totalKobo: number;
  discountCode: string | null;
};

export default function CartPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discountCode, setDiscountCode] = useState("");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [discountStatus, setDiscountStatus] = useState("");
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    setCart(readCart());
    setDiscountCode(window.localStorage.getItem(DISCOUNT_KEY) || "");
  }, []);
  useEffect(() => {
    if (cart.length)
      getQuote(window.localStorage.getItem(DISCOUNT_KEY) || "", false);
  }, [cart]);
  const save = (next: CartItem[]) => {
    setCart(next);
    writeCart(next);
    if (!next.length) {
      setQuote(null);
      window.localStorage.removeItem(DISCOUNT_KEY);
    }
  };
  const updateQuantity = (id: string, quantity: number) =>
    save(
      quantity < 1
        ? cart.filter((item) => item.id !== id)
        : cart.map((item) =>
            item.id === id
              ? { ...item, quantity: Math.min(quantity, item.stock) }
              : item,
          ),
    );
  const items = cart.map(({ id, quantity }) => ({ id, quantity }));
  const fallbackSubtotal = cart.reduce(
    (sum, item) => sum + item.price_kobo * item.quantity,
    0,
  );

  async function getQuote(code: string, announce = true) {
    setApplying(true);
    if (announce) setDiscountStatus("");
    try {
      const response = await fetch("/api/checkout/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, discountCode: code.trim() }),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(
          result.error ||
            "This code couldn’t be applied. Check the code and try again.",
        );
      setQuote(result);
      if (result.discountCode) {
        window.localStorage.setItem(DISCOUNT_KEY, result.discountCode);
        setDiscountCode(result.discountCode);
        if (announce)
          setDiscountStatus(
            `Code applied. You saved ${formatNaira(result.discountKobo)}.`,
          );
      } else {
        window.localStorage.removeItem(DISCOUNT_KEY);
        if (announce && code.trim())
          setDiscountStatus(
            "This code couldn’t be applied. Check the code and try again.",
          );
      }
    } catch (error) {
      if (announce)
        setDiscountStatus(
          error instanceof Error
            ? error.message
            : "This code couldn’t be applied. Check the code and try again.",
        );
    } finally {
      setApplying(false);
    }
  }
  const removeDiscount = () => {
    setDiscountCode("");
    window.localStorage.removeItem(DISCOUNT_KEY);
    setDiscountStatus("");
    getQuote("", false);
  };
  const subtotal = quote?.subtotalKobo ?? fallbackSubtotal;
  const discount = quote?.discountKobo ?? 0;
  const total = quote?.totalKobo ?? subtotal;
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <main className="site-shell">
      <StoreHeader active="cart" />
      {cart.length === 0 ? (
        <div className="store-container empty-cart-page">
          <div className="empty-icon">
            <BagIcon size={34} />
          </div>
          <h1>Your shelf starts here.</h1>
          <p>
            Your cart is empty. Find a game you’ll want
            <br className="desktop-copy" /> to keep.
          </p>
          <a className="primary-button" href="/shop">
            Explore games <span>→</span>
          </a>
        </div>
      ) : (
        <div className="store-container cart-page">
          <section className="cart-title">
            <p className="design-eyebrow">A GOOD CHOICE</p>
            <h1>Your cart</h1>
            <p>
              {count === 1
                ? "One great game. One good decision."
                : `${count} great games. One good decision.`}
            </p>
          </section>
          <div className="cart-layout">
            <section className="cart-lines">
              {cart.map((item) => (
                <article className="cart-line" key={item.id}>
                  <div className="cart-mini-cover">
                    <ProductCover product={item} />
                  </div>
                  <div className="cart-line-copy">
                    <span className="platform-badge">
                      {item.platform} · DISC
                    </span>
                    <h2>{item.title}</h2>
                    <p>Sealed physical disc</p>
                    <button
                      className="remove-link"
                      onClick={() => updateQuantity(item.id, 0)}
                    >
                      <TrashIcon /> <span>Remove</span>
                    </button>
                  </div>
                  <div className="cart-line-actions">
                    <div className="quantity-picker">
                      <button
                        aria-label={`Decrease ${item.title} quantity`}
                        onClick={() =>
                          updateQuantity(item.id, item.quantity - 1)
                        }
                      >
                        −
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        aria-label={`Increase ${item.title} quantity`}
                        onClick={() =>
                          updateQuantity(item.id, item.quantity + 1)
                        }
                      >
                        +
                      </button>
                    </div>
                    <strong>
                      {formatNaira(item.price_kobo * item.quantity)}
                    </strong>
                  </div>
                </article>
              ))}
              <div className="cart-after-lines">
                <a className="arrow-link back" href="/shop">
                  Continue shopping <span>←</span>
                </a>
                <span>
                  <BagIcon size={18} /> Every game arrives sealed.
                </span>
              </div>
            </section>
            <aside>
              <div className="cart-summary-panel">
                <h2>Order summary</h2>
                <dl className="summary-list">
                  <div>
                    <dt>
                      Subtotal · {count} {count === 1 ? "item" : "items"}
                    </dt>
                    <dd>{formatNaira(subtotal)}</dd>
                  </div>
                  {discount > 0 && (
                    <div>
                      <dt>Discount · {quote?.discountCode}</dt>
                      <dd>− {formatNaira(discount)}</dd>
                    </div>
                  )}
                  <div>
                    <dt>Delivery</dt>
                    <dd>At checkout</dd>
                  </div>
                </dl>
                <div className="discount-block">
                  <label htmlFor="discount-code">Discount code</label>
                  <div>
                    <input
                      id="discount-code"
                      value={discountCode}
                      onChange={(event) =>
                        setDiscountCode(event.target.value.toUpperCase())
                      }
                      placeholder="Enter code"
                    />
                    <button
                      className="secondary-button"
                      onClick={() => getQuote(discountCode)}
                      disabled={applying}
                    >
                      {applying ? "Applying…" : "Apply"}
                    </button>
                  </div>
                  {discountStatus && (
                    <p
                      className={
                        discount > 0
                          ? "discount-message"
                          : "discount-message error"
                      }
                    >
                      {discount > 0 && <CheckIcon size={16} />} {discountStatus}
                      {discount > 0 && (
                        <button onClick={removeDiscount}>Remove</button>
                      )}
                    </p>
                  )}
                </div>
                <div className="cart-total">
                  <span>Total before delivery</span>
                  <strong>{formatNaira(total)}</strong>
                </div>
                <p className="summary-note">
                  Enter your delivery address at checkout to see your final
                  total.
                </p>
                <a className="primary-button checkout-cta" href="/checkout">
                  Proceed to checkout <span>→</span>
                </a>
                <p className="secure-note">
                  <LockIcon size={15} /> Secure checkout with Paystack
                </p>
              </div>
              <p className="delivery-note">
                <TruckIcon size={18} /> Delivery across Nigeria
              </p>
            </aside>
          </div>
        </div>
      )}
      <StoreFooter />
    </main>
  );
}
