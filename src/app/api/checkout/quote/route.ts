import { NextResponse } from "next/server";
import { createCheckoutQuote } from "@/lib/quote";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const quote = await createCheckoutQuote(body.items, typeof body.discountCode === "string" ? body.discountCode : "");
    return NextResponse.json({ subtotalKobo: quote.subtotalKobo, discountKobo: quote.discountKobo, totalKobo: quote.totalKobo, discountCode: quote.discountCode });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "We couldn’t calculate your order." }, { status: 422 });
  }
}
