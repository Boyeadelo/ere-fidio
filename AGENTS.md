# AGENTS.md

## Project

èrè fídíò is an HNG demonstration storefront for sealed physical PlayStation and Xbox games in Nigeria. Preserve the exact Yoruba wordmark and the supplied cream, forest and terracotta design system.

## Rules

- Keep Supabase authoritative for products, prices, stock, discounts and orders.
- Never trust prices, totals, discounts, roles or payment status supplied by the browser.
- Never expose service-role, Paystack secret or Mailgun credentials to client components.
- Keep Paystack in test mode unless the owner explicitly authorises a separate live-commerce project.
- Preserve guest checkout and Google authentication.
- Preserve the desktop/mobile artboard hierarchy and the 1024px navigation breakpoint.
- Do not replace real catalogue content with fictional artboard copy.
- Keep product imagery data-driven through `image_url`; use bundled concept art only as an honest temporary fallback.
- Do not commit `.env.local`, `.vercel`, build output or credentials.

## Required checks

Run `npm run check` before deploying. Verify `/`, `/shop`, one `/games/[id]` route, `/cart`, `/checkout`, `/login`, `/admin`, `/help`, `/robots.txt` and `/sitemap.xml`. For visual changes, check 390, 768, 1023, 1024 and 1440 pixel widths and confirm there is no horizontal overflow.
