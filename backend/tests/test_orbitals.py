import math

import numpy as np
import pytest

from backend.app.core.orbitals import (
    generate_orbital,
    hydrogenic_wavefunction,
    validate_quantum_numbers,
)


@pytest.mark.parametrize("quantum_numbers", [(1, 0, 0), (2, 0, 0), (2, 1, -1), (2, 1, 0), (2, 1, 1), (3, 2, -2), (4, 3, 0), (5, 4, 4)])
def test_valid_quantum_numbers_are_accepted(quantum_numbers):
    assert validate_quantum_numbers(*quantum_numbers) == quantum_numbers


@pytest.mark.parametrize("quantum_numbers", [(0, 0, 0), (1, 1, 0), (2, 0, 1), (2, 2, 0)])
def test_invalid_quantum_numbers_are_rejected(quantum_numbers):
    with pytest.raises(ValueError):
        validate_quantum_numbers(*quantum_numbers)


def test_wavefunction_returns_finite_values():
    values = hydrogenic_wavefunction(2, 1, 0, np.array([0.0, 0.5]), np.array([1.0, 1.0]), np.array([0.0, 0.0]))
    assert np.all(np.isfinite(values))


def test_orbital_grid_has_expected_shape_and_probability():
    result = generate_orbital(2, 1, 0, grid_size=15)
    assert result["probability_grid"]["shape"] == [15, 15, 15]
    assert result["max_probability"] > 0
    assert result["normalization"] > 0


def test_orbital_mesh_is_finite_and_bounded():
    result = generate_orbital(2, 1, 0, grid_size=15)
    vertices = np.asarray(result["vertices"])
    faces = np.asarray(result["faces"])
    assert vertices.ndim == 2 and vertices.shape[1] == 3
    assert np.all(np.isfinite(vertices))
    if len(faces):
        assert faces.min() >= 0
        assert faces.max() < len(vertices)


def test_orbital_generation_is_deterministic():
    first = generate_orbital(3, 2, 1, grid_size=13)
    second = generate_orbital(3, 2, 1, grid_size=13)
    assert first["vertices"] == second["vertices"]
    assert first["faces"] == second["faces"]
    assert first["normalization"] == second["normalization"]


def test_orbital_grid_limit_is_enforced():
    with pytest.raises(ValueError):
        generate_orbital(1, 0, 0, grid_size=8)
    with pytest.raises(ValueError):
        generate_orbital(1, 0, 0, grid_size=66)


@pytest.mark.parametrize("quantum_numbers", [(1, 0, 0), (2, 1, 0), (3, 2, 2), (4, 3, -1)])
def test_orbital_metadata_preserves_quantum_numbers(quantum_numbers):
    result = generate_orbital(*quantum_numbers, grid_size=11)
    assert tuple(result["metadata"][key] for key in ("n", "l", "m")) == quantum_numbers


def test_atomic_number_changes_wavefunction_metadata():
    result = generate_orbital(1, 0, 0, atomic_number=8, grid_size=11)
    assert result["metadata"]["atomic_number"] == 8
