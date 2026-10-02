import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-auth";

const schema = z.object({
  code: z.string().trim().min(2).max(40).transform((value) => value.toUpperCase()),
  percentage_off: z.coerce.number().positive().max(100),
  is_active: z.boolean().default(true),
});

export async function POST(request: Request) {
  const access = await requireAdmin(request);
  if (!access) return NextResponse.json({ error: "Administrator access required." }, { status: 403 });
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid code and percentage." }, { status: 422 });
  const { data, error } = await access.admin.from("discount_codes").upsert(parsed.data, { onConflict: "code" }).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ discount: data });
}
