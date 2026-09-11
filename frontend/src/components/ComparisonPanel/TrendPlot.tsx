import { useState } from 'react';
import { AlertTriangle, ChartNoAxesCombined, LoaderCircle } from 'lucide-react';
import type { TrendResponse } from '../../types/element';
import { formatValue, propertyLabel, propertyUnit } from '../../utils/chemistry';

interface TrendPlotProps {
  trend: TrendResponse | null;
  property: string;
  loading: boolean;
  error: string | null;
  onPropertyChange: (property: string) => void;
}

interface HoveredPoint {
  z: number;
  symbol: string;
  value: number;
  x: number;
  y: number;
}

const TREND_OPTIONS = [
  ['atomicMass', 'Masa atómica'],
  ['densityGcm3', 'Densidad'],
  ['meltingPointK', 'Punto de fusión'],
  ['electronegativityPauling', 'Electronegatividad'],
];

export function TrendPlot({ trend, property, loading, error, onPropertyChange }: TrendPlotProps) {
  const [hovered, setHovered] = useState<HoveredPoint | null>(null);
  const series = trend?.series ?? [];
  const values = series.map((point) => point.value).filter((value): value is number => value !== null);
  const minimum = Math.min(...values, 0);
  const maximum = Math.max(...values, 1);
  const width = 760;
  const height = 255;
  const left = 48;
  const right = 20;
  const top = 25;
  const bottom = 40;
  const x = (z: number) => left + ((z - 1) / 117) * (width - left - right);
  const y = (value: number) => top + (height - top - bottom) - ((value - minimum) / Math.max(maximum - minimum, 1)) * (height - top - bottom);

  return (
    <div className="trend-content">
      <div className="trend-controls"><label className="select-control"><span className="sr-only">Propiedad para tendencia</span><select value={property} onChange={(event) => onPropertyChange(event.target.value)}>{TREND_OPTIONS.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label><span className="trend-unit">{propertyUnit(property) || 'relativo'}</span></div>
      {loading ? <div className="chart-state compact-state"><LoaderCircle className="spin" size={20} /><span>Consultando serie…</span></div> : error && series.length === 0 ? <div className="chart-state compact-state error"><AlertTriangle size={20} /><span>{error}</span></div> : series.length === 0 ? <div className="chart-state compact-state"><ChartNoAxesCombined size={20} /><span>No hay puntos disponibles.</span></div> : (
        <svg className="trend-svg" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`Tendencia de ${propertyLabel(property)} por número atómico`} onMouseLeave={() => setHovered(null)}>
          <title>{propertyLabel(property)} frente a número atómico</title>
          {[0, 0.5, 1].map((fraction) => { const tickValue = minimum + (maximum - minimum) * fraction; const tickY = y(tickValue); return <g key={fraction}><line className="chart-grid-line" x1={left} x2={width - right} y1={tickY} y2={tickY} /><text className="chart-axis-label" x={left - 10} y={tickY + 4} textAnchor="end">{tickValue.toPrecision(3)}</text></g>; })}
          <line className="chart-axis" x1={left} x2={width - right} y1={height - bottom} y2={height - bottom} />
          <text className="chart-axis-label" x={left} y={height - 13}>Z 1</text><text className="chart-axis-label" x={width - right} y={height - 13} textAnchor="end">Z 118</text>
          {series.slice(0, -1).map((point, index) => { const next = series[index + 1]; if (point.value === null || next.value === null) return null; return <line key={`line-${point.z}`} className="trend-line" x1={x(point.z)} y1={y(point.value)} x2={x(next.z)} y2={y(next.value)} />; })}
          {series.map((point) => {
            const val = point.value;
            if (val === null) return null;
            return (
              <circle
                className={`trend-point ${hovered?.z === point.z ? 'is-hovered' : ''}`}
                key={point.z}
                cx={x(point.z)}
                cy={y(val)}
                r={hovered?.z === point.z ? 5.5 : 3.8}
                onMouseEnter={() => setHovered({ z: point.z, symbol: point.symbol, value: val, x: x(point.z), y: y(val) })}
              >
                <title>{`${point.symbol} (Z ${point.z}): ${formatValue(val, 3)} ${propertyUnit(property)}`}</title>
              </circle>
            );
          })}
          {hovered && (
            <g className="trend-hover-group" pointerEvents="none">
              <line x1={hovered.x} x2={hovered.x} y1={top} y2={height - bottom} className="trend-hover-guideline" />
              <circle cx={hovered.x} cy={hovered.y} r="7" className="trend-hover-glow" />
              <circle cx={hovered.x} cy={hovered.y} r="4.5" className="trend-hover-core" />
              <g transform={`translate(${Math.max(left + 50, Math.min(width - right - 55, hovered.x))}, ${hovered.y > top + 42 ? hovered.y - 14 : hovered.y + 24})`}>
                <rect x="-56" y="-18" width="112" height="24" rx="4" className="trend-tooltip-box" />
                <text x="0" y="-3" textAnchor="middle" className="trend-tooltip-text">
                  {hovered.symbol} · Z {hovered.z} · {formatValue(hovered.value, 2)}
                </text>
              </g>
            </g>
          )}
        </svg>
      )}
      <div className="trend-caption"><span><i className="trend-dot" />{propertyLabel(property)}</span><span>n = {values.length} elementos con dato</span></div>
    </div>
  );
}
