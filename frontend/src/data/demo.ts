import type {
  BondAnalysisResponse,
  BondType,
  CellAtom,
  CompareResponse,
  CrystalResponse,
  ElementProperty,
  ElementRecord,
  ExportFormat,
  ExportResponse,
  HydrogenBondRole,
  OrbitalResponse,
  SpectralLine,
  SpectrumResponse,
  TrendResponse,
} from '../types/element';
import { getElementProperty } from '../types/element';

type Seed = readonly [symbol: string, nameEn: string, nameEs: string, mass: number];

const SEEDS: Seed[] = [
  ['H', 'Hydrogen', 'Hidrógeno', 1.008],
  ['He', 'Helium', 'Helio', 4.0026],
  ['Li', 'Lithium', 'Litio', 6.94],
  ['Be', 'Beryllium', 'Berilio', 9.0122],
  ['B', 'Boron', 'Boro', 10.81],
  ['C', 'Carbon', 'Carbono', 12.011],
  ['N', 'Nitrogen', 'Nitrógeno', 14.007],
  ['O', 'Oxygen', 'Oxígeno', 15.999],
  ['F', 'Fluorine', 'Flúor', 18.998],
  ['Ne', 'Neon', 'Neón', 20.18],
  ['Na', 'Sodium', 'Sodio', 22.99],
  ['Mg', 'Magnesium', 'Magnesio', 24.305],
  ['Al', 'Aluminium', 'Aluminio', 26.982],
  ['Si', 'Silicon', 'Silicio', 28.085],
  ['P', 'Phosphorus', 'Fósforo', 30.974],
  ['S', 'Sulfur', 'Azufre', 32.06],
  ['Cl', 'Chlorine', 'Cloro', 35.45],
  ['Ar', 'Argon', 'Argón', 39.948],
  ['K', 'Potassium', 'Potasio', 39.098],
  ['Ca', 'Calcium', 'Calcio', 40.078],
  ['Sc', 'Scandium', 'Escandio', 44.956],
  ['Ti', 'Titanium', 'Titanio', 47.867],
  ['V', 'Vanadium', 'Vanadio', 50.942],
  ['Cr', 'Chromium', 'Cromo', 51.996],
  ['Mn', 'Manganese', 'Manganeso', 54.938],
  ['Fe', 'Iron', 'Hierro', 55.845],
  ['Co', 'Cobalt', 'Cobalto', 58.933],
  ['Ni', 'Nickel', 'Níquel', 58.693],
  ['Cu', 'Copper', 'Cobre', 63.546],
  ['Zn', 'Zinc', 'Zinc', 65.38],
  ['Ga', 'Gallium', 'Galio', 69.723],
  ['Ge', 'Germanium', 'Germanio', 72.63],
  ['As', 'Arsenic', 'Arsénico', 74.922],
  ['Se', 'Selenium', 'Selenio', 78.971],
  ['Br', 'Bromine', 'Bromo', 79.904],
  ['Kr', 'Krypton', 'Kriptón', 83.798],
  ['Rb', 'Rubidium', 'Rubidio', 85.468],
  ['Sr', 'Strontium', 'Estroncio', 87.62],
  ['Y', 'Yttrium', 'Itrio', 88.906],
  ['Zr', 'Zirconium', 'Zirconio', 91.224],
  ['Nb', 'Niobium', 'Niobio', 92.906],
  ['Mo', 'Molybdenum', 'Molibdeno', 95.95],
  ['Tc', 'Technetium', 'Tecnecio', 98],
  ['Ru', 'Ruthenium', 'Rutenio', 101.07],
  ['Rh', 'Rhodium', 'Rodio', 102.906],
  ['Pd', 'Palladium', 'Paladio', 106.42],
  ['Ag', 'Silver', 'Plata', 107.868],
  ['Cd', 'Cadmium', 'Cadmio', 112.414],
  ['In', 'Indium', 'Indio', 114.818],
  ['Sn', 'Tin', 'Estaño', 118.71],
  ['Sb', 'Antimony', 'Antimonio', 121.76],
  ['Te', 'Tellurium', 'Telurio', 127.6],
  ['I', 'Iodine', 'Yodo', 126.904],
  ['Xe', 'Xenon', 'Xenón', 131.293],
  ['Cs', 'Caesium', 'Cesio', 132.905],
  ['Ba', 'Barium', 'Bario', 137.327],
  ['La', 'Lanthanum', 'Lantano', 138.905],
  ['Ce', 'Cerium', 'Cerio', 140.116],
  ['Pr', 'Praseodymium', 'Praseodimio', 140.908],
  ['Nd', 'Neodymium', 'Neodimio', 144.242],
  ['Pm', 'Promethium', 'Prometio', 145],
  ['Sm', 'Samarium', 'Samario', 150.36],
  ['Eu', 'Europium', 'Europio', 151.964],
  ['Gd', 'Gadolinium', 'Gadolinio', 157.25],
  ['Tb', 'Terbium', 'Terbio', 158.925],
  ['Dy', 'Dysprosium', 'Disprosio', 162.5],
  ['Ho', 'Holmium', 'Holmio', 164.93],
  ['Er', 'Erbium', 'Erbio', 167.259],
  ['Tm', 'Thulium', 'Tulio', 168.934],
  ['Yb', 'Ytterbium', 'Iterbio', 173.045],
  ['Lu', 'Lutetium', 'Lutecio', 174.967],
  ['Hf', 'Hafnium', 'Hafnio', 178.49],
  ['Ta', 'Tantalum', 'Tántalo', 180.948],
  ['W', 'Tungsten', 'Wolframio', 183.84],
  ['Re', 'Rhenium', 'Renio', 186.207],
  ['Os', 'Osmium', 'Osmio', 190.23],
  ['Ir', 'Iridium', 'Iridio', 192.217],
  ['Pt', 'Platinum', 'Platino', 195.084],
  ['Au', 'Gold', 'Oro', 196.967],
  ['Hg', 'Mercury', 'Mercurio', 200.592],
  ['Tl', 'Thallium', 'Talio', 204.38],
  ['Pb', 'Lead', 'Plomo', 207.2],
  ['Bi', 'Bismuth', 'Bismuto', 208.98],
  ['Po', 'Polonium', 'Polonio', 209],
  ['At', 'Astatine', 'Astato', 210],
  ['Rn', 'Radon', 'Radón', 222],
  ['Fr', 'Francium', 'Francio', 223],
  ['Ra', 'Radium', 'Radio', 226],
  ['Ac', 'Actinium', 'Actinio', 227],
  ['Th', 'Thorium', 'Torio', 232.038],
  ['Pa', 'Protactinium', 'Protactinio', 231.036],
  ['U', 'Uranium', 'Uranio', 238.029],
  ['Np', 'Neptunium', 'Neptunio', 237],
  ['Pu', 'Plutonium', 'Plutonio', 244],
  ['Am', 'Americium', 'Americio', 243],
  ['Cm', 'Curium', 'Curio', 247],
  ['Bk', 'Berkelium', 'Berkelio', 247],
  ['Cf', 'Californium', 'Californio', 251],
  ['Es', 'Einsteinium', 'Einsteinio', 252],
  ['Fm', 'Fermium', 'Fermio', 257],
  ['Md', 'Mendelevium', 'Mendelevio', 258],
  ['No', 'Nobelium', 'Nobelio', 259],
  ['Lr', 'Lawrencium', 'Lawrencio', 266],
  ['Rf', 'Rutherfordium', 'Rutherfordio', 267],
  ['Db', 'Dubnium', 'Dubnio', 268],
  ['Sg', 'Seaborgium', 'Seaborgio', 269],
  ['Bh', 'Bohrium', 'Bohrio', 270],
  ['Hs', 'Hassium', 'Hasio', 277],
  ['Mt', 'Meitnerium', 'Meitnerio', 278],
  ['Ds', 'Darmstadtium', 'Darmstadtio', 281],
  ['Rg', 'Roentgenium', 'Roentgenio', 282],
  ['Cn', 'Copernicium', 'Copernicio', 285],
  ['Nh', 'Nihonium', 'Nihonio', 286],
  ['Fl', 'Flerovium', 'Flerovio', 289],
  ['Mc', 'Moscovium', 'Moscovio', 290],
  ['Lv', 'Livermorium', 'Livermorio', 293],
  ['Ts', 'Tennessine', 'Teneso', 294],
  ['Og', 'Oganesson', 'Oganesón', 294],
];

