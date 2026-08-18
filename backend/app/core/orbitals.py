"""Hydrogenic orbital fields with an optional marching-cubes accelerator."""

from __future__ import annotations

import math
from typing import Any

try:  # NumPy is a declared dependency, but importing the module remains safe without it.
    import numpy as np
except ImportError:  # pragma: no cover - exercised only in deliberately minimal installs
    np = None  # type: ignore[assignment]

try:  # SciPy supplies stable special functions when available.
    from scipy.special import eval_genlaguerre, lpmv
except ImportError:  # pragma: no cover
    eval_genlaguerre = None
    lpmv = None

try:  # scikit-image is intentionally optional.
    from skimage.measure import marching_cubes
except ImportError:  # pragma: no cover
    marching_cubes = None


MAX_N = 8
MAX_GRID_SIZE = 65


def validate_quantum_numbers(n: int, l: int, m: int) -> tuple[int, int, int]:
    if any(isinstance(value, bool) or not isinstance(value, int) for value in (n, l, m)):
        raise ValueError("n, l, and m must be integers")
    if not 1 <= n <= MAX_N:
        raise ValueError(f"n must be in [1, {MAX_N}]")
    if not 0 <= l < n:
        raise ValueError("l must satisfy 0 <= l < n")
    if not -l <= m <= l:
        raise ValueError("m must satisfy -l <= m <= l")
    return n, l, m


def _validate_atomic_number(atomic_number: int) -> int:
    if isinstance(atomic_number, bool) or not isinstance(atomic_number, int) or not 1 <= atomic_number <= 118:
        raise ValueError("atomic_number must be an integer in [1, 118]")
    return atomic_number


def _require_numpy() -> Any:
    if np is None:
        raise RuntimeError("numpy is required for orbital calculations")
    return np


def _associated_laguerre(order: int, alpha: int, values: Any) -> Any:
    if eval_genlaguerre is not None:
        return eval_genlaguerre(order, alpha, values)
    if order == 0:
        return np.ones_like(values)
    if order == 1:
        return 1 + alpha - values
    previous = np.ones_like(values)
    current = 1 + alpha - values
    for index in range(2, order + 1):
        next_value = ((2 * index - 1 + alpha - values) * current - (index - 1 + alpha) * previous) / index
        previous, current = current, next_value
    return current


def _associated_legendre(l: int, order: int, values: Any) -> Any:
    if lpmv is not None:
        return lpmv(order, l, values)
    # Recurrence with the Condon-Shortley phase, used only when SciPy is absent.
    p_mm = np.ones_like(values)
    if order:
        factor = 1.0
        root = np.sqrt(np.maximum(0.0, 1.0 - values * values))
        for index in range(1, order + 1):
            factor *= -(2 * index - 1) * root
        p_mm = factor
    if l == order:
        return p_mm
    p_m1m = values * (2 * order + 1) * p_mm
    if l == order + 1:
        return p_m1m
    previous, current = p_mm, p_m1m
    for degree in range(order + 2, l + 1):
        next_value = ((2 * degree - 1) * values * current - (degree + order - 1) * previous) / (degree - order)
        previous, current = current, next_value
    return current


def _real_spherical_harmonic(l: int, m: int, theta: Any, phi: Any) -> Any:
    module = _require_numpy()
    order = abs(m)
    normalization = math.sqrt((2 * l + 1) / (4 * math.pi) * math.factorial(l - order) / math.factorial(l + order))
    legendre = _associated_legendre(l, order, module.cos(theta))
    if m > 0:
        return math.sqrt(2.0) * normalization * legendre * module.cos(order * phi)
    if m < 0:
        return math.sqrt(2.0) * normalization * legendre * module.sin(order * phi)
    return normalization * legendre


def hydrogenic_wavefunction(
    n: int,
    l: int,
    m: int,
    x: Any,
    y: Any,
    z: Any,
    atomic_number: int = 1,
) -> Any:
    """Evaluate a real hydrogenic orbital in Bohr coordinates."""

    validate_quantum_numbers(n, l, m)
    module = _require_numpy()
    _validate_atomic_number(atomic_number)
    x_values, y_values, z_values = (module.asarray(value, dtype=float) for value in (x, y, z))
    radius = module.sqrt(x_values * x_values + y_values * y_values + z_values * z_values)
    cos_theta = module.divide(z_values, radius, out=module.ones_like(radius), where=radius > 0)
    theta = module.arccos(module.clip(cos_theta, -1.0, 1.0))
    phi = module.arctan2(y_values, x_values)
    rho = 2.0 * atomic_number * radius / n
    normalization = math.sqrt((2.0 * atomic_number / n) ** 3 * math.factorial(n - l - 1) / (2.0 * n * math.factorial(n + l)))
    radial = normalization * module.exp(-rho / 2.0) * rho**l * _associated_laguerre(n - l - 1, 2 * l + 1, rho)
    return radial * _real_spherical_harmonic(l, m, theta, phi)


