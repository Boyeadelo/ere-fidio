"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Product } from "@/lib/store";
import { BagIcon, LockIcon, TagIcon, TruckIcon } from "@/components/Icons";
import ProductCard from "@/components/ProductCard";
import StoreFooter from "@/components/StoreFooter";
import StoreHeader from "@/components/StoreHeader";

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    createClient().from("products")
      .select("id, title, platform, price_kobo, description, stock, image_url, created_at")
      .eq("is_published", true).eq("is_archived", false).order("created_at", { ascending: false })
      .then(({ data, error: queryError }) => {
        if (queryError) setError("We couldn’t load the catalogue. Please refresh and try again.");
        setProducts((data as Product[] | null) ?? []); setLoading(false);
      });
  }, []);

  return <main className="site-shell">
    <StoreHeader />
    <div className="store-container">
      <section className="home-hero">
        <div className="home-hero-copy"><p className="design-eyebrow"><span />THE JOY OF THE PHYSICAL GAME</p><h1>A great game.<br /><em>Yours to keep.</em></h1><p>Find your next favourite on PS5, PS4 or Xbox. Sealed physical games, delivered across Nigeria.</p><div className="hero-buttons"><a className="primary-button large" href="/shop">Shop games <span>→</span></a><a className="arrow-link" href="#platforms">Browse by console <span>→</span></a></div></div>
        <div className="home-hero-art"><img src="/design-assets/hero.png" alt="" /><div className="art-caption"><BagIcon size={20} /><span><strong>Factory sealed. Ready for your shelf.</strong><small>A little anticipation. A great unboxing.</small></span></div></div>
      </section>
      <section className="trust-row" aria-label="Store benefits"><div><BagIcon /><span>Sealed discs</span></div><div><LockIcon /><span>Secure checkout</span></div><div><TagIcon /><span>Clear pricing</span></div><div><TruckIcon /><span>Nigeria delivery</span></div></section>
      <section className="featured-section">
        <div className="section-title-row"><div><h2>Your next obsession</h2><p>A few good places to press start.</p></div><a className="arrow-link desktop-copy" href="/shop">View all games <span>→</span></a><a className="arrow-link mobile-copy" href="/shop">Shop all <span>→</span></a></div>
        {loading && <div className="product-grid home-grid" aria-label="Loading games">{[1,2,3,4].map((n) => <div className="product-skeleton" key={n} />)}</div>}
        {error && <p className="feedback error" role="alert">{error}</p>}
        {!loading && !error && products.length === 0 && <div className="catalogue-empty"><h3>No games found.</h3><p>Try another title or browse games across all platforms.</p><a className="secondary-button" href="/shop">Clear search</a></div>}
        {!loading && !error && <div className="product-grid home-grid">{products.slice(0,4).map((product, index) => <ProductCard key={product.id} product={product} newArrival={index === 0} />)}</div>}
      </section>
    </div>
    <section className="platform-band" id="platforms"><div className="store-container"><p className="design-eyebrow">PICK YOUR PLATFORM</p><h2>Made for your console.</h2><div className="platform-card-track">{[
      ["PS5", "PlayStation 5", "Big worlds. A new generation."],
      ["PS4", "PlayStation 4", "Great stories. All-time favourites."],
      ["Xbox", "Xbox", "More ways to find your next game."],
    ].map(([mark,name,copy]) => <a className="console-card" href={`/shop?platform=${mark}`} key={mark}><span className="console-mark">{mark}</span><span><strong>{name}</strong><small>{copy}</small></span><b>→</b></a>)}</div></div></section>
    <div className="store-container"><section className="arrival-banner"><div><p className="design-eyebrow">FRESH ON THE SHELF</p><h2>New arrivals. New adventures.</h2><p>Make room for something you haven’t played yet.</p></div><a className="primary-button" href="/shop">Explore new arrivals <span>→</span></a></section></div>
    <StoreFooter />
  </main>;
}
