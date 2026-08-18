"""Unit-cell generators for the fourteen Bravais lattice types."""

from __future__ import annotations

import math
from typing import Any

BRAVAIS_LATTICES: dict[str, dict[str, str]] = {
    "SC": {"system": "cubic", "centering": "P"},
    "BCC": {"system": "cubic", "centering": "I"},
    "FCC": {"system": "cubic", "centering": "F"},
    "primitive_tetragonal": {"system": "tetragonal", "centering": "P"},
    "body_centered_tetragonal": {"system": "tetragonal", "centering": "I"},
    "primitive_orthorhombic": {"system": "orthorhombic", "centering": "P"},
    "base_centered_orthorhombic": {"system": "orthorhombic", "centering": "C"},
    "body_centered_orthorhombic": {"system": "orthorhombic", "centering": "I"},
    "face_centered_orthorhombic": {"system": "orthorhombic", "centering": "F"},
    "primitive_monoclinic": {"system": "monoclinic", "centering": "P"},
    "base_centered_monoclinic": {"system": "monoclinic", "centering": "C"},
    "primitive_triclinic": {"system": "triclinic", "centering": "P"},
    "rhombohedral": {"system": "trigonal", "centering": "R"},
    "primitive_hexagonal": {"system": "hexagonal", "centering": "P"},
}

_ALIASES = {
    "SIMPLE_CUBIC": "SC", "PRIMITIVE_CUBIC": "SC", "BODY_CENTERED_CUBIC": "BCC",
    "FACE_CENTERED_CUBIC": "FCC", "HEXAGONAL": "primitive_hexagonal", "HCP": "HCP",
    "TETRAGONAL_P": "primitive_tetragonal", "TETRAGONAL_I": "body_centered_tetragonal",
    "CUBIC": "FCC", "DIAMOND CUBIC": "FCC", "DIAMOND_CUBIC": "FCC", "ORTHORHOMBIC": "primitive_orthorhombic",
    "RHOMBOHEDRAL": "rhombohedral", "TETRAGONAL": "primitive_tetragonal",
}


def _canonical_lattice(value: str) -> str:
    if not isinstance(value, str):
        raise ValueError("lattice_type must be a string")
    normalized = value.strip().upper().replace("-", "_")
    candidate = _ALIASES.get(normalized, _ALIASES.get(value.strip().upper(), value.strip()))
    if candidate == "HCP":
        return candidate
    if candidate not in BRAVAIS_LATTICES:
        raise ValueError(f"unsupported lattice type: {value}")
    return candidate


def lattice_parameter_from_radius(radius_pm: float, lattice: str) -> float:
    if isinstance(radius_pm, bool) or not isinstance(radius_pm, (int, float)) or not math.isfinite(float(radius_pm)) or not 0 < radius_pm <= 500:
        raise ValueError("radius_pm must be in (0, 500]")
    normalized = _canonical_lattice(lattice)
    radius_angstrom = float(radius_pm) / 100.0
    if normalized == "BCC":
        return 4.0 * radius_angstrom / math.sqrt(3.0)
    if normalized == "FCC":
        return 2.0 * math.sqrt(2.0) * radius_angstrom
    return 2.0 * radius_angstrom


def _basis_for(lattice: str) -> tuple[str, str, list[tuple[float, float, float]]]:
    if lattice == "HCP":
        return "hexagonal", "P", [(0.0, 0.0, 0.0), (2.0 / 3.0, 1.0 / 3.0, 0.5)]
    definition = BRAVAIS_LATTICES[lattice]
    centering = definition["centering"]
    if centering == "P":
        basis = [(0.0, 0.0, 0.0)]
    elif centering == "I":
        basis = [(0.0, 0.0, 0.0), (0.5, 0.5, 0.5)]
    elif centering == "F":
        basis = [(0.0, 0.0, 0.0), (0.0, 0.5, 0.5), (0.5, 0.0, 0.5), (0.5, 0.5, 0.0)]
    elif centering == "C":
        basis = [(0.0, 0.0, 0.0), (0.0, 0.5, 0.5)]
    else:  # Rhombohedral conventional cell.
        basis = [(0.0, 0.0, 0.0), (2.0 / 3.0, 1.0 / 3.0, 1.0 / 3.0), (1.0 / 3.0, 2.0 / 3.0, 2.0 / 3.0)]
    return definition["system"], centering, basis


