import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-auth";

const productSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(2).max(120),
  slug: z.string().trim().min(2).max(140).regex(/^[a-z0-9-]+$/),
  platform: z.enum(["PS5", "PS4", "Xbox"]),
  description: z.string().trim().max(1000).default(""),
  image_url: z.string().trim().url().or(z.literal("")).nullable().optional(),
  price_kobo: z.coerce.number().int().positive(),
  stock: z.coerce.number().int().min(0),
  is_published: z.boolean(),
  is_archived: z.boolean().default(false),
});

async function save(request: Request, update: boolean) {
  const access = await requireAdmin(request);
  if (!access) return NextResponse.json({ error: "Administrator access required." }, { status: 403 });
  const parsed = productSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid product." }, { status: 422 });
  const { id, ...values } = parsed.data;
  if (update && !id) return NextResponse.json({ error: "Product ID is required." }, { status: 400 });
  const query = update
    ? access.admin.from("products").update({ ...values, image_url: values.image_url || null }).eq("id", id!).select("*").single()
    : access.admin.from("products").insert({ ...values, image_url: values.image_url || null }).select("*").single();
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ product: data });
}

export async function POST(request: Request) { return save(request, false); }
export async function PATCH(request: Request) { return save(request, true); }
