#!/usr/bin/env python3
"""Build the deterministic, offline PIDE data snapshot."""

from __future__ import annotations

import argparse
import gzip
import json
import math
from pathlib import Path
from typing import Any

try:
    from enrich_database import (
        APPEARANCE_ES,
        ATOMIC_RADIUS,
        BOILING_K,
        COVALENT_RADIUS,
        DENSITY,
        DISCOVERERS,
        DISCOVERY_YEARS,
        ELECTRON_AFFINITY,
        ELECTRONEGATIVITY,
        IONIZATION,
        ISOTOPE_OVERRIDES,
        LATTICE_SYSTEMS,
        LATTICE_TYPES,
        MELTING_K,
        NAME_ES_OVERRIDES,
        OXIDATION_STATES,
        SPECTRAL_OVERRIDES,
        USES_ES,
        VAN_DER_WAALS_RADIUS,
    )
except ImportError:
    from backend.scripts.enrich_database import (
        APPEARANCE_ES,
        ATOMIC_RADIUS,
        BOILING_K,
        COVALENT_RADIUS,
        DENSITY,
        DISCOVERERS,
        DISCOVERY_YEARS,
        ELECTRON_AFFINITY,
        ELECTRONEGATIVITY,
        IONIZATION,
        ISOTOPE_OVERRIDES,
        LATTICE_SYSTEMS,
        LATTICE_TYPES,
        MELTING_K,
        NAME_ES_OVERRIDES,
        OXIDATION_STATES,
        SPECTRAL_OVERRIDES,
        USES_ES,
        VAN_DER_WAALS_RADIUS,
    )

try:
    import periodictable as periodic_table
except ImportError:  # pragma: no cover - supported for minimal compiler installs
    periodic_table = None

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
SOURCE_METADATA = {
    "primary": "IUPAC",
    "secondary": ["CIAAW", "NIST ASD", "CRC Handbook"],
    "snapshot": "offline-seed-1",
}

SYMBOLS = "H He Li Be B C N O F Ne Na Mg Al Si P S Cl Ar K Ca Sc Ti V Cr Mn Fe Co Ni Cu Zn Ga Ge As Se Br Kr Rb Sr Y Zr Nb Mo Tc Ru Rh Pd Ag Cd In Sn Sb Te I Xe Cs Ba La Ce Pr Nd Pm Sm Eu Gd Tb Dy Ho Er Tm Yb Lu Hf Ta W Re Os Ir Pt Au Hg Tl Pb Bi Po At Rn Fr Ra Ac Th Pa U Np Pu Am Cm Bk Cf Es Fm Md No Lr Rf Db Sg Bh Hs Mt Ds Rg Cn Nh Fl Mc Lv Ts Og".split()

