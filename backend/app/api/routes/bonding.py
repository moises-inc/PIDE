from __future__ import annotations

from fastapi import APIRouter

from ...core.bonding import analyze_bond
from ...core.registry import get_registry
from ...errors import PideValidationError
from ...models import BondAnalysisRequest, BondAnalysisResponse

router = APIRouter(tags=["bonding"])


def _run(z1: int, z2: int) -> BondAnalysisResponse:
    registry = get_registry()
    return analyze_bond(registry.require(z1), registry.require(z2))


@router.post("/bonding/analyze", response_model=BondAnalysisResponse)
def analyze(request: BondAnalysisRequest) -> BondAnalysisResponse:
    try:
        return _run(request.z1, request.z2)
    except (ValueError, TypeError) as exc:
        raise PideValidationError(str(exc)) from exc


@router.get("/bonding/{z1}/{z2}", response_model=BondAnalysisResponse)
def analyze_pair(z1: int, z2: int) -> BondAnalysisResponse:
    if not 1 <= z1 <= 118 or not 1 <= z2 <= 118:
        raise PideValidationError("atomic numbers must be in [1, 118]")
    try:
        return _run(z1, z2)
    except (ValueError, TypeError) as exc:
        raise PideValidationError(str(exc)) from exc
