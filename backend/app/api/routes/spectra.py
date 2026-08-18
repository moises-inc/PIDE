from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Path, Query

from ...core.spectroscopy import generate_spectrum
from ...core.registry import get_registry
from ...models import SpectrumResponse

router = APIRouter(tags=["spectra"])


@router.get("/spectra/{z}", response_model=SpectrumResponse)
def element_spectrum(
    z: Annotated[int, Path(ge=1, le=118)],
    max_lines: Annotated[int, Query(ge=1, le=500)] = 100,
) -> dict:
    registry = get_registry()
    element = registry.require(z)
    return generate_spectrum(element, registry.spectra_for(z), max_lines=max_lines)
