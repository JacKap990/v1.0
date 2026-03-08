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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const lang = cookieStore.get("pantry-lang")?.value || "he";
  const theme = cookieStore.get("pantry-theme")?.value || "system";
  const color = cookieStore.get("pantry-color")?.value || "indigo";
  const density = cookieStore.get("pantry-density")?.value || "comfortable";
  const profileImage = cookieStore.get("pantry-profile")?.value || null;

  const dir = lang === "en" ? "ltr" : "rtl";

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
