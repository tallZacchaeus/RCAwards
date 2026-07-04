import type { Metadata, Viewport } from "next";
import { Cinzel, Playfair_Display, Manrope } from "next/font/google";
import "./globals.css";

const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-cinzel",
  display: "swap",
});
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});
const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
// A real landscape event photo makes a far better share card than the
// transparent wordmark. Replace with a dedicated 1200x630 designed image later.
const OG_IMAGE = {
  url: "/brand/photos/gallery/g20.jpg",
  width: 1400,
  height: 933,
  alt: "The Redemption City Awards of Excellence 2026",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "The Redemption City Awards of Excellence 2026",
    template: "%s · RCA 2026",
  },
  description:
    "The 4th edition of the Redemption City Award of Excellence — powered by City Breed. Celebrating a culture of excellence across Redemption City. Nominations open for 2026.",
  keywords: [
    "Redemption City Awards",
    "RCA 2026",
    "City Breed",
    "excellence",
    "awards",
    "nominations",
    "RCCG",
    "SATGO",
  ],
  authors: [{ name: "City Breed" }],
  creator: "City Breed",
  openGraph: {
    title: "The Redemption City Awards of Excellence 2026",
    description:
      "Celebrating a culture of excellence across Redemption City. Powered by City Breed. Nominations are open.",
    type: "website",
    locale: "en_GB",
    siteName: "Redemption City Awards",
    url: SITE_URL,
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: "The Redemption City Awards of Excellence 2026",
    description:
      "Celebrating a culture of excellence across Redemption City. Powered by City Breed.",
    creator: "@thecitybreed",
    images: [OG_IMAGE.url],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
    },
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0807",
  width: "device-width",
  initialScale: 1,
};

import { CursorTrail } from "@/components/cursor-trail";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${cinzel.variable} ${playfair.variable} ${manrope.variable}`}
    >
      <body>
        <CursorTrail />
        {children}
      </body>
    </html>
  );
}

