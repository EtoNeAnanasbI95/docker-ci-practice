import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/app/providers";
import Link from "next/link";
import { SiteNav } from "@/components/layout/site-nav";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Chairs Shop",
  description: "Онлайн-магазин дизайнерских стульев с авторизацией через SSO",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const themeInitScript = `(function(){try{var theme=localStorage.getItem('shop.theme');if(!theme){var prefersDark=window.matchMedia('(prefers-color-scheme: dark)').matches;theme=prefersDark?'dark':'light';}if(theme==='dark'){document.documentElement.classList.add('dark');}else{document.documentElement.classList.remove('dark');}}catch(e){}})();`;

  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        <Script id="theme-init" strategy="beforeInteractive">
          {themeInitScript}
        </Script>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground px-auto`}
      >
        <Providers>
          <div className="flex min-h-screen flex-col">
            <header className="border-b bg-background/90 backdrop-blur">
              <div className="container flex h-16 items-center justify-between mx-auto">
                <Link href="/" className="text-lg font-semibold">
                  Chairly Shop
                </Link>
                <SiteNav />
              </div>
            </header>
            <main className="flex-1">{children}</main>
            <footer className="border-t bg-muted/40">
              <div className="container flex flex-col gap-2 px-4 py-6 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between mx-auto">
                <span>© {new Date().getFullYear()} Chairly. Все права защищены.</span>
                <span>SSO + Adminer интеграция · PostgreSQL процедуры и представления</span>
              </div>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
