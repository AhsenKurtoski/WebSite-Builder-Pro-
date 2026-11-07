import { handleOAuthCallback } from "@/lib/auth/callback";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  return handleOAuthCallback(request, "google", "/google/callback");
}
