from __future__ import annotations

from fastapi import APIRouter

from ...core.comparator import compare_elements
from ...core.registry import get_registry
from ...errors import PideValidationError
from ...models import CompareRequest, CompareResponse

router = APIRouter(tags=["compare"])


@router.post("/compare", response_model=CompareResponse)
def compare(request: CompareRequest) -> dict:
    try:
        return compare_elements(get_registry(), request.element_numbers, request.properties)
    except (ValueError, TypeError) as exc:
        raise PideValidationError(str(exc)) from exc
