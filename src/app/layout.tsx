import type { Metadata } from "next";
import { Heebo, Inter } from "next/font/google";
import "./globals.css";
import { NextAuthProvider } from "@/components/NextAuthProvider";
import { ToastProvider } from "@/components/ui/Toast";
import { MainLayoutWrapper } from "@/components/MainLayoutWrapper";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { cookies } from "next/headers";
import { ThemeProvider } from "@/components/ThemeProvider";
import { LanguageProvider } from "@/components/LanguageProvider";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Static defaults for SSR. Hydration happens in ThemeProvider/LanguageProvider on client.
  const lang = "he";
  const theme = "system";
  const color = "indigo";
  const density = "comfortable";
  const profileImage = null;

  const dir = "rtl";

  return (
    <html lang={lang} dir={dir} suppressHydrationWarning>
      <body
        className={`${heebo.variable} ${inter.variable} antialiased relative min-h-screen`}
      >
        <NextAuthProvider>
          <LanguageProvider initialLanguage={lang}>
            <ThemeProvider
              initialTheme={theme as any}
              initialColor={color as any}
              initialDensity={density as any}
            >
              <ToastProvider>
                <ErrorBoundary>
                  <MainLayoutWrapper profileImage={profileImage}>
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
