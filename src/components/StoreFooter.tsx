import { LockIcon } from "./Icons";

export default function StoreFooter() {
  return <footer className="store-footer" id="about">
    <div className="store-container footer-columns">
      <div className="footer-intro"><a className="wordmark" href="/">èrè fídíò<span>.</span></a><p>Good games. Real discs.<br />Sealed physical games, delivered across Nigeria.</p><div className="footer-social" aria-label="Social profiles not yet configured"><span>Instagram ↗</span><span>X ↗</span></div></div>
      <div><strong>Explore</strong><a href="/shop">All games</a><a href="/shop?platform=PS5">PlayStation 5</a><a href="/shop?platform=PS4">PlayStation 4</a><a href="/shop?platform=Xbox">Xbox</a></div>
      <div><strong>Here to help</strong><a href="/help#support">Contact &amp; support</a><a href="/help#delivery">Delivery information</a><a href="/help#returns">Returns &amp; exchanges</a><a href="/help#faq">Frequently asked questions</a></div>
      <div><strong>The details</strong><a href="/#about">About èrè fídíò</a><a href="/help#payment">Payment information</a><a href="/help#privacy">Privacy policy</a><a href="/help#terms">Terms of service</a></div>
    </div>
    <div className="store-container footer-legal"><span>© 2026 èrè fídíò. Made for the love of the game.</span><strong><LockIcon size={16} /> Secure payments with Paystack</strong><span>Cards · Bank transfer · USSD</span></div>
  </footer>;
}
