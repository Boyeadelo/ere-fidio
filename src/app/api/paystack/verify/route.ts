import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const reference = new URL(request.url).searchParams.get("reference");
  if (!reference || !process.env.PAYSTACK_SECRET_KEY) {
    return NextResponse.json({ error: "A payment reference is required." }, { status: 400 });
  }

  const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
    cache: "no-store",
  });
  const result = await response.json();

  if (!response.ok || !result.status) {
    return NextResponse.json({ error: result.message || "Payment verification failed." }, { status: 502 });
  }

  return NextResponse.json({ status: result.data.status, reference: result.data.reference, amount: result.data.amount, paidAt: result.data.paid_at });
}
