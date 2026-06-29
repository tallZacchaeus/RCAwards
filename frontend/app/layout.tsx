import type { Metadata, Viewport } from "next";
import { Cinzel, Playfair_Display, Cormorant_Garamond, Manrope } from "next/font/google";
import "./globals.css";
import { SmoothScroll } from "@/components/smooth-scroll";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { EVENT } from "@/lib/site";

const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-cinzel",
});
const playfair = Playfair_Display({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-playfair",
});
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
});
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });

export const metadata: Metadata = {
  title: "The Redemption City Awards of Excellence 2026",
  description:
    "The 4th edition of the Redemption City Award of Excellence — powered by City Breed. Celebrating a culture of excellence across Redemption City. Nominations open for 2026.",
  openGraph: {
    title: "The Redemption City Awards of Excellence 2026",
    description:
      "Celebrating a culture of excellence across Redemption City. Powered by City Breed.",
    type: "website",
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
      className={`${cinzel.variable} ${playfair.variable} ${cormorant.variable} ${manrope.variable}`}
    >
      <body>
        <SmoothScroll>
          <SiteHeader />
          <main>{children}</main>
          <SiteFooter eventDate={EVENT.dateLabel} />
        </SmoothScroll>
      </body>
    </html>
  );
}