NAMES_EN = [f"Element {symbol}" for symbol in SYMBOLS]
NAME_OVERRIDES = {
    1: "Hydrogen", 2: "Helium", 3: "Lithium", 4: "Beryllium", 5: "Boron",
    6: "Carbon", 7: "Nitrogen", 8: "Oxygen", 9: "Fluorine", 10: "Neon",
    11: "Sodium", 12: "Magnesium", 13: "Aluminum", 14: "Silicon", 15: "Phosphorus",
    16: "Sulfur", 17: "Chlorine", 18: "Argon", 19: "Potassium", 20: "Calcium",
    21: "Scandium", 22: "Titanium", 23: "Vanadium", 24: "Chromium", 25: "Manganese",
    26: "Iron", 27: "Cobalt", 28: "Nickel", 29: "Copper", 30: "Zinc",
    31: "Gallium", 32: "Germanium", 33: "Arsenic", 34: "Selenium", 35: "Bromine",
    36: "Krypton", 47: "Silver", 79: "Gold", 80: "Mercury", 92: "Uranium", 118: "Oganesson",
}
NAME_OVERRIDES.update({
    37: "Rubidium", 38: "Strontium", 39: "Yttrium", 40: "Zirconium", 41: "Niobium", 42: "Molybdenum",
    43: "Technetium", 44: "Ruthenium", 45: "Rhodium", 46: "Palladium", 48: "Cadmium", 49: "Indium",
    50: "Tin", 51: "Antimony", 52: "Tellurium", 53: "Iodine", 54: "Xenon", 55: "Cesium",
    56: "Barium", 57: "Lanthanum", 58: "Cerium", 59: "Praseodymium", 60: "Neodymium", 61: "Promethium",
    62: "Samarium", 63: "Europium", 64: "Gadolinium", 65: "Terbium", 66: "Dysprosium", 67: "Holmium",
    68: "Erbium", 69: "Thulium", 70: "Ytterbium", 71: "Lutetium", 72: "Hafnium", 73: "Tantalum",
    74: "Tungsten", 75: "Rhenium", 76: "Osmium", 77: "Iridium", 78: "Platinum", 81: "Thallium",
    82: "Lead", 83: "Bismuth", 84: "Polonium", 85: "Astatine", 86: "Radon", 87: "Francium",
    88: "Radium", 89: "Actinium", 90: "Thorium", 91: "Protactinium", 93: "Neptunium", 94: "Plutonium",
    95: "Americium", 96: "Curium", 97: "Berkelium", 98: "Californium", 99: "Einsteinium", 100: "Fermium",
    101: "Mendelevium", 102: "Nobelium", 103: "Lawrencium", 104: "Rutherfordium", 105: "Dubnium",
    106: "Seaborgium", 107: "Bohrium", 108: "Hassium", 109: "Meitnerium", 110: "Darmstadtium",
    111: "Roentgenium", 112: "Copernicium", 113: "Nihonium", 114: "Flerovium", 115: "Moscovium",
    116: "Livermorium", 117: "Tennessine",
})

ATOMIC_MASSES = [
    float(value)
    for value in """1.008 4.002602 6.94 9.0121831 10.81 12.011 14.007 15.999 18.998403163 20.1797
    22.98976928 24.305 26.9815385 28.085 30.973761998 32.06 35.45 39.948 39.0983 40.078
    44.955908 47.867 50.9415 51.9961 54.938044 55.845 58.933194 58.6934 63.546 65.38
    69.723 72.63 74.921595 78.971 79.904 83.798 85.4678 87.62 88.90584 91.224 92.90637
    95.95 98 101.07 102.9055 106.42 107.8682 112.414 114.818 118.710 121.760 127.60 126.90447
    131.293 132.90545196 137.327 138.90547 140.116 140.90766 144.242 145 150.36 151.964 157.25
    158.92535 162.500 164.93033 167.259 168.93422 173.045 174.9668 178.49 180.94788 183.84
    186.207 190.23 192.217 195.084 196.966569 200.592 204.38 207.2 208.98040 209 210 222 223
    226 227 232.0377 231.03588 238.02891 237 244 243 247 247 251 252 257 258 259 262 267 268
    269 270 277 278 281 282 285 286 289 290 293 294 294""".split()
]

assert len(SYMBOLS) == len(ATOMIC_MASSES) == 118

GAS_Z = {1, 2, 7, 8, 9, 10, 17, 18, 36, 54, 86, 118}
LIQUID_Z = {35, 80}
RADIOACTIVE_Z = {43, 61, *range(84, 119)}
ALKALI_Z = {3, 11, 19, 37, 55, 87}
ALKALINE_EARTH_Z = {4, 12, 20, 38, 56, 88}
HALOGEN_Z = {9, 17, 35, 53, 85, 117}
NOBLE_GAS_Z = {2, 10, 18, 36, 54, 86, 118}
LANTHANIDE_Z = set(range(57, 72))
ACTINIDE_Z = set(range(89, 104))
METALLOID_Z = {5, 14, 32, 33, 51, 52, 84}
NONMETAL_Z = {1, 6, 7, 8, 15, 16, 34}
POST_TRANSITION_Z = {13, 31, 49, 50, 81, 82, 83, 113, 114, 115, 116}
TRANSITION_Z = (set(range(21, 31)) | set(range(39, 49)) | set(range(72, 81)) | set(range(104, 113)))

# Sparse dictionaries are now imported from enrich_database covering all 118 elements


def library_element(z: int) -> Any | None:
    """Return the optional local periodictable record for enrichment."""

    if periodic_table is None:
        return None
    try:
        return periodic_table.elements[z]
    except (IndexError, KeyError, TypeError):
        return None


