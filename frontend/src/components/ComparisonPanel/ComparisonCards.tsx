import type { CSSProperties } from 'react';
import { GitCompareArrows, Minus, Plus, ShieldAlert } from 'lucide-react';
import type { CompareResponse, ElementRecord } from '../../types/element';
import { categoryLabel, formatValue, propertyLabel, propertyUnit } from '../../utils/chemistry';

interface ComparisonCardsProps {
  elements: ElementRecord[];
  comparedZs: number[];
  response: CompareResponse | null;
  loading: boolean;
  error: string | null;
  onRemove: (z: number) => void;
  onSelect: (z: number) => void;
}

const CARD_PROPERTIES = ['atomicMass', 'densityGcm3', 'meltingPointK'];

interface RadarRow {
  property: string;
  values: number[];
}

function normalizeRadar(response: CompareResponse | null): RadarRow[] {
  if (!response || response.radar.length === 0) return [];
  const first = response.radar[0];
  if (typeof first.property === 'string' && Array.isArray(first.values)) {
    return response.radar.flatMap((entry) => {
      const property = typeof entry.property === 'string' ? entry.property : '';
      const values = Array.isArray(entry.values) ? entry.values.filter((value): value is number => typeof value === 'number') : [];
      return property ? [{ property, values }] : [];
    });
  }

  return response.properties.map((property) => ({
    property,
    values: response.radar.map((entry) => {
      const values = entry.values;
      if (!values || typeof values !== 'object' || Array.isArray(values)) return 0;
      const value = (values as Record<string, unknown>)[property];
      return typeof value === 'number' ? value : 0;
    }),
  }));
}

export function ComparisonCards({ elements, comparedZs, response, loading, error, onRemove, onSelect }: ComparisonCardsProps) {
  const radar = normalizeRadar(response);
  return (
    <div className="comparison-content">
      <div className="comparison-intro"><div className="comparison-icon"><GitCompareArrows size={19} /></div><div><strong>Selección activa</strong><p>{comparedZs.length} de 8 elementos · añade desde el detalle</p></div><span className="comparison-count">{comparedZs.length.toString().padStart(2, '0')} / 08</span></div>
      {error ? <div className="inline-notice"><ShieldAlert size={15} />{error} Se muestran valores locales.</div> : null}
      {loading ? <div className="loading-row"><span className="spinner-small" /> Actualizando diferencias…</div> : null}
      {elements.length < 2 ? (
        <div className="empty-state comparison-empty"><GitCompareArrows size={24} /><strong>Selecciona al menos dos elementos</strong><span>Abre el detalle de una celda y pulsa “Añadir al comparador”.</span></div>
      ) : (
        <>
          <div className="comparison-cards-grid">
            {elements.map((element, index) => (
              <article className={`comparison-card accent-${index % 4}`} key={element.z}>
                <div className="comparison-card-top"><span className="compare-rank">0{index + 1}</span><button className="remove-compare" type="button" onClick={() => onRemove(element.z)} aria-label={`Quitar ${element.nameEs} del comparador`}><Minus size={14} /></button></div>
                <button className="compare-element-button" type="button" onClick={() => onSelect(element.z)}><strong>{element.symbol}</strong><span>{element.nameEs}</span></button>
                <span className="compare-category">{categoryLabel(element.category)}</span>
                <div className="compare-mini-stats">
                  <span><small>Masa</small><b>{formatValue(element.atomicMass, 3)} <em>u</em></b></span>
                  <span><small>Densidad</small><b>{formatValue(element.densityGcm3, 2)} <em>g/cm³</em></b></span>
                  <span><small>Fusión</small><b>{formatValue(element.meltingPointK, 0)} <em>K</em></b></span>
                </div>
              </article>
            ))}
            {elements.length < 4 ? <div className="comparison-add-card"><Plus size={19} /><span>Selecciona otro elemento</span><small>máximo 8</small></div> : null}
          </div>
          <div className="radar-list">
            <div className="subsection-heading"><span>Perfil normalizado</span><small>comparación relativa</small></div>
            {radar.length > 0 ? radar.map((entry) => {
              const property = entry.property;
              const values = entry.values;
              return <div className="radar-row" key={property}><div className="radar-label"><span>{propertyLabel(property)}</span><small>{propertyUnit(property)}</small></div><div className="radar-bars">{values.map((value, index) => <span className={`radar-bar accent-${index % 4}`} key={`${property}-${index}`} style={{ '--bar-width': `${Math.max(4, value * 100)}%` } as CSSProperties}><i /></span>)}</div></div>;
            }) : CARD_PROPERTIES.map((property) => <div className="radar-row" key={property}><div className="radar-label"><span>{propertyLabel(property)}</span><small>{propertyUnit(property)}</small></div><div className="radar-bars"><span className="radar-bar muted"><i /></span></div></div>)}
          </div>
        </>
      )}
    </div>
  );
}
