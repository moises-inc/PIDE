import math

import pytest

from backend.app.core.registry import ElementRegistry
from backend.app.core.spectroscopy import (
    generate_spectrum,
    rydberg_wavelength_nm,
    wavelength_to_rgb,
)


@pytest.mark.parametrize(
    ("wavelength", "expected_channel"),
    [(380.0, 2), (400.0, 2), (450.0, 2), (500.0, 1), (550.0, 1), (600.0, 0), (650.0, 0), (780.0, 0)],
)
def test_visible_wavelength_maps_to_bounded_rgb(wavelength, expected_channel):
    rgb = wavelength_to_rgb(wavelength)
    assert len(rgb) == 3
    assert all(0 <= channel <= 255 for channel in rgb)
    assert rgb[expected_channel] >= 0


@pytest.mark.parametrize("wavelength", [379.99, 780.01, float("nan"), float("inf")])
def test_wavelength_rejects_out_of_domain_values(wavelength):
    with pytest.raises(ValueError):
        wavelength_to_rgb(wavelength)


def test_wavelength_mapping_is_deterministic():
    assert wavelength_to_rgb(656.28) == wavelength_to_rgb(656.28)


def test_hydrogen_balmer_alpha_matches_known_line():
    wavelength = rydberg_wavelength_nm(1, 3, 2)
    assert math.isclose(wavelength, 656.47, rel_tol=0.002)


def test_rydberg_requires_a_downward_transition():
    with pytest.raises(ValueError):
        rydberg_wavelength_nm(1, 2, 2)
    with pytest.raises(ValueError):
        rydberg_wavelength_nm(0, 3, 2)


def test_spectrum_lines_are_sorted_and_colored():
    spectrum = generate_spectrum(ElementRegistry().require(1), max_lines=20)
    wavelengths = [line["wavelength_nm"] for line in spectrum["lines"]]
    assert wavelengths == sorted(wavelengths)
    assert all(len(line["rgb"]) == 3 for line in spectrum["lines"])


def test_spectrum_limit_is_enforced():
    with pytest.raises(ValueError):
        generate_spectrum(ElementRegistry().require(1), max_lines=0)
    with pytest.raises(ValueError):
        generate_spectrum(ElementRegistry().require(1), max_lines=501)


@pytest.mark.parametrize("z", [1, 2, 6, 8, 26, 47, 79, 118])
def test_every_sampled_element_has_a_finite_spectrum(z):
    spectrum = generate_spectrum(ElementRegistry().require(z), max_lines=10)
    assert spectrum["z"] == z
    assert spectrum["lines"]
    assert all(math.isfinite(line["wavelength_nm"]) for line in spectrum["lines"])
