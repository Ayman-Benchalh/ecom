"use client";

import { usePathname, useRouter } from "next/navigation";
import { Globe } from "lucide-react";

interface LanguageSwitcherProps {
  currentLocale: string;
}

export function LanguageSwitcher({ currentLocale }: LanguageSwitcherProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLanguageChange = (newLocale: string) => {
    if (newLocale === currentLocale) return;

    // Set cookie
    document.cookie = `rayana_locale=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;

    // Replace locale in path
    const segments = pathname.split("/");
    segments[1] = newLocale;
    const newPath = segments.join("/") || `/${newLocale}`;
    router.push(newPath);
  };

  return (
    <div className="inline-flex items-center gap-1 p-1 bg-surface-container rounded-full border border-border text-xs font-medium">
      <Globe className="w-3.5 h-3.5 ml-1.5 text-muted-foreground mr-0.5" />
      <button
        onClick={() => handleLanguageChange("fr")}
        className={`px-2 py-1 rounded-full transition-colors cursor-pointer ${
          currentLocale === "fr"
            ? "bg-primary text-primary-foreground font-bold shadow-xs"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        FR
      </button>
      <button
        onClick={() => handleLanguageChange("ar")}
        className={`px-2 py-1 rounded-full transition-colors cursor-pointer ${
          currentLocale === "ar"
            ? "bg-primary text-primary-foreground font-bold shadow-xs"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        عربي
      </button>
      <button
        onClick={() => handleLanguageChange("en")}
        className={`px-2 py-1 rounded-full transition-colors cursor-pointer ${
          currentLocale === "en"
            ? "bg-primary text-primary-foreground font-bold shadow-xs"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        EN
      </button>
    </div>
  );
}
