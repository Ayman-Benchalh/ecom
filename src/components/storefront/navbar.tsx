import Link from "next/link";
import { getDictionary, isRTL } from "@/lib/i18n";
import { LanguageSwitcher } from "./language-switcher";
import { ThemeToggle } from "../theme-toggle";
import { Truck, ShieldCheck, ShoppingBag } from "lucide-react";

interface NavbarProps {
  locale: string;
}

export function Navbar({ locale }: NavbarProps) {
  const dict = getDictionary(locale);
  const rtl = isRTL(locale);

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-background/90 border-b border-border transition-colors">
      {/* Moroccan High-Conversion Announcement Bar */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-900 to-emerald-950 text-white text-xs font-semibold py-2 px-4 text-center flex items-center justify-center gap-2 tracking-wide shadow-xs">
        <Truck className="w-3.5 h-3.5 shrink-0 text-emerald-300" />
        <span>{dict.storefront.freeDelivery}</span>
        <span className="hidden sm:inline opacity-60">•</span>
        <span className="hidden sm:inline text-amber-300 font-bold">
          {dict.storefront.cashOnDelivery}
        </span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <Link
          href={`/${locale}`}
          className="flex items-center gap-2 group cursor-pointer focus:outline-hidden"
        >
          <div className="w-9 h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-black tracking-wider text-lg shadow-sm group-hover:scale-105 transition-transform">
            R
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold tracking-tight text-xl text-foreground font-serif leading-none">
              RAYANA
            </span>
            <span className="text-[10px] tracking-widest text-muted-foreground uppercase font-medium mt-0.5">
              Casablanca
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-muted-foreground">
          <Link
            href={`/${locale}`}
            className="hover:text-primary transition-colors py-1"
          >
            {dict.nav.home}
          </Link>
          <Link
            href={`/${locale}/#offers`}
            className="hover:text-primary transition-colors py-1 text-primary font-bold"
          >
            {dict.nav.offers}
          </Link>
          <Link
            href={`/${locale}/order/track`}
            className="hover:text-primary transition-colors py-1"
          >
            {dict.nav.tracking}
          </Link>
          <Link
            href={`/${locale}/returns`}
            className="hover:text-primary transition-colors py-1"
          >
            {dict.nav.returns}
          </Link>
        </nav>

        {/* Controls: Language Switcher, Theme Toggle & Admin link */}
        <div className="flex items-center gap-2.5">
          <LanguageSwitcher currentLocale={locale} />
          <ThemeToggle />
          <Link
            href={`/${locale}/admin`}
            className="text-xs font-medium text-muted-foreground hover:text-foreground px-2 py-1 rounded-md border border-border/60 hover:bg-surface-container transition-colors hidden sm:inline-flex"
            title={dict.nav.admin}
          >
            {dict.nav.admin}
          </Link>
        </div>
      </div>
    </header>
  );
}
