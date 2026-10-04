"use client";

import { useEffect } from "react";

export default function ReturnToApp({ returnUrl }: { returnUrl: string }) {
  useEffect(() => {
    window.location.replace(returnUrl);
  }, [returnUrl]);

  return (
    <main className="login-page">
      <p className="design-eyebrow">PAYMENT RECEIVED</p>
      <h1>Returning to èrè fídíò…</h1>
      <p>Your payment reference is ready. Continue in the mobile app to finish placing the order.</p>
      <a className="primary-button" href={returnUrl}>Return to the app</a>
      <p className="feedback">If the app does not open automatically, tap the button above.</p>
    </main>
  );
}
