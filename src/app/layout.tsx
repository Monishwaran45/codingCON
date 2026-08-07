import type { Metadata } from 'next';
import { inter, jetbrainsMono, firaCode } from '@/lib/fonts';
import { Navbar } from '@/components/ui/Navbar';
import { CommandPalette } from '@/components/ui/CommandPalette';
import { ThemeScript } from '@/components/ThemeScript';
import { ThemeProvider } from 'next-themes';
import './globals.css';

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_META_TITLE || 'Coding Test Platform',
  description: `Internal coding assessment platform for ${process.env.NEXT_PUBLIC_INSTITUTE_NAME || 'your institute'}.`,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} ${firaCode.variable}`}
      suppressHydrationWarning
    >
      <head>
        <ThemeScript />
      </head>
      <body
        className="min-h-screen bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 font-sans antialiased flex flex-col selection:bg-blue-500 selection:text-white dark:selection:text-zinc-950 transition-colors duration-150"
      >
        <ThemeProvider 
          attribute="class" 
          defaultTheme="dark" 
          enableSystem={false}
          storageKey="codingcon-theme"
          enableTransitionOnChange={true}
          disableTransitionOnChange={false}
          forcedTheme={undefined}
        >
          <Navbar />
          <CommandPalette />
          <main className="flex-1">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}

