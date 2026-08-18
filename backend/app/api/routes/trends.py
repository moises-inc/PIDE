from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Query

from ...core.registry import canonical_property, get_registry
from ...models import TrendResponse

router = APIRouter(tags=["trends"])


@router.get("/trends", response_model=TrendResponse)
def trends(property_name: Annotated[str, Query(alias="property", min_length=1, max_length=64)] = "atomic_mass") -> dict:
    canonical = canonical_property(property_name)
    return {"property": canonical, "series": get_registry().trend(canonical)}
