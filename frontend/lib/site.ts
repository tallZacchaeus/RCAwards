/* Static site content, sourced from the CityBreed brief and the official flyer.
   Category data is fetched live from the API at runtime, with this list as the
   build-time / offline fallback. */

export const EVENT = {
  name: "The Redemption City Awards of Excellence",
  edition: "4th Edition",
  tagline: "Excellence in motion. Greatness within reach.",
  poweredBy: "City Breed",
  social: "@thecitybreed",
  // Wednesday, 29 July 2026, 7pm WAT — from the official flyer. The +01:00 offset
  // makes the countdown target an absolute instant, not each visitor's local 7pm.
  dateISO: "2026-07-29T19:00:00+01:00",
  dateLabel: "Wednesday, 29 July 2026",
  nominateUrl: "/nominate",
};

export const NAV = [
  { label: "About", href: "/#about" },
  { label: "Categories", href: "/#categories" },
  { label: "Winners", href: "/#winners" },
  { label: "Jury", href: "/#jury" },
  { label: "Vote", href: "/vote" },
  { label: "Nominate", href: "/nominate" },
];

/** The 2025 judging panel (from the committee judging sheet). Add photos to
    /brand/jury/<slug>.jpg later; the cards fall back to initials. */
export const JURY = [
  { name: "Pastor Dare", role: "Chair of Jury" },
  { name: "Pastor Osoba", role: "Judging Committee" },
  { name: "Pastor Kunle", role: "Judging Committee" },
  { name: "Pastor Isaiah", role: "Judging Committee" },
  { name: "Dr. Peter", role: "Judging Committee" },
  { name: "Pastor Olumide", role: "Judging Committee" },
  { name: "Pastor Cole", role: "Judging Committee" },
  { name: "Sis. Tolu", role: "Judging Committee" },
  { name: "Oluwafunmilola", role: "Judging Committee" },
  { name: "Sis. Jumoke", role: "Judging Committee" },
  { name: "Sis. Tosin", role: "Judging Committee" },
  { name: "Pastor Femi", role: "Judging Committee" },
];

/** City Breed's five identity pillars. */
export const BREED = [
  {
    letter: "B",
    title: "Builders",
    body: "Visionary leaders committed to a profound, widespread impact globally — touching lives in every corner of the world, driven by purpose.",
  },
  {
    letter: "R",
    title: "Repairers",
    body: "As Kingdom ambassadors, we inspire change, mend the broken, and revitalise the world — heralding biblical values with love and righteousness.",
  },
  {
    letter: "E",
    title: "Executors",
    body: "We are doers, not dreamers alone. We turn vision into action, strategy into results, and potential into reality with precision and passion.",
  },
  {
    letter: "E",
    title: "Excellence",
    body: "Excellence reflects every fibre of our existence. It is not just what we do — it is who we are.",
  },
  {
    letter: "D",
    title: "Dominate",
    body: "A global mindset and drive. We strive for global impact, leaving a legacy for generations.",
  },
];

export const OBJECTIVES = [
  {
    title: "Recognition",
    body: "Celebrate individuals, businesses and organisations that have contributed to the development of Redemption City.",
  },
  {
    title: "Excellence",
    body: "Inspire a desire for excellence in all areas of human endeavour among residents of Redemption City.",
  },
  {
    title: "Achievement",
    body: "Promote excellent delivery of services and innovations among businesses and service providers in the City.",
  },
  {
    title: "Elegance",
    body: "Deliver a world-class ceremony that reflects the prestige, dignity, and beauty of excellence itself.",
  },
];

export const HOW_TO_NOMINATE = [
  { step: "01", title: "Visit the Site", body: "Open the nomination portal or scan the code from any City Breed channel." },
  { step: "02", title: "Choose a Category", body: "Browse the award categories and select the one you wish to nominate for." },
  { step: "03", title: "Fill the Form", body: "Enter the details about your nominee and submit your nomination." },
  { step: "04", title: "Submit More", body: "Return to the categories page to nominate for other deserving categories." },
];