def finite_attribute(record: Any | None, name: str) -> float | None:
    """Read a numeric library field without leaking invalid sentinel values."""

    if record is None:
        return None
    value = getattr(record, name, None)
    try:
        number = float(value)
    except (TypeError, ValueError):
        return None
    return number if math.isfinite(number) else None


def library_lattice(z: int) -> str | None:
    """Map periodictable's crystal symmetry to the PIDE lattice vocabulary."""

    record = library_element(z)
    structure = getattr(record, "crystal_structure", None) if record is not None else None
    if not isinstance(structure, dict):
        return None
    symmetry = str(structure.get("symmetry", "")).strip().upper()
    return {
        "BCC": "BCC",
        "FCC": "FCC",
        "HCP": "HCP",
        "DIAMOND": "Diamond cubic",
        "TETRAGONAL": "Tetragonal",
        "ORTHORHOMBIC": "Orthorhombic",
    }.get(symmetry)


def period_for(z: int) -> int:
    if z <= 2:
        return 1
    if z <= 10:
        return 2
    if z <= 18:
        return 3
    if z <= 36:
        return 4
    if z <= 54:
        return 5
    if z <= 86:
        return 6
    return 7


def group_for(z: int) -> int | None:
    period = period_for(z)
    if z in LANTHANIDE_Z or z in ACTINIDE_Z:
        return 3
    if period == 1:
        return 1 if z == 1 else 18
    if period in (2, 3):
        start = 3 if period == 2 else 11
        if z <= start + 1:
            return z - start + 1
        return z - start + 11
    if period == 4:
        return z - 18
    if period == 5:
        return z - 36
    if period == 6:
        if z in (55, 56):
            return z - 54
        return 3 if z >= 57 and z <= 71 else z - 68
    if z in (87, 88):
        return z - 86
    return 3 if z >= 89 and z <= 103 else z - 100


def block_for(z: int) -> str:
    if z in LANTHANIDE_Z or z in ACTINIDE_Z:
        return "f"
    if z in TRANSITION_Z:
        return "d"
    if z in {1, 2, 3, 4, 11, 12, 19, 20, 37, 38, 55, 56, 87, 88}:
        return "s"
    return "p"


def category_for(z: int) -> str:
    if z in ALKALI_Z:
        return "alkali_metal"
    if z in ALKALINE_EARTH_Z:
        return "alkaline_earth"
    if z in HALOGEN_Z:
        return "halogen"
    if z in NOBLE_GAS_Z:
        return "noble_gas"
    if z in LANTHANIDE_Z:
        return "lanthanide"
    if z in ACTINIDE_Z:
        return "actinide"
    if z in METALLOID_Z:
        return "metalloid"
    if z in NONMETAL_Z:
        return "nonmetal"
    if z in POST_TRANSITION_Z:
        return "post_transition_metal"
    if z in TRANSITION_Z:
        return "transition_metal"
    return "unknown"


def electron_configuration(z: int) -> tuple[str, str]:
    orbitals = [(1, "s", 2), (2, "s", 2), (2, "p", 6), (3, "s", 2), (3, "p", 6),
                (4, "s", 2), (3, "d", 10), (4, "p", 6), (5, "s", 2), (4, "d", 10),
                (5, "p", 6), (6, "s", 2), (4, "f", 14), (5, "d", 10), (6, "p", 6),
                (7, "s", 2), (5, "f", 14), (6, "d", 10), (7, "p", 6)]
    remaining = z
    filled: list[tuple[int, str, int]] = []
    for principal, subshell, capacity in orbitals:
        amount = min(remaining, capacity)
        if amount:
            filled.append((principal, subshell, amount))
        remaining -= amount
        if not remaining:
            break
    full = " ".join(f"{principal}{subshell}{amount}" for principal, subshell, amount in filled)
    cores = [(86, "[Rn]"), (54, "[Xe]"), (36, "[Kr]"), (18, "[Ar]"), (10, "[Ne]"), (2, "[He]")]
    core_z, core_label = next(((number, label) for number, label in cores if z > number), (0, ""))
    if not core_label:
        return full, full
    tail = [entry for entry in filled if sum(item[2] for item in filled[:filled.index(entry)]) >= core_z]
    tail.sort(key=lambda item: (item[0], "spdf".index(item[1])))
    condensed = core_label + " " + " ".join(f"{principal}{subshell}{amount}" for principal, subshell, amount in tail)
    special = {24: "[Ar] 3d5 4s1", 29: "[Ar] 3d10 4s1", 41: "[Kr] 4d4 5s1", 42: "[Kr] 4d5 5s1", 44: "[Kr] 4d7 5s1", 45: "[Kr] 4d8 5s1", 46: "[Kr] 4d10", 47: "[Kr] 4d10 5s1", 78: "[Xe] 4f14 5d9 6s1", 79: "[Xe] 4f14 5d10 6s1"}
    return full, special.get(z, condensed)


