from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Path, Query

from ...core.orbitals import generate_orbital
from ...errors import PideValidationError
from ...models import OrbitalResponse

router = APIRouter(tags=["orbitals"])


@router.get("/orbitals/{n}/{l}/{m}", response_model=OrbitalResponse)
def orbital(
    n: Annotated[int, Path(ge=1, le=8)],
    l: Annotated[int, Path(ge=0, le=7)],
    m: Annotated[int, Path(ge=-7, le=7)],
    atomic_number: Annotated[int, Query(ge=1, le=118, alias="z")] = 1,
    grid_size: Annotated[int, Query(ge=9, le=65)] = 25,
    iso_fraction: Annotated[float, Query(ge=0.01, le=0.99)] = 0.90,
) -> dict:
    try:
        return generate_orbital(n, l, m, atomic_number=atomic_number, grid_size=grid_size, iso_fraction=iso_fraction)
    except ValueError as exc:
        raise PideValidationError(str(exc)) from exc
