# Especificacion Tecnica: PIDE

## Objetivo

PIDE es una herramienta cientifica local para estudiantes e investigadores
que necesitan pasar de la tabla periodica a datos cuantitativos y
visualizaciones reproducibles sin servicios externos.

## Stack

- Python 3.11+, FastAPI, Pydantic 2, NumPy, SciPy y scikit-image opcional.
- React 19, TypeScript estricto, Vite, Three.js y CSS propio con tokens;
  Tailwind queda disponible para utilidades puntuales. Las graficas usan SVG
  accesible y determinista para no cargar Plotly en el bundle inicial offline.
- Pytest para backend; TypeScript/Vite build como contrato de frontend.

## Comandos

```bash
./setup.sh
python -m pytest backend/tests -q
python backend/scripts/build_database.py --check
npm --prefix frontend run build
./run.sh
```

## Estructura

`backend/app` contiene API y motores; `backend/data` contiene snapshots
compilados; `backend/pide` expone la libreria publica; `backend/tests` contiene
unitarias e integracion; `frontend/src` contiene componentes por feature;
`tasks` mantiene el plan vivo.

## Estilo

Python usa funciones puras, tipos explicitos y validacion en los bordes. React
usa componentes pequenos, props tipadas y estados de carga/error visibles.

```python
def wavelength_to_rgb(wavelength_nm: float) -> tuple[int, int, int]:
    """Return a deterministic display color for visible wavelengths."""
    if not 380 <= wavelength_nm <= 780:
        raise ValueError("wavelength_nm must be in [380, 780]")
    ...
```

## Estrategia de pruebas

La mayoria de pruebas son unitarias para formulas y validacion de datos. Las
pruebas de integracion usan `FastAPI TestClient` y el dataset local. No se
realizan peticiones a internet. Los casos limite cubren Z invalido, numeros
cuanticos invalidos, longitudes fuera de visible, datos ausentes y formatos de
exportacion.

## Limites

- Siempre: validar entradas, conservar procedencia, ejecutar tests antes de
  declarar un hito y evitar red en runtime.
- Preguntar antes: cambiar contratos ya publicados, sustituir fuentes oficiales
  o introducir una base de datos persistente.
- Nunca: incluir secretos, usar LLM en runtime, ocultar valores faltantes o
  eliminar pruebas para forzar un build verde.

## Criterios de aceptacion

Los criterios completos y verificables estan en `tasks/plan.md` y `tasks/todo.md`.
