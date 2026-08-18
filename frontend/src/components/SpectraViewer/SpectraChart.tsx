import { AlertTriangle, BarChart3, LoaderCircle } from 'lucide-react';
import type { SpectrumResponse } from '../../types/element';
import { formatValue } from '../../utils/chemistry';

interface SpectraChartProps {
  spectrum: SpectrumResponse | null;
  loading: boolean;
  error: string | null;
  sourceLabel: string;
}

export function SpectraChart({ spectrum, loading, error, sourceLabel }: SpectraChartProps) {
  const lines = spectrum?.lines ?? [];
  const width = 760;
  const height = 278;
  const chartLeft = 48;
  const chartRight = 18;
  const chartTop = 24;
  const chartBottom = 42;
  const chartWidth = width - chartLeft - chartRight;
  const chartHeight = height - chartTop - chartBottom;
  const maximum = Math.max(...lines.map((line) => line.intensity), 100);
  const x = (wavelength: number) => chartLeft + ((wavelength - 380) / 400) * chartWidth;
  const y = (intensity: number) => chartTop + chartHeight - (intensity / maximum) * chartHeight;

  return (
    <div className="chart-frame">
      <div className="chart-toolbar"><span className="chart-unit">INTENSIDAD RELATIVA</span><span>{lines.length} líneas <b>·</b> 380–780 nm</span></div>
      {loading ? (
        <div className="chart-state"><LoaderCircle className="spin" size={22} /><span>Calculando líneas de emisión…</span></div>
      ) : error && lines.length === 0 ? (
        <div className="chart-state error"><AlertTriangle size={21} /><span>{error}</span></div>
      ) : lines.length === 0 ? (
        <div className="chart-state"><BarChart3 size={22} /><span>No hay líneas espectrales para este elemento.</span></div>
      ) : (
        <svg className="spectrum-svg" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`Espectro de emisión de ${spectrum?.symbol ?? 'elemento'}`}>
          <title>Espectro de emisión {spectrum?.symbol}</title>
          {[0, 25, 50, 75, 100].map((tick) => {
            const tickY = y((tick / 100) * maximum);
            return <g key={tick}><line className="chart-grid-line" x1={chartLeft} x2={width - chartRight} y1={tickY} y2={tickY} /><text className="chart-axis-label" x={chartLeft - 9} y={tickY + 4} textAnchor="end">{tick}</text></g>;
          })}
          {[380, 480, 580, 680, 780].map((tick) => <g key={tick}><line className="chart-grid-line vertical" x1={x(tick)} x2={x(tick)} y1={chartTop} y2={height - chartBottom} /><text className="chart-axis-label" x={x(tick)} y={height - 15} textAnchor="middle">{tick}</text></g>)}
          <line className="chart-axis" x1={chartLeft} x2={width - chartRight} y1={height - chartBottom} y2={height - chartBottom} />
          {lines.map((line, index) => {
            const position = Math.max(chartLeft, Math.min(width - chartRight, x(line.wavelengthNm)));
            const lineColor = `rgb(${line.rgb[0]}, ${line.rgb[1]}, ${line.rgb[2]})`;
            return <g key={`${line.wavelengthNm}-${index}`}><title>{`${formatValue(line.wavelengthNm, 1)} nm · ${line.transition} · ${formatValue(line.intensity, 1)}%`}</title><line className="spectral-line" x1={position} x2={position} y1={height - chartBottom} y2={y(line.intensity)} stroke={lineColor} /><circle cx={position} cy={y(line.intensity)} r="2.8" fill={lineColor} /></g>;
          })}
        </svg>
      )}
      <div className="chart-caption"><span className="source-tag"><i />{sourceLabel}</span><span>Longitud de onda / nm</span></div>
    </div>
  );
}
