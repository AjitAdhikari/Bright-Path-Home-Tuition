import type { Metadata } from "next";
import { Inter, Lexend, Noto_Sans_Devanagari } from "next/font/google";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { SITE } from "@/lib/constants";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "sonner";

/* Body / sans face — Inter. */
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

/* Heading / display face — Lexend. */
const lexend = Lexend({
  subsets: ["latin"],
  variable: "--font-lexend",
  display: "swap",
});

/* Monospace face — Geist Mono (self-hosted via the `geist` package, so there's
   no build-time Google Fonts fetch to fail on). Exposes --font-geist-mono. */

/* Devanagari for the नेपाली toggle. */
const devanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-noto-devanagari",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
  ),
  title: {
    default: `${SITE.name} — Verified home tutors across Nepal`,
    template: `%s · ${SITE.name}`,
  },
  description:
    "Bright Path matches your child with verified, background-checked home tutors. Tell us the class, subjects and area — a real person calls, shares 2–3 checked tutors, and you confirm only after a free demo.",
  openGraph: {
    title: `${SITE.name} — Verified home tutors across Nepal`,
    description:
      "Post a requirement, meet a verified tutor, confirm after a free demo.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${lexend.variable} ${GeistMono.variable} ${devanagari.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
