'use client';

/**
 * ThemeScript - Injects a script that runs before page renders to prevent
 * flash of unstyled content (FOUC) when switching between light/dark modes.
 */
export function ThemeScript() {
  const themeScript = `
    (function() {
      try {
        const theme = localStorage.getItem('codingcon-theme') || 'dark';
        if (theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      } catch (e) {}
    })();
  `;

  return (
    <script dangerouslySetInnerHTML={{ __html: themeScript }} />
  );
}
