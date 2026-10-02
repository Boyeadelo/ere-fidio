"use client";

import { useEffect, useMemo, useState } from "react";
import { SearchIcon } from "@/components/Icons";
import ProductCard from "@/components/ProductCard";
import StoreFooter from "@/components/StoreFooter";
import StoreHeader from "@/components/StoreHeader";
import { createClient } from "@/lib/supabase/client";
import type { Platform, Product } from "@/lib/store";

type Sort = "featured" | "price" | "newest";

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [platform, setPlatform] = useState<Platform | "All">("All");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<Sort>("featured");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const initial = new URLSearchParams(window.location.search).get("platform");
    if (initial === "PS5" || initial === "PS4" || initial === "Xbox") setPlatform(initial);
    createClient().from("products").select("id, title, platform, price_kobo, description, stock, image_url, created_at").eq("is_published", true).eq("is_archived", false).order("created_at", { ascending: false }).then(({ data, error: queryError }) => {
      if (queryError) setError("We couldn’t load the catalogue. Please refresh and try again.");
      setProducts((data as Product[] | null) ?? []); setLoading(false);
    });
  }, []);

  const visibleProducts = useMemo(() => {
    const filtered = products.filter((product) => (platform === "All" || product.platform === platform) && `${product.title} ${product.description}`.toLowerCase().includes(search.trim().toLowerCase()));
    if (sort === "price") return [...filtered].sort((a,b) => a.price_kobo - b.price_kobo);
    if (sort === "newest") return [...filtered].sort((a,b) => (b.created_at || "").localeCompare(a.created_at || ""));
    return filtered;
  }, [platform, products, search, sort]);

  const active = platform === "PS5" ? "ps5" : platform === "PS4" ? "ps4" : platform === "Xbox" ? "xbox" : "shop";
  const clear = () => { setSearch(""); setPlatform("All"); setSort("featured"); };

  return <main className="site-shell"><StoreHeader active={active} /><div className="store-container catalogue-page">
    <section className="catalogue-heading"><p className="design-eyebrow">THE SHELF</p><h1>Find your next great game.</h1><p>Sealed physical games for your console. Pick a platform, find a favourite, and make it yours.</p></section>
    <section className="catalogue-controls"><div className="platform-tabs" role="group" aria-label="Filter games by platform">{(["All","PS5","PS4","Xbox"] as const).map((item) => <button key={item} className={platform === item ? "is-active" : ""} onClick={() => setPlatform(item)}>{item}</button>)}</div><div className="catalogue-tools"><label className="search-control"><span className="sr-only">Search games</span><SearchIcon /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search games" /></label><label className="sort-control"><span className="sr-only">Sort games</span><select value={sort} onChange={(event) => setSort(event.target.value as Sort)}><option value="featured">Sort: Featured</option><option value="price">Price: Low to high</option><option value="newest">Newest arrivals</option></select></label></div></section>
    <div className="catalogue-meta"><span>{visibleProducts.length} {visibleProducts.length === 1 ? "game" : "games"} to make your own</span><span>All prices in NGN</span></div>
    {loading && <div className="product-grid catalogue-grid">{[1,2,3,4,5,6].map((n) => <div className="product-skeleton" key={n} />)}</div>}
    {error && <p className="feedback error" role="alert">{error}</p>}
    {!loading && !error && visibleProducts.length === 0 && <div className="catalogue-empty"><div className="search-empty-icon"><SearchIcon size={30} /></div><h2>No games found.</h2><p>Try another title or browse games across all platforms.</p><button className="secondary-button" onClick={clear}>Clear search</button></div>}
    {!loading && !error && visibleProducts.length > 0 && <><div className="product-grid catalogue-grid">{visibleProducts.map((product, index) => <ProductCard key={product.id} product={product} newArrival={index === 0 && platform === "All" && !search} />)}</div><p className="shelf-end">You’ve reached the end of this shelf.</p></>}
  </div><StoreFooter /></main>;
}
