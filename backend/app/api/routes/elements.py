from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Path, Query

from ...core.registry import get_registry
from ...models import Element

router = APIRouter(tags=["elements"])


@router.get("/elements", response_model=list[Element])
def list_elements(
    block: Annotated[str | None, Query(min_length=1, max_length=1)] = None,
    group: Annotated[int | None, Query(ge=1, le=18)] = None,
    period: Annotated[int | None, Query(ge=1, le=7)] = None,
    category: Annotated[str | None, Query(min_length=1, max_length=48)] = None,
    metal_class: Annotated[str | None, Query(alias="metalClass", min_length=1, max_length=24)] = None,
    q: Annotated[str | None, Query(min_length=1, max_length=64)] = None,
    offset: Annotated[int, Query(ge=0, le=117)] = 0,
    limit: Annotated[int, Query(ge=1, le=118)] = 118,
) -> list[Element]:
    elements = get_registry().list_elements(
        block=block,
        group=group,
        period=period,
        category=category,
        metal_class=metal_class,
        query=q,
    )
    return elements[offset : offset + limit]


@router.get("/elements/{z}", response_model=Element)
def element_detail(z: Annotated[int, Path(ge=1, le=118)]) -> Element:
    return get_registry().require(z)
