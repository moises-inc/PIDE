"""Deterministic comparison, normalization, and Pearson statistics."""

from __future__ import annotations

import math
from typing import Iterable, Sequence

from .registry import ElementRegistry, canonical_property


def pearson_correlation(first: Sequence[float | None], second: Sequence[float | None]) -> float | None:
    if len(first) != len(second):
        raise ValueError("correlation sequences must have the same length")
    pairs = [(float(left), float(right)) for left, right in zip(first, second) if left is not None and right is not None]
    if len(pairs) < 2:
        return None
    first_values = [pair[0] for pair in pairs]
    second_values = [pair[1] for pair in pairs]
    first_mean = sum(first_values) / len(first_values)
    second_mean = sum(second_values) / len(second_values)
    numerator = sum((left - first_mean) * (right - second_mean) for left, right in pairs)
    first_norm = math.sqrt(sum((left - first_mean) ** 2 for left in first_values))
    second_norm = math.sqrt(sum((right - second_mean) ** 2 for right in second_values))
    if first_norm == 0 or second_norm == 0:
        return None
    return max(-1.0, min(1.0, numerator / (first_norm * second_norm)))


def _normalize(value: float | None, minimum: float | None, maximum: float | None) -> float | None:
    if value is None or minimum is None or maximum is None:
        return None
    if maximum == minimum:
        return 0.5
    return (value - minimum) / (maximum - minimum)


def compare_elements(registry: ElementRegistry, z_values: Iterable[int], properties: Iterable[str] | None = None) -> dict:
    numbers = list(z_values)
    if not 2 <= len(numbers) <= 8:
        raise ValueError("comparison requires between 2 and 8 elements")
    if len(set(numbers)) != len(numbers):
        raise ValueError("comparison elements must be unique")
    elements = [registry.require(number) for number in numbers]
    if isinstance(properties, str):
        properties = [properties]
    selected_properties = [canonical_property(value) for value in (properties or ["atomic_mass", "density_g_cm3", "melting_point_k"])]
    if len(selected_properties) > 8 or not selected_properties:
        raise ValueError("comparison requires between 1 and 8 properties")
    if len(set(selected_properties)) != len(selected_properties):
        raise ValueError("comparison properties must be unique")
    differences = {}
    ranges: dict[str, tuple[float | None, float | None]] = {}
    values_by_property: dict[str, list[float | None]] = {}
    for property_name in selected_properties:
        values = [element.numeric_value(property_name) for element in elements]
        values_by_property[property_name] = values
        finite_values = [value for value in values if value is not None and math.isfinite(value)]
        minimum = min(finite_values) if finite_values else None
        maximum = max(finite_values) if finite_values else None
        ranges[property_name] = (minimum, maximum)
        differences[property_name] = {
            "min": minimum,
            "max": maximum,
            "range": None if minimum is None or maximum is None else maximum - minimum,
            "pairwise": [
                {"z1": numbers[first], "z2": numbers[second], "difference": None if values[first] is None or values[second] is None else values[first] - values[second]}
                for first in range(len(numbers))
                for second in range(first + 1, len(numbers))
            ],
        }
    correlations = {
        property_name: {
            "with_atomic_number": pearson_correlation(values, [float(number) for number in numbers]),
            "with_first_property": pearson_correlation(values, values_by_property[selected_properties[0]]),
        }
        for property_name, values in values_by_property.items()
    }
    radar = []
    for index, element in enumerate(elements):
        radar.append({
            "z": element.z,
            "symbol": element.symbol,
            "values": {
                property_name: _normalize(value, *ranges[property_name])
                for property_name, value in ((name, values_by_property[name][index]) for name in selected_properties)
            },
        })
    return {
        "z": numbers,
        "properties": selected_properties,
        "elements": elements,
        "differences": differences,
        "correlations": correlations,
        "radar": radar,
    }


compare = compare_elements
