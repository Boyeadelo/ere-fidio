"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { BagIcon, CloseIcon, MenuIcon, UserIcon } from "./Icons";
import { useCart } from "./CartProvider";

type Props = { active?: "shop" | "ps5" | "ps4" | "xbox" | "about" | "cart" };

export default function StoreHeader({ active }: Props) {
  const { cartCount, user } = useCart();
  const [isAdmin, setIsAdmin] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!user) { setIsAdmin(false); return; }
    createClient().from("profiles").select("role").eq("id", user.id).maybeSingle()
      .then(({ data }) => setIsAdmin(data?.role === "admin"));
  }, [user]);

  const nav = [
    ["shop", "/shop", "Shop"], ["ps5", "/shop?platform=PS5", "PS5"],
    ["ps4", "/shop?platform=PS4", "PS4"], ["xbox", "/shop?platform=Xbox", "Xbox"],
    ["about", "/#about", "About"],
  ] as const;

  const signOut = async () => { await createClient().auth.signOut(); setIsAdmin(false); };

  return <header className="store-header">
    <div className="store-container store-header-inner">
      <a className="wordmark" href="/" aria-label="èrè fídíò home">èrè fídíò<span>.</span></a>
      <nav className="desktop-nav" aria-label="Main navigation">
        <div className="desktop-nav-centre">{nav.map(([id, href, label]) => <a key={id} className={active === id ? "is-active" : ""} href={href}>{label}</a>)}</div>
        <div className="desktop-nav-actions">
          <a className={active === "cart" ? "nav-cart is-active" : "nav-cart"} href="/cart"><BagIcon /> Cart <span className="cart-count">{cartCount}</span></a>
          {isAdmin && <a className="nav-account" href="/admin">Admin</a>}
          {user ? <><a className="nav-account" href="/account/orders"><UserIcon /> Orders</a><button className="nav-account" onClick={signOut} title={user.email ?? "Signed in"}>Logout</button></> : <a className="nav-account" href="/login"><UserIcon /> Login</a>}
        </div>
      </nav>
      <div className="mobile-nav-actions">
        <a className="mobile-cart" href="/cart" aria-label={`Cart, ${cartCount} items`}><BagIcon /><span>{cartCount}</span></a>
        <button className="icon-button" onClick={() => setMenuOpen(true)} aria-label="Open menu" aria-expanded={menuOpen}><MenuIcon /></button>
      </div>
    </div>
    {menuOpen && <div className="mobile-menu" role="dialog" aria-modal="true" aria-label="Site menu">
      <div className="mobile-menu-top"><a className="wordmark" href="/">èrè fídíò<span>.</span></a><button className="icon-button" onClick={() => setMenuOpen(false)} aria-label="Close menu"><CloseIcon /></button></div>
      <nav>{nav.map(([id, href, label]) => <a key={id} className={active === id ? "is-active" : ""} href={href}>{label}</a>)}<a href="/cart">Cart ({cartCount})</a>{isAdmin && <a href="/admin">Admin dashboard</a>}{user ? <><a href="/account/orders">Your orders</a><button onClick={signOut}>Logout</button></> : <a href="/login">Login</a>}</nav>
    </div>}
  </header>;
}