def element_record(z: int) -> dict[str, Any]:
    name = NAME_OVERRIDES.get(z, f"Element {SYMBOLS[z - 1]}")
    config, condensed = electron_configuration(z)
    library = library_element(z)
    group = group_for(z)
    if group in (1, 2):
        valence = group
    elif group and group >= 13:
        valence = group - 10
    else:
        valence = None
    isotope_records = isotope_record(z)
    melting_point = MELTING_K.get(z)
    boiling_point = BOILING_K.get(z)
    density = DENSITY.get(z) or finite_attribute(library, "density")
    covalent_radius = COVALENT_RADIUS.get(z)
    if covalent_radius is None:
        library_radius = finite_attribute(library, "covalent_radius")
        covalent_radius = None if library_radius is None else library_radius * 100.0
    lattice = LATTICE_TYPES.get(z) or library_lattice(z)
    if melting_point is not None and boiling_point is not None:
        phase = "solid" if 298.15 < melting_point else "liquid" if 298.15 < boiling_point else "gas"
    elif z in GAS_Z:
        phase = "gas"
    elif z in LIQUID_Z:
        phase = "liquid"
    else:
        phase = None
    derived = ["electron_configuration", "lattice_system", "isotopes_count"]
    return {
        "z": z,
        "atomic_number": z,
        "symbol": SYMBOLS[z - 1],
        "name_en": name,
        "name_es": NAME_ES_OVERRIDES.get(z, name),
        "atomic_mass": ATOMIC_MASSES[z - 1],
        "atomic_mass_uncertainty": finite_attribute(library, "_mass_unc"),
        "period": period_for(z),
        "group": group,
        "block": block_for(z),
        "category": category_for(z),
        "electron_configuration": config,
        "electron_configuration_condensed": condensed,
        "config": config,
        "config_cond": condensed,
        "valence_electrons": valence,
        "oxidation_states": OXIDATION_STATES.get(z, [0] if z in NOBLE_GAS_Z else []),
        "ox_states": OXIDATION_STATES.get(z, [0] if z in NOBLE_GAS_Z else []),
        "first_ionization_energy_ev": IONIZATION.get(z),
        "ie1": IONIZATION.get(z),
        "electron_affinity_ev": ELECTRON_AFFINITY.get(z),
        "ea": ELECTRON_AFFINITY.get(z),
        "electronegativity_pauling": ELECTRONEGATIVITY.get(z),
        "en_pauling": ELECTRONEGATIVITY.get(z),
        "atomic_radius_pm": ATOMIC_RADIUS.get(z),
        "r_atomic": ATOMIC_RADIUS.get(z),
        "covalent_radius_pm": covalent_radius,
        "r_covalent": covalent_radius,
        "van_der_waals_radius_pm": VAN_DER_WAALS_RADIUS.get(z),
        "r_vdw": VAN_DER_WAALS_RADIUS.get(z),
        "melting_point_k": melting_point,
        "mp_k": melting_point,
        "boiling_point_k": boiling_point,
        "bp_k": boiling_point,
        "density_g_cm3": density,
        "density": density,
        "phase": phase,
        "crystal_structure": lattice,
        "crystal": lattice,
        "lattice_type": lattice,
        "lattice_system": LATTICE_SYSTEMS.get(lattice or ""),
        "thermal_conductivity_w_mk": {6: 129, 13: 237, 26: 80.4, 29: 401, 47: 429, 79: 318}.get(z),
        "specific_heat_j_gk": {6: 0.709, 13: 0.897, 26: 0.449, 29: 0.385, 79: 0.129}.get(z),
        "electrical_resistivity_n_ohm_m": {13: 28.2, 26: 96.1, 29: 16.8, 47: 15.9, 79: 22.1}.get(z),
        "hardness_mohs": {6: 10.0, 13: 2.75, 26: 4.0, 29: 3.0, 79: 2.5}.get(z),
        "standard_electrode_potential_v": {1: 0.0, 3: -3.04, 11: -2.71, 26: -0.44, 29: 0.34, 47: 0.80, 79: 1.50}.get(z),
        "magnetic_order": "ferromagnetic" if z == 26 else None,
        "isotopes_count": len(isotope_records),
        "most_stable_isotope_mass": most_abundant_isotope_mass(isotope_records, ATOMIC_MASSES[z - 1]),
        "radioactive": z in RADIOACTIVE_Z,
        "half_life": None,
        "year_discovered": DISCOVERY_YEARS.get(z),
        "discoverer": DISCOVERERS.get(z),
        "uses": USES_ES.get(z, []),
        "description": f"{name} ({SYMBOLS[z - 1]}) es el elemento de número atómico {z} en la tabla periódica.",
        "abundance_earth_crust_ppm": None,
        "abundance_universe_ppm": None,
        "thermal_expansion_1_k": None,
        "sound_speed_m_s": None,
        "electronic_conductivity_s_m": None,
        "critical_temperature_k": None,
        "critical_pressure_mpa": None,
        "appearance": APPEARANCE_ES.get(z),
        "source": dict(SOURCE_METADATA),
        "derived_fields": derived,
    }


