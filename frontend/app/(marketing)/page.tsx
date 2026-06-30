import { Hero } from "@/components/hero";
import { AwardFeature } from "@/components/award-feature";
import { BreedPillars } from "@/components/breed-pillars";
import { LetterDirector } from "@/components/letter-director";
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
      <BreedPillars />
      <LetterDirector />
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
