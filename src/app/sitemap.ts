import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://ere-fidio.vercel.app";
  return ["", "/shop", "/cart", "/login", "/help"].map((path) => ({ url: `${base}${path}`, lastModified: new Date(), changeFrequency: path === "/shop" ? "daily" : "weekly", priority: path === "" ? 1 : 0.7 }));
}
