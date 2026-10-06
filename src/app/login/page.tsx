"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

export default function LoginPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [nextPath, setNextPath] = useState("/");
  const [reason, setReason] = useState("");
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const message = params.get("error");
    if (message) setError(message);
    const next = params.get("next");
    if (next?.startsWith("/")) setNextPath(next);
    setReason(params.get("reason") || "");
  }, []);

  const signInWithGoogle = async () => {
    setError("");
    setLoading(true);
    try {
      const supabase = createClient();
      const browserOrigin = window.location.origin.replace("0.0.0.0", "172.19.122.9");
      document.cookie = `oauth_next=${encodeURIComponent(nextPath)}; Path=/; Max-Age=600; SameSite=Lax${window.location.protocol === "https:" ? "; Secure" : ""}`;
      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${browserOrigin}/auth/callback`,
          queryParams: { prompt: "select_account" },
        },
      });
      if (signInError) setError(signInError.message);
    } catch {
      setError("Google sign-in could not start. Check the Supabase Google provider settings.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      <p className="design-eyebrow">èrè fídíò</p>
      <h1>Sign in</h1>
      <p>{reason === "checkout" ? "Sign in to keep this cart, combine it with your saved cart, and continue to checkout." : "Sign in to sync your cart and view your orders on every device."}</p>
      <button className="primary-button" onClick={signInWithGoogle} disabled={loading}>
        {loading ? "Opening Google…" : "Continue with Google"}
      </button>
      {error && <p className="feedback error" role="alert">{error}</p>}
    </main>
  );
}
