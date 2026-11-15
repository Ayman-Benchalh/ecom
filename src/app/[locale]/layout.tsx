import React from "react";
import { Navbar } from "@/components/storefront/navbar";
import { Footer } from "@/components/storefront/footer";
import { isRTL, defaultLocale, supportedLocales } from "@/lib/i18n";

export async function generateStaticParams() {
  return supportedLocales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const rtl = isRTL(locale);

  return (
    <div
      lang={locale}
      dir={rtl ? "rtl" : "ltr"}
      className="flex-1 flex flex-col min-h-screen"
    >
      <Navbar locale={locale} />
      <main className="flex-1">{children}</main>
      <Footer locale={locale} />
    </div>
  );
}

