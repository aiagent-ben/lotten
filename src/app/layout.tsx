import type { ReactNode } from "react";
import { Inter, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { LocaleProvider } from "@/components/LocaleProvider";

const interSans = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const cormorantDisplay = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={cn("h-full antialiased", interSans.variable, cormorantDisplay.variable)}>
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        <LocaleProvider>{children}</LocaleProvider>
      </body>
    </html>
  );
}
