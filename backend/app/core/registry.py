"""In-memory O(1) registry for the compiled PIDE snapshot."""

from __future__ import annotations

import gzip
import json
from pathlib import Path
from typing import Any, Iterable

from ..errors import PideDataError, PideNotFoundError, PideValidationError
from ..models import Element, to_camel

DEFAULT_DATA_DIR = Path(__file__).resolve().parents[2] / "data"
NUMERIC_PROPERTIES = {
    "atomic_mass",
    "atomic_mass_uncertainty",
    "period",
    "group",
    "valence_electrons",
    "first_ionization_energy_ev",
    "electron_affinity_ev",
    "electronegativity_pauling",
    "atomic_radius_pm",
    "covalent_radius_pm",
    "van_der_waals_radius_pm",
    "melting_point_k",
    "boiling_point_k",
    "density_g_cm3",
    "thermal_conductivity_w_mk",
    "specific_heat_j_gk",
    "electrical_resistivity_n_ohm_m",
    "hardness_mohs",
    "standard_electrode_potential_v",
    "isotopes_count",
    "most_stable_isotope_mass",
}
PROPERTY_ALIASES = {
    "atomicMass": "atomic_mass",
    "atomic_mass": "atomic_mass",
    "density": "density_g_cm3",
    "densityGcm3": "density_g_cm3",
    "meltingPoint": "melting_point_k",
    "boilingPoint": "boiling_point_k",
    "ionizationEnergy": "first_ionization_energy_ev",
    "firstIonizationEnergyEv": "first_ionization_energy_ev",
}
VALID_BLOCKS = {"s", "p", "d", "f"}
VALID_CATEGORIES = {
    "alkali_metal", "alkaline_earth", "transition_metal", "post_transition_metal",
    "metalloid", "nonmetal", "halogen", "noble_gas", "lanthanide", "actinide", "unknown",
}


def canonical_property(property_name: str) -> str:
    if not isinstance(property_name, str):
        raise PideValidationError("property must be a string")
    canonical = PROPERTY_ALIASES.get(property_name, property_name)
    if canonical == property_name:
        canonical = next((field_name for field_name in NUMERIC_PROPERTIES if to_camel(field_name) == property_name), canonical)
    if canonical not in NUMERIC_PROPERTIES:
        raise PideValidationError(
            f"Unsupported numeric property: {property_name}",
            details={"allowed": sorted(NUMERIC_PROPERTIES)},
        )
    return canonical


def _load_json(path: Path) -> Any:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise PideDataError(f"Unable to read dataset {path.name}", details=str(exc)) from exc


class ElementRegistry:
    """Load once and expose hash-indexed element and auxiliary records."""

    def __init__(self, data_dir: str | Path = DEFAULT_DATA_DIR):
        self.data_dir = Path(data_dir)
        try:
            raw_elements = _load_json(self.data_dir / "elements.json")
            raw_crystals = _load_json(self.data_dir / "crystals.json")
            raw_isotopes = _load_json(self.data_dir / "isotopes.json")
            with gzip.open(self.data_dir / "spectra_nist.json.gz", "rt", encoding="utf-8") as handle:
                raw_spectra = json.load(handle)
        except (OSError, json.JSONDecodeError) as exc:
            raise PideDataError("Unable to load the offline PIDE datasets", details=str(exc)) from exc
        if not isinstance(raw_elements, list):
            raise PideDataError("elements.json must contain a list")
        try:
            self.by_z: dict[int, Element] = {int(record["z"]): Element.model_validate(record) for record in raw_elements}
        except (KeyError, TypeError, ValueError) as exc:
            raise PideDataError("elements.json contains an invalid element record", details=str(exc)) from exc
        expected = set(range(1, 119))
        if set(self.by_z) != expected or len(self.by_z) != 118:
            raise PideDataError("elements.json must contain exactly atomic numbers 1 through 118")
        self.by_symbol = {element.symbol.lower(): element for element in self.by_z.values()}
        self._spectra = {int(record["z"]): record for record in raw_spectra}
        self._crystals = {int(record["z"]): record for record in raw_crystals}
        self._isotopes = {int(record["z"]): record for record in raw_isotopes}
        for name, table in (("spectra", self._spectra), ("crystals", self._crystals), ("isotopes", self._isotopes)):
            if set(table) != expected:
                raise PideDataError(f"{name} dataset must contain exactly atomic numbers 1 through 118")

    def get(self, z: int) -> Element | None:
        if isinstance(z, bool) or not isinstance(z, int) or not 1 <= z <= 118:
            return None
        return self.by_z.get(z)

    def require(self, z: int) -> Element:
        element = self.get(z)
        if element is None:
            raise PideNotFoundError(f"Element with atomic number {z} was not found", details={"z": z})
        return element

    def get_by_symbol(self, symbol: str) -> Element | None:
        if not isinstance(symbol, str):
            return None
        return self.by_symbol.get(symbol.strip().lower())

    def list_elements(
        self,
        *,
        block: str | None = None,
        group: int | None = None,
        period: int | None = None,
        category: str | None = None,
        query: str | None = None,
    ) -> list[Element]:
        if block is not None and block not in VALID_BLOCKS:
            raise PideValidationError("block must be one of s, p, d, or f")
        if category is not None and category not in VALID_CATEGORIES:
            raise PideValidationError("category is not recognized")
        if group is not None and not 1 <= group <= 18:
            raise PideValidationError("group must be in [1, 18]")
        if period is not None and not 1 <= period <= 7:
            raise PideValidationError("period must be in [1, 7]")
        normalized_query = query.strip().lower() if query else None
        candidates = list(self.by_z.values())
        if normalized_query:
            exact = [
                element for element in candidates
                if normalized_query in {element.symbol.lower(), element.name_en.lower(), element.name_es.lower()}
            ]
            if exact:
                candidates = exact
        result = []
        for element in candidates:
            if block is not None and element.block != block:
                continue
            if group is not None and element.group != group:
                continue
            if period is not None and element.period != period:
                continue
            if category is not None and element.category != category:
                continue
            if normalized_query and not any(
                normalized_query in (value or "").lower()
                for value in (element.symbol, element.name_en, element.name_es)
            ):
                continue
            result.append(element)
        return result

    def spectra_for(self, z: int) -> dict[str, Any]:
        self.require(z)
        return self._spectra[z]

    def crystal_for(self, z: int) -> dict[str, Any]:
        self.require(z)
        return self._crystals[z]

    def isotopes_for(self, z: int) -> dict[str, Any]:
        self.require(z)
        return self._isotopes[z]

    def trend(self, property_name: str, elements: Iterable[Element] | None = None) -> list[dict[str, Any]]:
        canonical = canonical_property(property_name)
        selected = list(elements) if elements is not None else self.list_elements()
        return [{"z": element.z, "symbol": element.symbol, "value": element.numeric_value(canonical)} for element in selected]


_registry: ElementRegistry | None = None


def get_registry() -> ElementRegistry:
    global _registry
    if _registry is None:
        _registry = ElementRegistry()
    return _registry
