import { fr, Dictionary } from "./dictionaries/fr";
import { ar } from "./dictionaries/ar";
import { en } from "./dictionaries/en";

export type Locale = "fr" | "ar" | "en";
export const defaultLocale: Locale = "fr";
export const supportedLocales: Locale[] = ["fr", "ar", "en"];

const dictionaries: Record<Locale, Dictionary> = {
  fr,
  ar,
  en,
};

export function getDictionary(locale: string = "fr"): Dictionary {
  if (locale === "ar") return dictionaries.ar;
  if (locale === "en") return dictionaries.en;
  return dictionaries.fr;
}

export function isRTL(locale: string = "fr"): boolean {
  return locale === "ar";
}

export function formatMAD(amount: number | string, locale: string = "fr"): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return "0.00 MAD";

  if (locale === "ar") {
    return `${num.toFixed(2)} د.م.`;
  }
  return `${num.toFixed(2)} MAD`;
}
