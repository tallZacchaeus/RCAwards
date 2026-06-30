import { Hero } from "@/components/hero";
import { AwardFeature } from "@/components/award-feature";
import { BreedPillars } from "@/components/breed-pillars";
import { LetterDirector } from "@/components/letter-director";
import { Objectives } from "@/components/objectives";
import { EventSchedule } from "@/components/event-schedule";
import { HowToNominate } from "@/components/how-to-nominate";
import { Categories } from "@/components/categories";
import { WinnersGallery } from "@/components/winners-gallery";
import { Sponsors } from "@/components/sponsors";
import { Faq } from "@/components/faq";
import { NominateCta } from "@/components/nominate-cta";

export default function Home() {
  return (
    <>
      <Hero />
      <AwardFeature />
      <BreedPillars />
      <LetterDirector />
      <Objectives />
      <EventSchedule />
      <HowToNominate />
      <Categories />
      <WinnersGallery />
      <Sponsors />
      <Faq />
      <NominateCta />
    </>
  );
}
