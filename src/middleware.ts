import { NextResponse } from "next/server";
import type { NextRequest } from "next/request";

const supportedLocales = ["fr", "ar", "en"];
const defaultLocale = "fr";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Ignore API, static files, and Next internal assets
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Check if pathname already starts with a supported locale
  const pathnameHasLocale = supportedLocales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (pathnameHasLocale) {
    return NextResponse.next();
  }

  // Get preferred or saved locale from cookie or header
  const savedLocale = request.cookies.get("rayana_locale")?.value;
  const targetLocale =
    savedLocale && supportedLocales.includes(savedLocale)
      ? savedLocale
      : defaultLocale;

  const url = request.nextUrl.clone();
  url.pathname = `/${targetLocale}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