def isotope_record(z: int) -> list[dict[str, Any]]:
    if z in ISOTOPE_OVERRIDES:
        return [dict(item) for item in ISOTOPE_OVERRIDES[z]]
    record = library_element(z)
    if record is not None:
        isotopes: list[dict[str, Any]] = []
        for mass_number in getattr(record, "isotopes", []):
            isotope = record[mass_number]
            mass = finite_attribute(isotope, "mass")
            if mass is None:
                continue
            abundance = finite_attribute(isotope, "abundance")
            isotopes.append({
                "mass_number": int(mass_number),
                "isotopic_mass": mass,
                "abundance_percent": abundance,
                "stable": bool(abundance is not None and abundance > 0 and z not in RADIOACTIVE_Z),
            })
        if isotopes:
            return isotopes
    mass = ATOMIC_MASSES[z - 1]
    return [{
        "mass_number": int(round(mass)),
        "isotopic_mass": mass,
        "abundance_percent": None,
        "stable": z not in RADIOACTIVE_Z,
    }]


def most_abundant_isotope_mass(isotopes: list[dict[str, Any]], fallback: float) -> float:
    """Return the isotope mass with the highest measured natural abundance."""

    measured = [item for item in isotopes if isinstance(item.get("abundance_percent"), (int, float)) and item["abundance_percent"] > 0]
    if measured:
        return float(max(measured, key=lambda item: float(item["abundance_percent"]))["isotopic_mass"])
    closest = min(isotopes, key=lambda item: abs(float(item["mass_number"]) - fallback), default=None)
    return float(closest["isotopic_mass"]) if closest is not None else fallback


def spectrum_record(z: int) -> dict[str, Any]:
    entries = SPECTRAL_OVERRIDES.get(z)
    if entries is None:
        entries = [
            (380.0 + float((z * 37 + index * 113) % 397), float(100 - index * 27), f"{SYMBOLS[z - 1]} I")
            for index in range(3)
        ]
    lines = [
        {
            "wavelength_nm": wavelength,
            "intensity": intensity,
            "transition": transition,
            "source": "NIST ASD offline snapshot" if z in SPECTRAL_OVERRIDES else "deterministic local seed",
        }
        for wavelength, intensity, transition in entries
    ]
    lines.sort(key=lambda line: line["wavelength_nm"])
    return {"z": z, "symbol": SYMBOLS[z - 1], "lines": lines, "source": dict(SOURCE_METADATA)}


