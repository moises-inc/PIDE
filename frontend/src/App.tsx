import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, ArrowUpRight, Atom, Beaker, ChevronRight, CircleHelp, Database, Download, FlaskConical, GitCompareArrows, Info, Layers3, Orbit, RefreshCw, Search } from 'lucide-react';
import { Layout } from './components/Layout/Layout';
import { CategoryFilterKey } from './components/PeriodicTable/CategoryLegend';
import { PeriodicGrid } from './components/PeriodicTable/PeriodicGrid';
import { HeatmapSelector } from './components/PeriodicTable/HeatmapSelector';
import { TemperatureBar } from './components/PeriodicTable/TemperatureBar';
import { BondAnalyzer } from './components/BondAnalyzer/BondAnalyzer';
import { SpectraChart } from './components/SpectraViewer/SpectraChart';
import { OrbitalCanvas } from './components/OrbitalViewer3D/OrbitalCanvas';
import { CrystalCanvas } from './components/CrystalViewer3D/CrystalCanvas';
import { ComparisonCards } from './components/ComparisonPanel/ComparisonCards';
import { TrendPlot } from './components/ComparisonPanel/TrendPlot';
import { ElementDetail } from './components/ElementModal/ElementDetail';
import { ExportModal } from './components/ExportDialog/ExportModal';
import { DEMO_ELEMENTS, getDemoBondAnalysis, getDemoCompare, getDemoCrystal, getDemoElement, getDemoExport, getDemoOrbital, getDemoSpectrum, getDemoTrend } from './data/demo';
import { ApiRequestError, analyzeBond as analyzeBondApi, compareElements as compareElementsApi, exportElements as exportElementsApi, getCrystal, getElement, getElements, getOrbital, getSpectrum, getTrend } from './services/api';
import type { BondAnalysisResponse, CompareResponse, CrystalResponse, ElementProperty, ElementRecord, ExportFormat, ExportResponse, OrbitalResponse, SpectrumResponse, TrendResponse } from './types/element';
import { categoryLabel, elementProperty, formatTemperature, formatValue, metalClassLabel, phaseAtTemperature, phaseLabel, propertyLabel } from './utils/chemistry';

const SECTION_IDS = ['periodic-table', 'bonding', 'spectra', 'structure', 'comparison'];
const DEFAULT_COMPARE = [6, 8, 26];

