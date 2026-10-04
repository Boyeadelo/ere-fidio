import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-auth";

const schema = z.object({
  id: z.string().uuid(),
  status: z.enum(["PAID", "PROCESSING", "PACKED", "DISPATCHED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"]),
});

export async function PATCH(request: Request) {
  const access = await requireAdmin(request);
  if (!access) return NextResponse.json({ error: "Administrator access required." }, { status: 403 });
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid order update." }, { status: 422 });
  const { error } = await access.admin.from("orders").update({ status: parsed.data.status }).eq("id", parsed.data.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