def crystal_record(z: int) -> dict[str, Any]:
    lattice = LATTICE_TYPES.get(z) or library_lattice(z)
    radius = COVALENT_RADIUS.get(z)
    if radius is None:
        library_radius = finite_attribute(library_element(z), "covalent_radius")
        radius = None if library_radius is None else library_radius * 100.0
    if lattice and radius:
        radius_angstrom = radius / 100.0
        a = 2.0 * radius_angstrom
        if lattice == "BCC":
            a = 4.0 * radius_angstrom / math.sqrt(3.0)
        elif lattice == "FCC":
            a = 2.0 * math.sqrt(2.0) * radius_angstrom
        elif lattice == "HCP":
            a = 2.0 * radius_angstrom
        cell = {"a_angstrom": round(a, 6), "b_angstrom": round(a, 6), "c_angstrom": round(a * (1.633 if lattice == "HCP" else 1.0), 6), "alpha_deg": 90.0, "beta_deg": 90.0, "gamma_deg": 120.0 if lattice == "HCP" else 90.0}
        available = True
    else:
        cell = {"a_angstrom": None, "b_angstrom": None, "c_angstrom": None, "alpha_deg": None, "beta_deg": None, "gamma_deg": None}
        available = False
    return {
        "z": z,
        "symbol": SYMBOLS[z - 1],
        "available": available,
        "lattice": lattice,
        "lattice_system": LATTICE_SYSTEMS.get(lattice) if lattice else None,
        "cell": cell,
        "basis": [],
        "source": dict(SOURCE_METADATA),
    }


def _write_json(path: Path, payload: Any) -> None:
    path.write_text(json.dumps(payload, ensure_ascii=True, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def compile_database(output_dir: str | Path = DATA_DIR, source_dir: str | Path | None = None) -> list[Path]:
    """Compile all local datasets and return their paths in stable order."""

    del source_dir  # Reserved for a future official-source import; runtime stays offline.
    output = Path(output_dir)
    output.mkdir(parents=True, exist_ok=True)
    elements = [element_record(z) for z in range(1, 119)]
    spectra = [spectrum_record(z) for z in range(1, 119)]
    crystals = [crystal_record(z) for z in range(1, 119)]
    isotopes = [{"z": z, "symbol": SYMBOLS[z - 1], "isotopes": isotope_record(z), "source": dict(SOURCE_METADATA)} for z in range(1, 119)]
    elements_path = output / "elements.json"
    spectra_path = output / "spectra_nist.json.gz"
    crystals_path = output / "crystals.json"
    isotopes_path = output / "isotopes.json"
    _write_json(elements_path, elements)
    _write_json(crystals_path, crystals)
    _write_json(isotopes_path, isotopes)
    spectra_payload = json.dumps(spectra, ensure_ascii=True, indent=2, sort_keys=True).encode("utf-8")
    spectra_path.write_bytes(gzip.compress(spectra_payload, mtime=0))
    return [elements_path, spectra_path, crystals_path, isotopes_path]


def validate_database(data_dir: str | Path = DATA_DIR) -> dict[str, int]:
    """Validate coverage and uniqueness of a compiled snapshot."""

    directory = Path(data_dir)
    elements = json.loads((directory / "elements.json").read_text(encoding="utf-8"))
    crystals = json.loads((directory / "crystals.json").read_text(encoding="utf-8"))
    isotopes = json.loads((directory / "isotopes.json").read_text(encoding="utf-8"))
    with gzip.open(directory / "spectra_nist.json.gz", "rt", encoding="utf-8") as handle:
        spectra = json.load(handle)
    expected = list(range(1, 119))
    for name, records in (("elements", elements), ("spectra", spectra), ("crystals", crystals), ("isotopes", isotopes)):
        numbers = [record["z"] for record in records]
        if numbers != expected:
            raise ValueError(f"{name} must contain each atomic number from 1 to 118 exactly once")
    return {"elements": len(elements), "spectra": len(spectra), "crystals": len(crystals), "isotopes": len(isotopes)}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=DATA_DIR)
    parser.add_argument("--source-dir", type=Path, default=None)
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    if args.check:
        print(json.dumps(validate_database(args.output), sort_keys=True))
    else:
        paths = compile_database(args.output, args.source_dir)
        print(f"Compiled {len(paths)} deterministic datasets in {args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
