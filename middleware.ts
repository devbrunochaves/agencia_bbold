import { NextResponse, type NextRequest } from "next/server";
import { updateSupabaseSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { response, user } = await updateSupabaseSession(request);
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/flow") && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(url);
  }

  if (pathname === "/login" && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/flow";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/flow/:path*", "/login"],
};
