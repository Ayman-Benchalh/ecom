import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  title: {
    default: "RAYANA — Mode & Essentiels Premium au Maroc",
    template: "%s | RAYANA",
  },
  description:
    "Boutique officielle RAYANA. Essentiels de qualité supérieure, packs avantageux, livraison express partout au Maroc et paiement sécurisé à la livraison (COD).",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className="min-h-screen flex flex-col font-sans bg-background text-foreground antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
