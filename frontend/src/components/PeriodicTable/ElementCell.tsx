import type { CSSProperties } from 'react';
import type { ElementRecord } from '../../types/element';
import { categoryLabel, formatValue, phaseLabel } from '../../utils/chemistry';

interface ElementCellProps {
  element: ElementRecord;
  heatValue: number | null;
  heatMin: number;
  heatMax: number;
  isSelected: boolean;
  isCompared: boolean;
  phase: 'Solid' | 'Liquid' | 'Gas' | 'Unknown';
  dimmed: boolean;
  onSelect: (z: number) => void;
}

export function ElementCell({ element, heatValue, heatMin, heatMax, isSelected, isCompared, phase, dimmed, onSelect }: ElementCellProps) {
  const amount = heatValue === null || heatMax <= heatMin ? 0 : Math.round(((heatValue - heatMin) / (heatMax - heatMin)) * 100);
  const style = { '--heat-color': `color-mix(in srgb, #142c33 ${Math.max(14, amount)}%, #102027)` } as CSSProperties;
  const categoryClass = element.category?.replaceAll(' ', '-').replaceAll('_', '-') ?? 'unknown';

  return (
    <button
      className={`element-cell category-${categoryClass} ${isSelected ? 'is-selected' : ''} ${isCompared ? 'is-compared' : ''} ${dimmed ? 'is-dimmed' : ''}`}
      style={style}
      type="button"
      onClick={() => onSelect(element.z)}
      aria-label={`${element.nameEs}, ${element.symbol}, número atómico ${element.z}. ${categoryLabel(element.category)}.`}
      aria-pressed={isSelected}
      title={`${element.nameEs} · ${categoryLabel(element.category)}`}
    >
      <span className="cell-meta"><small>{element.z}</small><small>{element.block ?? '—'}</small></span>
      <strong className="cell-symbol">{element.symbol}</strong>
      <span className="cell-name">{element.nameEs}</span>
      <span className="cell-value">{formatValue(heatValue, 2)}</span>
      <span className={`cell-phase phase-${phase.toLowerCase()}`} aria-label={`Fase: ${phaseLabel(phase)}`} />
      {isCompared ? <span className="compare-marker" aria-label="Incluido en comparador">+</span> : null}
    </button>
  );
}
