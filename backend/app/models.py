"""Pydantic contracts shared by the registry, engines, and HTTP API."""

from __future__ import annotations

from typing import Any, Literal

from pydantic import (
    AliasChoices,
    BaseModel,
    ConfigDict,
    Field,
    StrictInt,
    field_validator,
    model_validator,
)


def to_camel(value: str) -> str:
    """Convert internal snake_case names to the public JSON convention."""

    parts = value.split("_")
    return parts[0] + "".join(part[:1].upper() + part[1:] for part in parts[1:])


class PideModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        extra="ignore",
        str_strip_whitespace=True,
    )


class Element(PideModel):
    z: StrictInt = Field(ge=1, le=118)
    atomic_number: StrictInt | None = Field(default=None, ge=1, le=118)
    symbol: str = Field(min_length=1, max_length=3)
    name_en: str = Field(min_length=1, max_length=64)
    name_es: str = Field(min_length=1, max_length=64)
    atomic_mass: float | None = None
    atomic_mass_uncertainty: float | None = None
    period: int | None = Field(default=None, ge=1, le=7)
    group: int | None = Field(default=None, ge=1, le=18)
    block: str | None = Field(default=None, max_length=1)
    category: str | None = Field(default=None, max_length=48)
    metal_class: str | None = Field(default=None, max_length=24)
    electron_configuration: str | None = Field(
        default=None,
        validation_alias=AliasChoices("electron_configuration", "config"),
    )
    electron_configuration_condensed: str | None = Field(
        default=None,
        validation_alias=AliasChoices("electron_configuration_condensed", "config_cond"),
    )
    valence_electrons: int | None = Field(default=None, ge=0, le=32)
    oxidation_states: list[int] = Field(
        default_factory=list,
        validation_alias=AliasChoices("oxidation_states", "ox_states"),
    )
    first_ionization_energy_ev: float | None = Field(
        default=None,
        validation_alias=AliasChoices("first_ionization_energy_ev", "ie1"),
    )
    electron_affinity_ev: float | None = Field(
        default=None,
        validation_alias=AliasChoices("electron_affinity_ev", "ea"),
    )
    electronegativity_pauling: float | None = Field(
        default=None,
        validation_alias=AliasChoices("electronegativity_pauling", "en_pauling"),
    )
    atomic_radius_pm: float | None = Field(
        default=None,
        validation_alias=AliasChoices("atomic_radius_pm", "r_atomic"),
    )
    covalent_radius_pm: float | None = Field(
        default=None,
        validation_alias=AliasChoices("covalent_radius_pm", "r_covalent"),
    )
    van_der_waals_radius_pm: float | None = Field(
        default=None,
        validation_alias=AliasChoices("van_der_waals_radius_pm", "r_vdw"),
    )
    melting_point_k: float | None = Field(
        default=None,
        validation_alias=AliasChoices("melting_point_k", "mp_k"),
    )
    boiling_point_k: float | None = Field(
        default=None,
        validation_alias=AliasChoices("boiling_point_k", "bp_k"),
    )
    density_g_cm3: float | None = Field(default=None, validation_alias=AliasChoices("density_g_cm3", "density"))
    phase: str | None = None
    crystal_structure: str | None = Field(default=None, validation_alias=AliasChoices("crystal_structure", "crystal"))
    lattice_type: str | None = None
    lattice_system: str | None = None
    thermal_conductivity_w_mk: float | None = None
    specific_heat_j_gk: float | None = None
    electrical_resistivity_n_ohm_m: float | None = None
    hardness_mohs: float | None = None
    standard_electrode_potential_v: float | None = None
    magnetic_order: str | None = None
    isotopes_count: int | None = Field(default=None, ge=0)
    most_stable_isotope_mass: float | None = None
    radioactive: bool | None = None
    half_life: str | None = None
    year_discovered: int | str | None = None
    discoverer: str | None = None
    uses: list[str] = Field(default_factory=list)
    description: str | None = None
    abundance_earth_crust_ppm: float | None = None
    abundance_universe_ppm: float | None = None
    thermal_expansion_1_k: float | None = None
    sound_speed_m_s: float | None = None
    electronic_conductivity_s_m: float | None = None
    critical_temperature_k: float | None = None
    critical_pressure_mpa: float | None = None
    appearance: str | None = None
    source: dict[str, Any] = Field(default_factory=dict)
    derived_fields: list[str] = Field(default_factory=list)

    @model_validator(mode="before")
    @classmethod
    def map_legacy_fields(cls, value: Any) -> Any:
        if not isinstance(value, dict):
            return value
        mapped = dict(value)
        aliases = {
            "config": "electron_configuration",
            "config_cond": "electron_configuration_condensed",
            "ox_states": "oxidation_states",
            "ie1": "first_ionization_energy_ev",
            "ea": "electron_affinity_ev",
            "en_pauling": "electronegativity_pauling",
            "r_atomic": "atomic_radius_pm",
            "r_covalent": "covalent_radius_pm",
            "r_vdw": "van_der_waals_radius_pm",
            "mp_k": "melting_point_k",
            "bp_k": "boiling_point_k",
            "density": "density_g_cm3",
            "crystal": "crystal_structure",
        }
        for old, new in aliases.items():
            if new not in mapped and old in mapped:
                mapped[new] = mapped[old]

        if not mapped.get("metal_class") and mapped.get("category"):
            cat = str(mapped["category"]).replace(" ", "_").lower()
            if cat in ("alkali_metal", "alkaline_earth", "transition_metal", "post_transition_metal", "lanthanide", "actinide"):
                mapped["metal_class"] = "metal"
            elif cat == "metalloid":
                mapped["metal_class"] = "metalloid"
            elif cat in ("nonmetal", "halogen", "noble_gas"):
                mapped["metal_class"] = "nonmetal"
        return mapped

    @field_validator("symbol")
    @classmethod
    def normalize_symbol(cls, value: str) -> str:
        return value[0].upper() + value[1:].lower()

    def numeric_value(self, property_name: str) -> float | None:
        """Return a numeric property by canonical name or public alias."""

        aliases = {
            "atomicMass": "atomic_mass",
            "density": "density_g_cm3",
            "densityGcm3": "density_g_cm3",
            "ie1": "first_ionization_energy_ev",
            "electronAffinity": "electron_affinity_ev",
        }
        canonical = aliases.get(property_name, property_name)
        if canonical == property_name:
            canonical = next((field_name for field_name in self.__class__.model_fields if to_camel(field_name) == property_name), canonical)
        value = getattr(self, canonical, None)
        return value if isinstance(value, (int, float)) and not isinstance(value, bool) else None


