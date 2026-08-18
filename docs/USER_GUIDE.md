# PIDE User Guide

PIDE is a local periodic-data explorer. This guide describes the current
`0.1.0` interface, the two runtime modes, and the limits of the bundled
snapshot.

The project explicitly credits **NIDE by Andrés Sabogal** as its inspiring
repository: [github.com/AndresSabogal00/NIDE](https://github.com/AndresSabogal00/NIDE).
PIDE is independent, and NIDE is not a chemical-data provider for PIDE.

## 1. Install

Requirements:

- Python `3.11` or newer.
- Node.js and npm available on `PATH`.
- A local browser. WebGL is useful for the 3D views but is not required for
  the table, charts, comparison, or export modules.

From the PIDE root:

```bash
./setup.sh
```

The setup script creates `.venv`, installs `backend/requirements.txt`, builds
the four local datasets, installs frontend dependencies, and runs the Vite
build. Installation can use the network for package downloads. The PIDE
runtime itself does not call a cloud service or an LLM.

## 2. Start the application

```bash
./run.sh
```

Open:

- Frontend: <http://127.0.0.1:5173>
- API docs: <http://127.0.0.1:8000/docs>
- Health: <http://127.0.0.1:8000/health>

Stop both processes with `Ctrl+C` in the terminal running `run.sh`.

To start processes manually, use two terminals:

```bash
PYTHONPATH="$PWD/backend" python -m uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000
```

```bash
npm --prefix frontend run dev -- --host 127.0.0.1
```

## 3. Understand the data mode

The top bar and side rail show one of two states:

| State | Meaning |
|---|---|
| `API online` / `API conectada` | The browser loaded the local FastAPI snapshot successfully. |
| `Demo mode` / `Snapshot local` | The API is unavailable; local frontend fixtures keep the interface usable. |

Demo fixtures are defined in `frontend/src/data/demo.ts`. They are UI data,
not a second official dataset. A value or chart shown in demo mode must not be
quoted as an API or NIST result.

## 4. Navigate the workspace

The navigation rail contains four modules. On a narrow viewport, open it with
the menu button; selecting an item closes the rail and scrolls to the section.

### Periodic table

1. Use the search box for a symbol, English name, Spanish name, or atomic
   number.
2. Use the heatmap selector to color cells by one of the typed element
   properties.
3. Move the temperature control to classify each element as solid, liquid,
   gas, or unavailable from the stored melting and boiling points.
4. Select a cell to open its detail dialog.
5. The `f-block` is shown below the main grid for lanthanides and actinides.

The heatmap is a relative display over the values currently loaded. It is not
a physical scale and does not fill missing values.

### Element detail

The detail dialog shows identity, category, selected properties, electron
configuration, oxidation states, uses, and source metadata. The phase readout
uses the selected temperature. `null` values are displayed as unavailable.

Available actions:

- Add the element to the comparison selection.
- Open the export dialog.
- Copy its atomic number using the browser clipboard API.
- Close with the close button, backdrop, or `Escape`.

The comparison selection accepts 2 to 8 elements for an API comparison. The UI
can show an empty or one-element selection while it waits for another choice.

### Emission spectroscopy

The visible spectrum chart spans `380..780 nm`. Each vertical line shows a
stored or generated transition, relative intensity, and an RGB display color.
Hover the line to read its wavelength, transition, and intensity. The side
panel lists the first five lines.

The API can return records labeled `NIST ASD offline snapshot` or
`deterministic local seed`, depending on the element. The latter is a local
fallback and should not be presented as evaluated NIST data.

### 3D structure models

The structure section contains two viewers.

**Atomic orbital**

1. Choose `n`.
2. Choose `l` from the values below `n`.
3. Choose `m` from `-l..l`.
4. Drag to orbit and use the wheel to zoom.

The backend calculates a hydrogenic probability field on a bounded grid. A
mesh may be produced by marching cubes or by a points fallback when the
optional surface dependency is unavailable.

**Unit cell**

The crystal viewer displays the returned lattice, atoms, bonds, and cell box.
Drag to orbit and use the wheel to zoom. If a crystal record is unavailable,
the viewer says so instead of inventing atoms.

The current bonds are in-cell geometric pairs. They do not include periodic
images or all experimentally observed coordination.

### Comparison and trends

1. Add at least two elements from detail dialogs.
2. Use the minus button on a comparison card to remove an element.
3. Review the cards for mass, density, and melting point.
4. Review the normalized property rows and correlation values returned by the
   API.
5. Select a numeric property in the trend panel to view its series against
   atomic number.

Missing values remain missing in differences, normalization, and correlations.
Pearson correlation is `null` when there are not enough valid pairs or a
variable has no variation.

### Export

Open `Exportar` in the top bar or the comparison panel. Then:

1. Select `CSV`, `LaTeX`, or `BibTeX`.
2. Select the properties to include.
3. Press `Descargar ...`.

The API returns text, filename, and media type. The browser creates a `Blob`
and downloads it; the backend does not write a file. If the API is offline,
the frontend creates a demo export from its local fixtures.

## 5. Call the API directly

```bash
curl -s http://127.0.0.1:8000/health
curl -s 'http://127.0.0.1:8000/api/elements?q=oxygen'
curl -s 'http://127.0.0.1:8000/api/orbitals/2/1/0?z=8&grid_size=25&iso_fraction=0.9'
```

```bash
curl -s -X POST http://127.0.0.1:8000/api/compare \
  -H 'Content-Type: application/json' \
  -d '{"z":[6,8,26],"properties":["atomic_mass","density_g_cm3"]}'
```

The complete parameter and response reference is in
[`api_reference.md`](api_reference.md).

## 6. Use the Python facade

```bash
PYTHONPATH=backend python3 - <<'PY'
import pide

oxygen = pide.get_element(8)
print(oxygen.symbol, oxygen.name_en)
elements = pide.list_elements(period=2)
print(len(elements))
result = pide.compare([6, 8], ["atomic_mass", "density_g_cm3"])
print(result["properties"])
PY
```

The public package exports `Element`, `get_element`, `list_elements`, and
`compare`. Python models use `snake_case`; HTTP responses use `camelCase`.

## 7. Verify an installation

```bash
python3 backend/scripts/build_database.py --check
python3 -m pytest backend/tests -q
npm --prefix frontend run build
python3 -m compileall -q backend/app backend/pide backend/scripts
```

The checked workspace reported 118 records in each dataset, 153 passing tests,
a successful TypeScript/Vite build, and no `compileall` errors.

## 8. Troubleshooting

| Symptom | Action |
|---|---|
| `./run.sh` cannot find Python | Run `./setup.sh` or ensure `python3` is on `PATH`. |
| Frontend says `Demo mode` | Check that port `8000` is free and the backend command starts with `--app-dir backend`. |
| 3D panel says WebGL is unavailable | Use a browser with WebGL enabled; the other modules remain available. |
| Crystal panel says unavailable | The current snapshot has no usable lattice/parameters for that element. |
| API returns `VALIDATION_ERROR` | Check integer bounds, quantum-number relations, selection size, and property spelling. |
| Values appear as `null` or `—` | The snapshot does not provide that field; PIDE does not extrapolate it. |
| Build fails after dependency changes | Reinstall with `npm --prefix frontend install` and rerun the documented checks. |

## 9. Scientific limits and references

The data pipeline is an offline seed with record-level source metadata. It is
not a live synchronization client. NIST-labeled spectral overrides are not a
complete ASD export; crystal parameters are generated geometry; orbital values
are hydrogenic; and demo values are UI fixtures.

Read the provenance matrix in [`data_pipeline.md`](data_pipeline.md) before
using a value outside an exploratory context. External references:

- [IUPAC periodic table](https://iupac.org/what-we-do/periodic-table-of-elements/)
- [CIAAW standard atomic weights](https://ciaaw.org/atomic-weights.htm)
- [NIST Atomic Spectra Database](https://www.nist.gov/pml/atomic-spectra-database)
- [CRC Handbook, CHEMnetBASE](https://hbcp.chemnetbase.com/)
- [NIDE by Andrés Sabogal](https://github.com/AndresSabogal00/NIDE)
