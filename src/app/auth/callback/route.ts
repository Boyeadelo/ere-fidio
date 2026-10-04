import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const { searchParams } = requestUrl;
  const origin = requestUrl.origin.replace("0.0.0.0", "172.19.122.9");
  const code = searchParams.get("code");
  const cookieStore = await cookies();
  const savedNext = cookieStore.get("oauth_next")?.value;
  const next = savedNext?.startsWith("/") && !savedNext.startsWith("//") ? savedNext : "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      const loginUrl = new URL("/login", origin);
      loginUrl.searchParams.set("error", "Google sign-in could not be completed. Please try again.");
      return NextResponse.redirect(loginUrl);
    }
  }

  const response = NextResponse.redirect(`${origin}${next}`);
  response.cookies.delete("oauth_next");
  return response;
}
