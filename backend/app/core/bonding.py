"""Deterministic chemical bonding engine (Pauling scale, N-O-F hydrogen rule)."""

from __future__ import annotations

import math

from ..models import BondAnalysisResponse, Element

PAULING_POLAR_THRESHOLD = 0.4
PAULING_IONIC_THRESHOLD = 1.7
PAULING_SCALE_MAX = 3.3
HYDROGEN_BOND_PARTNERS = frozenset({7, 8, 9})

BOND_TYPE_ES = {
    "metallic": "Enlace metálico",
    "ionic": "Enlace iónico",
    "covalent_polar": "Enlace covalente polar",
    "covalent_nonpolar": "Enlace covalente apolar",
    "unknown": "Enlace indeterminado",
}


def _delta_chi(element_a: Element, element_b: Element) -> float | None:
    en_a = element_a.electronegativity_pauling
    en_b = element_b.electronegativity_pauling
    if en_a is None or en_b is None:
        return None
    return round(abs(en_a - en_b), 3)


def _classify_bond(element_a: Element, element_b: Element, delta: float | None) -> str:
    if element_a.metal_class == "metal" and element_b.metal_class == "metal":
        return "metallic"
    if delta is None:
        return "unknown"
    if element_a.metal_class == "nonmetal" and element_b.metal_class == "nonmetal":
        if delta < PAULING_POLAR_THRESHOLD:
            return "covalent_nonpolar"
        return "covalent_polar"
    if delta >= PAULING_IONIC_THRESHOLD:
        return "ionic"
    if delta < PAULING_POLAR_THRESHOLD:
        return "covalent_nonpolar"
    return "covalent_polar"


def _character_percentages(delta: float | None) -> tuple[float | None, float | None]:
    if delta is None:
        return None, None
    ionic = round((1 - math.exp(-((delta / 2) ** 2))) * 100, 1)
    covalent = round(100 - ionic, 1)
    return ionic, covalent


def _more_electronegative(element_a: Element, element_b: Element) -> Element | None:
    en_a = element_a.electronegativity_pauling
    en_b = element_b.electronegativity_pauling
    if en_a is None or en_b is None:
        return None
    if en_a == en_b:
        return None
    return element_a if en_a > en_b else element_b


def _partial_charges(element_a: Element, element_b: Element, delta: float | None, bond_type: str) -> dict[str, str]:
    if bond_type == "metallic" or delta is None:
        return {}
    if delta == 0:
        return {element_a.symbol: "delta0", element_b.symbol: "delta0"}
    more = _more_electronegative(element_a, element_b)
    less = element_b if more is element_a else element_a
    return {more.symbol: "delta-", less.symbol: "delta+"}


def _hydrogen_bond(element_a: Element, element_b: Element) -> tuple[bool, str, str]:
    pair = {element_a.z, element_b.z}
    partners = pair & HYDROGEN_BOND_PARTNERS
    if 1 in pair and partners:
        partner = next(iter(partners))
        partner_symbol = element_a.symbol if element_a.z == partner else element_b.symbol
        role_labels = {7: "Nitrógeno", 8: "Oxígeno", 9: "Flúor"}
        return (
            True,
            "both",
            (
                f"El hidrógeno actúa como donante (δ⁺) y el {role_labels[partner]} ({partner_symbol}) como aceptor "
                "mediante sus pares de electrones libres: el par cumple la regla N–O–F y puede formar puentes de hidrógeno."
            ),
        )
    return (
        False,
        "none",
        (
            "Solo el hidrógeno unido a Nitrógeno (Z=7), Oxígeno (Z=8) o Flúor (Z=9) genera puentes de hidrógeno. "
            "Este par no cumple la regla N–O–F, por lo que no presenta ese potencial."
        ),
    )


def _explanation(bond_type: str, delta: float | None, element_a: Element, element_b: Element, en_a: float | None, en_b: float | None) -> str:
    more = _more_electronegative(element_a, element_b)
    if bond_type == "metallic":
        return (
            f"{element_a.name_es} y {element_b.name_es} son metales: comparten un mar de electrones deslocalizados "
            "que da lugar a un enlace metálico, sin transferencia neta de carga."
        )
    if bond_type == "unknown":
        missing = " y ".join(sorted({symbol for symbol, en in ((element_a.symbol, en_a), (element_b.symbol, en_b)) if en is None}))
        return f"No hay dato de electronegatividad de Pauling para {missing}; la clasificación determinista no es posible."
    if bond_type == "ionic":
        return (
            f"La diferencia de electronegatividad Δχ = {delta} supera el umbral de Pauling (1.7): "
            f"{more.name_es} ({more.symbol}) atrae con fuerza la densidad electrónica y se forma un enlace iónico."
        )
    if bond_type == "covalent_polar":
        if element_a.metal_class == "nonmetal" and element_b.metal_class == "nonmetal" and delta >= PAULING_IONIC_THRESHOLD:
            return (
                f"Aunque Δχ = {delta} supera 1.7, ambos elementos son no metales: el par conserva carácter covalente polar "
                f"con un fuerte dipolo hacia {more.name_es} ({more.symbol}), el caso límite clásico del enlace H–F."
            )
        return (
            f"La diferencia Δχ = {delta} está entre 0.4 y 1.7: el par comparte electrones de forma desigual y "
            f"aparece un dipolo permanente dirigido hacia {more.name_es} ({more.symbol})."
        )
    return (
        f"La diferencia Δχ = {delta} es menor que 0.4: los electrones se comparten de manera casi simétrica "
        "y no aparece un dipolo neto apreciable."
    )


def analyze_bond(element_a: Element, element_b: Element) -> BondAnalysisResponse:
    """Classify the bond between two elements with deterministic Pauling rules."""
    delta = _delta_chi(element_a, element_b)
    bond_type = _classify_bond(element_a, element_b, delta)
    ionic_percent, covalent_percent = _character_percentages(delta)
    has_hydrogen_bond, hydrogen_bond_role, hydrogen_bond_explanation = _hydrogen_bond(element_a, element_b)
    en_a = element_a.electronegativity_pauling
    en_b = element_b.electronegativity_pauling
    return BondAnalysisResponse(
        z1=element_a.z,
        z2=element_b.z,
        symbol1=element_a.symbol,
        symbol2=element_b.symbol,
        name_es1=element_a.name_es,
        name_es2=element_b.name_es,
        electronegativity1=en_a,
        electronegativity2=en_b,
        delta_electronegativity=delta,
        bond_type=bond_type,
        bond_type_es=BOND_TYPE_ES[bond_type],
        ionic_character_percent=ionic_percent,
        covalent_character_percent=covalent_percent,
        has_hydrogen_bond_potential=has_hydrogen_bond,
        hydrogen_bond_role=hydrogen_bond_role,
        hydrogen_bond_explanation=hydrogen_bond_explanation,
        partial_charges=_partial_charges(element_a, element_b, delta, bond_type),
        explanation=_explanation(bond_type, delta, element_a, element_b, en_a, en_b),
    )
