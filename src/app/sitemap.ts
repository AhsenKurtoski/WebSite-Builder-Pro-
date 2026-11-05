import type { MetadataRoute } from "next";
import { LEGAL_PAGES, PUBLIC_PAGES } from "@/lib/site/pages";
import { absoluteUrl } from "@/lib/util/site-url";

/**
 * Sitemap delle pagine pubbliche.
 *
 * La pagina di stato resta fuori: è operativa e dichiara `noindex`. Le pagine
 * interne dell'applicazione (dashboard, studio, impostazioni) non compaiono per
 * lo stesso motivo — non sono materiale da indice.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: absoluteUrl("/"),
      changeFrequency: "weekly",
      priority: 1,
    },
    ...[...PUBLIC_PAGES, ...LEGAL_PAGES].map((page) => ({
      url: absoluteUrl(page.href),
      changeFrequency: "monthly" as const,
      priority: page.priority,
    })),
  ];
}
