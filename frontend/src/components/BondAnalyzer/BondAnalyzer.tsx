import { AlertCircle, ArrowLeftRight, Droplets, Gauge, Info, Layers, Link2, RefreshCw, Zap } from 'lucide-react';
import type { BondAnalysisResponse, ElementRecord } from '../../types/element';
import { formatValue } from '../../utils/chemistry';

const PAULING_MAX = 3.3;

interface IntermolecularForce {
  name: string;
  category: string;
  badgeClass: string;
  statusText: string;
  icon: 'droplets' | 'zap' | 'link2' | 'layers';
  explanation: string;
}

function determineIntermolecularForces(
  z1: number,
  z2: number,
  result: BondAnalysisResponse
): IntermolecularForce[] {
  const forces: IntermolecularForce[] = [];
  const delta = result.deltaElectronegativity;

  if (result.bondType === 'metallic') {
    forces.push({
      name: 'Mar de Electrones / Enlace Metálico',
      category: 'Cohesión Metálica en Red',
      badgeClass: 'imf-metallic',
      statusText: 'Interacción Primaria de Red',
      icon: 'layers',
      explanation: `Los cationes metálicos de ${result.symbol1} y ${result.symbol2} comparten electrones de valencia totalmente deslocalizados en una red cristalina compacta de alta conductividad.`,
    });
    return forces;
  }

  if (result.bondType === 'ionic' || (delta !== null && delta >= 1.7)) {
    forces.push({
      name: 'Atracción Electrostática (Red Iónica)',
      category: 'Fuerza Coulómbica Reticular',
      badgeClass: 'imf-ionic',
      statusText: 'Fuerza Dominante (500–4000 kJ/mol)',
      icon: 'zap',
      explanation: `Atracción electrostática omnidireccional no covalente entre iones de carga opuesta (${result.symbol1} y ${result.symbol2}) que estructuran una red cristalina tridimensional de gran estabilidad térmica.`,
    });
    return forces;
  }

  // Sistemas covalentes / moleculares
  const isHydrogenBond =
    result.hasHydrogenBondPotential ||
    (z1 === 1 && [7, 8, 9].includes(z2)) ||
    (z2 === 1 && [7, 8, 9].includes(z1));

  if (isHydrogenBond) {
    forces.push({
      name: 'Puentes de Hidrógeno (Regla N–O–F)',
      category: 'Interacción Dipolar Especial',
      badgeClass: 'imf-hbond',
      statusText: 'Activo · Regla N–O–F (10–40 kJ/mol)',
      icon: 'droplets',
      explanation:
        'Interacción dipolo-dipolo extraordinariamente potente entre el átomo de hidrógeno parcialmente desapantallado (δ⁺) y los pares de electrones libres solitarios de nitrógeno, oxígeno o flúor (δ⁻).',
    });
  }

  const isPolar =
    result.bondType === 'covalent_polar' || (delta !== null && delta >= 0.4 && delta < 1.7);

  if (isPolar) {
    forces.push({
      name: 'Atracción Dipolo-Dipolo (Keesom)',
      category: 'Fuerza de van der Waals',
      badgeClass: 'imf-dipole',
      statusText: 'Activo · Dipolos Permanentes (2–10 kJ/mol)',
      icon: 'zap',
      explanation: `Alineación y atracción electrostática mutua entre los polos permanentes δ⁺ y δ⁻ de moléculas adyacentes inducida por la diferencia de electronegatividad Δχ = ${formatValue(delta, 2)}.`,
    });
  }

  const isNonpolar =
    result.bondType === 'covalent_nonpolar' || (delta !== null && delta < 0.4);

  forces.push({
    name: 'Fuerzas de Dispersión de London',
    category: 'Dipolo Instantáneo – Inducido',
    badgeClass: isNonpolar ? 'imf-london-dominant' : 'imf-london-universal',
    statusText: isNonpolar ? 'Dominante en Apolar (0.05–4 kJ/mol)' : 'Universal Coadyuvante',
    icon: 'link2',
    explanation: isNonpolar
      ? 'Fluctuaciones cuánticas instantáneas y transitorias en la densidad electrónica generan dipolos temporales inducidos. Es la principal fuerza cohesiva en moléculas apolares y gases nobles.'
      : 'Presentes en toda especie química debido a la polarizabilidad de la nube electrónica; actúan sinérgicamente junto con las fuerzas dipolares permanentes.',
  });

  return forces;
}

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
          <div className="panel-heading"><span><span className="panel-number">C</span> Carácter del enlace</span><span className="panel-meta">criterio único Pauling</span></div>
          <div className="predominant-bond-container">
            <div className={`predominant-bond-badge ${bondClass}`}>
              <Zap size={22} />
              <div className="predominant-bond-info">
                <span className="predominant-bond-eyebrow">Tipo Predominante</span>
                <strong className="predominant-bond-title">
                  {result.bondType === 'metallic' ? 'Enlace Metálico' :
                   result.bondType === 'ionic' ? 'Enlace Iónico' :
                   result.bondType === 'covalent_polar' ? 'Enlace Covalente Polar' :
                   result.bondType === 'covalent_nonpolar' ? 'Enlace Covalente Apolar' : 'Enlace Indeterminado'}
                </strong>
                <span className="predominant-bond-threshold">
                  {result.bondType === 'metallic'
                    ? 'Criterio: Red metálica catiónica con electrones deslocalizados'
                    : result.bondType === 'ionic'
                    ? `Criterio: Δχ = ${formatValue(delta, 2)} ≥ 1.7 (Transferencia neta de carga)`
                    : result.bondType === 'covalent_polar'
                    ? `Criterio: 0.4 ≤ Δχ (${formatValue(delta, 2)}) < 1.7 (Dipolo permanente)`
                    : result.bondType === 'covalent_nonpolar'
                    ? `Criterio: Δχ = ${formatValue(delta, 2)} < 0.4 (Compartición simétrica)`
                    : 'Criterio: Sin datos de electronegatividad'}
                </span>
              </div>
            </div>
          </div>
          <div className="aside-note">
            <Info size={14} />
            <span>
              {result.bondType === 'metallic'
                ? 'Determinación exclusiva: La unión entre elementos metálicos forma un mar de electrones deslocalizados sin dipolos localizados.'
                : result.bondType === 'ionic'
                ? 'Determinación exclusiva: La diferencia de electronegatividad supera el umbral de 1.7, clasificando el enlace como predominantemente iónico.'
                : result.bondType === 'covalent_polar'
                ? 'Determinación exclusiva: La diferencia de electronegatividad se ubica entre 0.4 y 1.7, formando un enlace covalente con dipolo permanente.'
                : result.bondType === 'covalent_nonpolar'
                ? 'Determinación exclusiva: La diferencia de electronegatividad es inferior a 0.4, determinando una compartición casi equitativa de carga (covalente apolar).'
                : 'Sin datos suficientes de electronegatividad de Pauling para determinar el carácter del enlace.'}
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

        <div className="panel bond-card imf-panel">
          <div className="panel-heading">
            <span><span className="panel-number">F</span> Fuerzas intermoleculares en el compuesto/par</span>
            <span className="panel-meta">{result.symbol1}–{result.symbol2} · interacciones en fase condensada</span>
          </div>
          <div className="imf-grid">
            {determineIntermolecularForces(z1, z2, result).map((force) => (
              <div className={`imf-card ${force.badgeClass}`} key={force.name}>
                <div className="imf-card-header">
                  <div className="imf-card-title">
                    {force.icon === 'droplets' ? <Droplets size={17} /> :
                     force.icon === 'zap' ? <Zap size={17} /> :
                     force.icon === 'layers' ? <Layers size={17} /> :
                     <Link2 size={17} />}
                    <strong>{force.name}</strong>
                  </div>
                  <span className={`imf-badge ${force.badgeClass}`}>{force.statusText}</span>
                </div>
                <p className="imf-description">{force.explanation}</p>
                <div className="imf-footer">
                  <span className="imf-category">{force.category}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="aside-note">
            <Info size={14} />
            <span>
              {result.bondType === 'metallic'
                ? 'En enlaces metálicos, la cohesión omnidireccional del mar de electrones prevalece sobre interacciones intermoleculares dispersivas.'
                : result.bondType === 'ionic'
                ? 'En sólidos iónicos cristalinos, las fuerzas reticulares coulóbicas superan ampliamente a las atracciones de van der Waals.'
                : 'En sustancias covalentes moleculares, las fuerzas intermoleculares determinan propiedades físicas clave como volatilidad, viscosidad y estados de agregación.'}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
