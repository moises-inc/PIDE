# Guía de uso de PIDE

PIDE es un explorador local de información periódica. Esta guía corresponde a
la interfaz y al snapshot de la versión `0.1.0`.

## Atribución del proyecto

El repositorio inspirador declarado para PIDE es **NIDE, de Andrés Sabogal**:
[github.com/AndresSabogal00/NIDE](https://github.com/AndresSabogal00/NIDE).
PIDE es independiente. NIDE explora datos nucleares y no es el proveedor del
snapshot químico de PIDE ni una dependencia de runtime.

## 1. Instalación

Requisitos:

- Python `3.11` o superior.
- Node.js y npm disponibles en `PATH`.
- Un navegador local. WebGL permite usar las vistas 3D, pero no es necesario
  para la tabla, los gráficos SVG, el comparador ni la exportación.

Desde la raíz de PIDE:

```bash
./setup.sh
```

El script crea `.venv`, instala `backend/requirements.txt`, compila los cuatro
datasets locales, instala las dependencias del frontend y ejecuta el build de
Vite. La instalación puede necesitar internet para descargar paquetes. En
runtime PIDE no llama a servicios cloud ni a un LLM.

## 2. Arranque

```bash
./run.sh
```

Abrir:

- Interfaz: <http://127.0.0.1:5173>
- Swagger UI: <http://127.0.0.1:8000/docs>
- Estado: <http://127.0.0.1:8000/health>

Para detener ambos procesos, pulsar `Ctrl+C` en la terminal de `run.sh`.

Arranque manual en dos terminales:

```bash
PYTHONPATH="$PWD/backend" python -m uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000
```

```bash
npm --prefix frontend run dev -- --host 127.0.0.1
```

## 3. Modo API y modo demo

La barra superior y el panel lateral indican el estado de datos:

| Estado | Significado |
|---|---|
| `API online` / `API conectada` | El navegador obtuvo el snapshot local desde FastAPI. |
| `Demo mode` / `Snapshot local` | La API no está disponible; fixtures locales mantienen la interfaz navegable. |

Los fixtures están en `frontend/src/data/demo.ts`. Son datos de interfaz, no
una segunda base científica. Si aparece `Demo mode`, sus valores no deben
presentarse como resultados del backend ni como datos completos de NIST.

## 4. Recorrido de la interfaz

El panel de navegación contiene cuatro módulos. En una pantalla estrecha, el
botón de menú abre el panel; al seleccionar una sección, el panel se cierra y
la página se desplaza hasta ella.

### Tabla periódica

1. Escribir un símbolo, nombre en inglés, nombre en español o número atómico
   en el buscador.
2. Elegir una propiedad en el selector de heatmap.
3. Mover el control de temperatura para clasificar el estado como sólido,
   líquido, gas o sin dato.
4. Seleccionar una celda para abrir su ficha.
5. Consultar el `f-block` inferior para lantánidos y actínidos.

El heatmap es una visualización relativa de los valores cargados. No sustituye
una escala física y no rellena los `null`.

### Ficha del elemento

La ficha muestra identidad, categoría, propiedades seleccionadas,
configuración electrónica, estados de oxidación, usos y metadata de fuente.
La fase se calcula con la temperatura seleccionada y los puntos almacenados.
Un `null` se muestra como sin dato.

Acciones disponibles:

- Añadir el elemento al comparador.
- Abrir la exportación.
- Copiar el número atómico con el portapapeles del navegador.
- Cerrar con el botón, el fondo o `Escape`.

El comparador acepta de 2 a 8 elementos. La interfaz puede mantener cero o un
elemento mientras preparas la siguiente selección; la petición de comparación
solo se envía cuando hay al menos dos elementos.

### Espectroscopía de emisión

El gráfico visible cubre `380..780 nm`. Cada línea presenta una transición,
intensidad relativa y color RGB de visualización. Al pasar el cursor se puede
leer la longitud de onda, la transición y la intensidad; el lateral muestra
las cinco primeras líneas.

Una línea puede estar etiquetada `NIST ASD offline snapshot` o
`deterministic local seed`. La segunda etiqueta indica una semilla local, no
una evaluación completa de NIST ASD.

### Estructuras 3D

#### Orbital atómico

1. Elegir `n`.
2. Elegir `l` entre los valores menores que `n`.
3. Elegir `m` entre `-l` y `l`.
4. Arrastrar para orbitar y usar la rueda para acercar o alejar.

El backend calcula un campo de probabilidad hidrogenoide sobre una malla
acotada. La superficie usa marching cubes si la dependencia opcional está
disponible; en otro caso se muestran puntos de reserva.

#### Celda cristalina

La segunda vista muestra la red, átomos, enlaces y caja de la celda devuelta.
Se puede orbitar con arrastre y acercar con la rueda. Si no hay datos de red o
parámetros, el panel informa que la estructura no está disponible.

Los enlaces actuales son pares geométricos dentro de la base de una celda. No
incluyen imágenes periódicas ni toda coordinación experimental.

### Comparador y tendencias

1. Añadir al menos dos elementos desde sus fichas.
2. Usar el botón menos de una tarjeta para quitar un elemento.
3. Revisar masa, densidad y punto de fusión en las tarjetas.
4. Revisar el perfil normalizado y las correlaciones.
5. Elegir una propiedad numérica en el panel de tendencia para verla frente a
   `Z`.

Las diferencias y correlaciones respetan los datos ausentes. La correlación
de Pearson es `null` si no hay suficientes pares válidos o si una variable no
tiene variación.

### Exportación

Abrir `Exportar` en la barra superior o en el panel comparativo:

1. Elegir `CSV`, `LaTeX` o `BibTeX`.
2. Marcar las propiedades.
3. Pulsar `Descargar ...`.

El backend devuelve contenido, nombre y media type en memoria. El navegador
crea un `Blob` y descarga el resultado; el backend no escribe archivos. En
modo demo, la interfaz genera un export local equivalente al fixture.

## 5. Consultas HTTP

```bash
curl -s http://127.0.0.1:8000/health
curl -s 'http://127.0.0.1:8000/api/elements?q=oxigeno'
curl -s 'http://127.0.0.1:8000/api/spectra/8?max_lines=10'
```

```bash
curl -s -X POST http://127.0.0.1:8000/api/export \
  -H 'Content-Type: application/json' \
  -d '{"format":"csv","z":[6,8],"properties":["atomic_mass","density_g_cm3"]}'
```

La referencia completa de rutas, límites, respuestas y errores está en
[`api_reference.md`](api_reference.md).

## 6. Uso de la librería `pide`

```bash
PYTHONPATH=backend python3 - <<'PY'
import pide

oxigeno = pide.get_element(8)
print(oxigeno.symbol, oxigeno.name_en)
elementos = pide.list_elements(period=2)
print(len(elementos))
resultado = pide.compare([6, 8], ["atomic_mass", "density_g_cm3"])
print(resultado["properties"])
PY
```

La fachada pública exporta `Element`, `get_element`, `list_elements` y
`compare`. Los modelos Python usan `snake_case`; el JSON HTTP usa
`camelCase`.

## 7. Verificación local

```bash
python3 backend/scripts/build_database.py --check
python3 -m pytest backend/tests -q
npm --prefix frontend run build
python3 -m compileall -q backend/app backend/pide backend/scripts
```

En la revisión de este workspace se observaron 118 registros en cada dataset,
153 pruebas aprobadas, build de TypeScript/Vite correcto y ningún error de
`compileall`.

## 8. Problemas frecuentes

| Síntoma | Qué revisar |
|---|---|
| `run.sh` no encuentra Python | Ejecutar `./setup.sh` o comprobar `python3` en `PATH`. |
| La interfaz muestra `Demo mode` | Verificar que el puerto `8000` esté libre y que Uvicorn use `--app-dir backend`. |
| El visor 3D indica que WebGL no está disponible | Activar WebGL o usar un navegador compatible; los demás módulos siguen funcionando. |
| La celda cristalina no está disponible | El snapshot no tiene red o parámetros utilizables para ese elemento. |
| La API responde `VALIDATION_ERROR` | Revisar límites enteros, relación entre `n`, `l`, `m`, tamaño de selección y nombres de propiedades. |
| Un valor aparece como `null` o `—` | El snapshot no aporta ese campo; PIDE no lo extrapola. |
| Falla el build tras cambiar dependencias | Ejecutar `npm --prefix frontend install` y repetir los checks. |

## 9. Procedencia y referencias

El snapshot tiene metadata de registro con `IUPAC` como fuente primaria
declarada y `CIAAW`, `NIST ASD` y `CRC Handbook` como fuentes secundarias
declaradas. No hay sincronización automática. Las líneas NIST son overrides
parciales, las celdas son geometría derivada, los orbitales son hidrogenoides y
los fixtures son datos de UI.

Antes de usar un valor fuera de exploración, leer
[`data_pipeline.md`](data_pipeline.md) y contrastar con la fuente primaria:

- [IUPAC, tabla periódica](https://iupac.org/what-we-do/periodic-table-of-elements/)
- [CIAAW, pesos atómicos estándar](https://ciaaw.org/atomic-weights.htm)
- [NIST Atomic Spectra Database](https://www.nist.gov/pml/atomic-spectra-database)
- [CRC Handbook, CHEMnetBASE](https://hbcp.chemnetbase.com/)
- [NIDE, Andrés Sabogal](https://github.com/AndresSabogal00/NIDE)
