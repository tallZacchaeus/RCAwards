"""Seeds must always be valid and internally consistent."""
from app.schemas.form_schema import FieldType
from app.seed.loader import load_all_definitions


def test_all_seeds_load_and_validate():
    forms = load_all_definitions()
    assert len(forms) == 23


def test_slugs_are_unique():
    forms = load_all_definitions()
    slugs = [f.slug for f in forms]
    assert len(slugs) == len(set(slugs))


def test_every_form_has_at_least_one_section_and_field():
    for form in load_all_definitions():
        assert form.sections, f"{form.slug} has no sections"
        assert form.all_fields, f"{form.slug} has no fields"


def test_choice_fields_have_options():
    for form in load_all_definitions():
        for field in form.all_fields:
            if field.type in {FieldType.MULTIPLE_CHOICE, FieldType.DROPDOWN}:
                assert field.options, f"{form.slug}.{field.key} missing options"


def test_departmental_forms_are_uniform():
    """The PFO directive: every departmental award shares the same 5 criteria."""
    forms = [f for f in load_all_definitions() if f.group.value == "departmental"]
    assert len(forms) == 8
    expected = {"leadership", "integrity", "problem_solving", "collaboration", "impact_value"}
    signatures = set()
    for form in forms:
        scale_keys = frozenset(
            f.key for f in form.all_fields if f.type == FieldType.LINEAR_SCALE_1_10
        )
        assert scale_keys == expected, f"{form.slug} criteria differ"
        signatures.add(
            tuple((f.key, f.type.value, f.required) for f in form.all_fields)
        )
    assert len(signatures) == 1, "departmental forms are not uniform"
