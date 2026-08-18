import { Thermometer } from 'lucide-react';
import { formatTemperature, phaseLabel } from '../../utils/chemistry';

interface TemperatureBarProps {
  value: number;
  onChange: (value: number) => void;
}

export function TemperatureBar({ value, onChange }: TemperatureBarProps) {
  return (
    <div className="temperature-control">
      <div className="temperature-heading">
        <span><Thermometer size={15} /> Fase a temperatura</span>
        <strong>{formatTemperature(value)}</strong>
      </div>
      <input
        className="temperature-slider"
        type="range"
        min="0"
        max="6000"
        step="1"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        aria-label="Temperatura de simulación en kelvin"
      />
      <div className="temperature-scale"><span>0 K</span><span>6000 K</span></div>
      <div className="phase-legend" aria-label="Fases de la materia">
        <span className="phase-key solid"><i />{phaseLabel('Solid')}</span>
        <span className="phase-key liquid"><i />{phaseLabel('Liquid')}</span>
        <span className="phase-key gas"><i />{phaseLabel('Gas')}</span>
      </div>
    </div>
  );
}
