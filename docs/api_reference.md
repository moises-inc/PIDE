# Referencia de la API

Esta referencia describe el contrato implementado en `backend/app` y el
cliente de `frontend/src/services/api.ts`. No agrega rutas que no existan en
los routers actuales.

**Base local:** `http://127.0.0.1:8000`

La aplicación expone nueve rutas de aplicación: `/health` y ocho operaciones
con prefijo `/api`. FastAPI también sirve `/docs`, `/redoc` y `/openapi.json`
con su configuración predeterminada.

## Convenciones

- Los campos de los modelos Pydantic usan `camelCase`: `atomicMass`,
  `wavelengthNm` y `derivedFields`. Los diccionarios libres como `cell`,
  `metadata`, `source` y `probabilityGrid` no se convierten de forma
  recursiva; sus claves internas conservan la escritura del motor.
- Los cuerpos de petición aceptan los nombres internos en `snake_case` y sus
  alias públicos cuando el modelo los declara.
- Los números atómicos válidos están en `1..118`.
- Un valor ausente es `null`; una lista ausente conserva su valor vacío por
  defecto cuando así lo define el modelo.
- La API no escribe archivos. `/api/export` devuelve el contenido y el
  frontend crea la descarga en memoria.

## Salud

### `GET /health`

Respuesta `200`:

```json
{
  "status": "ok",
  "service": "pide",
  "version": "0.1.0"
}
```

La ruta no verifica dependencias externas. El proceso puede responder `ok`
porque el registro se carga de forma diferida; un fallo de lectura del snapshot
se expresa como error de datos al acceder a una ruta que lo necesita.

## Elementos

### `GET /api/elements`

Devuelve una lista de `Element`. Los filtros se combinan con AND.

| Parámetro | Tipo | Default | Restricción o efecto |
|---|---:|---:|---|
| `block` | string | `null` | Un carácter; el registro acepta `s`, `p`, `d` o `f`. |
| `group` | integer | `null` | `1..18`. |
| `period` | integer | `null` | `1..7`. |
| `category` | string | `null` | Categoría reconocida por el registro. |
| `q` | string | `null` | Búsqueda sin distinguir mayúsculas en símbolo, nombre inglés o nombre español. |
| `offset` | integer | `0` | `0..117`. |
| `limit` | integer | `118` | `1..118`. |

Ejemplos:

```bash
curl -s 'http://127.0.0.1:8000/api/elements?block=d&period=4&limit=10'
curl -s 'http://127.0.0.1:8000/api/elements?q=iron'
curl -s 'http://127.0.0.1:8000/api/elements?category=noble_gas&offset=0&limit=7'
```

La respuesta no contiene un objeto de paginación; es directamente un array.

### `GET /api/elements/{z}`

`z` es un path parameter entero en `1..118`. Devuelve un `Element`.

#### Modelo `Element`

Los nombres siguientes son los alias públicos serializados por Pydantic:

| Grupo | Campos |
|---|---|
| Identidad | `z`, `atomicNumber`, `symbol`, `nameEn`, `nameEs` |
| Posición | `period`, `group`, `block`, `category` |
| Masa y configuración | `atomicMass`, `atomicMassUncertainty`, `electronConfiguration`, `electronConfigurationCondensed`, `valenceElectrons`, `oxidationStates` |
| Energía y tamaño | `firstIonizationEnergyEv`, `electronAffinityEv`, `electronegativityPauling`, `atomicRadiusPm`, `covalentRadiusPm`, `vanDerWaalsRadiusPm` |
| Termofísica | `meltingPointK`, `boilingPointK`, `densityGcm3`, `phase`, `thermalConductivityWMk`, `specificHeatJGk`, `electricalResistivityNOhmM`, `thermalExpansion1K`, `criticalTemperatureK`, `criticalPressureMpa` |
| Estructura y estado | `crystalStructure`, `latticeType`, `latticeSystem`, `hardnessMohs`, `standardElectrodePotentialV`, `magneticOrder` |
| Isótopos y radioactividad | `isotopesCount`, `mostStableIsotopeMass`, `radioactive`, `halfLife` |
| Contexto | `yearDiscovered`, `discoverer`, `uses`, `description`, `appearance`, `abundanceEarthCrustPpm`, `abundanceUniversePpm`, `soundSpeedMS`, `electronicConductivitySM` |
| Procedencia | `source`, `derivedFields` |

La mayoría de propiedades físicas pueden ser `null`. `source` es un diccionario
de metadata a nivel de registro; `derivedFields` identifica campos derivados
según el snapshot actual, no es una auditoría de cada cálculo.

## Tendencias

### `GET /api/trends`

Parámetro requerido por nombre público `property`, con default
`atomic_mass`:

```bash
curl -s 'http://127.0.0.1:8000/api/trends?property=atomicMass'
```

Propiedades numéricas canónicas aceptadas:

