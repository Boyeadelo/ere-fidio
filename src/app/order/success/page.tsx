"use client";

import { useEffect, useState } from "react";
import { CheckIcon, LockIcon, MailIcon } from "@/components/Icons";
import StoreFooter from "@/components/StoreFooter";
import { formatNaira } from "@/lib/store";

type CompletedOrder = {
  orderId: string;
  reference: string;
  totalKobo: number;
  emailSent: boolean;
  customerEmail?: string;
};

export default function OrderSuccessPage() {
  const [order, setOrder] = useState<CompletedOrder | null>(null);
  useEffect(() => {
    const saved = window.localStorage.getItem("gamevault-completed-order");
    if (saved) setOrder(JSON.parse(saved) as CompletedOrder);
  }, []);
  return (
    <main className="site-shell">
      <header className="secure-header">
        <div className="store-container">
          <a className="wordmark" href="/">
            èrè fídíò<span>.</span>
          </a>
          <span>
            <LockIcon size={17} /> Secure checkout
          </span>
        </div>
      </header>
      <section className="success-page">
        <div className="success-check">
          <CheckIcon size={32} />
        </div>
        <p className="design-eyebrow">ORDER CONFIRMED</p>
        <h1>Thank you for your order.</h1>
        <p className="success-lead">
          Your next great game is on its way to becoming yours. We’ve
          <br className="desktop-copy" /> received your payment and will prepare
          your order.
        </p>
        {order ? (
          <div className="confirmation-panel">
            <div className="confirmation-top">
              <span>
                Order reference<strong>{order.reference}</strong>
              </span>
              <span>
                Total paid<strong>{formatNaira(order.totalKobo)}</strong>
              </span>
            </div>
            <div className="email-status">
              <MailIcon size={30} />
              <span>
                <strong>
                  {order.emailSent
                    ? "Confirmation email sent"
                    : "Your confirmation email is being prepared."}
                </strong>
                <small>
                  {order.emailSent && order.customerEmail
                    ? `Your order details have been sent to ${order.customerEmail}.`
                    : "We’ll share the next steps using your contact details."}
                </small>
              </span>
            </div>
            <div className="next-steps">
              <h2>What happens next?</h2>
              {[
                [
                  "1",
                  "We prepare your games.",
                  "Your sealed discs are packed for delivery.",
                ],
                [
                  "2",
                  "You get a delivery update.",
                  "We’ll share the next steps using your contact details.",
                ],
                [
                  "3",
                  "Make some room on your shelf.",
                  "A new adventure will soon be yours to keep.",
                ],
              ].map(([n, title, copy]) => (
                <div key={n}>
                  <b>{n}</b>
                  <span>
                    <strong>{title}</strong>
                    <small>{copy}</small>
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="confirmation-panel missing-order">
            <h2>Your order details are no longer available on this device.</h2>
            <p>Check your confirmation email or contact support for help.</p>
          </div>
        )}
        <a className="primary-button continue-button" href="/shop">
          Continue shopping <span>→</span>
        </a>
      <p className="success-support">
        Need help with your order? <a href="/help#support">Contact support</a>
      </p>
      </section>
      <StoreFooter />
    </main>
  );
}
