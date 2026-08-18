import pytest
from fastapi.testclient import TestClient

from backend.app.main import app


client = TestClient(app)


def test_health_endpoint_is_local_and_structured():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
    assert response.json()["service"] == "pide"


def test_openapi_is_available():
    response = client.get("/openapi.json")
    assert response.status_code == 200
    assert "/api/elements" in response.json()["paths"]


def test_elements_endpoint_returns_118_elements():
    response = client.get("/api/elements")
    assert response.status_code == 200
    payload = response.json()
    assert len(payload) == 118
    assert payload[0]["z"] == 1
    assert payload[-1]["symbol"] == "Og"


@pytest.mark.parametrize(
    ("query", "expected"),
    [("?block=f", "f"), ("?group=18", "noble_gas"), ("?period=1", "gas"), ("?category=halogen", "halogen")],
)
def test_elements_endpoint_filters(query, expected):
    response = client.get("/api/elements" + query)
    assert response.status_code == 200
    assert response.json()
    if query.startswith("?block"):
        assert all(item["block"] == expected for item in response.json())
    elif query.startswith("?period"):
        assert all(item["phase"] == expected for item in response.json())
    else:
        assert all(item["category"] == expected for item in response.json())


def test_elements_endpoint_supports_pagination_limit():
    response = client.get("/api/elements?offset=2&limit=3")
    assert response.status_code == 200
    assert [item["z"] for item in response.json()] == [3, 4, 5]


def test_element_detail_endpoint_returns_camel_case_properties():
    response = client.get("/api/elements/26")
    assert response.status_code == 200
    payload = response.json()
    assert payload["symbol"] == "Fe"
    assert payload["atomicMass"] == pytest.approx(55.845)
    assert "electronConfiguration" in payload
    assert payload["yearDiscovered"] == "Antiquity"


@pytest.mark.parametrize("path", ["/api/elements/0", "/api/elements/119", "/api/elements/not-a-number"])
def test_element_endpoint_returns_structured_validation_errors(path):
    response = client.get(path)
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "VALIDATION_ERROR"


def test_unknown_element_returns_structured_not_found():
    response = client.get("/api/elements/99")
    assert response.status_code == 200
    response = client.get("/api/elements/118")
    assert response.status_code == 200


def test_spectra_endpoint_returns_visible_rgb_lines():
    response = client.get("/api/spectra/1?max_lines=5")
    assert response.status_code == 200
    payload = response.json()
    assert payload["z"] == 1
    assert len(payload["lines"]) <= 5
    assert all(len(line["rgb"]) == 3 for line in payload["lines"])


def test_spectra_endpoint_rejects_invalid_limit():
    response = client.get("/api/spectra/1?max_lines=501")
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "VALIDATION_ERROR"


def test_orbitals_endpoint_returns_mesh_payload():
    response = client.get("/api/orbitals/2/1/0?grid_size=11")
    assert response.status_code == 200
    payload = response.json()
    assert payload["metadata"]["n"] == 2
    assert payload["vertices"]
    assert "faces" in payload


def test_orbitals_endpoint_rejects_inconsistent_quantum_numbers():
    response = client.get("/api/orbitals/2/2/0")
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "VALIDATION_ERROR"


def test_crystals_endpoint_returns_atoms_and_bonds():
    response = client.get("/api/crystals/26")
    assert response.status_code == 200
    payload = response.json()
    assert payload["z"] == 26
    assert payload["atoms"]
    assert payload["bonds"]


def test_trends_endpoint_returns_series_for_property():
    response = client.get("/api/trends?property=atomic_mass")
    assert response.status_code == 200
    payload = response.json()
    assert payload["property"] == "atomic_mass"
    assert len(payload["series"]) == 118


def test_trends_endpoint_rejects_unknown_property():
    response = client.get("/api/trends?property=unknown")
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "VALIDATION_ERROR"


def test_compare_endpoint_returns_analysis():
    response = client.post("/api/compare", json={"z": [1, 8, 26], "properties": ["atomic_mass", "density_g_cm3"]})
    assert response.status_code == 200
    payload = response.json()
    assert payload["z"] == [1, 8, 26]
    assert "correlations" in payload
    assert len(payload["radar"]) == 3
    assert "atomic_mass" in payload["radar"][0]["values"]


def test_compare_endpoint_rejects_too_many_elements():
    response = client.post("/api/compare", json={"z": list(range(1, 10))})
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "VALIDATION_ERROR"


@pytest.mark.parametrize("export_format", ["csv", "latex", "bibtex"])
def test_export_endpoint_supports_declared_formats(export_format):
    response = client.post("/api/export", json={"format": export_format, "z": [1, 8]})
    assert response.status_code == 200
    payload = response.json()
    assert payload["format"] == export_format
    assert payload["content"]
    assert payload["mediaType"]


def test_export_endpoint_rejects_undeclared_format():
    response = client.post("/api/export", json={"format": "json", "z": [1, 8]})
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "VALIDATION_ERROR"


def test_cors_allows_local_frontend_origin_only():
    allowed = client.get("/health", headers={"Origin": "http://localhost:5173"})
    denied = client.get("/health", headers={"Origin": "https://example.com"})
    assert allowed.headers.get("access-control-allow-origin") == "http://localhost:5173"
    assert "access-control-allow-origin" not in denied.headers
