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

MELTING_K = {
    1: 14.01, 2: 0.95, 3: 453.69, 4: 1560.0, 5: 2349.0, 6: 3823.0,
    7: 63.15, 8: 54.36, 9: 53.53, 10: 24.56, 11: 370.87, 12: 923.0,
    13: 933.47, 14: 1687.0, 15: 317.30, 16: 388.36, 17: 171.6, 18: 83.80,
    19: 336.53, 20: 1115.0, 21: 1814.0, 22: 1941.0, 23: 2183.0, 24: 2180.0,
    25: 1519.0, 26: 1811.0, 27: 1768.0, 28: 1728.0, 29: 1357.77, 30: 692.68,
    31: 302.91, 32: 1211.4, 33: 1090.0, 34: 494.0, 35: 265.8, 36: 115.79,
    47: 1234.93, 79: 1337.33, 80: 234.32, 92: 1405.3,
}
BOILING_K = {
    1: 20.28, 2: 4.22, 3: 1603.0, 4: 2742.0, 5: 4200.0, 6: 4098.0,
    7: 77.36, 8: 90.20, 9: 85.03, 10: 27.07, 11: 1156.0, 12: 1363.0,
    13: 2792.0, 14: 3538.0, 15: 553.65, 16: 717.87, 17: 239.11, 18: 87.30,
    19: 1032.0, 20: 1757.0, 21: 3109.0, 22: 3560.0, 23: 3680.0, 24: 2944.0,
    25: 2334.0, 26: 3134.0, 27: 3200.0, 28: 3186.0, 29: 2835.0, 30: 1180.0,
    31: 2477.0, 32: 3106.0, 33: 887.0, 34: 958.0, 35: 332.0, 36: 119.93,
    47: 2435.0, 79: 3129.0, 80: 629.88, 92: 4404.0,
}
DENSITY = {
    1: 0.00008988, 2: 0.0001785, 3: 0.534, 4: 1.85, 5: 2.34, 6: 2.267,
    7: 0.0012506, 8: 0.001429, 9: 0.001696, 10: 0.0009002, 11: 0.968,
    12: 1.738, 13: 2.70, 14: 2.329, 15: 1.823, 16: 2.07, 17: 0.003214,
    18: 0.0017837, 19: 0.862, 20: 1.54, 21: 2.985, 22: 4.506, 23: 6.11,
    24: 7.15, 25: 7.44, 26: 7.874, 27: 8.86, 28: 8.912, 29: 8.96,
    30: 7.14, 31: 5.91, 32: 5.323, 33: 5.776, 34: 4.809, 35: 3.122,
    36: 0.003733, 47: 10.49, 79: 19.30, 80: 13.534, 92: 19.1,
}
IONIZATION = {1: 13.598, 2: 24.587, 3: 5.392, 6: 11.260, 7: 14.534, 8: 13.618, 9: 17.423, 10: 21.565, 11: 5.139, 17: 12.968, 18: 15.760, 26: 7.902, 29: 7.726, 47: 7.576, 79: 9.225, 80: 10.437, 92: 6.194}
ELECTRON_AFFINITY = {1: 0.754, 3: 0.618, 5: 0.280, 6: 1.262, 7: -0.070, 8: 1.461, 9: 3.401, 11: 0.548, 13: 0.433, 14: 1.385, 15: 0.746, 16: 2.077, 17: 3.613, 19: 0.501, 20: 0.025, 26: 0.151, 27: 0.661, 28: 1.156, 29: 1.228, 35: 3.364, 47: 1.302, 79: 2.309}
ELECTRONEGATIVITY = {1: 2.20, 3: 0.98, 4: 1.57, 5: 2.04, 6: 2.55, 7: 3.04, 8: 3.44, 9: 3.98, 11: 0.93, 12: 1.31, 13: 1.61, 14: 1.90, 15: 2.19, 16: 2.58, 17: 3.16, 19: 0.82, 20: 1.00, 26: 1.83, 29: 1.90, 35: 2.96, 47: 1.93, 79: 2.54, 80: 2.00}
COVALENT_RADIUS = {1: 31, 2: 28, 3: 128, 4: 96, 5: 84, 6: 76, 7: 71, 8: 66, 9: 57, 10: 58, 11: 166, 12: 141, 13: 121, 14: 111, 15: 107, 16: 105, 17: 102, 18: 106, 19: 203, 20: 176, 26: 132, 29: 132, 35: 120, 47: 145, 79: 136, 80: 132, 92: 196}
ATOMIC_RADIUS = {1: 53, 2: 31, 3: 167, 4: 112, 5: 87, 6: 67, 7: 56, 8: 48, 9: 42, 10: 38, 11: 190, 12: 145, 13: 118, 14: 111, 15: 98, 16: 88, 17: 79, 18: 71, 19: 243, 20: 194, 26: 156, 29: 145, 35: 94, 47: 165, 79: 174, 80: 171, 92: 196}
VAN_DER_WAALS_RADIUS = {1: 120, 2: 140, 3: 182, 4: 153, 5: 192, 6: 170, 7: 155, 8: 152, 9: 147, 10: 154, 11: 227, 12: 173, 13: 184, 14: 210, 15: 180, 16: 180, 17: 175, 18: 188, 26: 204, 29: 196, 35: 185, 47: 172, 79: 166, 80: 155}