const NOBLE_GASES = new Set([2, 10, 18, 36, 54, 86, 118]);
const HALOGENS = new Set([9, 17, 35, 53, 85, 117]);
const METALLOIDS = new Set([5, 14, 32, 33, 51, 52, 84]);
const NON_METALS = new Set([1, 6, 7, 8, 15, 16, 34]);
const LANTHANIDES = new Set(Array.from({ length: 15 }, (_, index) => index + 57));
const ACTINIDES = new Set(Array.from({ length: 15 }, (_, index) => index + 89));

const SPECIALS: Record<number, Partial<ElementRecord>> = {
  1: {
    densityGcm3: 0.0000899,
    meltingPointK: 13.99,
    boilingPointK: 20.271,
    electronegativityPauling: 2.2,
    firstIonizationEnergyEv: 13.598,
    covalentRadiusPm: 31,
    phase: 'Gas',
    uses: ['Combustible de celdas de hidrógeno', 'Síntesis de amoníaco'],
  },
  6: {
    densityGcm3: 2.267,
    meltingPointK: 3915,
    boilingPointK: 4300,
    electronegativityPauling: 2.55,
    firstIonizationEnergyEv: 11.26,
    covalentRadiusPm: 76,
    phase: 'Solid',
    uses: ['Electrodos', 'Materiales compuestos', 'Química orgánica'],
  },
  7: {
    electronegativityPauling: 3.04,
  },
  8: {
    densityGcm3: 0.001429,
    meltingPointK: 54.36,
    boilingPointK: 90.188,
    electronegativityPauling: 3.44,
    firstIonizationEnergyEv: 13.618,
    covalentRadiusPm: 66,
    phase: 'Gas',
    uses: ['Respiración clínica', 'Metalurgia', 'Tratamiento de aguas'],
  },
  9: {
    densityGcm3: 0.001696,
    meltingPointK: 53.48,
    boilingPointK: 85.03,
    electronegativityPauling: 3.98,
    firstIonizationEnergyEv: 17.423,
    covalentRadiusPm: 57,
    phase: 'Gas',
  },
  11: {
    densityGcm3: 0.968,
    meltingPointK: 370.944,
    boilingPointK: 1156.09,
    electronegativityPauling: 0.93,
    firstIonizationEnergyEv: 5.139,
    covalentRadiusPm: 166,
    phase: 'Solid',
  },
  17: {
    densityGcm3: 0.0032,
    meltingPointK: 171.65,
    boilingPointK: 239.11,
    electronegativityPauling: 3.16,
    firstIonizationEnergyEv: 12.968,
    covalentRadiusPm: 102,
    phase: 'Gas',
  },
  26: {
    densityGcm3: 7.874,
    meltingPointK: 1811,
    boilingPointK: 3134,
    electronegativityPauling: 1.83,
    firstIonizationEnergyEv: 7.902,
    covalentRadiusPm: 132,
    phase: 'Solid',
    crystalStructure: 'BCC',
    latticeType: 'body-centered cubic',
    latticeSystem: 'cubic',
    uses: ['Aleaciones estructurales', 'Electroimanes', 'Catálisis'],
  },
  29: {
    densityGcm3: 8.96,
    meltingPointK: 1357.77,
    boilingPointK: 2835,
    electronegativityPauling: 1.9,
    firstIonizationEnergyEv: 7.726,
    covalentRadiusPm: 132,
    phase: 'Solid',
    crystalStructure: 'FCC',
    latticeType: 'face-centered cubic',
    latticeSystem: 'cubic',
  },
  79: {
    densityGcm3: 19.3,
    meltingPointK: 1337.33,
    boilingPointK: 3129,
    electronegativityPauling: 2.54,
    firstIonizationEnergyEv: 9.226,
    covalentRadiusPm: 124,
    phase: 'Solid',
    crystalStructure: 'FCC',
    latticeType: 'face-centered cubic',
    latticeSystem: 'cubic',
  },
};

