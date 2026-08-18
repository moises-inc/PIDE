import { useEffect, useState } from 'react';
import { Check, Download, FileDown, LoaderCircle, X } from 'lucide-react';
import type { ElementRecord, ExportFormat, ExportResponse } from '../../types/element';

interface ExportModalProps {
  open: boolean;
  elements: ElementRecord[];
  onClose: () => void;
  onSubmit: (format: ExportFormat, properties: string[]) => Promise<ExportResponse | null>;
}

const PROPERTY_OPTIONS = [
  ['atomic_mass', 'Masa atómica'],
  ['density_g_cm3', 'Densidad'],
  ['melting_point_k', 'Punto de fusión'],
  ['boiling_point_k', 'Punto de ebullición'],
  ['electronegativity_pauling', 'Electronegatividad'],
  ['first_ionization_energy_ev', 'Ionización I'],
];

export function ExportModal({ open, elements, onClose, onSubmit }: ExportModalProps) {
  const [format, setFormat] = useState<ExportFormat>('csv');
  const [properties, setProperties] = useState<string[]>(PROPERTY_OPTIONS.slice(0, 4).map(([value]) => value));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape' && !isSubmitting) onClose(); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, isSubmitting, onClose]);

  if (!open) return null;

  const toggleProperty = (property: string) => {
    setProperties((current) => current.includes(property) ? current.filter((item) => item !== property) : [...current, property]);
    setCompleted(false);
    setSubmitError(null);
  };

  const submit = async () => {
    if (elements.length === 0) return;
    setIsSubmitting(true);
    setCompleted(false);
    setSubmitError(null);
    try {
      const response = await onSubmit(format, properties);
      if (!response) {
        setSubmitError('No se recibió contenido para descargar.');
        return;
      }
      const blob = new Blob([response.content], { type: response.mediaType });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = response.filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      setCompleted(true);
    } catch {
      setSubmitError('La exportación falló. Revisa la conexión o intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !isSubmitting) onClose(); }}>
      <section className="export-dialog" role="dialog" aria-modal="true" aria-labelledby="export-dialog-title">
        <header className="dialog-header"><div><span className="eyebrow">Exportación reproducible</span><h2 id="export-dialog-title"><FileDown size={20} /> Crear archivo</h2></div><button className="icon-button" type="button" onClick={onClose} aria-label="Cerrar exportación"><X size={19} /></button></header>
         <div className="export-body"><div className="export-summary"><span>{elements.length.toString().padStart(2, '0')}</span><div><strong>{elements.length === 1 ? 'elemento seleccionado' : 'elementos seleccionados'}</strong><small>El export se genera en memoria, sin escribir en el backend.</small></div></div>{submitError ? <div className="inline-notice" role="alert">{submitError}</div> : null}
           <div className="export-field"><span className="field-label">Formato</span><div className="format-tabs" role="radiogroup" aria-label="Formato de exportación">{(['csv', 'latex', 'bibtex'] as ExportFormat[]).map((item) => <button type="button" role="radio" aria-checked={format === item} className={format === item ? 'is-active' : ''} key={item} onClick={() => { setFormat(item); setCompleted(false); setSubmitError(null); }}><strong>{item === 'csv' ? 'CSV' : item === 'latex' ? 'LaTeX' : 'BibTeX'}</strong><small>{item === 'csv' ? 'datos tabulares' : item === 'latex' ? 'tabla científica' : 'citas'}</small></button>)}</div></div>
          <div className="export-field"><div className="field-label-row"><span className="field-label">Propiedades</span><small>{properties.length} seleccionadas</small></div><div className="property-checks">{PROPERTY_OPTIONS.map(([value, label]) => <label key={value} className="check-row"><input type="checkbox" checked={properties.includes(value)} onChange={() => toggleProperty(value)} /><span className="fake-check"><Check size={12} /></span><span>{label}</span></label>)}</div></div>
        </div>
        <footer className="dialog-footer"><button className="outline-button" type="button" onClick={onClose} disabled={isSubmitting}>Cancelar</button><button className="primary-button" type="button" onClick={() => void submit()} disabled={isSubmitting || elements.length === 0}>{isSubmitting ? <><LoaderCircle className="spin" size={15} /> Preparando…</> : completed ? <><Check size={15} /> Descargado</> : <><Download size={15} /> Descargar {format.toUpperCase()}</>}</button></footer>
      </section>
    </div>
  );
}
