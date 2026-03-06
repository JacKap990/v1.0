import type { Metadata } from "next";
import { Heebo, Inter } from "next/font/google";
import "./globals.css";
import { NextAuthProvider } from "@/components/NextAuthProvider";
import { BottomNav } from "@/components/BottomNav";
import { Header } from "@/components/Header";
import { ToastProvider } from "@/components/ui/Toast";
import { MainLayoutWrapper } from "@/components/MainLayoutWrapper";
import { ErrorBoundary } from "@/components/ErrorBoundary";

import { getUserSettings } from "@/app/actions/settings";
import { ThemeProvider } from "@/components/ThemeProvider";

const heebo = Heebo({
  variable: "--font-heebo",
  subsets: ["hebrew", "latin"],
  weight: ["300", "400", "500", "700", "900"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "המזווה החכם",
  description: "ניהול מצרכים מתקדם ומבוסס בינה מלאכותית",
};

import { LanguageProvider } from "@/components/LanguageProvider";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getUserSettings() as any;
  const lang = settings?.language || "he";
  const dir = lang === "en" ? "ltr" : "rtl";

  return (
    <html lang={lang} dir={dir} suppressHydrationWarning>
      <body
        className={`${heebo.variable} ${inter.variable} antialiased relative min-h-screen`}
      >
        <NextAuthProvider>
          <LanguageProvider initialLanguage={lang}>
            <ThemeProvider
              initialTheme={settings?.themePref || "system"}
              initialColor={settings?.colorTheme || "indigo"}
              initialDensity={settings?.displayDensity || "comfortable"}
            >
              <ToastProvider>
                <ErrorBoundary>
                  <MainLayoutWrapper profileImage={settings?.profileImage}>
                    {children}
                  </MainLayoutWrapper>
                </ErrorBoundary>
              </ToastProvider>
            </ThemeProvider>
          </LanguageProvider>
        </NextAuthProvider>
      </body>
    </html>
  );
}
