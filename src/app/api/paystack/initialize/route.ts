import { NextResponse } from "next/server";
import { createCheckoutQuote } from "@/lib/quote";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin}/checkout`;

    if (!email) {
      return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
    }

    if (!process.env.PAYSTACK_SECRET_KEY) {
      return NextResponse.json({ error: "Paystack test mode is not configured on the server." }, { status: 503 });
    }

    const quote = await createCheckoutQuote(body.items, typeof body.discountCode === "string" ? body.discountCode : "");
    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, amount: quote.totalKobo, callback_url: callbackUrl, metadata: { discount_code: quote.discountCode } }),
      cache: "no-store",
    });
    const result = await response.json();

    if (!response.ok || !result.status) {
      return NextResponse.json({ error: result.message || "Paystack could not initialize this transaction." }, { status: 502 });
    }

    return NextResponse.json({ authorizationUrl: result.data.authorization_url, reference: result.data.reference });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to connect to Paystack right now." }, { status: 500 });
  }
}
