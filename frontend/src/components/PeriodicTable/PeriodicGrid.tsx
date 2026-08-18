import { SearchX } from 'lucide-react';
import type { ElementProperty, ElementRecord } from '../../types/element';
import { elementProperty, isFBlock, periodicColumn, periodicRow, phaseAtTemperature } from '../../utils/chemistry';
import { ElementCell } from './ElementCell';

interface PeriodicGridProps {
  elements: ElementRecord[];
  selectedZ: number;
  comparedZs: number[];
  heatmapProperty: ElementProperty;
  temperature: number;
  query: string;
  onSelect: (z: number) => void;
}

export function PeriodicGrid({ elements, selectedZ, comparedZs, heatmapProperty, temperature, query, onSelect }: PeriodicGridProps) {
  const values = elements.map((element) => elementProperty(element, heatmapProperty)).filter((value): value is number => value !== null);
  const heatMin = Math.min(...values, 0);
  const heatMax = Math.max(...values, 1);
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const matches = (element: ElementRecord) => !normalizedQuery || [element.symbol, element.nameEn, element.nameEs, String(element.z)].some((value) => value.toLocaleLowerCase().includes(normalizedQuery));
  const mainElements = elements.filter((element) => !isFBlock(element));
  const fElements = elements.filter(isFBlock);
  const filteredCount = elements.filter(matches).length;

  return (
    <div className="periodic-board" aria-live="polite">
      <div className="periodic-overflow">
        <div className="periodic-axis" aria-hidden="true">
          <span />
          {Array.from({ length: 18 }, (_, index) => <span key={index}>{index + 1}</span>)}
        </div>
        <div className="periodic-grid" role="grid" aria-label="Tabla periódica de los elementos">
          {mainElements.map((element) => (
            <div className="cell-slot" key={element.z} role="gridcell" aria-rowindex={periodicRow(element)} aria-colindex={periodicColumn(element)} style={{ gridColumn: periodicColumn(element), gridRow: periodicRow(element) }}>
              <ElementCell
                element={element}
                heatValue={elementProperty(element, heatmapProperty)}
                heatMin={heatMin}
                heatMax={heatMax}
                isSelected={element.z === selectedZ}
                isCompared={comparedZs.includes(element.z)}
                phase={phaseAtTemperature(element, temperature)}
                dimmed={!matches(element)}
                onSelect={onSelect}
              />
            </div>
          ))}
        </div>
        <div className="f-block-caption"><span>f-block</span><small>series internas</small></div>
        <div className="f-block-grid" role="grid" aria-label="Series de lantánidos y actínidos">
          {fElements.map((element) => (
            <div className="cell-slot" key={element.z} role="gridcell" aria-label={`${element.nameEs}, serie interna`}>
              <ElementCell
                element={element}
                heatValue={elementProperty(element, heatmapProperty)}
                heatMin={heatMin}
                heatMax={heatMax}
                isSelected={element.z === selectedZ}
                isCompared={comparedZs.includes(element.z)}
                phase={phaseAtTemperature(element, temperature)}
                dimmed={!matches(element)}
                onSelect={onSelect}
              />
            </div>
          ))}
        </div>
      </div>
      {filteredCount === 0 ? <div className="empty-state compact"><SearchX size={18} /><strong>Sin coincidencias</strong><span>Prueba con símbolo, nombre o Z.</span></div> : null}
      <div className="periodic-footnote"><span><i className="legend-swatch selection" /> selección</span><span><i className="legend-swatch compare" /> comparador</span><span><i className="legend-swatch heat" /> intensidad relativa</span><span>{filteredCount}/118 visibles</span></div>
    </div>
  );
}
