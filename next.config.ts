import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Evita che Next risalga fino alla home dell'utente cercando un lockfile
  // estraneo al progetto e includa file fuori dall'albero traced.
  outputFileTracingRoot: process.cwd(),
  // Il sito generato viene renderizzato in una route isolata e servito nell'iframe
  // di anteprima dell'editor: nessun bundler aggiuntivo, solo HTML/CSS statico.
  async headers() {
    const security = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
      { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
    ];
    return [
      { source: "/:path*", headers: security },
      {
        source: "/api/:path*",
        headers: [...security, { key: "Cache-Control", value: "no-store" }],
      },
    ];
  },
};

export default nextConfig;
