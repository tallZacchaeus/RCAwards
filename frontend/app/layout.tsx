import type { Metadata, Viewport } from "next";
import { Cinzel, Playfair_Display, Cormorant_Garamond, Manrope } from "next/font/google";
import "./globals.css";

const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-cinzel",
  display: "swap",
});
const playfair = Playfair_Display({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-playfair",
  display: "swap",
});
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});
const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

export const metadata: Metadata = {
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
  },
  twitter: {
    card: "summary_large_image",
    title: "The Redemption City Awards of Excellence 2026",
    description:
      "Celebrating a culture of excellence across Redemption City. Powered by City Breed.",
    creator: "@thecitybreed",
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${cinzel.variable} ${playfair.variable} ${cormorant.variable} ${manrope.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
