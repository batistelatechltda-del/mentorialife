import { NextRequest, NextResponse } from "next/server";
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const PUBLIC_PATHS = ["/", "/welcome"];

  const token = request.cookies.get("token")?.value || "";

  if (!token && !PUBLIC_PATHS.includes(pathname)) {
    return NextResponse.redirect(new URL("/welcome", request.url));
  }

  if (token && PUBLIC_PATHS.includes(pathname)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/welcome", "/dashboard/:path*"],
};
