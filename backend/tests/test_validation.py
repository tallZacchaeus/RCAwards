"""Submission validator behaviour, exercised against a real seeded form."""
import pytest

from app.schemas import validate_submission
from app.schemas.form_schema import FormDefinition
from app.seed.loader import load_all_definitions


@pytest.fixture
def creche() -> FormDefinition:
    return next(f for f in load_all_definitions() if f.slug == "creche-of-the-year")


def _valid_creche_answers() -> dict:
    return {
        "nominator_full_name": "Ada Obi",
        "nominator_contact": "ada@example.com",
        "relationship": "Parent/Guardian",
        "resides_in_city": "Yes",
        "creche_name": "Little Lights",
        "creche_location": "Zone 3",
        "staff_child_ratio": 8,
        "parental_satisfaction": 9,
        "cleanliness_safety": 10,
        "community_involvement": 7,
    }


def test_valid_submission_passes(creche):
    result = validate_submission(creche, _valid_creche_answers())
    assert result.ok, result.errors


def test_missing_required_field_fails(creche):
    answers = _valid_creche_answers()
    del answers["creche_name"]
    result = validate_submission(creche, answers)
    assert not result.ok
    assert "creche_name" in result.errors


def test_rating_out_of_range_fails(creche):
    answers = _valid_creche_answers()
    answers["staff_child_ratio"] = 99
    result = validate_submission(creche, answers)
    assert "staff_child_ratio" in result.errors


def test_invalid_choice_fails(creche):
    answers = _valid_creche_answers()
    answers["relationship"] = "Random Person"
    result = validate_submission(creche, answers)
    assert "relationship" in result.errors


def test_optional_fields_may_be_omitted(creche):
    # why_deserve and supporting_file are optional and absent here.
    result = validate_submission(creche, _valid_creche_answers())
    assert result.ok


def test_email_validation():
    form = next(f for f in load_all_definitions() if f.slug == "under-30-impact")
    base = {
        "nominator_email": "not-an-email",
        "resides_in_city": "No",
        "nominee_full_name": "Tobi A.",
        "impact_text": "Did great things.",
        "impact_rating": 8,
        "innovation_text": "Very innovative.",
        "innovation_rating": 7,
        "leadership_text": "A real leader.",
        "leadership_rating": 9,
        "character_text": "Strong character.",
        "character_rating": 8,
    }
    result = validate_submission(form, base)
    assert "nominator_email" in result.errors

    base["nominator_email"] = "tobi@example.com"
    assert validate_submission(form, base).ok


def test_max_words_enforced():
    form = next(f for f in load_all_definitions() if f.slug == "under-30-impact")
    answers = {
        "nominator_email": "tobi@example.com",
        "resides_in_city": "No",
        "nominee_full_name": "Tobi A.",
        "impact_text": "word " * 250,  # exceeds the 200-word cap
        "impact_rating": 8,
        "innovation_text": "Very innovative.",
        "innovation_rating": 7,
        "leadership_text": "A real leader.",
        "leadership_rating": 9,
        "character_text": "Strong character.",
        "character_rating": 8,
    }
    result = validate_submission(form, answers)
    assert "impact_text" in result.errors
