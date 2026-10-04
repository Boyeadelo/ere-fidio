# èrè fídíò

èrè fídíò (Yoruba for “video game”) is an HNG ecommerce demonstration for sealed physical PS5, PS4 and Xbox game discs in Nigeria.

**Live site:** https://ere-fidio.vercel.app

## Task deliverables

- Responsive storefront, catalogue, product, cart, checkout and confirmation screens
- Supabase Postgres catalogue, profiles, orders, order items, discount codes and admin roles
- Google authentication through Supabase Auth
- Paystack test-mode checkout and server-side payment verification
- Mailgun order-confirmation email
- Protected admin dashboard for products, discounts and order statuses
- Expo mobile app backed by the same Supabase project
- Guest carts on web and mobile that merge into one signed-in cart
- Supabase Realtime cart synchronisation across web and mobile
- Nigeria-only delivery form and naira pricing
- Vercel production deployment

Paystack is intentionally configured for **test mode**. This project is an HNG demonstration and does not fulfil real purchases.

## Technology

- Next.js 16, React and TypeScript
- Supabase Database and Auth
- Paystack test payments
- Mailgun transactional email
- Vercel hosting
- Manrope, bundled under the included SIL Open Font Licence

## Local setup

1. Run `npm install`.
2. Copy `.env.example` to `.env.local` and enter provider values locally. Never commit `.env.local`.
3. Run `supabase/schema.sql`, `supabase/001_public_catalog_access.sql`, `supabase/002_hng_completion.sql` and `supabase/003_shared_realtime_cart.sql` in the Supabase SQL Editor.
4. Configure Google as a Supabase Auth provider with `http://localhost:3000/auth/callback` and `https://ere-fidio.vercel.app/auth/callback`.
5. Run `npm run dev` and open http://localhost:3000.

## Environment variables

| Variable | Used for |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Browser and server Supabase URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public Supabase client |
| `SUPABASE_SERVICE_ROLE_KEY` | Protected server-side catalogue/order/admin work |
| `NEXT_PUBLIC_APP_URL` | Trusted OAuth and payment return origin |
| `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` | Public Paystack test key |
| `PAYSTACK_SECRET_KEY` | Server-side Paystack initialization/verification |
| `MAILGUN_API_KEY` | Server-side email delivery |
| `MAILGUN_DOMAIN` | Mailgun sending or sandbox domain |
| `MAILGUN_FROM_EMAIL` | Store confirmation sender |

## Useful commands

```bash
npm run dev
npm run lint
npm run typecheck
npm test
npm run build
npm run check
```

## Demonstration workflow

1. Browse or filter games by console.
2. Add games to the persistent cart.
3. Apply `WELCOME10` after the completion migration is installed.
4. Add games as a guest, then sign in with Google at checkout to merge them with the saved cross-device cart.
5. Enter Nigerian delivery details.
6. Complete a Paystack **test** payment.
7. Confirm the Supabase order record, stock change, success screen and Mailgun email.

## Admin dashboard

The owner account `boyeadelo@gmail.com` is promoted to admin by `supabase/002_hng_completion.sql`. After signing in, open `/admin` to manage products, discounts and order statuses.

## Security notes

- Secrets remain server-side and `.env.local` is ignored by Git.
- Shopper totals are calculated from Supabase prices on the server.
- Admin API routes validate the Supabase access token and admin profile role.
- Supabase Row Level Security protects shopper and administrator records.
- This HNG build uses a browser callback to complete test orders; it is not designed for real-money retail operations.

## Task 3 mobile app

The Expo app is in `mobile/` and uses the same Supabase catalogue, Google accounts and `cart_items` rows as the website.

1. Copy `mobile/.env.example` to `mobile/.env.local` and use the same public Supabase URL and anon key as the web app.
2. Add the redirect URL displayed on the mobile Login screen to Supabase Authentication → URL Configuration. During Expo Go development this is an `exp://.../--/auth/callback` URL.
3. Run `cd mobile && npm install && npx expo start`.
4. Scan the QR code with Expo Go.
5. Use the same Google account on web and mobile to test Realtime cart updates.

The mobile checkout hands off to the deployed web checkout for delivery details and Paystack test payment. The signed-in cart is already shared before that handoff.
