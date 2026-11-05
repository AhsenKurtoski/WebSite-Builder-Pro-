import type { Metadata } from "next";
import "./globals.css";
import { AUTHOR_NAME, SITE_NAME, SITE_URL, STUDIO_NAME } from "@/lib/util/site-url";

const siteUrl = SITE_URL;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${SITE_NAME} — website builder AI`,
    template: `%s · ${SITE_NAME}`,
  },
  description:
    "Descrivi l'attività, ottieni un sito completo: pagine, testi, SEO e pagine legali. Editor visuale ed export statico autosufficiente. Local-first: funziona anche senza chiavi API.",
  applicationName: SITE_NAME,
  keywords: ["website builder", "AI", "sito web", "statico", "SEO", "local-first"],
  authors: [{ name: AUTHOR_NAME }],
  // La vetrina si indicizza; le pagine interne dichiarano `noindex` per conto loro.
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    locale: "it_IT",
    url: siteUrl,
    siteName: SITE_NAME,
    title: "Atelier — website builder AI",
    description:
      "Un prompt, un sito completo e pubblicabile. Funziona senza chiavi API, l'anteprima è identica all'export.",
  },
  category: "design",
  creator: STUDIO_NAME,
  publisher: STUDIO_NAME,
  twitter: {
    card: "summary_large_image",
    title: "Atelier — website builder AI",
    description: "Un prompt, un sito completo e pubblicabile: editor visuale ed export statico autosufficiente.",
  },
  formatDetection: { telephone: false },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0b0d12",
  colorScheme: "dark" as const,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  );
}
