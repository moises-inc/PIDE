"""Public, dependency-light facade for the PIDE backend."""

from __future__ import annotations

try:
    from ..app.core.comparator import compare_elements
    from ..app.core.registry import get_registry
    from ..app.models import Element
except ImportError:  # Supports ``PYTHONPATH=backend; import pide``.
    from app.core.comparator import compare_elements
    from app.core.registry import get_registry
    from app.models import Element


def get_element(z: int) -> Element:
    return get_registry().require(z)


def list_elements(**filters: object) -> list[Element]:
    return get_registry().list_elements(**filters)


def compare(z_values: list[int], properties: list[str] | None = None) -> dict:
    return compare_elements(get_registry(), z_values, properties)
