# Motores cuánticos y cristalinos

Este documento describe las fórmulas y los límites que implementan
`backend/app/core/orbitals.py`, `spectroscopy.py` y `crystallography.py`. Las
salidas son modelos deterministas para exploración y visualización. No son un
sustituto de datos evaluados completos, cálculos electrónicos de muchos
cuerpos ni estructuras cristalográficas experimentales.

## Orbitales hidrogenoides

### Números cuánticos

El endpoint acepta `n` en `1..8`, `l` en `0..n-1` y `m` en `-l..l`. El número
atómico del potencial efectivo está limitado a `1..118`. El motor construye un
orbital real en coordenadas de Bohr.

La separación implementada es:

$$
\psi_{nlm}(r,\theta,\phi) = R_{nl}(r)Y_l^m(\theta,\phi)
$$

El código utiliza armónicos esféricos reales. Para `m > 0` usa la componente
con `cos(|m| phi)`, para `m < 0` la componente con `sin(|m| phi)` y para `m=0`
la componente axial. La normalización angular usa:

$$
N_{lm}=\sqrt{\frac{2l+1}{4\pi}\frac{(l-|m|)!}{(l+|m|)!}}
$$

La función asociada de Legendre procede de `scipy.special.lpmv` cuando SciPy
está disponible. El fallback implementa la recurrencia con fase de
Condon-Shortley.

### Parte radial

Para `rho = 2 Z r / n`, la evaluación sigue la forma:

$$
R_{nl}(r) = N_{nl}e^{-\rho/2}\rho^l
L_{n-l-1}^{2l+1}(\rho)
$$

con `L` como polinomio asociado de Laguerre. `scipy.special.eval_genlaguerre`
se usa cuando está disponible y el motor contiene una recurrencia para órdenes
no negativos en instalaciones sin SciPy.

La normalización radial implementada es:

$$
N_{nl}=\sqrt{\left(\frac{2Z}{n}\right)^3
\frac{(n-l-1)!}{2n(n+l)!}}
$$

Esta expresión describe el modelo hidrogenoide con carga nuclear `Z`; no
incluye apantallamiento, correlación electrónica ni relatividad.

### Malla y superficie

`generate_probability_grid` crea tres ejes uniformes con
`linspace(-extent, extent, grid_size)` y calcula:

$$
P(x,y,z)=|\psi(x,y,z)|^2
$$

El `extent` automático es `max(8, 2.5*n*n/sqrt(Z))` Bohr. Se acepta un tamaño
de malla de `9..65`; el endpoint expone `grid_size` pero no expone
`extent_bohr`.

El resumen devuelto contiene:

| Campo | Definición |
|---|---|
| `shape` | `[grid_size, grid_size, grid_size]`. |
| `spacing_bohr` | Separación uniforme de la malla. |
| `extent_bohr` | Semiextensión efectiva de la malla. |
| `iso_level` | `max(P) * (1 - iso_fraction)`. |
| `normalization` | `sum(P) * spacing_bohr**3`, aproximación discreta. |

Si `scikit-image` está instalado, `marching_cubes` intenta producir vértices y
caras triangulares. Si la dependencia es opcionalmente ausente o la extracción
falla, `_fallback_surface` conserva puntos cuyo valor supera el máximo entre
el nivel solicitado y el cuantil 0.90. El resultado marca el método en
`metadata.mesh_method` como `marching-cubes` o `points-fallback`.

El endpoint no devuelve el volumen completo de probabilidad. `probability_grid`
es un resumen, por lo que no debe usarse para reconstruir una densidad sin
volver a ejecutar el motor con la misma configuración.

## Espectros y color visible

Aunque no es un motor orbital, `spectroscopy.py` comparte la capa de modelos
cuantitativos.

### Longitud de onda a RGB

`wavelength_to_rgb` acepta `380 <= wavelength_nm <= 780` y `0.1 <= gamma <= 3`.
Divide el espectro en tramos lineales, aplica una atenuación en los extremos y
una corrección gamma. El resultado se redondea a tres canales enteros en
`0..255`.

Esta función está documentada en el código como una aproximación pública de
Dan Bruton. Sirve para color de pantalla; la metadata de respuesta la llama
`CIE 1931 approximation`, pero no representa una medición fotométrica ni una
conversión espectral calibrada.

### Fórmula de Rydberg

`rydberg_wavelength_nm` usa:

$$
\frac{1}{\lambda}=R_\infty Z^2
\left(\frac{1}{n_{lower}^2}-\frac{1}{n_{upper}^2}\right)
$$

con `R_inf = 10,973,731.568160 m^-1`, niveles enteros y `n_lower < n_upper`.
`generate_rydberg_lines` solo conserva líneas en `380..780 nm`. El cálculo es
hidrogenoide; no sustituye las transiciones evaluadas de NIST ASD.

`generate_spectrum` prioriza las líneas del snapshot, filtra al dominio visible,
limita la intensidad a `100`, ordena y aplica RGB. Si no recibe líneas, usa
Rydberg para hidrógeno y una semilla local determinista para otros elementos.

## Redes cristalinas

### Las 14 redes de Bravais

`BRAVAIS_LATTICES` contiene las 14 combinaciones convencionales siguientes:

