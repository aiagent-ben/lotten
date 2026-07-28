"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { locales } from "@/i18n/request";

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Detect locale from pathname and set html lang attribute
  useEffect(() => {
    const segments = pathname.split("/").filter(Boolean);
    const locale = segments[0];
    
    if (locales.includes(locale as any)) {
      const localeMap: Record<string, string> = {
        en: "en",
        zh: "zh",
        my: "ms",
      };
      document.documentElement.lang = localeMap[locale] || "en";
    }
  }, [pathname]);

  return <>{children}</>;
}