function positionFor(z: number): { period: number; group: number | null } {
  if (z <= 2) return { period: 1, group: z === 1 ? 1 : 18 };
  if (z <= 10) return { period: 2, group: z === 3 ? 1 : z === 4 ? 2 : z + 8 };
  if (z <= 18) return { period: 3, group: z === 11 ? 1 : z === 12 ? 2 : z };
  if (z <= 36) return { period: 4, group: z - 18 };
  if (z <= 54) return { period: 5, group: z - 36 };
  if (z <= 71) return { period: 6, group: z <= 56 ? z - 54 : z === 57 ? 3 : null };
  if (z <= 86) return { period: 6, group: z - 68 };
  if (z <= 103) return { period: 7, group: z <= 88 ? z - 86 : z === 89 ? 3 : null };
  return { period: 7, group: z - 100 };
}

function categoryFor(z: number, group: number | null): string {
  if (NOBLE_GASES.has(z)) return 'noble gas';
  if (HALOGENS.has(z)) return 'halogen';
  if (LANTHANIDES.has(z)) return 'lanthanide';
  if (ACTINIDES.has(z)) return 'actinide';
  if (METALLOIDS.has(z)) return 'metalloid';
  if (NON_METALS.has(z)) return 'nonmetal';
  if (group === 1) return 'alkali metal';
  if (group === 2) return 'alkaline earth metal';
  if (group !== null && group >= 3 && group <= 12) return 'transition metal';
  return 'post-transition metal';
}

