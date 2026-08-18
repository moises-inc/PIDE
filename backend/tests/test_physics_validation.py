import math

import pytest

from backend.app.core.registry import ElementRegistry
from backend.app.core.thermodynamics import phase_at_temperature


def test_atomic_numbers_and_masses_are_complete_and_ordered():
    elements = ElementRegistry().list_elements()
    assert [element.z for element in elements] == list(range(1, 119))
    assert all(element.atomic_mass is not None and element.atomic_mass > 0 for element in elements)
    assert elements[0].atomic_mass < elements[-1].atomic_mass
    assert elements[25].atomic_mass == pytest.approx(55.845)


@pytest.mark.parametrize(
    ("z", "temperature", "expected"),
    [(1, 298.15, "gas"), (35, 298.15, "liquid"), (26, 298.15, "solid"), (26, 4000, "gas")],
)
def test_phase_boundaries_match_compiled_transition_points(z, temperature, expected):
    assert phase_at_temperature(ElementRegistry().require(z), temperature) == expected


def test_phase_engine_rejects_temperature_outside_supported_domain():
    element = ElementRegistry().require(26)
    with pytest.raises(ValueError):
        phase_at_temperature(element, -0.1)
    with pytest.raises(ValueError):
        phase_at_temperature(element, 6000.1)


def test_numeric_dataset_values_are_finite_when_present():
    numeric_fields = (
        "atomic_mass",
        "density_g_cm3",
        "melting_point_k",
        "boiling_point_k",
        "covalent_radius_pm",
    )
    for element in ElementRegistry().list_elements():
        for field in numeric_fields:
            value = getattr(element, field)
            assert value is None or math.isfinite(value)


def test_element_source_provenance_is_present():
    source = ElementRegistry().require(8).source
    assert source["primary"] == "IUPAC"
    assert "NIST ASD" in source["secondary"]
