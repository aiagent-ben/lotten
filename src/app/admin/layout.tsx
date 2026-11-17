import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { interSans, cormorantDisplay } from '@/lib/fonts';

export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={cn('h-full antialiased', interSans.variable, cormorantDisplay.variable)}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        {children}
      </body>
    </html>
  );
}
