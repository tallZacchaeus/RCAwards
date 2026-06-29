"""Load award categories into the database from the JSON seed files.

Distinct categories live as one JSON file each under ``categories/``. The
Departmental Impact awards are generated from ``departments.json`` so they stay
uniform (the PFO directive). Every definition is validated against
``FormDefinition`` before it touches the database, so a malformed seed fails
loudly here rather than at submission time.

Usage:
    python -m app.seed.loader            # upsert all categories into the DB
    python -m app.seed.loader --check    # validate seeds only, no DB needed
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path

from ..schemas.form_schema import FormDefinition

SEED_DIR = Path(__file__).parent
CATEGORY_DIR = SEED_DIR / "categories"
DEPARTMENTS_FILE = SEED_DIR / "departments.json"


def _departmental_definitions() -> list[FormDefinition]:
    """Expand the uniform departmental template into one form per department."""
    data = json.loads(DEPARTMENTS_FILE.read_text())
    criteria = data["criteria"]
    start = data["sort_order_start"]
    forms: list[FormDefinition] = []

    for i, dept in enumerate(data["departments"]):
        name = dept["name"]
        forms.append(
            FormDefinition.model_validate(
                {
                    "slug": f"departmental-{dept['slug']}",
                    "name": f"{name} – Departmental Impact Award",
                    "group": data["group"],
                    "sort_order": start + i,
                    "voting_enabled": data["voting_enabled"],
                    "description": (
                        f"Nominate an outstanding individual in the {name} who has "
                        "demonstrated excellence in their role. Nominations are judged "
                        "uniformly on five values: Leadership, Integrity, Problem "
                        "Solving, Collaboration & Team Spirit, and Impact & Value to "
                        "the Department. The top 3 nominees per department are reviewed "
                        "by the judging committee."
                    ),
                    "sections": [
                        {
                            "title": "Nominator's Details",
                            "fields": [
                                {"key": "nominator_email", "label": "Your Valid Email Address", "type": "email", "required": True},
                                {"key": "nominator_position", "label": "Your Position (if applicable)", "type": "short_text", "required": False},
                                {"key": "resides_in_city", "label": "Do you reside in Redemption City or are you affiliated with an RCCG Region?", "type": "yes_no", "required": True},
                            ],
                        },
                        {
                            "title": "Nominee Information",
                            "fields": [
                                {"key": "nominee_full_name", "label": "Full Name of the Nominee", "type": "short_text", "required": True},
                                {"key": "nominee_role", "label": "Role/Position of the Nominee", "type": "short_text", "required": False},
                            ],
                        },
                        {
                            "title": "Evaluation Criteria",
                            "description": "Rate the nominee from 1 to 10 on each value (1 = Poor, 10 = Excellent).",
                            "fields": [
                                {"key": c["key"], "label": c["label"], "type": "linear_scale_1_10", "required": True}
                                for c in criteria
                            ],
                        },
                        {
                            "title": "Supporting Comments",
                            "fields": [
                                {"key": "why_nominate", "label": "Why are you nominating this person? Share a specific example of your experience with them.", "type": "paragraph", "required": True},
                                {"key": "supporting_file", "label": "Optional: upload a commendation letter, photo, or testimonial", "type": "file_upload", "required": False, "accept": ["image/*", "application/pdf"]},
                            ],
                        },
                    ],
                }
            )
        )
    return forms


def load_all_definitions() -> list[FormDefinition]:
    """Read, validate, and return every category form definition."""
    forms: list[FormDefinition] = []
    for path in sorted(CATEGORY_DIR.glob("*.json")):
        forms.append(FormDefinition.model_validate_json(path.read_text()))
    forms.extend(_departmental_definitions())

    slugs = [f.slug for f in forms]
    dupes = {s for s in slugs if slugs.count(s) > 1}
    if dupes:
        raise ValueError(f"duplicate category slugs across seeds: {sorted(dupes)}")
    return forms


def seed_database() -> int:
    """Upsert all categories into the database. Returns the count loaded."""
    # Imported lazily so --check works without a database driver/connection.
    from ..db import SessionLocal
    from ..models import Category, CategoryGroup

    forms = load_all_definitions()
    session = SessionLocal()
    try:
        for form in forms:
            existing = session.query(Category).filter_by(slug=form.slug).one_or_none()
            payload = dict(
                name=form.name,
                group=CategoryGroup(form.group.value),
                description=form.description,
                form_schema=form.model_dump(mode="json"),
                edition_year=form.edition_year,
                voting_enabled=form.voting_enabled,
                sort_order=form.sort_order,
                active=True,
            )
            if existing:
                for key, value in payload.items():
                    setattr(existing, key, value)
            else:
                session.add(Category(slug=form.slug, **payload))
        session.commit()
        return len(forms)
    finally:
        session.close()


def main() -> None:
    parser = argparse.ArgumentParser(description="Seed award categories.")
    parser.add_argument("--check", action="store_true", help="Validate seeds only; no DB writes.")
    args = parser.parse_args()

    if args.check:
        forms = load_all_definitions()
        by_group: dict[str, int] = {}
        for f in forms:
            by_group[f.group.value] = by_group.get(f.group.value, 0) + 1
        print(f"✓ {len(forms)} category definitions are valid.")
        for group, count in sorted(by_group.items()):
            print(f"    {group:13} {count}")
    else:
        count = seed_database()
        print(f"✓ Seeded {count} categories into the database.")


if __name__ == "__main__":
    main()
