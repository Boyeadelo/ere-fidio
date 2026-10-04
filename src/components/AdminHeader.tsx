"use client";

import { useCart } from "./CartProvider";
import { UserIcon } from "./Icons";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function AdminHeader() {
  const { user } = useCart();
  const router = useRouter();

  async function signOut() {
    await createClient().auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return <header className="store-header admin-header">
    <div className="store-container store-header-inner">
      <a className="wordmark" href="/admin" aria-label="èrè fídíò admin home">èrè fídíò<span>.</span></a>
      <nav className="admin-header-actions" aria-label="Administrator navigation">
        <a href="/shop">View store</a>
        {user ? <>
          <span className="admin-profile" title={user.email || "Administrator"}><UserIcon /><span>{user.email}</span></span>
          <button onClick={signOut}>Logout</button>
        </> : <a href="/login">Login</a>}
      </nav>
    </div>
  </header>;
}
