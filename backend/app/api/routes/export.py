from __future__ import annotations

import csv
import io
from typing import Any

from fastapi import APIRouter

from ...core.registry import get_registry
from ...errors import PideValidationError
from ...models import Element, ExportRequest, ExportResponse

router = APIRouter(tags=["export"])
DEFAULT_EXPORT_PROPERTIES = ["atomic_mass", "period", "group", "block", "category", "density_g_cm3", "melting_point_k", "boiling_point_k"]


def _element_row(element: Element, properties: list[str]) -> dict[str, Any]:
    row: dict[str, Any] = {"z": element.z, "symbol": element.symbol, "name": element.name_en}
    for property_name in properties:
        row[property_name] = getattr(element, property_name, None)
    return row


def _csv_content(elements: list[Element], properties: list[str]) -> str:
    columns = ["z", "symbol", "name", *properties]
    output = io.StringIO(newline="")
    writer = csv.DictWriter(output, fieldnames=columns, lineterminator="\n")
    writer.writeheader()
    for element in elements:
        writer.writerow(_element_row(element, properties))
    return output.getvalue()


def _latex_content(elements: list[Element], properties: list[str]) -> str:
    columns = ["Z", "Symbol", "Name", *properties]
    latex_break = "\\\\"
    lines = ["% PIDE offline export", "\\begin{tabular}{lll" + "r" * len(properties) + "}", " ".join(columns) + " " + latex_break, "\\hline"]
    for element in elements:
        row = _element_row(element, properties)
        lines.append(" & ".join(str(row.get(column.lower(), "")) for column in columns) + " " + latex_break)
    lines.append("\\end{tabular}")
    return "\n".join(lines) + "\n"


def _bibtex_content(elements: list[Element]) -> str:
    keys = []
    for element in elements:
        key = f"iupac_periodic_table_{element.z}"
        keys.append(f"@misc{{{key},\n  title = {{{element.name_en}}},\n  note = {{PIDE offline IUPAC/CIAAW snapshot, Z={element.z}}}\n}}")
    return "\n\n".join(keys) + "\n"


@router.post("/export", response_model=ExportResponse)
def export_data(request: ExportRequest) -> dict[str, str]:
    registry = get_registry()
    try:
        elements = [registry.require(z) for z in request.element_numbers]
        properties = request.properties or DEFAULT_EXPORT_PROPERTIES
        for property_name in properties:
            if not hasattr(elements[0], property_name):
                raise ValueError(f"Unsupported export property: {property_name}")
        if request.format == "csv":
            return {"format": "csv", "filename": "pide-elements.csv", "media_type": "text/csv", "content": _csv_content(elements, properties)}
        if request.format == "latex":
            return {"format": "latex", "filename": "pide-elements.tex", "media_type": "application/x-tex", "content": _latex_content(elements, properties)}
        return {"format": "bibtex", "filename": "pide-elements.bib", "media_type": "application/x-bibtex", "content": _bibtex_content(elements)}
    except (ValueError, TypeError) as exc:
        raise PideValidationError(str(exc)) from exc
