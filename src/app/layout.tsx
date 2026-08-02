import type { Metadata } from 'next';
import { inter, jetbrainsMono, firaCode } from '@/lib/fonts';
import { Navbar } from '@/components/ui/Navbar';
import { CommandPalette } from '@/components/ui/CommandPalette';
import './globals.css';

export const metadata: Metadata = {
  title: 'CIT Chennai Coding Test Platform',
  description: 'Internal coding assessment platform for college faculty and students.',
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
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const theme = localStorage.getItem('theme') || 'light';
                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })()
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 font-sans antialiased flex flex-col selection:bg-blue-500 selection:text-white dark:selection:text-zinc-950 transition-colors duration-150">
        <Navbar />
        <CommandPalette />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}