function blockFor(z: number, group: number | null): string {
  if (LANTHANIDES.has(z) || ACTINIDES.has(z)) return 'f';
  if (group !== null && group <= 2) return 's';
  if (group !== null && group >= 13) return 'p';
  return 'd';
}

function metalClassFor(category: string): 'metal' | 'metalloid' | 'nonmetal' {
  if (category === 'metalloid') return 'metalloid';
  if (category === 'nonmetal' || category === 'halogen' || category === 'noble gas') return 'nonmetal';
  return 'metal';
}

function createElement(seed: Seed, index: number): ElementRecord {
  const z = index + 1;
  const position = positionFor(z);
  const category = categoryFor(z, position.group);
  const metalClass = metalClassFor(category);
  const specials = SPECIALS[z] ?? {};
  const defaultDensity = z < 3 ? 0.0002 : Number((0.9 + ((z * 37) % 185) / 10).toFixed(3));
  const defaultMelting = Number((220 + ((z * 97) % 1300)).toFixed(1));
  const defaultBoiling = Number((defaultMelting + 500 + ((z * 53) % 1800)).toFixed(1));
  const oxidationStates = z === 26 ? [-2, 2, 3, 6] : z === 8 ? [-2, -1, 1, 2] : position.group ? [position.group <= 2 ? position.group : position.group - 10] : [3];

  return {
    z,
    atomicNumber: z,
    symbol: seed[0],
    nameEn: seed[1],
    nameEs: seed[2],
    atomicMass: seed[3],
    atomicMassUncertainty: null,
    period: position.period,
    group: position.group,
    block: blockFor(z, position.group),
    category,
    metalClass,
    electronConfiguration: `1s² … ${seed[0]} valence shell`,
    electronConfigurationCondensed: `[core] ${position.group ?? 'f-block'}`,
    valenceElectrons: position.group === null ? null : position.group > 12 ? position.group - 10 : position.group,
    oxidationStates,
    firstIonizationEnergyEv: Number((5.4 + ((119 - z) % 42) / 10).toFixed(3)),
    electronAffinityEv: z % 5 === 0 ? null : Number((0.1 + ((z * 13) % 35) / 10).toFixed(2)),
    electronegativityPauling: NOBLE_GASES.has(z) ? null : Number((0.7 + ((z * 17) % 26) / 10).toFixed(2)),
    atomicRadiusPm: Number((65 + ((z * 19) % 120)).toFixed(1)),
    covalentRadiusPm: Number((45 + ((z * 11) % 105)).toFixed(1)),
    vanDerWaalsRadiusPm: Number((120 + ((z * 7) % 80)).toFixed(1)),
    meltingPointK: defaultMelting,
    boilingPointK: defaultBoiling,
    densityGcm3: defaultDensity,
    phase: defaultMelting > 298 ? 'Solid' : defaultBoiling > 298 ? 'Liquid' : 'Gas',
    crystalStructure: category.includes('metal') ? (z % 3 === 0 ? 'FCC' : 'BCC') : null,
    latticeType: category.includes('metal') ? 'cubic prototype' : null,
    latticeSystem: category.includes('metal') ? 'cubic' : null,
    thermalConductivityWMk: Number((2 + ((z * 29) % 390) / 10).toFixed(2)),
    specificHeatJGk: Number((0.15 + ((z * 7) % 80) / 100).toFixed(3)),
    electricalResistivityNOhmM: category.includes('metal') ? Number((1 + ((z * 31) % 950)).toFixed(2)) : null,
    hardnessMohs: Number((1 + ((z * 11) % 85) / 10).toFixed(1)),
    standardElectrodePotentialV: z % 4 === 0 ? null : Number((-2.5 + ((z * 23) % 48) / 10).toFixed(2)),
    magneticOrder: z === 26 || z === 27 || z === 28 ? 'ferromagnetic / paramagnetic' : 'diamagnetic',
    isotopesCount: z < 84 ? 2 + (z % 8) : null,
    mostStableIsotopeMass: seed[3],
    radioactive: z >= 84,
    halfLife: z >= 84 ? 'Variable; no stable isotope' : null,
    yearDiscovered: z < 12 ? 'Antiquity' : 1800 + ((z * 17) % 220),
    discoverer: z < 12 ? 'Known since antiquity' : 'Historical record',
    uses: specials.uses ?? ['Materiales de referencia', 'Investigación y enseñanza'],
    description: `${seed[1]} es una entrada de demostración para explorar el contrato tipado de PIDE sin servidor activo.`,
    abundanceEarthCrustPpm: z < 93 ? Number((0.1 + ((z * 43) % 65000) / 100).toFixed(2)) : null,
    abundanceUniversePpm: Number((0.01 + ((z * 19) % 220) / 10).toFixed(2)),
    thermalExpansion1K: Number((3 + ((z * 5) % 260) / 10).toFixed(2)),
    soundSpeedMS: Number((700 + ((z * 113) % 5700)).toFixed(1)),
    electronicConductivitySM: category.includes('metal') ? Number((1000 + ((z * 1900) % 580000)).toFixed(1)) : null,
    criticalTemperatureK: NOBLE_GASES.has(z) ? Number((4 + ((z * 3) % 80)).toFixed(2)) : null,
    criticalPressureMpa: NOBLE_GASES.has(z) ? Number((0.2 + ((z * 7) % 50) / 10).toFixed(2)) : null,
    appearance: category.includes('metal') ? 'Lustrous solid' : 'Colourless or characteristic solid',
    source: { dataset: 'PIDE demo snapshot', provenance: 'Local UI fixture; replaceable by /api.' },
    derivedFields: ['phase', 'electronConfigurationCondensed'],
    ...specials,
  };
}

