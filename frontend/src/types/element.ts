export type ElementProperty =
  | 'atomicMass'
  | 'densityGcm3'
  | 'meltingPointK'
  | 'boilingPointK'
  | 'electronegativityPauling'
  | 'firstIonizationEnergyEv'
  | 'covalentRadiusPm';

export interface ElementRecord {
  z: number;
  atomicNumber: number | null;
  symbol: string;
  nameEn: string;
  nameEs: string;
  atomicMass: number | null;
  atomicMassUncertainty: number | null;
  period: number | null;
  group: number | null;
  block: string | null;
  category: string | null;
  metalClass: 'metal' | 'metalloid' | 'nonmetal' | null;
  electronConfiguration: string | null;
  electronConfigurationCondensed: string | null;
  valenceElectrons: number | null;
  oxidationStates: number[];
  firstIonizationEnergyEv: number | null;
  electronAffinityEv: number | null;
  electronegativityPauling: number | null;
  atomicRadiusPm: number | null;
  covalentRadiusPm: number | null;
  vanDerWaalsRadiusPm: number | null;
  meltingPointK: number | null;
  boilingPointK: number | null;
  densityGcm3: number | null;
  phase: string | null;
  crystalStructure: string | null;
  latticeType: string | null;
  latticeSystem: string | null;
  thermalConductivityWMk: number | null;
  specificHeatJGk: number | null;
  electricalResistivityNOhmM: number | null;
  hardnessMohs: number | null;
  standardElectrodePotentialV: number | null;
  magneticOrder: string | null;
  isotopesCount: number | null;
  mostStableIsotopeMass: number | null;
  radioactive: boolean | null;
  halfLife: string | null;
  yearDiscovered: number | string | null;
  discoverer: string | null;
  uses: string[];
  description: string | null;
  abundanceEarthCrustPpm: number | null;
  abundanceUniversePpm: number | null;
  thermalExpansion1K: number | null;
  soundSpeedMS: number | null;
  electronicConductivitySM: number | null;
  criticalTemperatureK: number | null;
  criticalPressureMpa: number | null;
  appearance: string | null;
  source: Record<string, unknown>;
  derivedFields: string[];
}

export interface TrendPoint {
  z: number;
  symbol: string;
  value: number | null;
}

export interface TrendResponse {
  property: string;
  series: TrendPoint[];
}

export interface SpectralLine {
  wavelengthNm: number;
  intensity: number;
  transition: string;
  rgb: [number, number, number];
  source: string;
}

export interface SpectrumResponse {
  z: number;
  symbol: string;
  lines: SpectralLine[];
  metadata: Record<string, unknown>;
}

export interface OrbitalResponse {
  vertices: Array<[number, number, number]>;
  faces: Array<[number, number, number]>;
  probabilityGrid: Record<string, unknown>;
  probability: Record<string, unknown> | null;
  maxProbability: number;
  normalization: number;
  metadata: Record<string, unknown>;
}

export interface CellAtom {
  index: number;
  fractional: [number, number, number];
  position: [number, number, number];
}

export interface CrystalResponse {
  z: number;
  symbol: string;
  lattice: string;
  latticeSystem: string;
  cell: {
    aAngstrom: number;
    bAngstrom: number;
    cAngstrom: number;
    alphaDeg: number;
    betaDeg: number;
    gammaDeg: number;
  };
  atoms: CellAtom[];
  bonds: Array<[number, number]>;
  metadata: Record<string, unknown>;
}

export interface CompareResponse {
  z: number[];
  properties: string[];
  elements: ElementRecord[];
  differences: Record<string, unknown>;
  correlations: Record<string, unknown>;
  radar: Array<Record<string, unknown>>;
}

export type ExportFormat = 'csv' | 'latex' | 'bibtex';

export type BondType = 'metallic' | 'ionic' | 'covalent_polar' | 'covalent_nonpolar' | 'unknown';

export type HydrogenBondRole = 'donor' | 'acceptor' | 'both' | 'none';

export interface BondAnalysisResponse {
  z1: number;
  z2: number;
  symbol1: string;
  symbol2: string;
  nameEs1: string;
  nameEs2: string;
  electronegativity1: number | null;
  electronegativity2: number | null;
  deltaElectronegativity: number | null;
  bondType: BondType;
  bondTypeEs: string;
  ionicCharacterPercent: number | null;
  covalentCharacterPercent: number | null;
  hasHydrogenBondPotential: boolean;
  hydrogenBondRole: HydrogenBondRole;
  hydrogenBondExplanation: string;
  partialCharges: Record<string, string>;
  explanation: string;
}

export interface ExportResponse {
  format: ExportFormat;
  filename: string;
  mediaType: string;
  content: string;
}

export const ELEMENT_PROPERTY_LABELS: Record<ElementProperty, string> = {
  atomicMass: 'Masa atómica',
  densityGcm3: 'Densidad',
  meltingPointK: 'Fusión',
  boilingPointK: 'Ebullición',
  electronegativityPauling: 'Electronegatividad',
  firstIonizationEnergyEv: 'Ionización I',
  covalentRadiusPm: 'Radio covalente',
};

export const ELEMENT_PROPERTY_UNITS: Record<ElementProperty, string> = {
  atomicMass: 'u',
  densityGcm3: 'g/cm³',
  meltingPointK: 'K',
  boilingPointK: 'K',
  electronegativityPauling: 'Pauling',
  firstIonizationEnergyEv: 'eV',
  covalentRadiusPm: 'pm',
};

export function getElementProperty(element: ElementRecord, property: ElementProperty): number | null {
  return element[property];
}
