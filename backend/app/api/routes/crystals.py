from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Path

from ...core.crystallography import generate_unit_cell
from ...core.registry import get_registry
from ...models import CrystalResponse

router = APIRouter(tags=["crystals"])


@router.get("/crystals/{z}", response_model=CrystalResponse)
def element_crystal(z: Annotated[int, Path(ge=1, le=118)]) -> dict:
    registry = get_registry()
    element = registry.require(z)
    record = registry.crystal_for(z)
    if not record.get("available") or not record.get("lattice"):
        return {
            "z": z,
            "symbol": element.symbol,
            "lattice": "unavailable",
            "lattice_system": "unknown",
            "cell": {"a_angstrom": 0.0, "b_angstrom": 0.0, "c_angstrom": 0.0, "alpha_deg": 0.0, "beta_deg": 0.0, "gamma_deg": 0.0},
            "atoms": [],
            "bonds": [],
            "metadata": {"available": False, "source": record.get("source", {})},
        }
    try:
        cell = record["cell"]
        generated = generate_unit_cell(
            record["lattice"],
            a=cell["a_angstrom"],
            b=cell["b_angstrom"],
            c=cell["c_angstrom"],
            alpha=cell["alpha_deg"],
            beta=cell["beta_deg"],
            gamma=cell["gamma_deg"],
            element_z=z,
        )
        return {
            "z": z,
            "symbol": element.symbol,
            "lattice": generated["lattice"],
            "lattice_system": generated["lattice_system"],
            "cell": generated["cell"],
            "atoms": generated["atoms"],
            "bonds": generated["bonds"],
            "metadata": {**generated["metadata"], "available": True, "source": record.get("source", {})},
        }
    except Exception:
        return {
            "z": z,
            "symbol": element.symbol,
            "lattice": record.get("lattice") or "unavailable",
            "lattice_system": "unknown",
            "cell": {"a_angstrom": 0.0, "b_angstrom": 0.0, "c_angstrom": 0.0, "alpha_deg": 0.0, "beta_deg": 0.0, "gamma_deg": 0.0},
            "atoms": [],
            "bonds": [],
            "metadata": {"available": False, "source": record.get("source", {})},
        }