export const DEMO_ELEMENTS: ElementRecord[] = SEEDS.map(createElement);

export function getDemoElement(z: number): ElementRecord {
  return DEMO_ELEMENTS.find((element) => element.z === z) ?? DEMO_ELEMENTS[0];
}

function wavelengthColor(wavelength: number): [number, number, number] {
  const normalized = Math.max(0, Math.min(1, (wavelength - 380) / 400));
  const red = Math.round(255 * Math.min(1, Math.max(0, Math.abs(normalized - 0.78) * 4)));
  const green = Math.round(255 * Math.max(0, 1 - Math.abs(normalized - 0.48) * 3));
  const blue = Math.round(255 * Math.min(1, Math.max(0, (0.65 - normalized) * 3)));
  return [red, green, blue];
}

export function getDemoSpectrum(z: number): SpectrumResponse {
  const element = getDemoElement(z);
  const lines: SpectralLine[] = Array.from({ length: 18 }, (_, index) => {
    const wavelength = 392 + ((z * 29 + index * 41) % 372);
    return {
      wavelengthNm: wavelength,
      intensity: Number((22 + ((z * 17 + index * 13) % 78)).toFixed(1)),
      transition: `${Math.max(1, index % 5 + 1)}p → ${Math.max(1, index % 4 + 1)}s`,
      rgb: wavelengthColor(wavelength),
      source: 'PIDE demo fixture',
    };
  }).sort((left, right) => left.wavelengthNm - right.wavelengthNm);

  return {
    z,
    symbol: element.symbol,
    lines,
    metadata: { source: 'demo', visibleRangeNm: [380, 780], lineCount: lines.length },
  };
}

function orbitalShape(n: number, l: number, m: number, theta: number, phi: number): number {
  if (l === 0) return 1;
  if (l === 1) return m === 0 ? Math.cos(theta) : Math.sin(theta) * Math.cos(phi * Math.max(1, Math.abs(m)));
  return Math.sin(theta) ** l * Math.cos(l * theta + m * phi);
}

