#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PYTHON_BIN="${ROOT_DIR}/.venv/bin/python"

if [[ ! -x "${PYTHON_BIN}" ]]; then
  PYTHON_BIN="$(command -v python3 || true)"
fi
if [[ -z "${PYTHON_BIN}" || ! -x "${PYTHON_BIN}" ]]; then
  printf '%s\n' 'No se encontró Python 3. Ejecuta ./setup.sh primero.' >&2
  exit 1
fi
if [[ ! -d "${ROOT_DIR}/frontend/node_modules" ]]; then
  printf '%s\n' 'No se encontró frontend/node_modules. Ejecuta ./setup.sh primero.' >&2
  exit 1
fi

export PYTHONPATH="${ROOT_DIR}/backend${PYTHONPATH:+:${PYTHONPATH}}"
"${PYTHON_BIN}" -m uvicorn app.main:app --app-dir "${ROOT_DIR}/backend" --host 127.0.0.1 --port 8000 &
BACKEND_PID=$!
npm --prefix "${ROOT_DIR}/frontend" run dev -- --host 127.0.0.1 &
FRONTEND_PID=$!

cleanup() {
  kill "${BACKEND_PID}" "${FRONTEND_PID}" 2>/dev/null || true
  wait "${BACKEND_PID}" "${FRONTEND_PID}" 2>/dev/null || true
}
trap cleanup INT TERM EXIT

printf 'PIDE backend: http://127.0.0.1:8000/docs\n'
printf 'PIDE frontend: http://127.0.0.1:5173\n'
wait -n "${BACKEND_PID}" "${FRONTEND_PID}"