```text
atomic_mass
atomic_mass_uncertainty
period
group
valence_electrons
first_ionization_energy_ev
electron_affinity_ev
electronegativity_pauling
atomic_radius_pm
covalent_radius_pm
van_der_waals_radius_pm
melting_point_k
boiling_point_k
density_g_cm3
thermal_conductivity_w_mk
specific_heat_j_gk
electrical_resistivity_n_ohm_m
hardness_mohs
standard_electrode_potential_v
isotopes_count
most_stable_isotope_mass
```

También se acepta el alias `camelCase` derivado del nombre canónico, además de
los alias explícitos `atomicMass`, `density`, `densityGcm3`, `meltingPoint`,
`boilingPoint`, `ionizationEnergy` y `firstIonizationEnergyEv`.

Respuesta:

```json
{
  "property": "atomic_mass",
  "series": [
    {"z": 1, "symbol": "H", "value": 1.008},
    {"z": 2, "symbol": "He", "value": 4.002602}
  ]
}
```

El array real contiene los elementos disponibles en el registro y puede
contener valores `null`.

## Espectros

### `GET /api/spectra/{z}`

| Parámetro | Tipo | Default | Restricción |
|---|---:|---:|---|
| `z` | integer | requerido | `1..118`. |
| `max_lines` | integer | `100` | `1..500`. |

Ejemplo:

```bash
curl -s 'http://127.0.0.1:8000/api/spectra/26?max_lines=25'
```

Cada `SpectralLine` contiene:

| Campo público | Tipo | Significado |
|---|---|---|
| `wavelengthNm` | number | Longitud de onda filtrada al intervalo visible `380..780 nm`. |
| `intensity` | number | Intensidad no negativa, limitada a `100`. |
| `transition` | string | Etiqueta del snapshot o del generador. |
| `rgb` | `[int, int, int]` | Color de visualización calculado. |
| `source` | string | Origen indicado por la línea. |

El motor ordena por longitud de onda y luego por intensidad descendente.
`metadata` incluye `domain_nm`, `gamma` y el texto
`method="CIE 1931 approximation"`. La conversión RGB es una aproximación de
visualización basada en la función de Dan Bruton; no es una transformación
colorimétrica de laboratorio.

Las líneas con overrides del snapshot se etiquetan con `NIST ASD offline
snapshot`. Las líneas generadas por la semilla local conservan su etiqueta
correspondiente; la presencia de esta ruta no implica cobertura completa de
NIST ASD.

## Orbitales

### `GET /api/orbitals/{n}/{l}/{m}`

| Parámetro | Ubicación | Default | Restricción |
|---|---|---:|---|
| `n` | path | requerido | `1..8`; además `l < n`. |
| `l` | path | requerido | `0..7`; además `0 <= l < n`. |
| `m` | path | requerido | `-7..7`; además `-l <= m <= l`. |
| `z` | query | `1` | Alias de `atomic_number`, `1..118`. |
| `grid_size` | query | `25` | `9..65`. |
| `iso_fraction` | query | `0.90` | `0.01..0.99`. |

Ejemplo:

```bash
curl -s 'http://127.0.0.1:8000/api/orbitals/3/2/0?z=26&grid_size=25&iso_fraction=0.90'
```

`OrbitalResponse` contiene:

| Campo | Contenido |
|---|---|
| `vertices` | Lista de ternas en unidades de Bohr. |
| `faces` | Lista de índices triangulares; puede ser vacía con el fallback de puntos. |
| `probabilityGrid` | Resumen con `shape`, `spacing_bohr`, `extent_bohr` e `iso_level`. No es el volumen completo. |
| `probability` | Resumen compatible; puede ser `null` en fixtures del frontend. |
| `maxProbability` | Máximo de `|psi|^2` en la malla. |
| `normalization` | Suma discreta de `|psi|^2 * spacing^3`; no se fuerza a uno. |
| `metadata` | `n`, `l`, `m`, `atomic_number`, unidades, método de mesh e `iso_fraction`. |

El método de mesh es `marching-cubes` cuando `scikit-image` está instalado y
la extracción funciona. Si no, `points-fallback` devuelve puntos sobre un
umbral basado en el cuantil 0.90.

## Cristales

### `GET /api/crystals/{z}`

`z` debe estar en `1..118`.

```bash
curl -s 'http://127.0.0.1:8000/api/crystals/26'
```

Una respuesta disponible contiene `lattice`, `latticeSystem`, `cell`, `atoms`,
`bonds` y `metadata`. `cell` usa:

```json
{
  "a_angstrom": 0.0,
  "b_angstrom": 0.0,
  "c_angstrom": 0.0,
  "alpha_deg": 90.0,
  "beta_deg": 90.0,
  "gamma_deg": 90.0
}
```

`cell` es un `dict` sin un modelo Pydantic anidado, por lo que estas claves
permanecen en `snake_case` en la respuesta actual. La interfaz TypeScript
declara nombres camelCase para esa propiedad; los clientes que consuman la
API directamente deben seguir el payload real y el esquema OpenAPI.

Cuando el snapshot no tiene red o parámetros, el endpoint no inventa una
estructura: devuelve `lattice="unavailable"`, `latticeSystem="unknown"`,
átomos y enlaces vacíos, celdas en cero y `metadata.available=false`.

