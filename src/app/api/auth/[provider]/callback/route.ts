import { handleOAuthCallback } from "@/lib/auth/callback";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ provider: string }> },
): Promise<Response> {
  const { provider } = await params;
  const redirectPath = provider === "google" ? "/google/callback" : `/api/auth/${provider}/callback`;
  return handleOAuthCallback(request, provider, redirectPath);
}
