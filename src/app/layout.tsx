import type { Metadata } from "next";
import { CartProvider } from "@/components/CartProvider";
import CartMergeNotice from "@/components/CartMergeNotice";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://ere-fidio.vercel.app"),
  title: { default: "èrè fídíò", template: "%s · èrè fídíò" },
  description: "Physical PlayStation and Xbox games delivered across Nigeria",
  alternates: { canonical: "/" },
  openGraph: {
    title: "èrè fídíò",
    description: "Physical PlayStation and Xbox games delivered across Nigeria",
    url: "/",
    siteName: "èrè fídíò",
    locale: "en_NG",
    type: "website",
    images: [{ url: "/design-assets/hero.png", width: 1200, height: 630, alt: "èrè fídíò game store" }],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-NG">
      <body>
        <CartProvider>
          <CartMergeNotice />
          {children}
        </CartProvider>
      </body>
    </html>
  );
}
