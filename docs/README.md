# Source briefs

The platform's content and requirements come from three source documents kept in
the project root (the `.docx` files are git-ignored as large binaries — keep your
local copies):

- **2026 Content For Award 4.0 link.docx** — nomination-form specs for every award
  category (sections, fields, 1–10 criteria, uploads). This is the source for the
  JSON form definitions in `backend/app/seed/categories/`.
- **CityBreed Website Upgrade.docx** — marketing-site copy and structure (hero,
  B.R.E.E.D. pillars, objectives, how-to-nominate, categories, gallery, footer).
- **Redemption City Awards.dc.html** — a polished dark-luxury landing-page design
  export; the visual basis for the Phase 3 site (committed for reference).

When a category form changes, edit the matching JSON in
`backend/app/seed/categories/` (or `departments.json` for departmental awards) and
re-run `python -m app.seed.loader`.
