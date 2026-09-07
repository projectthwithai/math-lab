'use client';

// ==========================================
// Apex Suite: Math Lab - Theme Provider
// ==========================================
// next-themes で <html> に `dark` / `light` クラスを付与する。
// Tailwind v4 の `@custom-variant dark` と組み合わせてクラス戦略で切り替える。

import { ThemeProvider as NextThemesProvider } from 'next-themes';

interface AppThemeProviderProps {
  children: React.ReactNode;
}

export default function AppThemeProvider({ children }: AppThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange={false}
    >
      {children}
    </NextThemesProvider>
  );
}