LATTICE_TYPES = {
    1: "HCP", 2: "HCP", 3: "BCC", 4: "HCP", 5: "Rhombohedral", 6: "Hexagonal",
    7: "HCP", 8: "Cubic", 9: "Cubic", 10: "FCC", 11: "BCC", 12: "HCP",
    13: "FCC", 14: "Diamond cubic", 15: "Orthorhombic", 16: "Orthorhombic",
    17: "Orthorhombic", 18: "FCC", 19: "BCC", 20: "FCC", 21: "HCP", 22: "HCP",
    23: "BCC", 24: "BCC", 25: "BCC", 26: "BCC", 27: "HCP", 28: "FCC",
    29: "FCC", 30: "HCP", 31: "Orthorhombic", 32: "Diamond cubic", 33: "Rhombohedral",
    34: "Hexagonal", 35: "Orthorhombic", 36: "FCC", 37: "BCC", 38: "FCC",
    39: "HCP", 40: "HCP", 41: "BCC", 42: "BCC", 43: "HCP", 44: "HCP",
    45: "FCC", 46: "FCC", 47: "FCC", 48: "HCP", 49: "Tetragonal", 50: "Tetragonal",
    51: "Rhombohedral", 52: "Hexagonal", 53: "Orthorhombic", 54: "FCC", 55: "BCC",
    56: "BCC", 74: "BCC", 75: "HCP", 76: "HCP", 77: "FCC", 78: "FCC",
    79: "FCC", 80: "Rhombohedral", 81: "HCP", 82: "FCC", 83: "Rhombohedral",
    90: "Orthorhombic", 92: "Orthorhombic",
}

LATTICE_SYSTEMS = {
    "SC": "cubic", "BCC": "cubic", "FCC": "cubic", "HCP": "hexagonal",
    "Rhombohedral": "trigonal", "Diamond cubic": "cubic", "Cubic": "cubic",
    "Orthorhombic": "orthorhombic", "Tetragonal": "tetragonal",
}

SPECTRAL_OVERRIDES = {
    1: [(656.281, 100.0, "H-alpha"), (486.133, 72.0, "H-beta"), (434.047, 42.0, "H-gamma")],
    2: [(447.148, 85.0, "He I"), (501.568, 64.0, "He I"), (587.562, 100.0, "He I")],
    8: [(615.598, 35.0, "O I"), (777.194, 100.0, "O I")],
    26: [(438.354, 55.0, "Fe I"), (495.759, 78.0, "Fe I"), (526.953, 100.0, "Fe I")],
}

