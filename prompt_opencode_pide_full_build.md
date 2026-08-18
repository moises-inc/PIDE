# 🚀 Prompt Maestro de Construcción Táctica: PIDE (Periodic Information and Data Explorer)

> **Destinatario:** OpenCode (OpenCode Desktop / OpenCode Go / NVIDIA Tier)
> **Workspace:** `/mnt/9b846436-0407-4e80-b8af-5417ffbdee8e/PIDE`
> **Modelo Recomendado:** `DeepSeek V4 Pro` (para razonamiento cuántico, cristalografía y algoritmos) / `DeepSeek V4 Flash` (para desarrollo rápido de componentes y endpoints).
> **Rol:** Agente Desarrollador Full-Stack Científico.

---

## 🎯 Objetivo General
Construir la aplicación completa de **PIDE (*Periodic Information and Data Explorer*)**, una aplicación web científica moderna (FastAPI + React 19 + TypeScript + Vite + Tailwind CSS + Three.js + Plotly.js) para la exploración, análisis cuantitativo, espectroscopía de emisión de NIST, visualización 3D de orbitales y celdas unitarias cristalinas, y comparación multivariable de los 118 elementos químicos.

---

## 📐 Especificación de Arquitectura

```text
/mnt/9b846436-0407-4e80-b8af-5417ffbdee8e/PIDE/
├── setup.sh                            # Script bash para crear venv, instalar backend y frontend deps
├── run.sh                              # Script bash para levantar backend (puerto 8000) y frontend (5173)
├── backend/
│   ├── pyproject.toml
│   ├── requirements.txt                # fastapi, uvicorn, pydantic, numpy, scipy, periodictable
│   ├── data/
│   │   ├── elements.json               # 118 elementos con >45 propiedades oficiales IUPAC/NIST/CRC
│   │   ├── spectra_nist.json.gz        # Líneas de emisión NIST con longitudes de onda (nm) e intensidades
│   │   ├── crystals.json               # Parámetros de red y tipos de estructura cristalina
│   │   └── isotopes.json               # Isótopos oficiales CIAAW y masas atómicas
│   ├── app/
│   │   ├── main.py                     # Instancia FastAPI con CORS y router
│   │   ├── api/
│   │   │   ├── router.py
│   │   │   └── routes/
│   │   │       ├── elements.py         # GET /api/elements, GET /api/elements/{z}
│   │   │       ├── spectra.py          # GET /api/spectra/{z} (líneas con color RGB)
│   │   │       ├── orbitals.py         # GET /api/orbitals/{n}/{l}/{m} (malla 3D |ψ|²)
│   │   │       ├── crystals.py         # GET /api/crystals/{z} (posiciones atómicas 3D)
│   │   │       ├── trends.py           # GET /api/trends (series de Z vs propiedad)
│   │   │       ├── compare.py          # POST /api/compare (análisis de discrepancias y radar)
│   │   │       └── export.py           # POST /api/export (LaTeX, BibTeX, CSV)
│   │   └── core/
│   │       ├── registry.py             # Repositorio en memoria y consultas O(1)
│   │       ├── spectroscopy.py         # Algoritmo CIE 1931 RGB y cálculo de Rydberg
│   │       ├── orbitals.py             # Polinomios de Laguerre, armónicos esféricos y Marching Cubes
│   │       ├── crystallography.py      # Generador de celdas unitarias para las 14 redes de Bravais
│   │       ├── thermodynamics.py       # Determinación de fase (Sólido/Líquido/Gas) vs T (0-6000 K)
│   │       └── comparator.py           # Motor de diferencias y correlaciones estadísticas
│   ├── pide/                           # Paquete Python instalable (`from pide import Element, compare`)
│   │   ├── __init__.py
│   │   └── core.py
│   ├── scripts/
│   │   └── build_database.py           # Script generador y compilador de datos
│   └── tests/                          # 80+ tests con Pytest
│       ├── test_physics_validation.py
│       ├── test_spectra.py
│       ├── test_orbitals.py
│       └── test_api.py
└── frontend/
    ├── package.json                    # React 19, Vite, Three.js, Lucide, Tailwind, Plotly.js
    ├── vite.config.ts
    ├── tailwind.config.js
    └── src/
        ├── App.tsx
        ├── types/element.ts
        ├── services/api.ts
        └── components/
            ├── Layout/Layout.tsx
            ├── PeriodicTable/
            │   ├── PeriodicGrid.tsx    # 18 col, 32 col y Espiral con Level-of-Detail
            │   ├── ElementCell.tsx
            │   ├── HeatmapSelector.tsx
            │   └── TemperatureBar.tsx  # Slider dinámico 0 a 6000 K
            ├── SpectraViewer/SpectraChart.tsx
            ├── OrbitalViewer3D/OrbitalCanvas.tsx
            ├── CrystalViewer3D/CrystalCanvas.tsx
            ├── ComparisonPanel/
            │   ├── ComparisonCards.tsx
            │   └── TrendPlot.tsx
            ├── ElementModal/ElementDetail.tsx
            └── ExportDialog/ExportModal.tsx
```

---

## 🔬 Algoritmos Matemáticos Críticos

### 1. Mapeo Longitud de Onda $\rightarrow$ Color RGB (`spectroscopy.py`)
Implementar la aproximación de Dan Bruton del estándar CIE 1931 para mapear $\lambda \in [380, 780]\ \text{nm}$ a RGB normalizado con corrección gamma ($\gamma = 0{,}80$).

### 2. Isosuperficies de Orbitales Atómicos Cuánticos (`orbitals.py`)
Calcular la función de onda espacial para el átomo hidrogenoide:
$$\psi_{nlm}(r, \theta, \phi) = \sqrt{\left(\frac{2Z}{n a_0}\right)^3 \frac{(n-l-1)!}{2n [(n+l)!]^3}} e^{-\rho/2} \rho^l L_{n-l-1}^{2l+1}(\rho) \cdot Y_l^m(\theta, \phi)$$
Donde $\rho = \frac{2Zr}{n a_0}$, $L_p^q$ son los polinomios asociados de Laguerre y $Y_l^m$ los armónicos esféricos reales. Generar la grilla 3D de probabilidad $|\psi|^2$ y extraer la isosuperficie del $90\%$ mediante `scipy.spatial` / `skimage.measure.marching_cubes`.

### 3. Redes Cristalinas de Bravais (`crystallography.py`)
Generar las posiciones atómicas $(x, y, z)$ en la celda unitaria para las redes cúbicas (SC, BCC, FCC) y hexagonales (HCP), conectando los átomos vecinos que se encuentren a una distancia menor al radio de corte $r_{\text{cut}} = 1{,}15 \times 2 r_{\text{covalente}}$.

---

## 📋 Protocolo de Ejecución y Validación

1. **Fase 1 (Backend & Datasets):** Generar los archivos `backend/data/*.json`, los modelos Pydantic y los endpoints base.
2. **Fase 2 (Motores):** Implementar y probar `spectroscopy.py`, `orbitals.py`, `crystallography.py` y `thermodynamics.py`.
3. **Fase 3 (Frontend):** Configurar Vite + React 19 + Tailwind, implementar `PeriodicGrid`, `TemperatureBar`, `SpectraChart`, `OrbitalCanvas` y `CrystalCanvas`.
4. **Fase 4 (Comparador & UI):** Construir `ComparisonPanel`, `ElementDetail` y `ExportModal`.
5. **Fase 5 (Testing & Sync):** Ejecutar `pytest backend/tests -q` asegurando 100% de tests pasando. Crear la bitácora en `90_System/Agent_Sync/Task_Logs/log_pide_build_completo.md`.
