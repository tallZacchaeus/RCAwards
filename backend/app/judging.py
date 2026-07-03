"""Judging engine — reproduces the 2025 judge-panel scoring methodology.

A category's official judging criteria ARE the 1-10 evaluation fields on its
nomination form, so there's a single source of truth. Scoring aggregates the way
the committee's spreadsheet does:

  per-criterion average  = (sum of scores given for that criterion) ÷ panel size
  nominee Ranked Score   = sum of the per-criterion averages
                         = (sum of every score from every judge) ÷ panel size

Dividing by the full panel size (not just participating judges) is deliberate —
a nominee seen by more judges earns more validated weight, exactly as the sheet
does. Judges who did not score simply contribute nothing (the sheet records
them as zeros; same result).
"""
from __future__ import annotations

from dataclasses import dataclass

from .schemas.form_schema import FieldType, FormDefinition


@dataclass(frozen=True)
class Criterion:
    key: str
    label: str


def judging_criteria(form_schema: dict) -> list[Criterion]:
    """The official judging criteria for a category = its 1-10 form fields."""
    form = FormDefinition.model_validate(form_schema)
    return [
        Criterion(key=f.key, label=f.label)
        for f in form.all_fields
        if f.type == FieldType.LINEAR_SCALE_1_10
    ]


@dataclass
class NomineeResult:
    criteria_averages: dict[str, float]  # criterion key → (sum of scores) ÷ panel size
    ranked_score: float
    judge_count: int  # distinct judges who scored this nominee


def score_nominee(
    judge_criteria_maps: list[dict[str, int]], panel_size: int
) -> NomineeResult:
    """Aggregate one nominee from the list of each judge's {criterion: score} map."""
    by_criterion: dict[str, list[int]] = {}
    total_sum = 0
    for cmap in judge_criteria_maps:
        for key, value in cmap.items():
            by_criterion.setdefault(key, []).append(value)
            total_sum += value

    divisor = panel_size if panel_size > 0 else max(1, len(judge_criteria_maps))
    averages = {
        key: round(sum(vals) / divisor, 2) for key, vals in by_criterion.items() if vals
    }
    ranked = round(total_sum / divisor, 2)
    return NomineeResult(
        criteria_averages=averages,
        ranked_score=ranked,
        judge_count=len(judge_criteria_maps),
    )
