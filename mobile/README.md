# èrè fídíò mobile

Expo/React Native client for the HNG Task 3 extension of èrè fídíò.

## Features

- Shared Supabase catalogue and Google account
- Guest cart stored on the device
- Guest-cart merge after sign-in
- Duplicate quantities added together with a review alert
- Supabase Realtime cart sync with web and other mobile clients
- Product search, platform filtering, product details and quantity controls
- Secure checkout handoff to the deployed Paystack test checkout

## Setup

1. Copy `.env.example` to `.env.local`.
2. Add the same public Supabase URL and anon key used by the web project.
3. Run `npm install`.
4. Run `npx expo start` and scan the QR code with Expo Go.
5. On the Login screen, copy the displayed redirect URL and add it to Supabase Authentication → URL Configuration if it is not already allowed.

Never add the Supabase service-role key, Paystack secret or Mailgun key to the mobile app.

## Checks

```bash
npm run lint
npm run typecheck
npx expo-doctor
```
