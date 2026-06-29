import { SmoothScroll } from "@/components/smooth-scroll";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { EVENT } from "@/lib/site";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SmoothScroll>
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter eventDate={EVENT.dateLabel} />
    </SmoothScroll>
  );
}
