import { AlertCircle, ArrowLeftRight, Droplets, Gauge, Info, Link2, RefreshCw, Zap } from 'lucide-react';
import type { BondAnalysisResponse, ElementRecord } from '../../types/element';
import { formatValue } from '../../utils/chemistry';

const PAULING_MAX = 3.3;

const SHORTCUTS: Array<{ label: string; z1: number; z2: number }> = [
  { label: 'H₂O', z1: 1, z2: 8 },
  { label: 'NaCl', z1: 11, z2: 17 },
  { label: 'HF', z1: 1, z2: 9 },
  { label: 'HCl', z1: 1, z2: 17 },
  { label: 'CH₄', z1: 6, z2: 1 },
  { label: 'O₂', z1: 8, z2: 8 },
  { label: 'Fe–Cu', z1: 26, z2: 29 },
];

interface BondAnalyzerProps {
  elements: ElementRecord[];
  z1: number;
  z2: number;
  onZ1Change: (z: number) => void;
  onZ2Change: (z: number) => void;
  result: BondAnalysisResponse;
  loading: boolean;
  error: string | null;
  apiOnline: boolean;
  sourceLabel: string;
  selectedElement: ElementRecord;
  onUseSelected: () => void;
}

function chargeGlyph(charge: string | undefined): string {
  if (charge === 'delta+') return 'δ⁺';
  if (charge === 'delta-') return 'δ⁻';
  if (charge === 'delta0') return 'δ⁰';
  return '—';
}

function chargeClass(charge: string | undefined): string {
  if (charge === 'delta-') return 'charge-neg';
  if (charge === 'delta+') return 'charge-pos';
  return 'charge-zero';
}

function meterPosition(en: number | null): number | null {
  if (en === null) return null;
  return Math.max(0, Math.min(100, (en / PAULING_MAX) * 100));
}

