import { AlertTriangle, ChartNoAxesCombined, LoaderCircle } from 'lucide-react';
import type { TrendResponse } from '../../types/element';
import { propertyLabel, propertyUnit } from '../../utils/chemistry';

interface TrendPlotProps {
  trend: TrendResponse | null;
  property: string;
  loading: boolean;
  error: string | null;
  onPropertyChange: (property: string) => void;
}

const TREND_OPTIONS = [
  ['atomicMass', 'Masa atómica'],
  ['densityGcm3', 'Densidad'],
  ['meltingPointK', 'Punto de fusión'],
  ['electronegativityPauling', 'Electronegatividad'],
];

export function TrendPlot({ trend, property, loading, error, onPropertyChange }: TrendPlotProps) {
  const series = trend?.series ?? [];
  const values = series.map((point) => point.value).filter((value): value is number => value !== null);
  const minimum = Math.min(...values, 0);
  const maximum = Math.max(...values, 1);
  const width = 760;
  const height = 255;
  const left = 45;
  const right = 18;
  const top = 25;
  const bottom = 40;
  const x = (z: number) => left + ((z - 1) / 117) * (width - left - right);
  const y = (value: number) => top + (height - top - bottom) - ((value - minimum) / Math.max(maximum - minimum, 1)) * (height - top - bottom);

  return (
    <div className="trend-content">
      <div className="trend-controls"><label className="select-control"><span className="sr-only">Propiedad para tendencia</span><select value={property} onChange={(event) => onPropertyChange(event.target.value)}>{TREND_OPTIONS.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label><span className="trend-unit">{propertyUnit(property) || 'relativo'}</span></div>
      {loading ? <div className="chart-state compact-state"><LoaderCircle className="spin" size={20} /><span>Consultando serie…</span></div> : error && series.length === 0 ? <div className="chart-state compact-state error"><AlertTriangle size={20} /><span>{error}</span></div> : series.length === 0 ? <div className="chart-state compact-state"><ChartNoAxesCombined size={20} /><span>No hay puntos disponibles.</span></div> : (
        <svg className="trend-svg" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`Tendencia de ${propertyLabel(property)} por número atómico`}>
          <title>{propertyLabel(property)} frente a número atómico</title>
          {[0, 0.5, 1].map((fraction) => { const tickValue = minimum + (maximum - minimum) * fraction; const tickY = y(tickValue); return <g key={fraction}><line className="chart-grid-line" x1={left} x2={width - right} y1={tickY} y2={tickY} /><text className="chart-axis-label" x={left - 8} y={tickY + 4} textAnchor="end">{tickValue.toPrecision(3)}</text></g>; })}
          <line className="chart-axis" x1={left} x2={width - right} y1={height - bottom} y2={height - bottom} />
          <text className="chart-axis-label" x={left} y={height - 13}>Z 1</text><text className="chart-axis-label" x={width - right} y={height - 13} textAnchor="end">Z 118</text>
          {series.slice(0, -1).map((point, index) => { const next = series[index + 1]; if (point.value === null || next.value === null) return null; return <line key={`line-${point.z}`} className="trend-line" x1={x(point.z)} y1={y(point.value)} x2={x(next.z)} y2={y(next.value)} />; })}
          {series.map((point) => point.value === null ? null : <circle className="trend-point" key={point.z} cx={x(point.z)} cy={y(point.value)} r="2.4"><title>{`${point.symbol} · Z ${point.z} · ${point.value}`}</title></circle>)}
        </svg>
      )}
      <div className="trend-caption"><span><i className="trend-dot" />{propertyLabel(property)}</span><span>n = {values.length} elementos con dato</span></div>
    </div>
  );
}