class TrendPoint(PideModel):
    z: StrictInt
    symbol: str
    value: float | None


class TrendResponse(PideModel):
    property: str
    series: list[TrendPoint]


class SpectralLine(PideModel):
    wavelength_nm: float = Field(gt=0, le=10000)
    intensity: float = Field(ge=0, le=100)
    transition: str
    rgb: tuple[int, int, int]
    source: str


class SpectrumResponse(PideModel):
    z: StrictInt
    symbol: str
    lines: list[SpectralLine]
    metadata: dict[str, Any] = Field(default_factory=dict)


class OrbitalResponse(PideModel):
    vertices: list[tuple[float, float, float]]
    faces: list[tuple[int, int, int]]
    probability_grid: dict[str, Any]
    probability: dict[str, Any] | None = None
    max_probability: float
    normalization: float
    metadata: dict[str, Any]


class CellAtom(PideModel):
    index: int = Field(ge=0)
    fractional: tuple[float, float, float]
    position: tuple[float, float, float]


class CrystalResponse(PideModel):
    z: StrictInt
    symbol: str
    lattice: str
    lattice_system: str
    cell: dict[str, float]
    atoms: list[CellAtom]
    bonds: list[tuple[int, int]]
    metadata: dict[str, Any] = Field(default_factory=dict)


class CompareRequest(PideModel):
    z: list[StrictInt] | None = Field(default=None, min_length=2, max_length=8)
    elements: list[StrictInt] | None = Field(default=None, min_length=2, max_length=8)
    properties: list[str] = Field(default_factory=lambda: ["atomic_mass", "density_g_cm3", "melting_point_k"])

    @model_validator(mode="before")
    @classmethod
    def accept_element_aliases(cls, value: Any) -> Any:
        if not isinstance(value, dict):
            return value
        mapped = dict(value)
        if "z" not in mapped and "elements" not in mapped and "element_ids" in mapped:
            mapped["z"] = mapped["element_ids"]
        return mapped

    @model_validator(mode="after")
    def validate_selection(self) -> "CompareRequest":
        if self.z is None and self.elements is None:
            raise ValueError("z or elements is required")
        if self.z is not None and self.elements is not None and self.z != self.elements:
            raise ValueError("z and elements must contain the same selection")
        selected = self.z if self.z is not None else self.elements
        assert selected is not None
        if len(set(selected)) != len(selected):
            raise ValueError("element selection must not contain duplicates")
        if any(number < 1 or number > 118 for number in selected):
            raise ValueError("element atomic numbers must be in [1, 118]")
        if not self.properties or len(self.properties) > 8:
            raise ValueError("properties must contain between 1 and 8 values")
        return self

    @property
    def element_numbers(self) -> list[int]:
        return list(self.z if self.z is not None else self.elements or [])


class CompareResponse(PideModel):
    z: list[int]
    properties: list[str]
    elements: list[Element]
    differences: dict[str, Any]
    correlations: dict[str, Any]
    radar: list[dict[str, Any]]


class ExportRequest(PideModel):
    format: Literal["csv", "latex", "bibtex"]
    z: list[StrictInt] | None = Field(default=None, min_length=1, max_length=20)
    elements: list[StrictInt] | None = Field(default=None, min_length=1, max_length=20)
    properties: list[str] = Field(default_factory=list)

    @model_validator(mode="before")
    @classmethod
    def accept_export_aliases(cls, value: Any) -> Any:
        if not isinstance(value, dict):
            return value
        mapped = dict(value)
        if "z" not in mapped and "elements" not in mapped and "element_ids" in mapped:
            mapped["z"] = mapped["element_ids"]
        return mapped

    @model_validator(mode="after")
    def validate_export_selection(self) -> "ExportRequest":
        selected = self.z if self.z is not None else self.elements
        if not selected:
            raise ValueError("z or elements is required")
        if len(set(selected)) != len(selected):
            raise ValueError("element selection must not contain duplicates")
        if any(number < 1 or number > 118 for number in selected):
            raise ValueError("element atomic numbers must be in [1, 118]")
        return self

    @property
    def element_numbers(self) -> list[int]:
        return list(self.z if self.z is not None else self.elements or [])


class ExportResponse(PideModel):
    format: str
    filename: str
    media_type: str
    content: str