export const FAQ = [
  {
    q: "Who can submit a nomination?",
    a: "Anyone. The power is in your hands — residents, members, partners and the wider community are all welcome to recognise excellence.",
  },
  {
    q: "How many categories can I nominate for?",
    a: "As many as you like. After submitting one nomination, return to the categories page to nominate for other deserving categories.",
  },
  {
    q: "Is there a cost to nominate?",
    a: "No. Nominating is completely free.",
  },
  {
    q: "How are winners selected?",
    a: "Nominations are reviewed by a judging committee against each category's criteria, with the strongest nominees shortlisted and celebrated on the award night.",
  },
  {
    q: "When and where is the ceremony?",
    a: `The 4th edition holds on ${EVENT.dateLabel} — a world-class celebration of the people who make Redemption City extraordinary.`,
  },
];

/** Group labels for the categories section. */
export const GROUP_LABELS: Record<string, string> = {
  city: "Redemption City",
  regional: "RCCG Regional",
  departmental: "Departmental Impact",
  satgo: "SATGO Youth Province",
};

/** Build-time fallback list — mirrors the seeded categories. */
export type CategorySummary = {
  slug: string;
  name: string;
  group: string;
  description: string;
  voting_enabled?: boolean;
  nominations_open?: boolean;
};

export const FALLBACK_CATEGORIES: CategorySummary[] = [
  { slug: "creche-of-the-year", name: "Crèche of the Year", group: "city", description: "Excellence in early childhood care, safety, innovation, and impact." },
  { slug: "organisation-of-the-year", name: "Organisation of the Year", group: "city", description: "Excellence in service delivery, innovation, staff development, and community engagement." },
  { slug: "inspirational-leader", name: "Inspirational Leader (Male & Female)", group: "city", description: "Leadership, integrity, service, mentorship, and transformational impact." },
  { slug: "business-owner-of-the-year", name: "Business Owner of the Year", group: "city", description: "Significant contribution to the city through jobs, innovation, and mentorship." },
  { slug: "under-30-impact", name: "Under-30 Impact Person", group: "city", description: "A young changemaker under 30 with purpose-driven impact." },
  { slug: "csr-organisation-of-the-year", name: "CSR Organisation of the Year", group: "city", description: "Exceptional leadership in Corporate Social Responsibility." },
  { slug: "event-of-the-year", name: "Event of the Year", group: "city", description: "An outstanding event of quality, creativity, and lasting impression." },
  { slug: "primary-secondary-school", name: "School of the Year", group: "city", description: "Excellence in academics, innovation, character, and community." },
  { slug: "tech-development", name: "Tech Development of the Year", group: "regional", description: "Innovation, creativity, and measurable impact in technology." },
  { slug: "youth-development", name: "Youth Development", group: "regional", description: "A region investing in spiritual growth, leadership, and skills for youth." },
  { slug: "sports-development", name: "Sports Development", group: "regional", description: "Promoting sports and wellness for youth engagement and unity." },
  { slug: "agricultural-innovation", name: "Agricultural Innovation", group: "regional", description: "Innovative projects, food security, and agribusiness empowerment." },
  { slug: "departmental-sanitation", name: "Sanitation Department", group: "departmental", description: "Individual excellence in the Sanitation department." },
  { slug: "departmental-water", name: "Water Department", group: "departmental", description: "Individual excellence in the Water department." },
  { slug: "departmental-health", name: "Health Department", group: "departmental", description: "Individual excellence in the Health department." },
  { slug: "departmental-environmental-health", name: "Environmental Health Department", group: "departmental", description: "Individual excellence in the Environmental Health department." },
  { slug: "departmental-maintenance", name: "Maintenance Department", group: "departmental", description: "Individual excellence in the Maintenance department." },
  { slug: "departmental-electronics", name: "Electronics Department", group: "departmental", description: "Individual excellence in the Electronics department." },
  { slug: "departmental-transport", name: "Transport Department", group: "departmental", description: "Individual excellence in the Transport department." },
  { slug: "departmental-security", name: "Security Department", group: "departmental", description: "Individual excellence in the Security department." },
  { slug: "satgo-evangelism", name: "Evangelism Youth Province", group: "satgo", description: "Exceptional commitment to evangelism, discipleship, and outreach." },
  { slug: "satgo-fastest-growing", name: "Fastest Growing Youth Province", group: "satgo", description: "Remarkable growth in spiritual development and youth engagement." },
  { slug: "satgo-outstanding", name: "Outstanding Youth Province", group: "satgo", description: "Excellence across ministry, innovation, and leadership development." },
];
