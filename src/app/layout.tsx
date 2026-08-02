import type { Metadata } from 'next';
import { inter, jetbrainsMono, firaCode } from '@/lib/fonts';
import { Navbar } from '@/components/ui/Navbar';
import './globals.css';

export const metadata: Metadata = {
  title: 'codingCON | Competitive Coding & Algorithmic Contest Platform',
  description: 'Next.js 14 Competitive Coding Contest Platform with real-time verdicts, WebSocket streaming, and loss-averse leaderboards.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark ${inter.variable} ${jetbrainsMono.variable} ${firaCode.variable}`}
    >
      <body className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased flex flex-col selection:bg-cyan-500 selection:text-slate-950">
        <Navbar />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
