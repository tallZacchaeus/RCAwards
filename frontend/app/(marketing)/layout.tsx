import { SmoothScroll } from "@/components/smooth-scroll";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PageTransition } from "@/components/page-transition";
import { EVENT } from "@/lib/site";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SmoothScroll>
      <SiteHeader />
      <main className="flex flex-col flex-1">
        <PageTransition>{children}</PageTransition>
      </main>
      <SiteFooter eventDate={EVENT.dateLabel} />
    </SmoothScroll>
  );
}

