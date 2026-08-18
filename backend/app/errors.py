"""Application errors and their stable JSON error contracts."""

from __future__ import annotations

from typing import Any


class PideError(Exception):
    """Base error raised for a controlled client-visible failure."""

    status_code = 400
    code = "PIDE_ERROR"

    def __init__(self, message: str, *, details: Any = None, status_code: int | None = None):
        super().__init__(message)
        self.message = message
        self.details = details
        if status_code is not None:
            self.status_code = status_code


class PideValidationError(PideError, ValueError):
    status_code = 422
    code = "VALIDATION_ERROR"


class PideNotFoundError(PideError):
    status_code = 404
    code = "ELEMENT_NOT_FOUND"


class PideDataError(PideError):
    status_code = 500
    code = "DATA_ERROR"