export function getDemoOrbital(n: number, l: number, m: number): OrbitalResponse {
  const rings = 18;
  const segments = 36;
  const vertices: Array<[number, number, number]> = [];
  const faces: Array<[number, number, number]> = [];

  for (let ring = 0; ring <= rings; ring += 1) {
    const theta = (ring / rings) * Math.PI;
    for (let segment = 0; segment <= segments; segment += 1) {
      const phi = (segment / segments) * Math.PI * 2;
      const amplitude = orbitalShape(n, l, m, theta, phi);
      const radialNode = 0.72 + 0.28 * Math.cos((n - l) * theta) ** 2;
      const radius = 0.42 + Math.abs(amplitude) * (1.15 + 0.24 * radialNode);
      vertices.push([
        radius * Math.sin(theta) * Math.cos(phi),
        radius * Math.cos(theta),
        radius * Math.sin(theta) * Math.sin(phi),
      ]);
    }
  }

  for (let ring = 0; ring < rings; ring += 1) {
    for (let segment = 0; segment < segments; segment += 1) {
      const current = ring * (segments + 1) + segment;
      const next = current + segments + 1;
      faces.push([current, next, current + 1], [current + 1, next, next + 1]);
    }
  }

  return {
    vertices,
    faces,
    probabilityGrid: { shape: [25, 25, 25], source: 'demo' },
    probability: null,
    maxProbability: 1,
    normalization: 1,
    metadata: { n, l, m, atomicNumber: 26, isoFraction: 0.9, source: 'demo' },
  };
}

function crystalFractions(lattice: string): Array<[number, number, number]> {
  if (lattice === 'BCC') return [[0, 0, 0], [0.5, 0.5, 0.5]];
  if (lattice === 'FCC') return [[0, 0, 0], [0, 0.5, 0.5], [0.5, 0, 0.5], [0.5, 0.5, 0]];
  if (lattice === 'HCP') return [[0, 0, 0], [0.5, 0.5, 0], [0.5, 0.166, 0.5], [0, 0.666, 0.5]];
  return [[0, 0, 0]];
}

export function getDemoCrystal(z: number): CrystalResponse {
  const element = getDemoElement(z);
  const lattice = element.crystalStructure === 'FCC' ? 'FCC' : element.crystalStructure === 'BCC' ? 'BCC' : z % 5 === 0 ? 'HCP' : 'BCC';
  const cell = { aAngstrom: 3.58 + (z % 4) * 0.18, bAngstrom: 3.58 + (z % 4) * 0.18, cAngstrom: 3.58 + (z % 4) * 0.18, alphaDeg: 90, betaDeg: 90, gammaDeg: 90 };
  const fractions = crystalFractions(lattice);
  const atoms: CellAtom[] = fractions.map((fractional, index) => ({
    index,
    fractional,
    position: [fractional[0] * cell.aAngstrom, fractional[1] * cell.bAngstrom, fractional[2] * cell.cAngstrom],
  }));
  const bonds: Array<[number, number]> = [];
  for (let index = 1; index < atoms.length; index += 1) bonds.push([0, index]);

  return {
    z,
    symbol: element.symbol,
    lattice,
    latticeSystem: 'cubic',
    cell,
    atoms,
    bonds,
    metadata: { source: 'demo', available: true, prototype: `${lattice} demo cell` },
  };
}

function propertyFromName(property: string): ElementProperty {
  const aliases: Record<string, ElementProperty> = {
    atomic_mass: 'atomicMass',
    atomicMass: 'atomicMass',
    density_g_cm3: 'densityGcm3',
    densityGcm3: 'densityGcm3',
    melting_point_k: 'meltingPointK',
    meltingPointK: 'meltingPointK',
    boiling_point_k: 'boilingPointK',
    boilingPointK: 'boilingPointK',
    electronegativity_pauling: 'electronegativityPauling',
    electronegativityPauling: 'electronegativityPauling',
    first_ionization_energy_ev: 'firstIonizationEnergyEv',
    firstIonizationEnergyEv: 'firstIonizationEnergyEv',
    covalent_radius_pm: 'covalentRadiusPm',
    covalentRadiusPm: 'covalentRadiusPm',
  };
  return aliases[property] ?? 'atomicMass';
}

export function getDemoTrend(property: string): TrendResponse {
  const canonical = propertyFromName(property);
  return {
    property: canonical,
    series: DEMO_ELEMENTS.map((element) => ({ z: element.z, symbol: element.symbol, value: getElementProperty(element, canonical) })),
  };
}

