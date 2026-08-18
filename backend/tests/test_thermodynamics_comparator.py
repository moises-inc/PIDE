import math

import pytest

from backend.app.core.comparator import compare_elements, pearson_correlation
from backend.app.core.registry import ElementRegistry
from backend.app.core.thermodynamics import phase_at_temperature, phase_profile


@pytest.mark.parametrize(
    ("z", "temperature", "phase"),
    [(1, 10, "solid"), (1, 300, "gas"), (35, 280, "liquid"), (35, 400, "gas"), (79, 1400, "liquid"), (26, 300, "solid")],
)
def test_phase_at_temperature_uses_melting_and_boiling_points(z, temperature, phase):
    assert phase_at_temperature(ElementRegistry().require(z), temperature) == phase


@pytest.mark.parametrize("temperature", [-1, 6000.1, float("nan")])
def test_phase_temperature_limits_are_rejected(temperature):
    with pytest.raises(ValueError):
        phase_at_temperature(ElementRegistry().require(26), temperature)


def test_phase_profile_has_deterministic_boundaries():
    profile = phase_profile(ElementRegistry().require(26))
    assert profile["melting_point_k"] < profile["boiling_point_k"]
    assert profile["allowed_range_k"] == [0.0, 6000.0]


def test_comparator_returns_differences_correlations_and_radar():
    result = compare_elements(ElementRegistry(), [1, 8, 26], ["atomic_mass", "density_g_cm3"])
    assert result["z"] == [1, 8, 26]
    assert set(result["differences"]) == {"atomic_mass", "density_g_cm3"}
    assert len(result["radar"]) == 3
    assert "atomic_mass" in result["correlations"]


def test_comparator_normalizes_radar_values_between_zero_and_one():
    result = compare_elements(ElementRegistry(), [1, 8, 26], ["atomic_mass"])
    values = [item["values"]["atomic_mass"] for item in result["radar"]]
    assert all(0.0 <= value <= 1.0 for value in values)
    assert min(values) == 0.0
    assert max(values) == 1.0


def test_comparator_rejects_unknown_or_non_numeric_properties():
    with pytest.raises(ValueError):
        compare_elements(ElementRegistry(), [1, 8], ["does_not_exist"])
    with pytest.raises(ValueError):
        compare_elements(ElementRegistry(), [1, 8], ["symbol"])


def test_comparator_rejects_selection_limits():
    with pytest.raises(ValueError):
        compare_elements(ElementRegistry(), [1], ["atomic_mass"])
    with pytest.raises(ValueError):
        compare_elements(ElementRegistry(), list(range(1, 10)), ["atomic_mass"])
    with pytest.raises(ValueError):
        compare_elements(ElementRegistry(), [1, 1], ["atomic_mass"])


def test_pearson_correlation_is_signed_and_bounded():
    assert math.isclose(pearson_correlation([1, 2, 3], [1, 2, 3]), 1.0)
    assert math.isclose(pearson_correlation([1, 2, 3], [3, 2, 1]), -1.0)
    assert pearson_correlation([1, 1, 1], [1, 2, 3]) is None


def test_compare_handles_missing_values_without_nan():
    registry = ElementRegistry()
    result = compare_elements(registry, [1, 2, 26], ["electronegativity_pauling"])
    assert all(value is None or math.isfinite(value) for value in result["correlations"]["electronegativity_pauling"].values())
