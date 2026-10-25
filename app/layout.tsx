import type { Metadata } from 'next';
import { Righteous, Poppins } from 'next/font/google';
import './globals.css';

const righteous = Righteous({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-righteous',
  display: 'swap',
});

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'DuoVibe — Música compartida en tiempo real',
  description: 'Escucha y comparte música con alguien especial en tiempo real.',
  keywords: ['música', 'spotify', 'compartir', 'tiempo real', 'pareja'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${righteous.variable} ${poppins.variable}`}>
      <body className="min-h-dvh bg-zinc-950 text-zinc-100 font-poppins antialiased">
        {children}
      </body>
    </html>
  );
}
