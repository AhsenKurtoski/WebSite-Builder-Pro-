import { afterEach, describe, expect, it } from "vitest";
import { isSecureRequest, requestOrigin } from "@/lib/auth/origin";

afterEach(() => {
  delete process.env.NEXT_PUBLIC_SITE_URL;
});

function req(url: string, headers: Record<string, string> = {}): Request {
  return new Request(url, { headers });
}

describe("origine pubblica per OAuth", () => {
  it("usa gli header inoltrati dal proxy", () => {
    const request = req("http://10.0.0.4:3000/api/auth/google", {
      "x-forwarded-host": "atelier.example.com",
      "x-forwarded-proto": "https",
    });
    expect(requestOrigin(request)).toBe("https://atelier.example.com");
    expect(isSecureRequest(request)).toBe(true);
  });

  it("prende il primo valore quando il proxy concatena gli header", () => {
    const request = req("http://interno/api/auth/github", {
      "x-forwarded-host": "atelier.example.com, interno",
      "x-forwarded-proto": "https, http",
    });
    expect(requestOrigin(request)).toBe("https://atelier.example.com");
  });

  it("funziona in locale su http e senza header inoltrati", () => {
    const request = req("http://localhost:3000/login", { host: "localhost:3000" });
    expect(requestOrigin(request)).toBe("http://localhost:3000");
    expect(isSecureRequest(request)).toBe(false);
  });

  it("usa NEXT_PUBLIC_SITE_URL solo quando manca l'host", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://atelier.example.com/";
    expect(requestOrigin(req("http://interno/"))).toBe("https://atelier.example.com");
    const withHost = req("http://interno/", { host: "preview.example.com", "x-forwarded-proto": "https" });
    expect(requestOrigin(withHost)).toBe("https://preview.example.com");
  });
});
