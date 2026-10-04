"use client";

import { useState } from "react";
import { formatNaira, type Product } from "@/lib/store";
import ProductCover from "./ProductCover";
import { useCart } from "./CartProvider";

export default function ProductCard({
  product,
  newArrival = false,
  compact = false,
}: {
  product: Product;
  newArrival?: boolean;
  compact?: boolean;
}) {
  const [state, setState] = useState<"idle" | "adding" | "added">("idle");
  const { addItem } = useCart();
  const add = async () => {
    if (state !== "idle" || product.stock < 1) return;
    setState("adding");
    window.setTimeout(async () => {
      await addItem(product);
      setState("added");
      window.setTimeout(() => setState("idle"), 1600);
    }, 220);
  };
  return (
    <article className={`product-card ${compact ? "is-compact" : ""}`}>
      <div className="product-art-panel">
        {newArrival && <span className="new-arrival">NEW ARRIVAL</span>}
        <a href={`/games/${product.id}`} aria-label={`View ${product.title}`}>
          <ProductCover product={product} />
        </a>
      </div>
      <div className="product-card-copy">
        <span className="platform-badge">{product.platform} · DISC</span>
        <h3>
          <a href={`/games/${product.id}`}>{product.title}</a>
        </h3>
        <p>{product.description}</p>
        <div className="product-card-bottom">
          <div className="product-card-price">
            <strong>{formatNaira(product.price_kobo)}</strong>
            <span
              className={
                product.stock > 0 ? "stock-label" : "stock-label is-out"
              }
            >
              <i />
              {product.stock > 0 ? "In stock" : "Out of stock"}
            </span>
          </div>
          <button
            className={
              state === "added" ? "primary-button is-added" : "primary-button"
            }
            onClick={add}
            disabled={product.stock < 1 || state === "adding"}
            aria-live="polite"
          >
            {state === "adding" && <span className="button-spinner" aria-hidden="true" />}
            {product.stock < 1
              ? "Out of stock"
              : state === "adding"
                ? "Adding…"
                : state === "added"
                  ? "Added to cart"
                  : "Add to cart"}
            {state === "idle" && product.stock > 0 && <span>+</span>}
          </button>
        </div>
      </div>
    </article>
  );
}
