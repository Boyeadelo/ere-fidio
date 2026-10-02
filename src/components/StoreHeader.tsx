"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CART_EVENT, readCart } from "@/lib/store";
import { BagIcon, CloseIcon, MenuIcon, UserIcon } from "./Icons";

type Props = { active?: "shop" | "ps5" | "ps4" | "xbox" | "about" | "cart" };

export default function StoreHeader({ active }: Props) {
  const [cartCount, setCartCount] = useState(0);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const syncCart = () => setCartCount(readCart().reduce((sum, item) => sum + item.quantity, 0));
    syncCart();
    window.addEventListener("storage", syncCart);
    window.addEventListener(CART_EVENT, syncCart);
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      setUserEmail(data.user?.email ?? null);
      if (data.user) {
        const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).maybeSingle();
        setIsAdmin(profile?.role === "admin");
      }
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => { setUserEmail(session?.user?.email ?? null); if (!session) setIsAdmin(false); });
    return () => {
      window.removeEventListener("storage", syncCart);
      window.removeEventListener(CART_EVENT, syncCart);
      data.subscription.unsubscribe();
    };
  }, []);

  const nav = [
    ["shop", "/shop", "Shop"], ["ps5", "/shop?platform=PS5", "PS5"],
    ["ps4", "/shop?platform=PS4", "PS4"], ["xbox", "/shop?platform=Xbox", "Xbox"],
    ["about", "/#about", "About"],
  ] as const;

  const signOut = async () => { await createClient().auth.signOut(); setUserEmail(null); setIsAdmin(false); };

  return <header className="store-header">
    <div className="store-container store-header-inner">
      <a className="wordmark" href="/" aria-label="èrè fídíò home">èrè fídíò<span>.</span></a>
      <nav className="desktop-nav" aria-label="Main navigation">
        <div className="desktop-nav-centre">{nav.map(([id, href, label]) => <a key={id} className={active === id ? "is-active" : ""} href={href}>{label}</a>)}</div>
        <div className="desktop-nav-actions">
          <a className={active === "cart" ? "nav-cart is-active" : "nav-cart"} href="/cart"><BagIcon /> Cart <span className="cart-count">{cartCount}</span></a>
          {isAdmin && <a className="nav-account" href="/admin">Admin</a>}
          {userEmail ? <><a className="nav-account" href="/account/orders"><UserIcon /> Orders</a><button className="nav-account" onClick={signOut} title={userEmail}>Logout</button></> : <a className="nav-account" href="/login"><UserIcon /> Login</a>}
        </div>
      </nav>
      <div className="mobile-nav-actions">
        <a className="mobile-cart" href="/cart" aria-label={`Cart, ${cartCount} items`}><BagIcon /><span>{cartCount}</span></a>
        <button className="icon-button" onClick={() => setMenuOpen(true)} aria-label="Open menu" aria-expanded={menuOpen}><MenuIcon /></button>
      </div>
    </div>
    {menuOpen && <div className="mobile-menu" role="dialog" aria-modal="true" aria-label="Site menu">
      <div className="mobile-menu-top"><a className="wordmark" href="/">èrè fídíò<span>.</span></a><button className="icon-button" onClick={() => setMenuOpen(false)} aria-label="Close menu"><CloseIcon /></button></div>
      <nav>{nav.map(([id, href, label]) => <a key={id} className={active === id ? "is-active" : ""} href={href}>{label}</a>)}<a href="/cart">Cart ({cartCount})</a>{isAdmin && <a href="/admin">Admin dashboard</a>}{userEmail ? <><a href="/account/orders">Your orders</a><button onClick={signOut}>Logout</button></> : <a href="/login">Login</a>}</nav>
    </div>}
  </header>;
}
