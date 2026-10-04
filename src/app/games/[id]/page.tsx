"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { BagIcon, LockIcon, TagIcon, TruckIcon } from "@/components/Icons";
import ProductCard from "@/components/ProductCard";
import ProductCover from "@/components/ProductCover";
import StoreFooter from "@/components/StoreFooter";
import StoreHeader from "@/components/StoreHeader";
import { createClient } from "@/lib/supabase/client";
import {
  formatNaira,
  platformName,
  type Product,
} from "@/lib/store";
import { useCart } from "@/components/CartProvider";

export default function ProductPage() {
  const params = useParams<{ id: string }>();
  const productId = params.id;
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState(false);
  const { addItem } = useCart();

  useEffect(() => {
    const supabase = createClient();
    Promise.all([
      supabase
        .from("products")
        .select(
          "id, title, platform, price_kobo, description, stock, image_url, created_at",
        )
        .eq("id", productId)
        .maybeSingle(),
      supabase
        .from("products")
        .select(
          "id, title, platform, price_kobo, description, stock, image_url, created_at",
        )
        .eq("is_published", true)
        .eq("is_archived", false)
        .neq("id", productId)
        .limit(4),
    ]).then(([current, suggestions]) => {
      setProduct(current.data as Product | null);
      setRelated((suggestions.data as Product[] | null) ?? []);
      setLoading(false);
    });
  }, [productId]);

  const add = async () => {
    if (!product || product.stock < 1) return;
    await addItem(product, quantity);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  };
  if (loading)
    return (
      <main className="site-shell">
        <StoreHeader />
        <div className="store-container product-loading">
          <div className="product-skeleton" />
          <div className="skeleton-copy" />
        </div>
      </main>
    );
  if (!product)
    return (
      <main className="site-shell">
        <StoreHeader />
        <div className="store-container catalogue-empty">
          <h1>This game could not be found.</h1>
          <a className="primary-button" href="/shop">
            Back to games
          </a>
        </div>
        <StoreFooter />
      </main>
    );

  return (
    <main className="site-shell">
      <StoreHeader />
      <div className="store-container product-page">
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <a href="/">Home</a>
          <span>›</span>
          <a href={`/shop?platform=${product.platform}`}>
            {product.platform} games
          </a>
          <span>›</span>
          <span>{product.title}</span>
        </nav>
        <div className="product-detail-layout">
          <section className="product-artwork-panel">
            <ProductCover product={product} priority />
            <p>
              <BagIcon size={18} /> Sealed physical edition
            </p>
          </section>
          <section className="product-detail-copy">
            <span className="platform-badge">{product.platform} · DISC</span>
            <p className="design-eyebrow">YOUR NEXT GREAT ADVENTURE</p>
            <h1>{product.title}</h1>
            <div className="product-price-stock">
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
            <p className="product-long-description">{product.description}</p>
            <dl className="product-facts">
              <div>
                <dt>Format</dt>
                <dd>Physical disc</dd>
              </div>
              <div>
                <dt>Platform</dt>
                <dd>{platformName(product.platform)}</dd>
              </div>
              <div>
                <dt>Genre</dt>
                <dd>Not specified</dd>
              </div>
            </dl>
            <label className="quantity-label">Quantity</label>
            <div className="product-purchase">
              <div className="quantity-picker">
                <button
                  aria-label="Decrease quantity"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  −
                </button>
                <span>{quantity}</span>
                <button
                  aria-label="Increase quantity"
                  onClick={() =>
                    setQuantity(Math.min(product.stock || 1, quantity + 1))
                  }
                >
                  +
                </button>
              </div>
              <button
                className={added ? "primary-button is-added" : "primary-button"}
                onClick={add}
                disabled={product.stock < 1}
              >
                {product.stock < 1
                  ? "Out of stock"
                  : added
                    ? "Added to cart"
                    : "Add to cart"}{" "}
                <BagIcon size={18} />
              </button>
            </div>
            {added && (
              <p className="added-message" role="status">
                ✓ <strong>Added to your cart.</strong>{" "}
                <a href="/cart">View cart</a>
              </p>
            )}
            <div className="delivery-callout">
              <TruckIcon size={28} />
              <span>
                <strong>From our shelf to your door.</strong>
                <small>
                  Delivery across Nigeria. Your delivery fee is shown at
                  checkout after you enter your address.
                </small>
              </span>
            </div>
            <div className="product-assurances">
              <span>
                <BagIcon size={17} /> Sealed disc
              </span>
              <span>
                <LockIcon size={17} /> Secure payment
              </span>
              <span>
                <TagIcon size={17} /> Clear pricing
              </span>
            </div>
            <p className="edition-note">
              Please check your console and edition before ordering.
            </p>
          </section>
        </div>
        <section className="related-section">
          <div className="section-title-row">
            <div>
              <h2>Keep a good thing going.</h2>
              <p>A few more games for your shelf.</p>
            </div>
            <a className="arrow-link" href="/shop">
              Shop all <span>→</span>
            </a>
          </div>
          <div className="product-grid home-grid">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} compact />
            ))}
          </div>
        </section>
      </div>
      <StoreFooter />
    </main>
  );
}