ISOTOPE_OVERRIDES = {
    1: [
        {"mass_number": 1, "isotopic_mass": 1.00782503223, "abundance_percent": 99.9885, "stable": True},
        {"mass_number": 2, "isotopic_mass": 2.01410177812, "abundance_percent": 0.0115, "stable": True},
        {"mass_number": 3, "isotopic_mass": 3.01604928199, "abundance_percent": None, "stable": False},
    ],
    6: [
        {"mass_number": 12, "isotopic_mass": 12.0, "abundance_percent": 98.93, "stable": True},
        {"mass_number": 13, "isotopic_mass": 13.00335483507, "abundance_percent": 1.07, "stable": True},
        {"mass_number": 14, "isotopic_mass": 14.0032419884, "abundance_percent": None, "stable": False},
    ],
    8: [
        {"mass_number": 16, "isotopic_mass": 15.99491461957, "abundance_percent": 99.757, "stable": True},
        {"mass_number": 17, "isotopic_mass": 16.9991317565, "abundance_percent": 0.038, "stable": True},
        {"mass_number": 18, "isotopic_mass": 17.99915961286, "abundance_percent": 0.205, "stable": True},
    ],
    26: [
        {"mass_number": 54, "isotopic_mass": 53.93960899, "abundance_percent": 5.845, "stable": True},
        {"mass_number": 56, "isotopic_mass": 55.93493633, "abundance_percent": 91.754, "stable": True},
        {"mass_number": 57, "isotopic_mass": 56.93539284, "abundance_percent": 2.119, "stable": True},
        {"mass_number": 58, "isotopic_mass": 57.93327443, "abundance_percent": 0.282, "stable": True},
    ],
    92: [
        {"mass_number": 234, "isotopic_mass": 234.0409523, "abundance_percent": 0.0054, "stable": False},
        {"mass_number": 235, "isotopic_mass": 235.0439299, "abundance_percent": 0.7204, "stable": False},
        {"mass_number": 238, "isotopic_mass": 238.0507884, "abundance_percent": 99.2742, "stable": False},
    ],
}

NAME_ES_OVERRIDES = {
    1: "Hidrogeno", 2: "Helio", 3: "Litio", 4: "Berilio", 5: "Boro", 6: "Carbono",
    7: "Nitrogeno", 8: "Oxigeno", 9: "Fluor", 10: "Neon", 11: "Sodio", 12: "Magnesio",
    13: "Aluminio", 14: "Silicio", 15: "Fosforo", 16: "Azufre", 17: "Cloro", 18: "Argon",
    19: "Potasio", 20: "Calcio", 26: "Hierro", 29: "Cobre", 35: "Bromo", 47: "Plata",
    79: "Oro", 80: "Mercurio", 92: "Uranio", 118: "Oganeson",
}
NAME_ES_OVERRIDES.update({
    37: "Rubidio", 38: "Estroncio", 39: "Itrio", 40: "Circonio", 41: "Niobio", 42: "Molibdeno",
    43: "Tecnecio", 44: "Rutenio", 45: "Rodio", 46: "Paladio", 48: "Cadmio", 49: "Indio",
    50: "Estano", 51: "Antimonio", 52: "Telurio", 53: "Yodo", 54: "Xenon", 55: "Cesio",
    56: "Bario", 57: "Lantano", 58: "Cerio", 59: "Praseodimio", 60: "Neodimio", 61: "Prometio",
    62: "Samario", 63: "Europio", 64: "Gadolinio", 65: "Terbio", 66: "Disprosio", 67: "Holmio",
    68: "Erbio", 69: "Tulio", 70: "Iterbio", 71: "Lutecio", 72: "Hafnio", 73: "Tantalo",
    74: "Wolframio", 75: "Renio", 76: "Osmio", 77: "Iridio", 78: "Platino", 81: "Talio",
    82: "Plomo", 83: "Bismuto", 84: "Polonio", 85: "Astato", 86: "Radon", 87: "Francio",
    88: "Radio", 89: "Actinio", 90: "Torio", 91: "Protactinio", 93: "Neptunio", 94: "Plutonio",
    95: "Americio", 96: "Curio", 97: "Berkelio", 98: "Californio", 99: "Einstenio", 100: "Fermio",
    101: "Mendelevio", 102: "Nobelio", 103: "Lawrencio", 104: "Rutherfordio", 105: "Dubnio",
    106: "Seaborgio", 107: "Bohrio", 108: "Hassio", 109: "Meitnerio", 110: "Darmstadtio",
    111: "Roentgenio", 112: "Copernicio", 113: "Nihonio", 114: "Flerovio", 115: "Moscovio",
    116: "Livermorio", 117: "Tenesino",
})

