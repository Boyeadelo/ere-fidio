"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

export default function LoginPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    const message = new URLSearchParams(window.location.search).get("error");
    if (message) setError(message);
  }, []);

  const signInWithGoogle = async () => {
    setError("");
    setLoading(true);
    try {
      const supabase = createClient();
      const configuredOrigin = process.env.NEXT_PUBLIC_APP_URL;
      const browserOrigin = window.location.origin.replace("0.0.0.0", "172.19.122.9");
      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${configuredOrigin || browserOrigin}/auth/callback` },
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
      <p>Sign in to view your orders. Guest checkout remains available.</p>
      <button className="primary-button" onClick={signInWithGoogle} disabled={loading}>
        {loading ? "Opening Google…" : "Continue with Google"}
      </button>
      {error && <p className="feedback error" role="alert">{error}</p>}
    </main>
  );
}
