# Plan de Implementacion: PIDE

## Objetivo

Construir una aplicacion local y determinista para explorar los 118 elementos,
consultar lineas espectrales, generar orbitales atomicos y celdas cristalinas,
analizar tendencias y exportar resultados. El backend FastAPI sera la fuente
de verdad de los datos y calculos; el frontend React 19 consumira contratos
tipados y ofrecera una interfaz usable en escritorio y movil.

## Supuestos y decisiones

- PIDE se ejecuta sin nube ni LLM en runtime. Los datasets se compilan una vez
  desde fuentes declarativas y el servidor solo lee archivos locales.
- Los valores ausentes de fuentes oficiales se representan como `null`; no se
  inventan mediciones. Los campos derivados se identifican en metadata.
- El dataset publico se guarda como JSON reproducible y su compilador acepta
  una carpeta de fuentes opcional para futuras actualizaciones CIAAW/NIST/CRC.
- Los contratos HTTP usan JSON, nombres `camelCase` en respuestas y errores
  estructurados. Los identificadores de elemento se validan como Z en 1..118.
- La malla orbital limita el tamano solicitado y usa una semilla/configuracion
  determinista. Marching cubes es opcional con una salida de puntos de reserva
  para que la API siga funcionando en instalaciones ligeras.
- La interfaz usa una estetica de laboratorio oscuro, cian y amber, sin
  gradientes decorativos ni dependencias de iconos remotos.
- Las graficas se renderizan con SVG determinista y accesible en lugar de
  cargar Plotly en el bundle inicial; esto mantiene el modo offline ligero y
  conserva tooltips nativos mediante elementos SVG.

## Arquitectura

```text
backend/data/*.json
        |
  core/registry.py  <--- app/api/routes/*.py <--- FastAPI
        |                         |
  core scientific engines     JSON contracts
        |                         |
        +------------------- frontend/src/services/api.ts
                                      |
                    React 19 components + Three.js/SVG
```

### Contratos principales

- `GET /api/elements`: lista filtrable por bloque, grupo, periodo y categoria.
- `GET /api/elements/{z}`: detalle de un elemento y propiedades disponibles.
- `GET /api/spectra/{z}`: lineas con intensidad y RGB CIE aproximado.
- `GET /api/orbitals/{n}/{l}/{m}`: vertices, caras, probabilidad y metadata.
- `GET /api/crystals/{z}`: red, parametros de celda, atomos y enlaces.
- `GET /api/trends`: series de Z frente a una propiedad.
- `POST /api/compare`: elementos seleccionados, diferencias, correlaciones y
  datos normalizados para radar.
- `POST /api/export`: exportacion LaTeX, BibTeX o CSV sin escribir en disco.

## Plan por fases

### Fase 1: Fundacion y dataset

1. Crear configuracion Python/Node, estructura de paquetes y scripts de
   ejecucion.
2. Implementar el compilador reproducible y generar los cuatro datasets.
3. Implementar modelos, registro O(1), errores y rutas de elementos/tendencias.

**Checkpoint:** `python backend/scripts/build_database.py --output ...` genera
los JSON; `pytest backend/tests -q` valida 118 elementos y los contratos base.

### Fase 2: Motores cientificos

4. Implementar conversion wavelength-RGB, lineas de Rydberg y espectros.
5. Implementar orbitales hidrogenoides reales, malla, normalizacion y
   isosuperficie.
6. Implementar redes de Bravais, celda atomica y conectividad por radio de
   corte.
7. Implementar fases termodinamicas y comparador estadistico.

**Checkpoint:** tests de invariantes fisicas, limites, determinismo y rutas
cientificas pasan sin depender de la red.

### Fase 3: API completa

8. Conectar spectra, orbitals, crystals, compare y export con esquemas
   Pydantic y documentacion OpenAPI.
9. Agregar CORS restringido a los origenes locales y health endpoint.

**Checkpoint:** TestClient cubre cada endpoint, errores 404/422 y payloads.

### Fase 4: Frontend

10. Crear Vite + React 19 + TypeScript, tokens CSS y cliente API.
11. Implementar tabla periodica responsive, heatmap, temperatura y detalle.
12. Implementar graficos SVG de espectro/tendencias y panel comparativo.
13. Implementar canvas Three.js para orbitales y cristales, con estados de
    carga/error y controles accesibles.
14. Implementar exportacion, navegacion movil y estados vacios.

**Checkpoint:** `npm run build` y verificacion de desarrollo sin errores de
consola; layout comprobado en 320, 768, 1024 y 1440 px.

### Fase 5: Cierre y trazabilidad

15. Ejecutar suite completa, corregir regresiones, documentar comandos y
    generar la bitacora de sincronizacion solicitada.

### Fase 6: Refactorizacion OLED y documentacion publica

16. Auditar el estado actual de la UI y establecer tokens OLED Black puros,
    con zinc para superficies y bordes, y acentos quimicos reservados para datos.
17. Corregir la alternancia del comparador, feedback de botones, foco de
    dialogos, descarga/exportacion y navegacion movil.
18. Crear CodeWiki, guias bilingues, README internacional, licencia MIT y
    atribucion visible al proyecto inspirador NIDE.

**Checkpoint:** `npm --prefix frontend run build`, `pytest backend/tests -v` y
revision de referencias NIDE en README, package, pyproject y footer.

## Riesgos y mitigaciones

| Riesgo | Impacto | Mitigacion |
|---|---|---|
| Fuentes externas no disponibles durante build | Alto | Dataset declarativo versionado y compilacion offline |
| Dependencias cientificas pesadas | Medio | Limites de malla, imports opcionales y fallback de superficie |
| Contratos frontend/backend divergentes | Alto | Esquemas Pydantic, tipos TS y tests de payload |
| Render 3D costoso en movil | Medio | Instancing, limites de vertices y controles compactos |
| Valores historicos faltantes | Medio | `null` explicito, procedencia por campo y filtros de datos |

## Criterios de exito

- Los cuatro JSON se regeneran de forma determinista y contienen los 118 Z.
- El backend arranca en `:8000`, publica OpenAPI y responde todos los endpoints.
- Los motores producen resultados finitos, acotados y reproducibles.
- La suite de backend tiene al menos 80 pruebas y pasa completa.
- El frontend compila con React 19, TypeScript estricto y Vite.
- La experiencia permite seleccionar elementos, inspeccionar detalle, comparar,
  ver espectro/orbital/celda y exportar sin errores visibles.

## Verificacion

- `python -m pytest backend/tests -q`
- `python backend/scripts/build_database.py --check`
- `npm --prefix frontend run build`
- `python -m compileall backend/app backend/pide backend/scripts`

## Verificacion de la Fase 6

- `pytest backend/tests -v`
- `npm --prefix frontend run build`
- `grep -R "AndresSabogal00/NIDE" README.md LICENSE frontend/src backend/pyproject.toml`

## Fuentes y procedencia

- IUPAC, *Periodic Table of the Elements* y tablas de pesos atomicos.
- CIAAW, *Atomic Weights 2021* e isotopic compositions.
- NIST Atomic Spectra Database, lineas y niveles de energia.
- CRC Handbook of Chemistry and Physics, propiedades termicas y cristalinas.
- Dan Bruton, aproximacion publica wavelength-to-RGB basada en CIE 1931.
