"""FastAPI entry point for the offline PIDE backend."""

from __future__ import annotations

from typing import Any

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from .api.router import router as api_router
from .errors import PideError

APP_VERSION = "0.1.0"
LOCAL_ORIGINS = ["http://localhost:5173", "http://127.0.0.1:5173"]


def _error_body(code: str, message: str, details: Any = None) -> dict[str, Any]:
    error: dict[str, Any] = {"code": code, "message": message}
    if details is not None:
        error["details"] = details
    return {"error": error}


def create_app() -> FastAPI:
    application = FastAPI(
        title="PIDE Offline API",
        description="Deterministic local periodic data and scientific engines.",
        version=APP_VERSION,
    )
    application.add_middleware(
        CORSMiddleware,
        allow_origins=LOCAL_ORIGINS,
        allow_credentials=False,
        allow_methods=["GET", "POST", "OPTIONS"],
        allow_headers=["Accept", "Content-Type"],
    )

    @application.exception_handler(PideError)
    async def pide_error_handler(_: Request, exc: PideError) -> JSONResponse:
        return JSONResponse(status_code=exc.status_code, content=_error_body(exc.code, exc.message, exc.details))

    @application.exception_handler(RequestValidationError)
    async def validation_error_handler(_: Request, exc: RequestValidationError) -> JSONResponse:
        details = [
            {"loc": list(error.get("loc", ())), "message": error.get("msg", "Invalid value"), "type": error.get("type", "value_error")}
            for error in exc.errors()
        ]
        return JSONResponse(status_code=422, content=_error_body("VALIDATION_ERROR", "Request validation failed", details))

    @application.exception_handler(StarletteHTTPException)
    async def http_error_handler(_: Request, exc: StarletteHTTPException) -> JSONResponse:
        code = "NOT_FOUND" if exc.status_code == 404 else "HTTP_ERROR"
        message = str(exc.detail) if isinstance(exc.detail, str) else "HTTP request failed"
        details = None if isinstance(exc.detail, str) else exc.detail
        return JSONResponse(status_code=exc.status_code, content=_error_body(code, message, details))

    @application.exception_handler(Exception)
    async def internal_error_handler(_: Request, __: Exception) -> JSONResponse:
        return JSONResponse(status_code=500, content=_error_body("INTERNAL_ERROR", "An unexpected backend error occurred"))

    @application.get("/health", tags=["system"])
    async def health() -> dict[str, str]:
        return {"status": "ok", "service": "pide", "version": APP_VERSION}

    application.include_router(api_router, prefix="/api")
    return application


app = create_app()
