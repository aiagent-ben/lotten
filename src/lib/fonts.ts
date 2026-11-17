import { Inter, Cormorant_Garamond } from 'next/font/google';

export const interSans = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

export const cormorantDisplay = Cormorant_Garamond({
  variable: '--font-cormorant',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});