Cada átomo tiene `index`, coordenadas `fractional` y posición cartesiana
`position`. Los enlaces son pares de índices calculados dentro de la base de
la celda; no incluyen imágenes periódicas.

## Comparación

### `POST /api/compare`

Cuerpo mínimo:

```json
{
  "z": [6, 8, 26],
  "properties": ["atomic_mass", "density_g_cm3", "melting_point_k"]
}
```

También se acepta `elements` o el alias de entrada `element_ids`. La selección
debe contener entre 2 y 8 enteros distintos, todos en `1..118`. Se puede
enviar solo `z` o solo `elements`; si se envían ambos deben coincidir.
`properties` contiene entre 1 y 8 nombres numéricos distintos. Si se omite,
el default es `atomic_mass`, `density_g_cm3` y `melting_point_k`.

La respuesta incluye:

| Campo | Contenido |
|---|---|
| `z` | Selección recibida. |
| `properties` | Propiedades canónicas resueltas. |
| `elements` | Fichas completas de los elementos seleccionados. |
| `differences` | Mínimo, máximo, rango y diferencias por pares. |
| `correlations` | Correlación de Pearson con `Z` y con la primera propiedad, ignorando `null`. |
| `radar` | Un registro por elemento con valores normalizados por propiedad. |

La normalización es `(value - min) / (max - min)`; si el rango es cero se usa
`0.5`. Una correlación sin dos pares válidos o sin variación se devuelve como
`null`.

## Exportación

### `POST /api/export`

Cuerpo:

```json
{
  "format": "csv",
  "z": [6, 8, 26],
  "properties": ["atomic_mass", "density_g_cm3"]
}
```

`format` solo admite `csv`, `latex` o `bibtex`. La selección admite entre 1 y
20 elementos y también `elements` o `element_ids`. Las propiedades se expresan
con nombres de atributo Python, por ejemplo `atomic_mass` y
`melting_point_k`; los alias camelCase son adecuados para tendencias y
comparación, pero no se convierten automáticamente en esta ruta de
exportación.

Si `properties` está vacío, se usan:

```text
atomic_mass, period, group, block, category, density_g_cm3,
melting_point_k, boiling_point_k
```

La respuesta tiene esta forma:

```json
{
  "format": "csv",
  "filename": "pide-elements.csv",
  "mediaType": "text/csv",
  "content": "z,symbol,name,atomic_mass\n..."
}
```

Para `latex`, el media type es `application/x-tex`; para `bibtex`,
`application/x-bibtex`. BibTeX genera una entrada por elemento y no utiliza la
lista de propiedades para el contenido de la cita.

Ejemplo:

```bash
curl -s -X POST http://127.0.0.1:8000/api/export \
  -H 'Content-Type: application/json' \
  -d '{"format":"csv","z":[6,8,26],"properties":["atomic_mass","density_g_cm3"]}'
```

## API pública de Python

`backend/pide/__init__.py` exporta `Element`, `get_element`, `list_elements` y
`compare`. Desde la raíz:

```bash
PYTHONPATH=backend python3 - <<'PY'
import pide

carbon = pide.get_element(6)
print(carbon.name_en, carbon.atomic_mass)
print([element.symbol for element in pide.list_elements(block="p")[:1]])
comparison = pide.compare([6, 8], ["atomic_mass", "density_g_cm3"])
print(comparison["z"])
PY
```

La fachada `list_elements` reenvía filtros al registro. La implementación
actual del método no usa `limit` como filtro interno; para limitar una lista en
Python se debe cortar el resultado (`pide.list_elements(...)[:10]`).

## Errores

Todas las excepciones gestionadas se serializan bajo `error`:

| HTTP | `code` | Cuándo |
|---:|---|---|
| `404` | `ELEMENT_NOT_FOUND` | El registro no encuentra un número atómico solicitado. |
| `404` | `NOT_FOUND` | Ruta HTTP inexistente. |
| `422` | `VALIDATION_ERROR` | Parámetros fuera de rango, JSON inválido para el modelo o propiedad no soportada. |
| `500` | `DATA_ERROR` | Snapshot ausente, ilegible o con cobertura incorrecta. |
| `500` | `INTERNAL_ERROR` | Excepción no controlada expuesta como mensaje genérico. |
| Otro | `HTTP_ERROR` | Error HTTP gestionado por Starlette. |

Ejemplo de forma 422:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [
      {"loc": ["path", "z"], "message": "Input should be less than or equal to 118", "type": "less_than_equal"}
    ]
  }
}
```

## Referencias y procedencia

- [IUPAC, tabla periódica](https://iupac.org/what-we-do/periodic-table-of-elements/)
- [CIAAW, pesos atómicos estándar](https://ciaaw.org/atomic-weights.htm)
- [NIST Atomic Spectra Database, SRD 78](https://www.nist.gov/pml/atomic-spectra-database)
- [CRC Handbook, CHEMnetBASE](https://hbcp.chemnetbase.com/)
- [Repositorio inspirador NIDE, Andrés Sabogal](https://github.com/AndresSabogal00/NIDE)
