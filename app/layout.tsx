import type { Metadata } from "next";
import { Playfair_Display, Source_Serif_4, Noto_Sans_Devanagari } from "next/font/google";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { SITE } from "@/lib/constants";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "sonner";

/* Body / UI face — Source Serif 4. A highly readable editorial serif that
   stays comfortable in forms, tables and long copy. */
const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-source-serif",
  display: "swap",
});

/* Heading / display face — Playfair Display. Large editorial headings with an
   elegant italic used selectively for emphasis. */
const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  style: ["normal", "italic"],
  variable: "--font-playfair",
  display: "swap",
});

/* Monospace face — Geist Mono (self-hosted via the `geist` package). Used for
   small uppercase technical labels / metadata. Exposes --font-geist-mono. */

/* Devanagari for the नेपाली toggle. Not preloaded: the default (English) view
   never needs it, so it stays out of the critical path and loads on demand
   (with swap) only when Nepali content is shown. */
const devanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-noto-devanagari",
  display: "swap",
  preload: false,
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
      className={`${sourceSerif.variable} ${playfair.variable} ${GeistMono.variable} ${devanagari.variable} h-full antialiased`}
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