export function BondAnalyzer({
  elements,
  z1,
  z2,
  onZ1Change,
  onZ2Change,
  result,
  loading,
  error,
  apiOnline,
  sourceLabel,
  selectedElement,
  onUseSelected,
}: BondAnalyzerProps) {
  const delta = result.deltaElectronegativity;
  const marker1 = meterPosition(result.electronegativity1);
  const marker2 = meterPosition(result.electronegativity2);
  const zoneStart = marker1 !== null && marker2 !== null ? Math.min(marker1, marker2) : null;
  const zoneWidth = marker1 !== null && marker2 !== null ? Math.abs(marker1 - marker2) : null;
  const bondClass = `bond-type-${result.bondType.replaceAll('_', '-')}`;
  const selectedSymbol = selectedElement.symbol;

  const isMetallic = result.bondType === 'metallic';

  return (
    <section className="section-block bonding-section" id="bonding" aria-labelledby="bonding-title">
      <div className="section-header compact">
        <div>
          <div className="section-kicker"><span>02</span> BONDING ENGINE</div>
          <h2 id="bonding-title">Analizador de enlaces químicos</h2>
          <p>Clasificación determinista por electronegatividad de Pauling: tipo de enlace, carácter iónico y puentes de hidrógeno.</p>
        </div>
        <div className="module-tag"><Link2 size={15} /> Δχ · Pauling</div>
      </div>

      <div className="bond-toolbar">
        <label className="select-control bond-select"><span>Elemento A</span><select value={z1} onChange={(event) => onZ1Change(Number(event.target.value))} aria-label="Elemento A">
          {elements.map((element) => <option value={element.z} key={element.z}>{element.z} · {element.symbol} — {element.nameEs}</option>)}
        </select></label>
        <button className="icon-button bond-swap" type="button" onClick={() => { onZ1Change(z2); onZ2Change(z1); }} aria-label="Intercambiar elementos" title="Intercambiar elementos"><ArrowLeftRight size={15} /></button>
        <label className="select-control bond-select"><span>Elemento B</span><select value={z2} onChange={(event) => onZ2Change(Number(event.target.value))} aria-label="Elemento B">
          {elements.map((element) => <option value={element.z} key={element.z}>{element.z} · {element.symbol} — {element.nameEs}</option>)}
        </select></label>
        <div className="toolbar-divider" />
        <div className="bond-shortcuts" role="group" aria-label="Combinaciones frecuentes">
          {SHORTCUTS.map((shortcut) => (
            <button className={`shortcut-chip ${z1 === shortcut.z1 && z2 === shortcut.z2 ? 'is-active' : ''}`} type="button" key={shortcut.label} onClick={() => { onZ1Change(shortcut.z1); onZ2Change(shortcut.z2); }}>
              {shortcut.label}
            </button>
          ))}
        </div>
        <div className="toolbar-divider" />
        <button className="outline-button bond-sync" type="button" onClick={onUseSelected} title={`Usar ${selectedSymbol} (Z ${selectedElement.z}) como elemento B`}>
          <RefreshCw size={14} /> Z₂ ← {selectedSymbol}
        </button>
      </div>

      {error && apiOnline ? <div className="resource-note"><AlertCircle size={14} /><span>{error}. Se muestra el respaldo local.</span></div> : null}

      <div className="bond-layout">
        <div className="panel bond-card">
          <div className="panel-heading"><span><span className="panel-number">A</span> Veredicto del enlace</span><span className="panel-meta">{loading ? 'analizando…' : sourceLabel}</span></div>
          <div className="bond-verdict">
            <div className={`bond-type-badge ${bondClass}`}><Link2 size={15} /><span>{result.bondTypeEs}</span></div>
            <div className="bond-pair"><span>{result.symbol1}<small>{formatValue(result.electronegativity1, 2)}</small></span><ArrowLeftRight size={15} /><span>{result.symbol2}<small>{formatValue(result.electronegativity2, 2)}</small></span></div>
            <div className="bond-delta"><Gauge size={15} /><span>Δχ</span><strong>{formatValue(delta, 2)}</strong></div>
          </div>
          <p className="bond-explanation">{result.explanation}</p>
        </div>

        <div className="panel bond-card">
          <div className="panel-heading"><span><span className="panel-number">B</span> Escala de Pauling (0 – 3.3)</span><Gauge size={15} /></div>
          <div className="pauling-meter">
            <div className="pauling-track">
              {zoneStart !== null && zoneWidth !== null && zoneWidth > 0 ? <div className="pauling-zone" style={{ left: `${zoneStart}%`, width: `${zoneWidth}%` }} /> : null}
              <div className="pauling-threshold at-polar" style={{ left: `${(0.4 / PAULING_MAX) * 100}%` }} />
              <div className="pauling-threshold at-ionic" style={{ left: `${(1.7 / PAULING_MAX) * 100}%` }} />
              {marker1 !== null ? <div className="pauling-marker" style={{ left: `${marker1}%` }}><span className="marker-chip">{result.symbol1}<small>{formatValue(result.electronegativity1, 2)}</small></span></div> : null}
              {marker2 !== null ? <div className="pauling-marker" style={{ left: `${marker2}%` }}><span className="marker-chip">{result.symbol2}<small>{formatValue(result.electronegativity2, 2)}</small></span></div> : null}
            </div>
            <div className="pauling-scale">
              <span>0</span><span className="scale-polar">0.4</span><span className="scale-ionic">1.7</span><span>3.3</span>
            </div>
          </div>
          <div className="aside-note"><Info size={14} /><span>Zona ámbar: rango Δχ del par analizado. Líneas punteadas: umbrales apolar (0.4) e iónico (1.7).</span></div>
        </div>

        <div className="panel bond-card">
          <div className="panel-heading"><span><span className="panel-number">C</span> Carácter del enlace</span><span className="panel-meta">fórmula de Pauling</span></div>
          <div className="character-bars">
            <div className="character-row">
              <span className="character-label ionic">Iónico</span>
              <div className="progress-track"><div className="progress-bar-ionic" style={{ width: `${result.ionicCharacterPercent ?? 0}%` }} /></div>
              <b>{result.ionicCharacterPercent === null ? '—' : `${formatValue(result.ionicCharacterPercent, 1)} %`}</b>
            </div>
            <div className="character-row">
              <span className={`character-label ${isMetallic ? 'metallic' : 'covalent'}`}>{isMetallic ? 'Metálico (deslocalizado)' : 'Covalente'}</span>
              <div className="progress-track"><div className={isMetallic ? 'progress-bar-metallic' : 'progress-bar-covalent'} style={{ width: `${result.covalentCharacterPercent ?? 0}%` }} /></div>
              <b>{result.covalentCharacterPercent === null ? '—' : `${formatValue(result.covalentCharacterPercent, 1)} %`}</b>
            </div>
          </div>
          <div className="aside-note">
            <Info size={14} />
            <span>
              {isMetallic
                ? '% iónico = (1 − e⁻⁽Δχ/2⁾²) × 100. En enlaces metálicos, el porcentaje restante representa la deslocalización en el mar de electrones.'
                : '% iónico = (1 − e⁻⁽Δχ/2⁾²) × 100. Ambos porcentajes suman siempre 100.'}
            </span>
          </div>
        </div>

        <div className="panel bond-card">
          <div className="panel-heading"><span><span className="panel-number">D</span> Puente de hidrógeno</span><Droplets size={15} /></div>
          <div className={`hydrogen-bond-badge ${result.hasHydrogenBondPotential ? 'is-active' : 'is-inactive'}`}>
            <Droplets size={20} />
            <div>
              <strong>{result.hasHydrogenBondPotential ? 'Potencial activo · regla N–O–F' : 'Sin potencial de puente de hidrógeno'}</strong>
              <p>{result.hydrogenBondExplanation}</p>
            </div>
          </div>
        </div>

        <div className="panel bond-card charge-card">
          <div className="panel-heading"><span><span className="panel-number">E</span> Cargas parciales</span><Zap size={15} /></div>
          <div className="charge-diagram">
            <span className="charge-chip">{result.symbol1}<b className={chargeClass(result.partialCharges[result.symbol1])}>{chargeGlyph(result.partialCharges[result.symbol1])}</b></span>
            <span className="charge-arrow">───►</span>
            <span className="charge-chip">{result.symbol2}<b className={chargeClass(result.partialCharges[result.symbol2])}>{chargeGlyph(result.partialCharges[result.symbol2])}</b></span>
          </div>
          <div className="aside-note">
            <Info size={14} />
            <span>
              {result.bondType === 'metallic' ? 'En un enlace metálico no hay dipolo localizado: la densidad electrónica se deslocaliza en un mar compartido.' :
                result.deltaElectronegativity === null ? 'Sin datos de electronegatividad no es posible asignar polarización parcial.' :
                  'El elemento más electronegativo concentra densidad (δ⁻) y el otro queda deficitario (δ⁺).'}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
