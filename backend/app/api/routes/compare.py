from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Query

from ...core.comparator import compare_elements
from ...core.registry import get_registry
from ...errors import PideValidationError
from ...models import CompareRequest, CompareResponse

router = APIRouter(tags=["compare"])


@router.post("/compare", response_model=CompareResponse)
@router.get("/compare", response_model=CompareResponse)
def compare(
    request: CompareRequest | None = None,
    z: Annotated[list[int] | None, Query()] = None,
    properties: Annotated[list[str] | None, Query()] = None,
) -> dict:
    element_numbers = request.element_numbers if request and request.element_numbers else (z or [6, 8, 26])
    props = request.properties if request and request.properties else (properties or ["atomicMass", "densityGcm3", "meltingPointK"])
    try:
        return compare_elements(get_registry(), element_numbers, props)
    except (ValueError, TypeError) as exc:
        raise PideValidationError(str(exc)) from exc
