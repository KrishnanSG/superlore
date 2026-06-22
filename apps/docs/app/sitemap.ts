import type { MetadataRoute } from "next";
import { source } from "@/lib/source";

const BASE = "https://superlore.vercel.app";

export const dynamic = "force-static";

/** Sitemap — every doc page from the source tree, plus the top-level routes. */
export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/docs`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE}/viewer`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/cloud`, changeFrequency: "monthly", priority: 0.5 },
  ];
  const docPages: MetadataRoute.Sitemap = source.getPages().map((p) => ({
    url: `${BASE}${p.url}`,
    changeFrequency: "weekly",
    priority: 0.7,
  }));
  return [...staticRoutes, ...docPages];
}
