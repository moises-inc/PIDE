"""Deterministic spectroscopy utilities and visible-line color mapping."""

from __future__ import annotations

import math
from typing import Any


def _finite_number(value: float, name: str) -> float:
    if isinstance(value, bool):
        raise ValueError(f"{name} must be a finite number")
    try:
        result = float(value)
    except (TypeError, ValueError) as exc:
        raise ValueError(f"{name} must be a finite number") from exc
    if not math.isfinite(result):
        raise ValueError(f"{name} must be a finite number")
    return result


def wavelength_to_rgb(wavelength_nm: float, gamma: float = 0.80) -> tuple[int, int, int]:
    """Map a visible wavelength to display RGB using Dan Bruton's approximation."""

    wavelength = _finite_number(wavelength_nm, "wavelength_nm")
    gamma_value = _finite_number(gamma, "gamma")
    if not 380.0 <= wavelength <= 780.0:
        raise ValueError("wavelength_nm must be in [380, 780]")
    if not 0.1 <= gamma_value <= 3.0:
        raise ValueError("gamma must be in [0.1, 3.0]")
    if wavelength < 440:
        red, green, blue = -(wavelength - 440) / 60, 0.0, 1.0
    elif wavelength < 490:
        red, green, blue = 0.0, (wavelength - 440) / 50, 1.0
    elif wavelength < 510:
        red, green, blue = 0.0, 1.0, -(wavelength - 510) / 20
    elif wavelength < 580:
        red, green, blue = (wavelength - 510) / 70, 1.0, 0.0
    elif wavelength < 645:
        red, green, blue = 1.0, -(wavelength - 645) / 65, 0.0
    else:
        red, green, blue = 1.0, 0.0, 0.0
    if wavelength < 420:
        attenuation = 0.3 + 0.7 * (wavelength - 380) / 40
    elif wavelength > 700:
        attenuation = 0.3 + 0.7 * (780 - wavelength) / 80
    else:
        attenuation = 1.0
    channels = []
    for channel in (red, green, blue):
        corrected = 0.0 if channel <= 0 else (channel * attenuation) ** gamma_value
        channels.append(max(0, min(255, int(round(corrected * 255)))))
    return tuple(channels)  # type: ignore[return-value]


def wavelength_to_rgb_normalized(wavelength_nm: float, gamma: float = 0.80) -> tuple[float, float, float]:
    """Return the same mapping on a [0, 1] scale for scientific consumers."""

    return tuple(channel / 255.0 for channel in wavelength_to_rgb(wavelength_nm, gamma))


def rydberg_wavelength_nm(atomic_number: int, n_upper: int, n_lower: int = 1) -> float:
    """Calculate a hydrogenic transition wavelength in nanometres."""

    if isinstance(atomic_number, bool) or not isinstance(atomic_number, int) or not 1 <= atomic_number <= 118:
        raise ValueError("atomic_number must be an integer in [1, 118]")
    if isinstance(n_upper, bool) or isinstance(n_lower, bool) or not isinstance(n_upper, int) or not isinstance(n_lower, int):
        raise ValueError("quantum levels must be integers")
    if not 1 <= n_lower < n_upper <= 100:
        raise ValueError("n_upper must be greater than n_lower and in [2, 100]")
    rydberg_m_inv = 10_973_731.568_160
    inverse_m = rydberg_m_inv * atomic_number**2 * (1.0 / n_lower**2 - 1.0 / n_upper**2)
    return 1.0e9 / inverse_m


def generate_rydberg_lines(atomic_number: int, series_lower: int = 2, max_upper: int = 8) -> list[dict[str, Any]]:
    """Generate a small deterministic series of hydrogenic lines."""

    if not 1 <= series_lower <= 6 or not series_lower + 1 <= max_upper <= 20:
        raise ValueError("series_lower and max_upper are outside the supported limits")
    lines = []
    for upper in range(series_lower + 1, max_upper + 1):
        wavelength = rydberg_wavelength_nm(atomic_number, upper, series_lower)
        if 380 <= wavelength <= 780:
            lines.append({
                "wavelength_nm": round(wavelength, 6),
                "intensity": round(100.0 / (upper - series_lower), 6),
                "transition": f"n={upper}->n={series_lower}",
                "rgb": wavelength_to_rgb(wavelength),
                "source": "Rydberg hydrogenic calculation",
            })
    return sorted(lines, key=lambda line: line["wavelength_nm"])


def generate_spectrum(element: Any, raw_lines: list[dict[str, Any]] | dict[str, Any] | None = None, max_lines: int = 100) -> dict[str, Any]:
    """Decorate compiled spectral lines with validated RGB display colors."""

    if isinstance(max_lines, bool) or not isinstance(max_lines, int) or not 1 <= max_lines <= 500:
        raise ValueError("max_lines must be in [1, 500]")
    if raw_lines is None:
        atomic_number = int(element.z)
        if atomic_number == 1:
            record = generate_rydberg_lines(1, series_lower=2, max_upper=8)
        else:
            record = [
                {
                    "wavelength_nm": 380.0 + float((atomic_number * 37 + index * 113) % 397),
                    "intensity": float(100 - index * 27),
                    "transition": f"{element.symbol} I",
                    "source": "deterministic local fallback",
                }
                for index in range(3)
            ]
    else:
        record = raw_lines
    if isinstance(record, dict):
        record = record.get("lines", [])
    if not isinstance(record, list):
        raise ValueError("spectral lines must be a list")
    lines = []
    for line in record:
        wavelength = _finite_number(line.get("wavelength_nm"), "wavelength_nm")
        if not 380.0 <= wavelength <= 780.0:
            continue
        intensity = _finite_number(line.get("intensity", 0.0), "intensity")
        if intensity < 0:
            raise ValueError("intensity must be non-negative")
        lines.append({
            "wavelength_nm": round(wavelength, 6),
            "intensity": min(100.0, intensity),
            "transition": str(line.get("transition", "unknown")),
            "rgb": wavelength_to_rgb(wavelength),
            "source": str(line.get("source", "offline dataset")),
        })
    lines.sort(key=lambda line: (line["wavelength_nm"], -line["intensity"]))
    return {
        "z": int(element.z),
        "symbol": str(element.symbol),
        "lines": lines[:max_lines],
        "metadata": {"domain_nm": [380.0, 780.0], "gamma": 0.80, "method": "CIE 1931 approximation"},
    }


def rydberg_wavelength(*args: Any, **kwargs: Any) -> float:
    """Compatibility spelling for callers using the shorter function name."""

    return rydberg_wavelength_nm(*args, **kwargs)
