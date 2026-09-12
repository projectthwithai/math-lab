import type { Metadata, Viewport } from "next";
import { Inter, Noto_Sans_JP, JetBrains_Mono } from "next/font/google";
import Navbar from "@/components/layout/Navbar";
import BottomNav from "@/components/layout/BottomNav";
import UserStoreHydrator from "@/components/layout/UserStoreHydrator";
import AppThemeProvider from "@/components/layout/ThemeProvider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const notoSansJp = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-noto-sans-jp",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Math Lab | 理数AI学習OS by Apex",
  description: "東大・難関大レベルまで、最短で思考力を覚醒させる理数AI学習OS",
};

export const viewport: Viewport = {
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ja"
      suppressHydrationWarning
      className={`${inter.variable} ${notoSansJp.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-slate-50 text-slate-900 transition-colors duration-300 dark:bg-black dark:text-zinc-100">
        <AppThemeProvider>
          <UserStoreHydrator />
          <Navbar />
          <div className="flex-1 pb-20 md:pb-0">{children}</div>
          <BottomNav />
        </AppThemeProvider>
      </body>
    </html>
  );
}
