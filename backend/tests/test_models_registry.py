import pytest

from backend.app.errors import PideNotFoundError, PideValidationError
from backend.app.models import CompareRequest, Element, ExportRequest
from backend.app.core.registry import ElementRegistry


@pytest.mark.parametrize("z", [0, -1, 119, 1000, True, 1.5, "x", None])
def test_element_model_rejects_invalid_atomic_number(z):
    with pytest.raises(Exception):
        Element(z=z, symbol="X", name_en="X", name_es="X")


def test_element_model_accepts_legacy_field_names():
    element = Element(
        z=1,
        symbol="H",
        name_en="Hydrogen",
        name_es="Hidrogeno",
        config="1s1",
        ox_states=[-1, 1],
        ie1=13.598,
    )
    assert element.electron_configuration == "1s1"
    assert element.oxidation_states == [-1, 1]
    assert element.first_ionization_energy_ev == 13.598


def test_element_model_serializes_camel_case():
    element = Element(z=1, symbol="H", name_en="Hydrogen", name_es="Hidrogeno")
    payload = element.model_dump(by_alias=True)
    assert payload["atomicMass"] is None
    assert payload["nameEn"] == "Hydrogen"


def test_registry_indexes_z_in_constant_time_map():
    registry = ElementRegistry()
    assert isinstance(registry.by_z, dict)
    assert len(registry.by_z) == 118
    assert registry.get(1).symbol == "H"
    assert registry.get(118).symbol == "Og"


def test_registry_indexes_symbols_case_insensitively():
    registry = ElementRegistry()
    assert registry.get_by_symbol("fe").z == 26
    assert registry.get_by_symbol("AU").name_en == "Gold"


def test_registry_lists_elements_in_atomic_number_order():
    registry = ElementRegistry()
    elements = registry.list_elements()
    assert [element.z for element in elements] == list(range(1, 119))


def test_registry_filters_by_block():
    elements = ElementRegistry().list_elements(block="f")
    assert elements
    assert all(element.block == "f" for element in elements)


def test_registry_filters_by_group_and_period():
    elements = ElementRegistry().list_elements(group=18, period=2)
    assert [element.symbol for element in elements] == ["Ne"]


def test_registry_filters_by_category():
    elements = ElementRegistry().list_elements(category="noble_gas")
    assert len(elements) == 7
    assert all(element.category == "noble_gas" for element in elements)


def test_registry_search_matches_symbol_and_names():
    registry = ElementRegistry()
    assert [element.z for element in registry.list_elements(query="iron")] == [26]
    assert [element.z for element in registry.list_elements(query="oro")] == [79]


def test_registry_rejects_unknown_element():
    with pytest.raises(PideNotFoundError) as exc_info:
        ElementRegistry().require(119)
    assert exc_info.value.code == "ELEMENT_NOT_FOUND"


def test_registry_rejects_invalid_filter_values():
    with pytest.raises(PideValidationError):
        ElementRegistry().list_elements(block="invalid-block")


def test_registry_reads_spectra_and_crystal_records():
    registry = ElementRegistry()
    assert registry.spectra_for(1)["lines"]
    assert registry.crystal_for(26)["z"] == 26


def test_compare_request_limits_selection_and_deduplicates_nothing():
    request = CompareRequest(z=[1, 8], properties=["atomic_mass"])
    assert request.element_numbers == [1, 8]
    with pytest.raises(Exception):
        CompareRequest(z=[1])
    with pytest.raises(Exception):
        CompareRequest(z=[1, 1])


def test_export_request_accepts_element_ids_alias():
    request = ExportRequest(element_ids=[1, 8], format="csv")
    assert request.element_numbers == [1, 8]