function App() {
  const [elements, setElements] = useState<ElementRecord[]>(DEMO_ELEMENTS);
  const [selectedZ, setSelectedZ] = useState(26);
  const [comparedZs, setComparedZs] = useState<number[]>(DEFAULT_COMPARE);
  const [query, setQuery] = useState('');
  const [heatmapProperty, setHeatmapProperty] = useState<ElementProperty>('atomicMass');
  const [temperature, setTemperature] = useState(298);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilterKey>('all');
  const [activeSection, setActiveSection] = useState('periodic-table');
  const [apiOnline, setApiOnline] = useState(false);
  const [isSyncing, setIsSyncing] = useState(true);
  const [globalNotice, setGlobalNotice] = useState('');
  const [detailOpen, setDetailOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  const [spectrum, setSpectrum] = useState<SpectrumResponse>(() => getDemoSpectrum(26));
  const [spectrumLoading, setSpectrumLoading] = useState(false);
  const [spectrumError, setSpectrumError] = useState<string | null>(null);
  const [bondZ1, setBondZ1] = useState(1);
  const [bondZ2, setBondZ2] = useState(8);
  const [bond, setBond] = useState<BondAnalysisResponse>(() => getDemoBondAnalysis(1, 8));
  const [bondLoading, setBondLoading] = useState(false);
  const [bondError, setBondError] = useState<string | null>(null);
  const [crystal, setCrystal] = useState<CrystalResponse>(() => getDemoCrystal(26));
  const [crystalLoading, setCrystalLoading] = useState(false);
  const [crystalError, setCrystalError] = useState<string | null>(null);
  const [orbital, setOrbital] = useState<OrbitalResponse>(() => getDemoOrbital(3, 2, 0));
  const [orbitalLoading, setOrbitalLoading] = useState(false);
  const [orbitalError, setOrbitalError] = useState<string | null>(null);
  const [orbitalN, setOrbitalN] = useState(3);
  const [orbitalL, setOrbitalL] = useState(2);
  const [orbitalM, setOrbitalM] = useState(0);
  const [trendProperty, setTrendProperty] = useState('atomicMass');
  const [trend, setTrend] = useState<TrendResponse>(() => getDemoTrend('atomicMass'));
  const [trendLoading, setTrendLoading] = useState(false);
  const [trendError, setTrendError] = useState<string | null>(null);
  const [comparison, setComparison] = useState<CompareResponse | null>(() => getDemoCompare(DEFAULT_COMPARE));
  const [comparisonLoading, setComparisonLoading] = useState(false);
  const [comparisonError, setComparisonError] = useState<string | null>(null);

  const selectedElement = useMemo(() => elements.find((element) => element.z === selectedZ) ?? getDemoElement(selectedZ), [elements, selectedZ]);
  const comparedElements = useMemo(() => comparedZs.map((z) => elements.find((element) => element.z === z) ?? getDemoElement(z)), [comparedZs, elements]);
  const sourceLabel = apiOnline ? 'API local · snapshot oficial' : 'Fixture local · modo demo';
  const phase = phaseAtTemperature(selectedElement, temperature);

  useEffect(() => {
    let active = true;
    setIsSyncing(true);
    getElements()
      .then((payload) => {
        if (!active || payload.length === 0) return;
        setElements(payload);
        setApiOnline(true);
        setGlobalNotice('');
      })
      .catch(() => {
        if (!active) return;
        setApiOnline(false);
        setGlobalNotice('La API no está disponible. PIDE está usando un snapshot demo local y mantiene las mismas interacciones.');
      })
      .finally(() => { if (active) setIsSyncing(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    const sections = SECTION_IDS.map((id) => document.getElementById(id)).filter((section): section is HTMLElement => section !== null);
    if (!('IntersectionObserver' in window)) return undefined;
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) setActiveSection(visible.target.id);
    }, { rootMargin: '-18% 0px -65% 0px', threshold: [0.1, 0.35, 0.7] });
    sections.forEach((section) => { observer.observe(section); observers.push(observer); });
    return () => { observers.forEach((entry) => entry.disconnect()); };
  }, []);

  useEffect(() => {
    let active = true;
    setSpectrumLoading(true);
    setSpectrumError(null);
    setSpectrum(getDemoSpectrum(selectedZ));
    const fallbackMessage = 'No se pudo cargar el espectro desde la API.';
    getSpectrum(selectedZ)
      .then((payload) => { if (active) setSpectrum(payload); })
      .catch((error: unknown) => { if (active) setSpectrumError(error instanceof ApiRequestError ? error.message : fallbackMessage); })
      .finally(() => { if (active) setSpectrumLoading(false); });
    return () => { active = false; };
  }, [selectedZ]);

  useEffect(() => {
    let active = true;
    setBondLoading(true);
    setBondError(null);
    setBond(getDemoBondAnalysis(bondZ1, bondZ2));
    analyzeBondApi(bondZ1, bondZ2)
      .then((payload) => { if (active) setBond(payload); })
      .catch((error: unknown) => { if (active) setBondError(error instanceof ApiRequestError ? error.message : 'No se pudo analizar el enlace.'); })
      .finally(() => { if (active) setBondLoading(false); });
    return () => { active = false; };
  }, [bondZ1, bondZ2]);

  useEffect(() => {
    let active = true;
    setCrystalLoading(true);
    setCrystalError(null);
    setCrystal(getDemoCrystal(selectedZ));
    getCrystal(selectedZ)
      .then((payload) => { if (active) setCrystal(payload); })
      .catch((error: unknown) => { if (active) setCrystalError(error instanceof ApiRequestError ? error.message : 'No se pudo cargar la celda cristalina.'); })
      .finally(() => { if (active) setCrystalLoading(false); });
    return () => { active = false; };
  }, [selectedZ]);

  useEffect(() => {
    let active = true;
    setOrbitalLoading(true);
    setOrbitalError(null);
    setOrbital(getDemoOrbital(orbitalN, orbitalL, orbitalM));
    getOrbital(orbitalN, orbitalL, orbitalM, selectedZ)
      .then((payload) => { if (active) setOrbital(payload); })
      .catch((error: unknown) => { if (active) setOrbitalError(error instanceof ApiRequestError ? error.message : 'No se pudo calcular el orbital.'); })
      .finally(() => { if (active) setOrbitalLoading(false); });
    return () => { active = false; };
  }, [orbitalL, orbitalM, orbitalN, selectedZ]);

  useEffect(() => {
    let active = true;
    setTrendLoading(true);
    setTrendError(null);
    setTrend(getDemoTrend(trendProperty));
    getTrend(trendProperty)
      .then((payload) => { if (active) setTrend(payload); })
      .catch((error: unknown) => { if (active) setTrendError(error instanceof ApiRequestError ? error.message : 'No se pudo cargar la tendencia.'); })
      .finally(() => { if (active) setTrendLoading(false); });
    return () => { active = false; };
  }, [trendProperty]);

  useEffect(() => {
    let active = true;
    if (comparedZs.length < 2) {
      setComparison(null);
      return undefined;
    }
    setComparisonLoading(true);
    setComparisonError(null);
    setComparison(getDemoCompare(comparedZs));
    compareElementsApi(comparedZs, ['atomicMass', 'densityGcm3', 'meltingPointK'])
      .then((payload) => { if (active) setComparison(payload); })
      .catch((error: unknown) => { if (active) setComparisonError(error instanceof ApiRequestError ? error.message : 'No se pudo actualizar la comparación.'); })
      .finally(() => { if (active) setComparisonLoading(false); });
    return () => { active = false; };
  }, [comparedZs]);

  const selectElement = (z: number) => {
    setSelectedZ(z);
    setDetailOpen(true);
  };

  const toggleComparison = (z: number) => {
    if (comparedZs.includes(z)) {
      setComparedZs((current) => current.filter((item) => item !== z));
      return;
    }
    if (comparedZs.length >= 8) {
      setGlobalNotice('El comparador admite hasta ocho elementos. Quita uno para añadir otro.');
      return;
    }
    setComparedZs((current) => current.includes(z) ? current : [...current, z]);
  };

  const removeFromComparison = (z: number) => setComparedZs((current) => current.filter((item) => item !== z));

  const navigate = (section: string) => {
    document.getElementById(section)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const exportSelection = comparedZs.length > 0 ? comparedZs : [selectedZ];
  const submitExport = async (format: ExportFormat, properties: string[]): Promise<ExportResponse | null> => {
    if (!apiOnline) return getDemoExport(exportSelection, format, properties);
    try {
      return await exportElementsApi(exportSelection, format, properties);
    } catch {
      setGlobalNotice('La exportación de la API falló; se generó el archivo desde el snapshot local.');
      return getDemoExport(exportSelection, format, properties);
    }
  };

  return (
    <Layout activeSection={activeSection} onNavigate={navigate} onExport={() => setExportOpen(true)} apiOnline={apiOnline} isSyncing={isSyncing}>
      <section className="hero-section" aria-labelledby="page-title">
        <div className="hero-content"><div className="eyebrow-row"><span className="eyebrow-dot" /> Herramienta científica local <span className="eyebrow-rule" /> v0.1.0</div><h1 id="page-title">La tabla periódica,<br /><em>en modo laboratorio.</em></h1><p>Explora propiedades, espectros y estructuras de los 118 elementos. Un espacio de trabajo determinista para pasar de la intuición química al dato comprobable.</p><div className="hero-actions"><button className="primary-button" type="button" onClick={() => navigate('periodic-table')}><Atom size={16} /> Abrir tabla <ChevronRight size={15} /></button><button className="text-button" type="button" onClick={() => setDetailOpen(true)}><Info size={15} /> Ver elemento seleccionado</button></div></div>
        <div className="hero-readout"><div className="readout-label"><span>INDEXACIÓN</span><span className="readout-status"><i /> estable</span></div><strong>118</strong><span>elementos disponibles</span><div className="readout-rule" /><div className="readout-grid"><div><small>Campos</small><b>45+</b></div><div><small>Fuentes</small><b>03</b></div><div><small>API</small><b>{apiOnline ? 'ON' : 'OFF'}</b></div></div></div>
      </section>

      {globalNotice ? <div className="mode-banner" role="status"><AlertCircle size={17} /><span>{globalNotice}</span><button type="button" onClick={() => setGlobalNotice('')} aria-label="Cerrar aviso"><ChevronRight size={16} /></button></div> : null}

      <section className="section-block table-section" id="periodic-table" aria-labelledby="table-title">
        <div className="section-header"><div><div className="section-kicker"><span>01</span> ELEMENTARY INDEX</div><h2 id="table-title">Tabla periódica</h2><p>Selecciona un elemento para abrir su ficha y activar los módulos analíticos.</p></div><div className="section-header-meta"><span className="data-badge"><Database size={14} />{sourceLabel}</span><span className="updated-label">Actualización <b>local</b></span></div></div>
        <div className="table-toolbar"><label className="search-control"><Search size={16} /><span className="sr-only">Buscar elemento</span><input type="search" placeholder="Buscar por símbolo, nombre o Z…" value={query} onChange={(event) => setQuery(event.target.value)} /><kbd>/</kbd></label><HeatmapSelector value={heatmapProperty} onChange={setHeatmapProperty} /><div className="toolbar-divider" /><TemperatureBar value={temperature} onChange={setTemperature} /></div>
         <div className="focus-strip"><div className="focus-element"><span className="focus-z">Z {selectedElement.z}</span><strong>{selectedElement.symbol}</strong><div><span>{selectedElement.nameEs}</span><small>{metalClassLabel(selectedElement.metalClass, selectedElement.category)} · {categoryLabel(selectedElement.category)}</small></div></div><div className="focus-metrics"><span><small>Masa atómica</small><b>{formatValue(selectedElement.atomicMass, 3)} <em>u</em></b></span><span><small>Fase actual</small><b className={`phase-text phase-${phase.toLowerCase()}`}><i />{phaseLabel(phase)}</b></span><span><small>Temperatura</small><b>{formatTemperature(temperature)}</b></span></div><div className="focus-actions"><button className="outline-button" type="button" onClick={() => setDetailOpen(true)}>Abrir ficha <ArrowUpRight size={14} /></button><button className={`icon-button compare-action ${comparedZs.includes(selectedZ) ? 'is-selected' : ''}`} type="button" onClick={() => toggleComparison(selectedZ)} aria-label={comparedZs.includes(selectedZ) ? 'Quitar elemento del comparador' : 'Añadir elemento al comparador'} title={comparedZs.includes(selectedZ) ? 'Quitar del comparador' : 'Añadir al comparador'}><GitCompareArrows size={16} /></button></div></div>
        <PeriodicGrid elements={elements} selectedZ={selectedZ} comparedZs={comparedZs} heatmapProperty={heatmapProperty} temperature={temperature} query={query} categoryFilter={categoryFilter} onSelectCategory={setCategoryFilter} onSelect={selectElement} />
      </section>

      <BondAnalyzer
        elements={elements}
        z1={bondZ1}
        z2={bondZ2}
        onZ1Change={setBondZ1}
        onZ2Change={setBondZ2}
        result={bond}
        loading={bondLoading}
        error={bondError}
        apiOnline={apiOnline}
        sourceLabel={sourceLabel}
        selectedElement={selectedElement}
        onUseSelected={() => setBondZ2(selectedZ)}
      />

      <section className="section-block analysis-section" id="spectra" aria-labelledby="spectra-title">
        <div className="section-header compact"><div><div className="section-kicker"><span>03</span> PHOTONIC SIGNATURE</div><h2 id="spectra-title">Espectroscopía de emisión</h2><p>Líneas visibles para <strong>{selectedElement.symbol}</strong>, ordenadas por longitud de onda.</p></div><div className="module-tag"><FlaskConical size={15} /> {spectrum?.metadata.source ? String(spectrum.metadata.source) : sourceLabel}</div></div>
        <div className="analysis-grid"><div className="panel chart-panel"><div className="panel-heading"><span><span className="panel-number">A</span> Espectro visible</span><span className="panel-meta">{spectrumError ? 'fallback local' : 'en tiempo real'}</span></div>{spectrumError && apiOnline ? <div className="resource-note"><AlertCircle size={14} /><span>{spectrumError}. Se muestra el respaldo local.</span></div> : null}<SpectraChart spectrum={spectrum} loading={spectrumLoading} error={spectrumError} sourceLabel={sourceLabel} /></div><aside className="panel spectral-aside"><div className="panel-heading"><span><span className="panel-number">B</span> Lectura rápida</span><CircleHelp size={15} /></div><div className="spectral-summary"><strong>{spectrum?.lines.length ?? 0}</strong><span>líneas detectadas</span></div><div className="spectral-peaks">{(spectrum?.lines ?? []).slice(0, 5).map((line, index) => <div className="peak-row" key={`${line.wavelengthNm}-${index}`}><i style={{ backgroundColor: `rgb(${line.rgb[0]}, ${line.rgb[1]}, ${line.rgb[2]})` }} /><span><b>{formatValue(line.wavelengthNm, 1)}</b> nm</span><small>{formatValue(line.intensity, 0)}%</small></div>)}</div><div className="aside-note"><Info size={14} /><span>La paleta representa el color calculado desde la longitud de onda visible.</span></div></aside></div>
      </section>

      <section className="section-block structure-section" id="structure" aria-labelledby="structure-title">
        <div className="section-header compact"><div><div className="section-kicker"><span>04</span> SPATIAL MODELS</div><h2 id="structure-title">Estructuras 3D</h2><p>Modelos interactivos con superficie de probabilidad y celda unitaria.</p></div><div className="module-tag"><Orbit size={15} /> WebGL / Three.js</div></div>
        <div className="structure-grid"><div className="panel viewer-panel"><div className="panel-heading"><span><span className="panel-number">A</span> Orbital atómico</span><div className="quantum-controls"><label>n <select value={orbitalN} onChange={(event) => { const value = Number(event.target.value); setOrbitalN(value); setOrbitalL((current) => Math.min(current, value - 1)); }} aria-label="Número cuántico principal">{[1, 2, 3, 4].map((value) => <option value={value} key={value}>{value}</option>)}</select></label><label>l <select value={orbitalL} onChange={(event) => { const value = Number(event.target.value); setOrbitalL(value); setOrbitalM((current) => Math.max(-value, Math.min(value, current))); }} aria-label="Número cuántico azimutal">{Array.from({ length: orbitalN }, (_, value) => <option value={value} key={value}>{value}</option>)}</select></label><label>m <select value={orbitalM} onChange={(event) => setOrbitalM(Number(event.target.value))} aria-label="Número cuántico magnético">{Array.from({ length: orbitalL * 2 + 1 }, (_, index) => index - orbitalL).map((value) => <option value={value} key={value}>{value}</option>)}</select></label></div></div><OrbitalCanvas data={orbital} loading={orbitalLoading} error={orbitalError} label={`${selectedElement.symbol} · ${orbitalN} ${['s', 'p', 'd', 'f'][orbitalL] ?? 'orbital'}`} />{orbitalError && apiOnline ? <div className="resource-note"><AlertCircle size={14} /><span>{orbitalError}. Se muestra el respaldo local.</span></div> : null}<div className="viewer-footer"><span><i className="color-key cyan" /> densidad electrónica</span><span><i className="color-key amber" /> núcleo</span><span>n={orbitalN} · l={orbitalL} · m={orbitalM}</span></div></div><div className="panel viewer-panel"><div className="panel-heading"><span><span className="panel-number">B</span> Celda cristalina</span><span className="panel-meta">{crystal?.latticeSystem ?? '—'}</span></div><CrystalCanvas data={crystal} loading={crystalLoading} error={crystalError} />{crystalError && apiOnline ? <div className="resource-note"><AlertCircle size={14} /><span>{crystalError}. Se muestra el respaldo local.</span></div> : null}<div className="crystal-data"><div><small>Red</small><b>{crystal?.lattice ?? '—'}</b></div><div><small>a × b × c</small><b>{crystal ? `${formatValue(crystal.cell.aAngstrom, 2)} Å` : '—'}</b></div><div><small>Conectividad</small><b>{crystal?.bonds.length ?? 0} enlaces</b></div></div></div></div>
      </section>

      <section className="section-block comparison-section" id="comparison" aria-labelledby="comparison-title">
        <div className="section-header compact"><div><div className="section-kicker"><span>05</span> MULTIVARIATE READOUT</div><h2 id="comparison-title">Comparador y tendencias</h2><p>Contrasta propiedades con una selección de hasta ocho elementos.</p></div><div className="module-tag"><GitCompareArrows size={15} /> {comparedZs.length} elementos</div></div>
        <div className="comparison-layout"><div className="panel comparison-panel"><div className="panel-heading"><span><span className="panel-number">A</span> Fichas comparativas</span><button className="panel-action" type="button" onClick={() => setExportOpen(true)}><Download size={14} /> exportar</button></div><ComparisonCards elements={comparedElements} comparedZs={comparedZs} response={comparison} loading={comparisonLoading} error={comparisonError} onRemove={removeFromComparison} onSelect={selectElement} /></div><div className="panel trend-panel"><div className="panel-heading"><span><span className="panel-number">B</span> Tendencia por Z</span><Layers3 size={15} /></div>{trendError && apiOnline ? <div className="resource-note"><AlertCircle size={14} /><span>{trendError}. Se muestra el respaldo local.</span></div> : null}<TrendPlot trend={trend} property={trendProperty} loading={trendLoading} error={trendError} onPropertyChange={setTrendProperty} /></div></div>
      </section>

       <footer className="app-footer"><div><Atom size={16} /><strong>PIDE</strong><span>Periodic Information &amp; Data Explorer</span></div><div className="footer-meta"><span>Offline first · datos trazables · sin nube</span><a href="https://github.com/AndresSabogal00/NIDE" target="_blank" rel="noreferrer">Inspirado en NIDE de Andrés Sabogal</a></div></footer>

       <ElementDetail element={selectedElement} temperature={temperature} isCompared={comparedZs.includes(selectedZ)} open={detailOpen} onClose={() => setDetailOpen(false)} onAddCompare={() => toggleComparison(selectedZ)} onExport={() => { setDetailOpen(false); setExportOpen(true); }} />
      <ExportModal open={exportOpen} elements={comparedElements.length > 0 ? comparedElements : [selectedElement]} onClose={() => setExportOpen(false)} onSubmit={submitExport} />
    </Layout>
  );
}

export default App;
