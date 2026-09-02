import { useState, type ReactNode } from 'react';
import { Activity, Atom, Database, Download, Menu, PanelLeft, X } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
  activeSection: string;
  onNavigate: (section: string) => void;
  onExport: () => void;
  apiOnline: boolean;
  isSyncing: boolean;
}

const NAV_ITEMS = [
  { id: 'periodic-table', label: 'Tabla periódica', detail: '118 registros' },
  { id: 'bonding', label: 'Enlaces químicos', detail: 'Pauling · Δχ' },
  { id: 'spectra', label: 'Espectroscopía', detail: 'Líneas NIST' },
  { id: 'structure', label: 'Estructuras 3D', detail: 'Orbital + celda' },
  { id: 'comparison', label: 'Comparador', detail: 'Análisis multivariable' },
];

export function Layout({ children, activeSection, onNavigate, onExport, apiOnline, isSyncing }: LayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [railCollapsed, setRailCollapsed] = useState(false);

  const navigate = (section: string) => {
    onNavigate(section);
    setMobileOpen(false);
  };

  return (
    <div className={`app-frame ${railCollapsed ? 'rail-collapsed' : ''}`}>
      <div className={`mobile-scrim ${mobileOpen ? 'is-visible' : ''}`} onClick={() => setMobileOpen(false)} aria-hidden="true" />
      <aside className={`side-rail ${mobileOpen ? 'is-open' : ''}`} aria-label="Navegación principal">
        <div className="brand-lockup">
          <div className="brand-mark" aria-hidden="true"><Atom size={21} strokeWidth={1.8} /></div>
          <div>
            <p className="brand-name">PIDE<span>/</span></p>
            <p className="brand-subtitle">Periodic data explorer</p>
          </div>
          <button className="icon-button rail-close" type="button" onClick={() => setMobileOpen(false)} aria-label="Cerrar navegación">
            <X size={17} />
          </button>
        </div>

        <div className="rail-rule" />
        <div className="rail-kicker"><span className="status-dot" /> Workspace local</div>

        <nav className="main-nav">
          <p className="nav-label">Módulos</p>
          {NAV_ITEMS.map((item) => (
            <button
              className={`nav-item ${activeSection === item.id ? 'is-active' : ''}`}
              key={item.id}
              type="button"
              onClick={() => navigate(item.id)}
              aria-current={activeSection === item.id ? 'page' : undefined}
              aria-label={item.label}
            >
              <span className="nav-index">{String(NAV_ITEMS.indexOf(item) + 1).padStart(2, '0')}</span>
              <span className="nav-copy"><strong>{item.label}</strong><small>{item.detail}</small></span>
            </button>
          ))}
        </nav>

        <div className="rail-spacer" />
        <div className="data-health-card">
          <div className="health-heading"><Database size={15} /><span>Fuente de datos</span></div>
          <strong>{apiOnline ? 'API conectada' : 'Snapshot local'}</strong>
          <p>{apiOnline ? 'FastAPI · puerto 8000' : 'Modo demo · sin backend'}</p>
          <div className={`health-line ${apiOnline ? 'online' : 'offline'}`}><span />{isSyncing ? 'Sincronizando…' : apiOnline ? 'En línea' : 'Disponible offline'}</div>
        </div>
        <p className="rail-version">PIDE v0.1.0 <span>·</span> IUPAC / NIST</p>
      </aside>

      <main className="main-shell">
        <header className="topbar">
          <button className="mobile-menu icon-button" type="button" onClick={() => setMobileOpen(true)} aria-label="Abrir navegación">
            <Menu size={19} />
          </button>
          <div className="breadcrumb"><span>Workspace</span><b>/</b><strong>Explorer</strong></div>
          <div className="topbar-actions">
            <div className={`connection-chip ${apiOnline ? 'is-online' : ''}`}>
              <Activity size={14} />
              <span>{apiOnline ? 'API online' : 'Demo mode'}</span>
            </div>
            <button className="outline-button top-export" type="button" onClick={onExport}><Download size={15} /> Exportar</button>
             <button className="icon-button desktop-rail-toggle" type="button" onClick={() => setRailCollapsed((collapsed) => !collapsed)} aria-label={railCollapsed ? 'Expandir panel de navegación' : 'Contraer panel de navegación'} aria-expanded={!railCollapsed} title={railCollapsed ? 'Expandir panel' : 'Contraer panel'}><PanelLeft size={17} /></button>
          </div>
        </header>
        <div className="main-content">{children}</div>
      </main>
    </div>
  );
}
