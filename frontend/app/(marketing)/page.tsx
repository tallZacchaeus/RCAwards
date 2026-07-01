import { Hero } from "@/components/hero";
import { AwardFeature } from "@/components/award-feature";
import { Stats } from "@/components/stats";
import { BreedPillars } from "@/components/breed-pillars";
import { Objectives } from "@/components/objectives";
import { HowToNominate } from "@/components/how-to-nominate";
import { Categories } from "@/components/categories";
import { WinnersGallery } from "@/components/winners-gallery";
import { MeetJury } from "@/components/jury";
import { Sponsors } from "@/components/sponsors";
import { Faq } from "@/components/faq";
import { NominateCta } from "@/components/nominate-cta";

export default function Home() {
  return (
    <>
      <Hero />
      <AwardFeature />
      <Stats />
      <BreedPillars />
      <Objectives />
      <HowToNominate />
      <Categories />
      <WinnersGallery />
      <MeetJury />
      <Sponsors />
      <Faq />
      <NominateCta />
    </>
  );
}