def generate_probability_grid(n: int, l: int, m: int, atomic_number: int = 1, grid_size: int = 25, extent_bohr: float | None = None) -> tuple[Any, float, float]:
    validate_quantum_numbers(n, l, m)
    _validate_atomic_number(atomic_number)
    module = _require_numpy()
    if isinstance(grid_size, bool) or not isinstance(grid_size, int) or not 9 <= grid_size <= MAX_GRID_SIZE:
        raise ValueError(f"grid_size must be in [9, {MAX_GRID_SIZE}]")
    if extent_bohr is None:
        extent_bohr = max(8.0, 2.5 * n * n / math.sqrt(atomic_number))
    if not math.isfinite(extent_bohr) or not 1.0 <= extent_bohr <= 100.0:
        raise ValueError("extent_bohr must be in [1, 100]")
    coordinates = module.linspace(-extent_bohr, extent_bohr, grid_size, dtype=float)
    x_values, y_values, z_values = module.meshgrid(coordinates, coordinates, coordinates, indexing="ij")
    wavefunction = hydrogenic_wavefunction(n, l, m, x_values, y_values, z_values, atomic_number)
    probability = module.nan_to_num(module.square(module.abs(wavefunction)), nan=0.0, posinf=0.0, neginf=0.0)
    spacing = float(coordinates[1] - coordinates[0])
    normalization = float(module.sum(probability) * spacing**3)
    return probability, spacing, normalization


def _fallback_surface(probability: Any, extent_bohr: float, spacing: float, iso_level: float) -> tuple[Any, Any]:
    module = _require_numpy()
    threshold = max(iso_level, float(module.quantile(probability, 0.90)))
    indexes = module.argwhere(probability >= threshold)
    if len(indexes) > 5000:
        indexes = indexes[:: max(1, len(indexes) // 5000)]
    vertices = indexes.astype(float) * spacing - extent_bohr
    return vertices, module.empty((0, 3), dtype=int)


def generate_orbital(
    n: int,
    l: int,
    m: int,
    *,
    atomic_number: int = 1,
    grid_size: int = 25,
    iso_fraction: float = 0.90,
    extent_bohr: float | None = None,
) -> dict[str, Any]:
    """Return a deterministic probability grid summary and an isosurface mesh."""

    validate_quantum_numbers(n, l, m)
    _validate_atomic_number(atomic_number)
    if not isinstance(iso_fraction, (int, float)) or isinstance(iso_fraction, bool) or not 0.01 <= iso_fraction <= 0.99:
        raise ValueError("iso_fraction must be in [0.01, 0.99]")
    probability, spacing, normalization = generate_probability_grid(n, l, m, atomic_number, grid_size, extent_bohr)
    module = _require_numpy()
    maximum = float(module.max(probability))
    iso_level = maximum * (1.0 - float(iso_fraction))
    vertices = faces = None
    method = "points-fallback"
    if marching_cubes is not None and maximum > 0 and float(module.min(probability)) <= iso_level <= maximum:
        try:
            raw_vertices, raw_faces, _, _ = marching_cubes(probability, level=iso_level, spacing=(spacing, spacing, spacing))
            vertices = raw_vertices - (grid_size - 1) * spacing / 2.0
            faces = raw_faces.astype(int)
            method = "marching-cubes"
        except (RuntimeError, ValueError):
            vertices = faces = None
    if vertices is None or faces is None:
        vertices, faces = _fallback_surface(probability, (grid_size - 1) * spacing / 2.0, spacing, iso_level)
    vertex_list = [tuple(float(component) for component in vertex) for vertex in vertices]
    face_list = [tuple(int(component) for component in face) for face in faces]
    extent = (grid_size - 1) * spacing / 2.0
    grid_summary = {
        "shape": [grid_size, grid_size, grid_size],
        "spacing_bohr": spacing,
        "extent_bohr": extent,
        "iso_level": iso_level,
    }
    return {
        "vertices": vertex_list,
        "faces": face_list,
        "probability_grid": grid_summary,
        "probability": grid_summary,
        "max_probability": maximum,
        "normalization": normalization,
        "metadata": {
            "n": n,
            "l": l,
            "m": m,
            "atomic_number": atomic_number,
            "coordinate_unit": "bohr",
            "mesh_method": method,
            "iso_fraction": float(iso_fraction),
        },
    }


generate_orbital_mesh = generate_orbital


def associated_laguerre(order: int, alpha: int, values: Any) -> Any:
    if isinstance(order, bool) or not isinstance(order, int) or order < 0:
        raise ValueError("order must be a non-negative integer")
    if isinstance(alpha, bool) or not isinstance(alpha, int) or alpha < 0:
        raise ValueError("alpha must be a non-negative integer")
    return _associated_laguerre(order, alpha, _require_numpy().asarray(values, dtype=float))


def real_spherical_harmonic(l: int, m: int, theta: Any, phi: Any) -> Any:
    validate_quantum_numbers(max(1, l + 1), l, m)
    return _real_spherical_harmonic(l, m, _require_numpy().asarray(theta, dtype=float), _require_numpy().asarray(phi, dtype=float))


def hydrogenic_radial(n: int, l: int, radius: Any, atomic_number: int = 1) -> Any:
    validate_quantum_numbers(n, l, 0)
    _validate_atomic_number(atomic_number)
    module = _require_numpy()
    radius_values = module.asarray(radius, dtype=float)
    rho = 2.0 * atomic_number * radius_values / n
    normalization = math.sqrt((2.0 * atomic_number / n) ** 3 * math.factorial(n - l - 1) / (2.0 * n * math.factorial(n + l)))
    return normalization * module.exp(-rho / 2.0) * rho**l * _associated_laguerre(n - l - 1, 2 * l + 1, rho)