export function getDemoCompare(zs: number[], properties: string[] = ['atomicMass', 'densityGcm3', 'meltingPointK']): CompareResponse {
  const elements = zs.map(getDemoElement);
  const radar = properties.map((property) => {
    const canonical = propertyFromName(property);
    const values = elements.map((element) => getElementProperty(element, canonical) ?? 0);
    const max = Math.max(...values, 1);
    return { property: canonical, values: values.map((value) => Number((value / max).toFixed(3))) };
  });
  const differences: Record<string, unknown> = {};
  for (const property of properties) {
    const canonical = propertyFromName(property);
    const values = elements.map((element) => getElementProperty(element, canonical)).filter((value): value is number => value !== null);
    const min = Math.min(...values);
    const max = Math.max(...values);
    differences[canonical] = { min, max, spread: max - min };
  }
  return {
    z: zs,
    properties: properties.map(propertyFromName),
    elements,
    differences,
    correlations: { note: 'Demo correlations are computed locally when the API is unavailable.' },
    radar,
  };
}

const BOND_TYPE_ES: Record<BondType, string> = {
  metallic: 'Enlace metálico',
  ionic: 'Enlace iónico',
  covalent_polar: 'Enlace covalente polar',
  covalent_nonpolar: 'Enlace covalente apolar',
  unknown: 'Enlace indeterminado',
};

const HYDROGEN_BOND_PARTNERS = new Set([7, 8, 9]);
const PAULING_POLAR_THRESHOLD = 0.4;
const PAULING_IONIC_THRESHOLD = 1.7;

function classifyBond(a: ElementRecord, b: ElementRecord, delta: number | null): BondType {
  if (a.metalClass === 'metal' && b.metalClass === 'metal') return 'metallic';
  if (delta === null) return 'unknown';
  if (a.metalClass === 'nonmetal' && b.metalClass === 'nonmetal') {
    return delta < PAULING_POLAR_THRESHOLD ? 'covalent_nonpolar' : 'covalent_polar';
  }
  if (delta >= PAULING_IONIC_THRESHOLD) return 'ionic';
  return delta < PAULING_POLAR_THRESHOLD ? 'covalent_nonpolar' : 'covalent_polar';
}

function hydrogenBondFor(a: ElementRecord, b: ElementRecord): { has: boolean; role: HydrogenBondRole; explanation: string } {
  const partners = [a.z, b.z].filter((z) => HYDROGEN_BOND_PARTNERS.has(z));
  if ([a.z, b.z].includes(1) && partners.length > 0) {
    const labels: Record<number, string> = { 7: 'Nitrógeno', 8: 'Oxígeno', 9: 'Flúor' };
    const partnerZ = partners[0];
    const partnerSymbol = a.z === partnerZ ? a.symbol : b.symbol;
    return {
      has: true,
      role: 'both',
      explanation: `El hidrógeno actúa como donante (δ⁺) y el ${labels[partnerZ]} (${partnerSymbol}) como aceptor mediante sus pares de electrones libres: el par cumple la regla N–O–F y puede formar puentes de hidrógeno.`,
    };
  }
  return {
    has: false,
    role: 'none',
    explanation: 'Solo el hidrógeno unido a Nitrógeno (Z=7), Oxígeno (Z=8) o Flúor (Z=9) genera puentes de hidrógeno. Este par no cumple la regla N–O–F, por lo que no presenta ese potencial.',
  };
}

function explainBond(bondType: BondType, delta: number | null, a: ElementRecord, b: ElementRecord, enA: number | null, enB: number | null): string {
  const more = enA !== null && enB !== null && enA !== enB ? (enA > enB ? a : b) : null;
  if (bondType === 'metallic') {
    return `${a.nameEs} y ${b.nameEs} son metales: comparten un mar de electrones deslocalizados que da lugar a un enlace metálico, sin transferencia neta de carga.`;
  }
  if (bondType === 'unknown') {
    const missing = [...new Set([enA === null ? a.symbol : '', enB === null ? b.symbol : ''].filter(Boolean))].join(' y ');
    return `No hay dato de electronegatividad de Pauling para ${missing}; la clasificación determinista no es posible.`;
  }
  if (bondType === 'ionic') {
    return `La diferencia de electronegatividad Δχ = ${delta} supera el umbral de Pauling (1.7): ${more?.nameEs} (${more?.symbol}) atrae con fuerza la densidad electrónica y se forma un enlace iónico.`;
  }
  if (bondType === 'covalent_polar') {
    if (a.metalClass === 'nonmetal' && b.metalClass === 'nonmetal' && (delta ?? 0) >= PAULING_IONIC_THRESHOLD) {
      return `Aunque Δχ = ${delta} supera 1.7, ambos elementos son no metales: el par conserva carácter covalente polar con un fuerte dipolo hacia ${more?.nameEs} (${more?.symbol}), el caso límite clásico del enlace H–F.`;
    }
    return `La diferencia Δχ = ${delta} está entre 0.4 y 1.7: el par comparte electrones de forma desigual y aparece un dipolo permanente dirigido hacia ${more?.nameEs} (${more?.symbol}).`;
  }
  return `La diferencia Δχ = ${delta} es menor que 0.4: los electrones se comparten de manera casi simétrica y no aparece un dipolo neto apreciable.`;
}

