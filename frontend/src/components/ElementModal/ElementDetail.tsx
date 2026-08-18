import { useEffect, useRef, useState } from 'react';
import { Copy, Download, ExternalLink, Plus, X } from 'lucide-react';
import type { ElementRecord } from '../../types/element';
import { categoryLabel, formatTemperature, formatValue, phaseAtTemperature, phaseLabel } from '../../utils/chemistry';

interface ElementDetailProps {
  element: ElementRecord | null;
  temperature: number;
  isCompared: boolean;
  open: boolean;
  onClose: () => void;
  onAddCompare: () => void;
  onExport: () => void;
}

export function ElementDetail({ element, temperature, isCompared, open, onClose, onAddCompare, onExport }: ElementDetailProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) return undefined;
    const previousFocus = document.activeElement as HTMLElement | null;
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKeyDown);
    closeButtonRef.current?.focus();
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      previousFocus?.focus();
    };
  }, [open, onClose]);

  const copyAtomicNumber = async () => {
    if (!navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(String(element?.z ?? ''));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  if (!open || !element) return null;
  const phase = phaseAtTemperature(element, temperature);
  const values = [
    ['Masa atómica', formatValue(element.atomicMass, 5), 'u'],
    ['Densidad', formatValue(element.densityGcm3, 4), 'g/cm³'],
    ['Radio covalente', formatValue(element.covalentRadiusPm, 1), 'pm'],
    ['Ionización I', formatValue(element.firstIonizationEnergyEv, 3), 'eV'],
    ['Electronegatividad', formatValue(element.electronegativityPauling, 2), 'Pauling'],
    ['Fusión / ebullición', `${formatValue(element.meltingPointK, 0)} / ${formatValue(element.boilingPointK, 0)}`, 'K'],
  ];

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="element-dialog" role="dialog" aria-modal="true" aria-labelledby="element-dialog-title">
         <header className="dialog-header"><div><span className="eyebrow">Ficha de elemento · Z {element.z}</span><h2 id="element-dialog-title"><b>{element.symbol}</b> {element.nameEs}</h2></div><button ref={closeButtonRef} className="icon-button" type="button" onClick={onClose} aria-label="Cerrar ficha"><X size={19} /></button></header>
        <div className="dialog-body">
          <div className="element-hero"><div className={`hero-symbol category-${element.category?.replaceAll(' ', '-').replaceAll('_', '-') ?? 'unknown'}`}><span>{element.z}</span><strong>{element.symbol}</strong></div><div className="hero-copy"><span className="category-pill">{categoryLabel(element.category)}</span><p>{element.description}</p><div className="hero-tags"><span>Periodo {element.period ?? '—'}</span><span>Grupo {element.group ?? 'f-block'}</span><span>Bloque {element.block ?? '—'}</span></div></div></div>
          <div className="phase-readout"><span className={`phase-dot phase-${phase.toLowerCase()}`} /><div><small>Estado simulado</small><strong>{phaseLabel(phase)} <em>a {formatTemperature(temperature)}</em></strong></div><div className="phase-boundaries"><span>Fusión <b>{formatValue(element.meltingPointK, 0)} K</b></span><span>Ebullición <b>{formatValue(element.boilingPointK, 0)} K</b></span></div></div>
          <div className="detail-section"><div className="section-heading"><span>Propiedades seleccionadas</span><small>snapshot local / API</small></div><div className="property-table">{values.map(([label, value, unit]) => <div className="property-row" key={label}><span>{label}</span><strong>{value}</strong><small>{unit}</small></div>)}</div></div>
          <div className="detail-columns"><div><div className="section-heading"><span>Configuración</span></div><p className="mono-value">{element.electronConfiguration ?? 'Sin dato'}</p><p className="condensed-value">{element.electronConfigurationCondensed ?? 'Sin dato'}</p></div><div><div className="section-heading"><span>Estados de oxidación</span></div><div className="oxidation-list">{element.oxidationStates.length > 0 ? element.oxidationStates.map((state) => <span key={state}>{state > 0 ? `+${state}` : state}</span>) : <small>Sin dato</small>}</div></div></div>
          <div className="detail-section"><div className="section-heading"><span>Usos y procedencia</span></div><div className="uses-list">{element.uses.slice(0, 4).map((use) => <span key={use}>{use}</span>)}</div><p className="provenance"><ExternalLink size={13} />{String(element.source.dataset ?? 'PIDE data')} · campos derivados visibles en API</p></div>
        </div>
         <footer className="dialog-footer"><button className={`primary-button ${isCompared ? 'is-active' : ''}`} type="button" onClick={onAddCompare} aria-pressed={isCompared}><Plus size={16} />{isCompared ? 'Quitar del comparador' : 'Añadir al comparador'}</button><button className="outline-button" type="button" onClick={onExport}><Download size={15} />Exportar</button><button className="icon-button" type="button" aria-label={copied ? 'Número atómico copiado' : 'Copiar número atómico'} title={copied ? 'Copiado' : 'Copiar número atómico'} onClick={() => void copyAtomicNumber()}><Copy size={16} /></button></footer>
      </section>
    </div>
  );
}
