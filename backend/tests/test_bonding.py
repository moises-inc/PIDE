import pytest
from fastapi.testclient import TestClient

from backend.app.core.bonding import analyze_bond
from backend.app.core.registry import get_registry
from backend.app.main import app


registry = get_registry()
client = TestClient(app)


def bond(z1: int, z2: int):
    return analyze_bond(registry.require(z1), registry.require(z2))


def test_nacl_is_ionic_with_pauling_character():
    result = bond(11, 17)
    assert result.symbol1 == "Na"
    assert result.symbol2 == "Cl"
    assert result.delta_electronegativity == pytest.approx(2.23, abs=1e-9)
    assert result.bond_type == "ionic"
    assert result.bond_type_es == "Enlace iónico"
    assert result.ionic_character_percent == pytest.approx(71.2, abs=0.05)
    assert result.covalent_character_percent == pytest.approx(28.8, abs=0.05)
    assert not result.has_hydrogen_bond_potential
    assert result.hydrogen_bond_role == "none"
    assert result.partial_charges == {"Cl": "delta-", "Na": "delta+"}


def test_h_o_is_covalent_polar_with_hydrogen_bond():
    result = bond(1, 8)
    assert result.delta_electronegativity == pytest.approx(1.24, abs=1e-9)
    assert result.bond_type == "covalent_polar"
    assert result.bond_type_es == "Enlace covalente polar"
    assert 0 < result.ionic_character_percent < 50
    assert result.has_hydrogen_bond_potential
    assert result.hydrogen_bond_role == "both"
    assert "regla N–O–F" in result.hydrogen_bond_explanation
    assert result.partial_charges == {"O": "delta-", "H": "delta+"}


def test_h_f_is_covalent_polar_with_hydrogen_bond():
    result = bond(1, 9)
    assert result.delta_electronegativity == pytest.approx(1.78, abs=1e-9)
    assert result.bond_type == "covalent_polar"
    assert result.has_hydrogen_bond_potential
    assert result.hydrogen_bond_role == "both"
    assert result.partial_charges == {"F": "delta-", "H": "delta+"}


def test_o2_is_covalent_nonpolar_without_dipole():
    result = bond(8, 8)
    assert result.delta_electronegativity == 0.0
    assert result.bond_type == "covalent_nonpolar"
    assert result.bond_type_es == "Enlace covalente apolar"
    assert result.ionic_character_percent == 0.0
    assert result.covalent_character_percent == 100.0
    assert not result.has_hydrogen_bond_potential
    assert result.partial_charges == {"O": "delta0"}


def test_fe_cu_is_metallic():
    result = bond(26, 29)
    assert result.bond_type == "metallic"
    assert result.bond_type_es == "Enlace metálico"
    assert "mar de electrones" in result.explanation
    assert not result.has_hydrogen_bond_potential
    assert result.partial_charges == {}


def test_noble_gas_pair_is_unknown():
    result = bond(2, 10)
    assert result.delta_electronegativity is None
    assert result.bond_type == "unknown"
    assert result.ionic_character_percent is None
    assert result.covalent_character_percent is None
    assert not result.has_hydrogen_bond_potential


def test_analysis_is_symmetric():
    direct = bond(1, 8)
    swapped = bond(8, 1)
    assert direct.bond_type == swapped.bond_type
    assert direct.delta_electronegativity == swapped.delta_electronegativity


def test_api_post_bonding_analyze():
    response = client.post("/api/bonding/analyze", json={"z1": 11, "z2": 17})
    assert response.status_code == 200
    payload = response.json()
    assert payload["bondType"] == "ionic"
    assert payload["bondTypeEs"] == "Enlace iónico"
    assert payload["deltaElectronegativity"] == pytest.approx(2.23, abs=1e-9)
    assert payload["ionicCharacterPercent"] == pytest.approx(71.2, abs=0.05)
    assert "partialCharges" in payload


def test_api_get_bonding_pair():
    response = client.get("/api/bonding/1/9")
    assert response.status_code == 200
    payload = response.json()
    assert payload["bondType"] == "covalent_polar"
    assert payload["hasHydrogenBondPotential"] is True


@pytest.mark.parametrize("path", ["/api/bonding/0/8", "/api/bonding/1/119"])
def test_api_bonding_rejects_out_of_range(path):
    response = client.get(path)
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "VALIDATION_ERROR"
