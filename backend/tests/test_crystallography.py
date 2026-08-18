import math

import pytest

from backend.app.core.crystallography import (
    BRAVAIS_LATTICES,
    generate_unit_cell,
    lattice_parameter_from_radius,
)
from backend.app.core.registry import ElementRegistry


@pytest.mark.parametrize("lattice", sorted(BRAVAIS_LATTICES))
def test_all_fourteen_bravais_lattices_have_generators(lattice):
    result = generate_unit_cell(lattice, a=3.0, b=3.2, c=4.0)
    assert result["lattice"] == lattice
    assert result["atoms"]
    assert all(len(atom["position"]) == 3 for atom in result["atoms"])


@pytest.mark.parametrize(
    ("lattice", "expected_atoms"),
    [("SC", 1), ("BCC", 2), ("FCC", 4), ("HCP", 2)],
)
def test_common_lattice_basis_counts(lattice, expected_atoms):
    assert len(generate_unit_cell(lattice, a=3.0)["atoms"]) == expected_atoms


def test_bcc_has_center_atom():
    positions = [atom["fractional"] for atom in generate_unit_cell("BCC", a=3.0)["atoms"]]
    assert [0.5, 0.5, 0.5] in positions


def test_fcc_has_face_centers():
    positions = [atom["fractional"] for atom in generate_unit_cell("FCC", a=3.0)["atoms"]]
    assert [0.0, 0.5, 0.5] in positions
    assert [0.5, 0.0, 0.5] in positions


def test_bonds_reference_valid_atom_indices():
    result = generate_unit_cell("FCC", a=3.6, cutoff=3.0)
    assert result["bonds"]
    for first, second in result["bonds"]:
        assert 0 <= first < len(result["atoms"])
        assert 0 <= second < len(result["atoms"])
        assert first != second


def test_lattice_parameters_follow_radius_geometry():
    assert math.isclose(lattice_parameter_from_radius(125, "SC"), 2.5, rel_tol=1e-9)
    assert lattice_parameter_from_radius(125, "FCC") > 2.5


def test_element_crystal_generation_uses_registry_data():
    element = ElementRegistry().require(26)
    result = generate_unit_cell(element.crystal_structure or "BCC", radius_pm=element.covalent_radius_pm)
    assert result["element_z"] == 26 or result["element_z"] is None
    assert result["atoms"]


def test_crystal_inputs_are_bounded():
    with pytest.raises(ValueError):
        generate_unit_cell("FCC", a=0)
    with pytest.raises(ValueError):
        generate_unit_cell("FCC", a=100.1)
    with pytest.raises(ValueError):
        generate_unit_cell("not-a-lattice", a=3)