| Sistema cristalino | Centrado `P` | Centrado `I` | Centrado `F` | Centrado `C` o `R` |
|---|---|---|---|---|
| Cúbico | `SC` | `BCC` | `FCC` | No aplica |
| Tetragonal | `primitive_tetragonal` | `body_centered_tetragonal` | No aplica | No aplica |
| Ortorrómbico | `primitive_orthorhombic` | `body_centered_orthorhombic` | `face_centered_orthorhombic` | `base_centered_orthorhombic` |
| Monoclínico | `primitive_monoclinic` | No aplica | No aplica | `base_centered_monoclinic` |
| Triclínico | `primitive_triclinic` | No aplica | No aplica | No aplica |
| Trigonal | No aplica | No aplica | No aplica | `rhombohedral` (`R`) |
| Hexagonal | `primitive_hexagonal` | No aplica | No aplica | No aplica |

`HCP` se trata como un caso especial de estructura hexagonal con dos posiciones
de base. En sentido estricto, HCP describe un empaquetamiento/estructura y no
una decimoquinta red de Bravais; su red de Bravais subyacente es hexagonal
primitiva.

El generador incluye aliases convenientes. Por ejemplo, `SIMPLE_CUBIC` se
normaliza a `SC`, `BODY_CENTERED_CUBIC` a `BCC`, `FACE_CENTERED_CUBIC` a `FCC`
y `HEXAGONAL` a `primitive_hexagonal`. El alias genérico `CUBIC` se mapea a
`FCC` en el código actual; esto es una decisión de prototipo y no una
clasificación experimental del elemento.

### Base y coordenadas

Las bases fraccionarias principales son:

| Centrado | Posiciones fraccionarias |
|---|---|
| `P` | `(0, 0, 0)` |
| `I` | `(0, 0, 0)`, `(1/2, 1/2, 1/2)` |
| `F` | `(0, 0, 0)`, `(0, 1/2, 1/2)`, `(1/2, 0, 1/2)`, `(1/2, 1/2, 0)` |
| `C` | `(0, 0, 0)`, `(0, 1/2, 1/2)` |
| `R` | `(0, 0, 0)`, `(2/3, 1/3, 1/3)`, `(1/3, 2/3, 2/3)` |
| `HCP` | `(0, 0, 0)`, `(2/3, 1/3, 1/2)` |

Para una celda con parámetros `a`, `b`, `c`, `alpha`, `beta` y `gamma`, el
motor convierte una coordenada fraccionaria `(fx, fy, fz)` a cartesiana con:

$$
x = af_x + b\cos(\gamma)f_y + c\cos(\beta)f_z
$$

$$
y = b\sin(\gamma)f_y + c\frac{\cos(\alpha)-\cos(\beta)\cos(\gamma)}{\sin(\gamma)}f_z
$$

$$
z = c\sqrt{1-\cos^2(\beta)-
\left(\frac{\cos(\alpha)-\cos(\beta)\cos(\gamma)}{\sin(\gamma)}\right)^2}f_z
$$

Los ángulos se convierten a radianes internamente y deben estar en `(0, 180)`.
Las longitudes están en Å y el radio covalente de entrada en pm se transforma
con `1 Å = 100 pm`.

### Parámetro de red desde radio

Si no se proporciona `a`, `lattice_parameter_from_radius` usa un radio en pm:

$$
a_{SC}=2r,\qquad
a_{BCC}=\frac{4r}{\sqrt{3}},\qquad
a_{FCC}=2\sqrt{2}r
$$

con `r` expresado en Å después de la conversión. Para las otras redes el
fallback básico usa `2r`; los parámetros `b`, `c` y los ángulos se completan
según el caso. En HCP, el código usa `c/a=1.633` en la construcción del
snapshot.

### Enlaces geométricos

Si no se especifica `cutoff`, se usa `1.15 * min(a,b,c)` o un valor derivado
del radio. El motor compara distancias euclidianas entre pares de átomos de la
base y conserva las que cumplen `0 < distance <= cutoff`.

Por tanto, `bonds` no es una conectividad periódica completa, no incluye
vecinos de celdas adyacentes y no debe interpretarse como número de
coordinación experimental.

## Validación de límites

| Motor | Invariante comprobable | Implementación |
|---|---|---|
| Orbital | `n`, `l`, `m` válidos y malla acotada | `validate_quantum_numbers`, `grid_size=9..65`. |
| Orbital | Valores finitos | `nan_to_num` sobre `|psi|^2` y límites de `extent_bohr`. |
| Espectro | Dominio visible | Filtrado `380..780 nm`, `max_lines=1..500`. |
| RGB | Canales acotados | Cada canal se limita a `0..255`. |
| Cristal | Geometría válida | Longitudes `(0,100]`, ángulos `(0,180)` y `cutoff` `(0,200]`. |
| Cristal | Base determinista | Posiciones y enlaces derivan de la red y los parámetros recibidos. |

La suite actual comprueba estos límites en
`backend/tests/test_orbitals.py`, `test_spectroscopy.py` y
`test_crystallography.py`. Los resultados de ejecución están resumidos en el
[README](../README.md).

## Referencias y atribución

- [NIST Atomic Spectra Database, SRD 78](https://www.nist.gov/pml/atomic-spectra-database), para distinguir datos espectroscópicos evaluados de los generadores locales.
- [IUPAC, Periodic Table of the Elements](https://iupac.org/what-we-do/periodic-table-of-elements/), terminología y organización periódica.
- [CIAAW, Standard Atomic Weights](https://ciaaw.org/atomic-weights.htm), referencia de pesos atómicos estándar.
- [CRC Handbook of Chemistry and Physics, CHEMnetBASE](https://hbcp.chemnetbase.com/), secciones de estructuras cristalinas y parámetros de propiedades.
- [NIDE, Andrés Sabogal](https://github.com/AndresSabogal00/NIDE), repositorio inspirador de la arquitectura local y trazable; no es una fuente de estas fórmulas ni de los snapshots de PIDE.
