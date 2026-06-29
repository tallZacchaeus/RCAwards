import { Hero } from "@/components/hero";
import { BreedPillars } from "@/components/breed-pillars";
import { AboutAward } from "@/components/about-award";
import { Objectives } from "@/components/objectives";
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
      <BreedPillars />
      <AboutAward />
      <Objectives />
      <HowToNominate />
      <Categories />
      <WinnersGallery />
      <Sponsors />
      <Faq />
      <NominateCta />
    </>
  );
}
