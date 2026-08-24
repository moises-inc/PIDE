import type { ElementProperty, ElementRecord } from '../types/element';
import { ELEMENT_PROPERTY_LABELS, getElementProperty } from '../types/element';

export function formatValue(value: number | null | undefined, digits = 3): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return new Intl.NumberFormat('es-ES', { maximumFractionDigits: digits }).format(value);
}

export function formatTemperature(value: number): string {
  return `${new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0 }).format(value)} K`;
}

export function phaseAtTemperature(element: ElementRecord, temperature: number): 'Solid' | 'Liquid' | 'Gas' | 'Unknown' {
  if (element.meltingPointK === null || element.boilingPointK === null) return 'Unknown';
  if (temperature < element.meltingPointK) return 'Solid';
  if (temperature < element.boilingPointK) return 'Liquid';
  return 'Gas';
}

export function phaseLabel(phase: string): string {
  if (phase === 'Solid') return 'Sólido';
  if (phase === 'Liquid') return 'Líquido';
  if (phase === 'Gas') return 'Gas';
  return 'Sin dato';
}

export function categoryLabel(category: string | null): string {
  const labels: Record<string, string> = {
    'alkali metal': 'Metal alcalino',
    'alkaline earth metal': 'Alcalinotérreo',
    'transition metal': 'Metal de transición',
    'post-transition metal': 'Metal post-transición',
    nonmetal: 'No metal',
    metalloid: 'Metaloide',
    halogen: 'Halógeno',
    'noble gas': 'Gas noble',
    lanthanide: 'Lantánido',
    actinide: 'Actínido',
  };
  const normalized = category?.replaceAll('_', ' ');
  return normalized ? labels[normalized] ?? normalized : 'Categoría no disponible';
}

export function propertyLabel(property: string): string {
  const known = ELEMENT_PROPERTY_LABELS[property as ElementProperty];
  if (known) return known;
  const aliases: Record<string, ElementProperty> = {
    atomic_mass: 'atomicMass',
    density_g_cm3: 'densityGcm3',
    melting_point_k: 'meltingPointK',
    boiling_point_k: 'boilingPointK',
    electronegativity_pauling: 'electronegativityPauling',
    first_ionization_energy_ev: 'firstIonizationEnergyEv',
    covalent_radius_pm: 'covalentRadiusPm',
  };
  return aliases[property] ? ELEMENT_PROPERTY_LABELS[aliases[property]] : property.replaceAll('_', ' ');
}

export function propertyUnit(property: string): string {
  const units: Record<string, string> = {
    atomicMass: 'u',
    atomic_mass: 'u',
    densityGcm3: 'g/cm³',
    density_g_cm3: 'g/cm³',
    meltingPointK: 'K',
    melting_point_k: 'K',
    boilingPointK: 'K',
    boiling_point_k: 'K',
    electronegativityPauling: 'Pauling',
    electronegativity_pauling: 'Pauling',
    firstIonizationEnergyEv: 'eV',
    first_ionization_energy_ev: 'eV',
    covalentRadiusPm: 'pm',
    covalent_radius_pm: 'pm',
  };
  return units[property] ?? '';
}

export function normaliseProperty(property: string): ElementProperty {
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

export function elementProperty(element: ElementRecord, property: string): number | null {
  return getElementProperty(element, normaliseProperty(property));
}

export function periodicRow(element: ElementRecord): number {
  if (element.z >= 58 && element.z <= 71) return 8;
  if (element.z >= 90 && element.z <= 103) return 9;
  return element.period ?? 1;
}

export function periodicColumn(element: ElementRecord): number {
  if (element.z >= 58 && element.z <= 71) return element.z - 56;
  if (element.z >= 90 && element.z <= 103) return element.z - 88;
  return element.group ?? 1;
}

export function isFBlock(element: ElementRecord): boolean {
  return (element.z >= 58 && element.z <= 71) || (element.z >= 90 && element.z <= 103);
}

export function cssColorForHeat(value: number | null, min: number, max: number): string {
  if (value === null || max <= min) return '#10232a';
  const amount = Math.max(0, Math.min(1, (value - min) / (max - min)));
  const red = Math.round(17 + amount * 202);
  const green = Math.round(57 + amount * 118);
  const blue = Math.round(68 + amount * 18);
  return `rgb(${red}, ${green}, ${blue})`;
}

export function escapeCsv(value: string | number | null): string {
  const text = value === null ? '' : String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}
