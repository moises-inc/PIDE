import { SlidersHorizontal } from 'lucide-react';
import type { ElementProperty } from '../../types/element';
import { ELEMENT_PROPERTY_LABELS } from '../../types/element';

interface HeatmapSelectorProps {
  value: ElementProperty;
  onChange: (value: ElementProperty) => void;
}

const OPTIONS: ElementProperty[] = ['atomicMass', 'densityGcm3', 'meltingPointK', 'electronegativityPauling', 'firstIonizationEnergyEv'];

export function HeatmapSelector({ value, onChange }: HeatmapSelectorProps) {
  return (
    <label className="select-control heatmap-control">
      <SlidersHorizontal size={15} aria-hidden="true" />
      <span className="sr-only">Propiedad del mapa de calor</span>
      <select value={value} onChange={(event) => onChange(event.target.value as ElementProperty)}>
        {OPTIONS.map((property) => <option key={property} value={property}>{ELEMENT_PROPERTY_LABELS[property]}</option>)}
      </select>
    </label>
  );
}
