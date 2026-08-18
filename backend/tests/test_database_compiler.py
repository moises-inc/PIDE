import gzip
import hashlib
import json
from pathlib import Path

from backend.scripts.build_database import compile_database, validate_database


def test_compiler_generates_all_four_datasets(tmp_path: Path):
    paths = compile_database(tmp_path)
    assert {path.name for path in paths} == {
        "elements.json",
        "spectra_nist.json.gz",
        "crystals.json",
        "isotopes.json",
    }


def test_compiled_elements_have_all_atomic_numbers(tmp_path: Path):
    compile_database(tmp_path)
    elements = json.loads((tmp_path / "elements.json").read_text())
    assert len(elements) == 118
    assert [element["z"] for element in elements] == list(range(1, 119))


def test_compiled_elements_have_provenance_and_core_properties(tmp_path: Path):
    compile_database(tmp_path)
    elements = json.loads((tmp_path / "elements.json").read_text())
    required = {
        "z",
        "symbol",
        "name_en",
        "name_es",
        "atomic_mass",
        "period",
        "group",
        "block",
        "category",
        "electron_configuration",
        "oxidation_states",
        "source",
    }
    assert required <= set(elements[0])
    assert elements[0]["source"]["primary"] == "IUPAC"


def test_compiled_spectra_cover_all_atomic_numbers(tmp_path: Path):
    compile_database(tmp_path)
    with gzip.open(tmp_path / "spectra_nist.json.gz", "rt", encoding="utf-8") as handle:
        spectra = json.load(handle)
    assert len(spectra) == 118
    assert {record["z"] for record in spectra} == set(range(1, 119))
    assert all(record["lines"] for record in spectra)


def test_compiled_crystals_and_isotopes_cover_all_atomic_numbers(tmp_path: Path):
    compile_database(tmp_path)
    crystals = json.loads((tmp_path / "crystals.json").read_text())
    isotopes = json.loads((tmp_path / "isotopes.json").read_text())
    assert {record["z"] for record in crystals} == set(range(1, 119))
    assert {record["z"] for record in isotopes} == set(range(1, 119))


def test_compiler_is_byte_deterministic(tmp_path: Path):
    first = tmp_path / "first"
    second = tmp_path / "second"
    compile_database(first)
    compile_database(second)
    for name in ("elements.json", "spectra_nist.json.gz", "crystals.json", "isotopes.json"):
        first_hash = hashlib.sha256((first / name).read_bytes()).hexdigest()
        second_hash = hashlib.sha256((second / name).read_bytes()).hexdigest()
        assert first_hash == second_hash


def test_database_validator_accepts_compiled_snapshot(tmp_path: Path):
    compile_database(tmp_path)
    report = validate_database(tmp_path)
    assert report["elements"] == 118
    assert report["spectra"] == 118
    assert report["crystals"] == 118
    assert report["isotopes"] == 118


def test_isotope_records_have_stable_keys(tmp_path: Path):
    compile_database(tmp_path)
    isotopes = json.loads((tmp_path / "isotopes.json").read_text())
    assert {"z", "symbol", "isotopes", "source"} <= set(isotopes[0])
    assert all(isinstance(record["isotopes"], list) for record in isotopes)


def test_compiler_preserves_discovery_and_most_abundant_isotope_data(tmp_path: Path):
    compile_database(tmp_path)
    elements = json.loads((tmp_path / "elements.json").read_text())
    isotopes = json.loads((tmp_path / "isotopes.json").read_text())
    iron = elements[25]
    iron_isotopes = isotopes[25]["isotopes"]
    assert iron["year_discovered"] == "Antiquity"
    assert iron["most_stable_isotope_mass"] == 55.93493633
    assert max(iron_isotopes, key=lambda item: item["abundance_percent"])["mass_number"] == 56