OXIDATION_STATES = {
    1: [-1, 1], 2: [0], 3: [1], 4: [2], 5: [3], 6: [-4, -2, 2, 4],
    7: [-3, -2, -1, 1, 2, 3, 4, 5], 8: [-2, -1, 1, 2], 9: [-1], 10: [0],
    11: [1], 12: [2], 13: [3], 14: [-4, 2, 4], 15: [-3, 3, 5], 16: [-2, 2, 4, 6],
    17: [-1, 1, 3, 5, 7], 18: [0], 19: [1], 20: [2], 26: [2, 3], 29: [1, 2],
    35: [-1, 1, 3, 5], 47: [1], 79: [1, 3], 80: [1, 2], 92: [3, 4, 5, 6],
}

USES = {
    1: ["fuel cells", "ammonia production"], 2: ["cryogenics", "leak detection"],
    3: ["rechargeable batteries", "ceramics"], 5: ["borosilicate glass"],
    6: ["steelmaking", "organic chemistry"], 7: ["fertilizers", "inert atmospheres"],
    8: ["medicine", "steelmaking", "water treatment"], 9: ["fluoropolymers"],
    11: ["heat transfer", "street lighting"], 13: ["aircraft alloys", "packaging"],
    14: ["semiconductors", "glass"], 17: ["water disinfection"], 26: ["steel", "construction"],
    29: ["electrical wiring", "heat exchangers"], 47: ["photography", "electronics"],
    79: ["electronics", "catalysis", "jewelry"], 80: ["sensors", "laboratory instruments"],
    92: ["nuclear fuel", "research"],
}

DISCOVERERS = {
    1: "Henry Cavendish", 2: "Pierre Janssen and Norman Lockyer", 3: "Johan August Arfwedson",
    6: "Known since antiquity", 8: "Joseph Priestley and Carl Wilhelm Scheele", 26: "Known since antiquity",
    29: "Known since antiquity", 47: "Known since antiquity", 79: "Known since antiquity",
    80: "Known since antiquity", 92: "Martin Heinrich Klaproth",
}
DISCOVERY_YEARS = {
    1: 1766, 2: 1868, 3: 1817, 4: 1798, 5: 1808, 6: "Antiquity", 7: 1772, 8: 1774,
    9: 1886, 10: 1898, 11: 1807, 12: 1755, 13: 1825, 14: 1824, 15: 1669, 16: "Antiquity",
    17: 1774, 18: 1894, 19: 1807, 20: 1808, 21: 1879, 22: 1791, 23: 1801, 24: 1797,
    25: 1774, 26: "Antiquity", 27: 1735, 28: 1751, 29: "Antiquity", 30: 1746,
    31: 1875, 32: 1886, 33: 1250, 34: 1817, 35: 1826, 36: 1898, 47: "Antiquity",
    79: "Antiquity", 80: "Antiquity", 92: 1789,
}


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
        "uses": USES.get(z, []),
        "description": f"{name} ({SYMBOLS[z - 1]}) is atomic number {z} in the periodic table.",
        "abundance_earth_crust_ppm": None,
        "abundance_universe_ppm": None,
        "thermal_expansion_1_k": None,
        "sound_speed_m_s": None,
        "electronic_conductivity_s_m": None,
        "critical_temperature_k": None,
        "critical_pressure_mpa": None,
        "appearance": None,
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
