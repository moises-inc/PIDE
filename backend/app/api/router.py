from fastapi import APIRouter

from .routes import compare, crystals, elements, export, orbitals, spectra, trends

router = APIRouter()
router.include_router(elements.router)
router.include_router(spectra.router)
router.include_router(orbitals.router)
router.include_router(crystals.router)
router.include_router(trends.router)
router.include_router(compare.router)
router.include_router(export.router)
