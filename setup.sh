#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VENV_DIR="${ROOT_DIR}/.venv"

if ! command -v python3 >/dev/null 2>&1; then
  printf '%s\n' 'PIDE requiere Python 3.11 o superior.' >&2
  exit 1
fi

if [[ ! -x "${VENV_DIR}/bin/python" ]]; then
  python3 -m venv "${VENV_DIR}"
fi

"${VENV_DIR}/bin/python" -m pip install --upgrade pip
"${VENV_DIR}/bin/python" -m pip install -r "${ROOT_DIR}/backend/requirements.txt"
"${VENV_DIR}/bin/python" "${ROOT_DIR}/backend/scripts/build_database.py"

if ! command -v npm >/dev/null 2>&1; then
  printf '%s\n' 'PIDE requiere Node.js y npm para construir el frontend.' >&2
  exit 1
fi

npm --prefix "${ROOT_DIR}/frontend" install
npm --prefix "${ROOT_DIR}/frontend" run build