def _fractional_to_cartesian(fractional: tuple[float, float, float], a: float, b: float, c: float, alpha: float, beta: float, gamma: float) -> tuple[float, float, float]:
    alpha_r, beta_r, gamma_r = map(math.radians, (alpha, beta, gamma))
    sin_gamma = math.sin(gamma_r)
    if abs(sin_gamma) < 1e-10:
        raise ValueError("gamma must not be a multiple of 180 degrees")
    fx, fy, fz = fractional
    x = a * fx + b * math.cos(gamma_r) * fy + c * math.cos(beta_r) * fz
    y = b * sin_gamma * fy + c * (math.cos(alpha_r) - math.cos(beta_r) * math.cos(gamma_r)) / sin_gamma * fz
    z = c * math.sqrt(max(0.0, 1.0 - math.cos(beta_r) ** 2 - ((math.cos(alpha_r) - math.cos(beta_r) * math.cos(gamma_r)) / sin_gamma) ** 2)) * fz
    return (x, y, z)


def generate_unit_cell(
    lattice_type: Any,
    *,
    a: float | None = None,
    b: float | None = None,
    c: float | None = None,
    alpha: float = 90.0,
    beta: float = 90.0,
    gamma: float | None = None,
    radius_pm: float | None = None,
    cutoff: float | None = None,
    element_z: int | None = None,
) -> dict[str, Any]:
    """Create fractional/cartesian atom positions and in-cell bonds."""

    if not isinstance(lattice_type, str):
        element_z = getattr(lattice_type, "z", element_z)
        lattice_type = getattr(lattice_type, "lattice_type", None) or getattr(lattice_type, "crystal_structure", None)
    lattice = _canonical_lattice(lattice_type or "SC")
    if a is None:
        a = lattice_parameter_from_radius(radius_pm, lattice) if radius_pm is not None else 3.0
    if isinstance(a, bool) or not isinstance(a, (int, float)) or not math.isfinite(float(a)) or not 0 < a <= 100:
        raise ValueError("a must be in (0, 100]")
    b = a if b is None else b
    c = a if c is None else c
    if any(isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(float(value)) or not 0 < value <= 100 for value in (b, c)):
        raise ValueError("b and c must be in (0, 100]")
    if gamma is None:
        gamma = 120.0 if lattice in {"HCP", "primitive_hexagonal"} else 90.0
    if not all(isinstance(value, (int, float)) and math.isfinite(float(value)) and 0 < float(value) < 180 for value in (alpha, beta, gamma)):
        raise ValueError("cell angles must be finite values in (0, 180)")
    system, centering, fractional_basis = _basis_for(lattice)
    atoms = [
        {
            "index": index,
            "fractional": [round(float(value), 10) for value in fractional],
            "position": [round(value, 10) for value in _fractional_to_cartesian(fractional, float(a), float(b), float(c), float(alpha), float(beta), float(gamma))],
        }
        for index, fractional in enumerate(fractional_basis)
    ]
    if cutoff is None:
        cutoff = 1.15 * min(float(a), float(b), float(c)) if radius_pm is None else 2.0 * float(radius_pm) / 100.0 * 1.15
    if isinstance(cutoff, bool) or not isinstance(cutoff, (int, float)) or not math.isfinite(float(cutoff)) or not 0 < cutoff <= 200:
        raise ValueError("cutoff must be in (0, 200]")
    bonds: list[tuple[int, int]] = []
    for first in range(len(atoms)):
        first_position = atoms[first]["position"]
        for second in range(first + 1, len(atoms)):
            second_position = atoms[second]["position"]
            distance = math.sqrt(sum((first_position[index] - second_position[index]) ** 2 for index in range(3)))
            if 1e-10 < distance <= float(cutoff):
                bonds.append((first, second))
    return {
        "element_z": element_z,
        "lattice": lattice,
        "lattice_system": system,
        "centering": centering,
        "cell": {
            "a_angstrom": float(a), "b_angstrom": float(b), "c_angstrom": float(c),
            "alpha_deg": float(alpha), "beta_deg": float(beta), "gamma_deg": float(gamma),
        },
        "atoms": atoms,
        "bonds": bonds,
        "metadata": {"basis_count": len(atoms), "cutoff_angstrom": float(cutoff), "method": "fractional cell geometry"},
    }


generate_crystal_cell = generate_unit_cell
