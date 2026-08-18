"""Pure phase-boundary calculations for the local PIDE dataset."""

from __future__ import annotations

import math
from typing import Any


def _value(element: Any, name: str) -> float | None:
    if isinstance(element, dict):
        aliases = {"melting_point_k": "mp_k", "boiling_point_k": "bp_k"}
        value = element.get(name, element.get(aliases.get(name, "")))
    else:
        value = getattr(element, name, None)
    return float(value) if isinstance(value, (int, float)) and not isinstance(value, bool) else None


def phase_at_temperature(element: Any, temperature_k: float) -> str:
    """Return solid, liquid, gas, or unknown for 0 <= T <= 6000 K."""

    if isinstance(temperature_k, bool) or not isinstance(temperature_k, (int, float)) or not math.isfinite(float(temperature_k)) or not 0 <= temperature_k <= 6000:
        raise ValueError("temperature_k must be finite and in [0, 6000]")
    melting = _value(element, "melting_point_k")
    boiling = _value(element, "boiling_point_k")
    if melting is None and boiling is None:
        return "unknown"
    if melting is not None and boiling is not None and boiling > melting:
        if temperature_k < melting:
            return "solid"
        if temperature_k < boiling:
            return "liquid"
        return "gas"
    if melting is not None:
        return "solid" if temperature_k < melting else "unknown"
    assert boiling is not None
    return "liquid" if temperature_k < boiling else "gas"


def phase_profile(element: Any) -> dict[str, Any]:
    melting = _value(element, "melting_point_k")
    boiling = _value(element, "boiling_point_k")
    return {
        "melting_point_k": melting,
        "boiling_point_k": boiling,
        "allowed_range_k": [0.0, 6000.0],
        "phase_at_298_k": phase_at_temperature(element, 298.15),
    }


temperature_phase = phase_at_temperature
