import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const { searchParams } = requestUrl;
  const origin = process.env.NEXT_PUBLIC_APP_URL || requestUrl.origin.replace("0.0.0.0", "172.19.122.9");
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      const loginUrl = new URL("/login", origin);
      loginUrl.searchParams.set("error", "Google sign-in could not be completed. Please try again.");
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}