export function getDemoBondAnalysis(z1: number, z2: number): BondAnalysisResponse {
  const a = getDemoElement(z1);
  const b = getDemoElement(z2);
  const enA = a.electronegativityPauling;
  const enB = b.electronegativityPauling;
  const delta = enA === null || enB === null ? null : Number(Math.abs(enA - enB).toFixed(3));
  const bondType = classifyBond(a, b, delta);
  const ionicCharacterPercent = delta === null ? null : Number(((1 - Math.exp(-((delta / 2) ** 2))) * 100).toFixed(1));
  const covalentCharacterPercent = ionicCharacterPercent === null ? null : Number((100 - ionicCharacterPercent).toFixed(1));
  const hydrogenBond = hydrogenBondFor(a, b);
  let partialCharges: Record<string, string> = {};
  if (bondType !== 'metallic' && delta !== null) {
    if (delta === 0) {
      partialCharges = { [a.symbol]: 'delta0', [b.symbol]: 'delta0' };
    } else if (enA !== null && enB !== null && enA !== enB) {
      const more = enA > enB ? a : b;
      const less = more === a ? b : a;
      partialCharges = { [more.symbol]: 'delta-', [less.symbol]: 'delta+' };
    }
  }
  return {
    z1,
    z2,
    symbol1: a.symbol,
    symbol2: b.symbol,
    nameEs1: a.nameEs,
    nameEs2: b.nameEs,
    electronegativity1: enA,
    electronegativity2: enB,
    deltaElectronegativity: delta,
    bondType,
    bondTypeEs: BOND_TYPE_ES[bondType],
    ionicCharacterPercent,
    covalentCharacterPercent,
    hasHydrogenBondPotential: hydrogenBond.has,
    hydrogenBondRole: hydrogenBond.role,
    hydrogenBondExplanation: hydrogenBond.explanation,
    partialCharges,
    explanation: explainBond(bondType, delta, a, b, enA, enB),
  };
}

function exportRow(element: ElementRecord, properties: string[]): Record<string, string | number | null> {
  const row: Record<string, string | number | null> = { z: element.z, symbol: element.symbol, name: element.nameEn };
  for (const property of properties) {
    const canonical = propertyFromName(property);
    row[canonical] = getElementProperty(element, canonical);
  }
  return row;
}

export function getDemoExport(zs: number[], format: ExportFormat, properties: string[]): ExportResponse {
  const elements = zs.map(getDemoElement);
  const selectedProperties = properties.length > 0 ? properties : ['atomicMass', 'densityGcm3', 'meltingPointK', 'boilingPointK'];
  const rows = elements.map((element) => exportRow(element, selectedProperties));
  let content = '';
  let filename = 'pide-elements.csv';
  let mediaType = 'text/csv';
  if (format === 'csv') {
    const columns = Object.keys(rows[0] ?? { z: '', symbol: '', name: '' });
    content = [columns.join(','), ...rows.map((row) => columns.map((column) => String(row[column] ?? '')).join(','))].join('\n') + '\n';
  } else if (format === 'latex') {
    filename = 'pide-elements.tex';
    mediaType = 'application/x-tex';
    const columns = ['Z', 'Symbol', 'Name', ...selectedProperties];
    content = `% PIDE offline demo export\n\\begin{tabular}{lll${'r'.repeat(selectedProperties.length)}}\n${columns.join(' & ')} \\\\ \n\\hline\n`;
    content += rows.map((row) => columns.map((column) => String(row[column.toLowerCase()] ?? '')).join(' & ') + ' \\\\').join('\n');
    content += '\n\\end{tabular}\n';
  } else {
    filename = 'pide-elements.bib';
    mediaType = 'application/x-bibtex';
    content = elements.map((element) => `@misc{pide_${element.z},\n  title = {${element.nameEn}},\n  note = {PIDE local demo snapshot, Z=${element.z}}\n}`).join('\n\n') + '\n';
  }
  return { format, filename, mediaType, content };
}
