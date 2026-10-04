"use client";

import { useCart } from "./CartProvider";

export default function CartMergeNotice() {
  const { mergeNotice, dismissMergeNotice } = useCart();
  if (!mergeNotice) return null;
  return (
    <div className="cart-merge-notice" role="status">
      <p><strong>Your carts were combined.</strong> {mergeNotice.message}</p>
      <div>
        <a href="/cart">Review cart</a>
        <button onClick={dismissMergeNotice} aria-label="Dismiss cart merge notice">Dismiss</button>
      </div>
    </div>
  );
}
