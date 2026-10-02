import StoreFooter from "@/components/StoreFooter";
import StoreHeader from "@/components/StoreHeader";

const sections = [
  ["support", "Contact & support", "For this HNG demonstration, order and delivery questions can be sent to boyeadelo@gmail.com. Include your Paystack reference so the order can be found quickly."],
  ["delivery", "Delivery information", "èrè fídíò currently demonstrates delivery across Nigeria. Delivery fees and courier timelines are not charged in this HNG test build; the checkout tells shoppers when a fee has not been configured."],
  ["returns", "Returns & exchanges", "This is a demonstration storefront and does not fulfil real purchases. In a live store, sealed games would be eligible for return only under the published policy and consumer-protection requirements."],
  ["faq", "Frequently asked questions", "All products represent sealed physical game discs. Prices are shown in naira, Paystack runs in test mode, and the confirmation email is sent through Mailgun to an authorised test recipient."],
  ["payment", "Payment information", "Checkout uses Paystack test mode. No real charge should be made with Paystack’s documented test payment details. Store totals are recalculated on the server from Supabase product prices."],
  ["privacy", "Privacy policy", "This HNG demonstration collects only the details entered for the test order. Authentication is handled by Google and Supabase. Payment details are handled by Paystack and are not stored by èrè fídíò."],
  ["terms", "Terms of service", "èrè fídíò is an HNG learning project. Product availability, delivery, discounts and payment are demonstrations and do not create a real retail fulfilment obligation."],
] as const;

export default function HelpPage() {
  return <main className="site-shell"><StoreHeader />
    <section className="store-container info-page"><p className="design-eyebrow">THE DETAILS</p><h1>Help and store information</h1><p>Clear information for the èrè fídíò HNG demonstration.</p>
      <div className="info-sections">{sections.map(([id, title, copy]) => <article id={id} key={id}><h2>{title}</h2><p>{copy}</p></article>)}</div>
    </section><StoreFooter /></main>;
}
