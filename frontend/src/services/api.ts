import type {
  CompareResponse,
  CrystalResponse,
  ElementRecord,
  ExportFormat,
  ExportResponse,
  OrbitalResponse,
  SpectrumResponse,
  TrendResponse,
} from '../types/element';

export class ApiRequestError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(message: string, status = 0, code = 'NETWORK_ERROR') {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.code = code;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      ...init,
      headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...init?.headers },
    });
  } catch {
    throw new ApiRequestError('API no disponible; se usará el conjunto demo.', 0, 'NETWORK_ERROR');
  }

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }
  if (!response.ok) {
    const errorPayload = payload as { error?: { message?: string; code?: string } } | null;
    throw new ApiRequestError(
      errorPayload?.error?.message ?? `La API respondió con ${response.status}.`,
      response.status,
      errorPayload?.error?.code ?? 'HTTP_ERROR',
    );
  }
  return payload as T;
}

export function getElements(query?: { q?: string; block?: string; period?: number; group?: number }): Promise<ElementRecord[]> {
  const params = new URLSearchParams();
  if (query?.q) params.set('q', query.q);
  if (query?.block) params.set('block', query.block);
  if (query?.period) params.set('period', String(query.period));
  if (query?.group) params.set('group', String(query.group));
  const suffix = params.toString() ? `?${params.toString()}` : '';
  return request<ElementRecord[]>(`/elements${suffix}`);
}

export function getElement(z: number): Promise<ElementRecord> {
  return request<ElementRecord>(`/elements/${z}`);
}

export function getSpectrum(z: number, maxLines = 100): Promise<SpectrumResponse> {
  return request<SpectrumResponse>(`/spectra/${z}?max_lines=${maxLines}`);
}

export function getOrbital(n: number, l: number, m: number, z: number, gridSize = 25, isoFraction = 0.9): Promise<OrbitalResponse> {
  const params = new URLSearchParams({ z: String(z), grid_size: String(gridSize), iso_fraction: String(isoFraction) });
  return request<OrbitalResponse>(`/orbitals/${n}/${l}/${m}?${params.toString()}`);
}

export function getCrystal(z: number): Promise<CrystalResponse> {
  return request<CrystalResponse>(`/crystals/${z}`);
}

export function getTrend(property: string): Promise<TrendResponse> {
  return request<TrendResponse>(`/trends?property=${encodeURIComponent(property)}`);
}

export function compareElements(z: number[], properties: string[]): Promise<CompareResponse> {
  return request<CompareResponse>('/compare', {
    method: 'POST',
    body: JSON.stringify({ z, properties }),
  });
}

export function exportElements(z: number[], format: ExportFormat, properties: string[]): Promise<ExportResponse> {
  return request<ExportResponse>('/export', {
    method: 'POST',
    body: JSON.stringify({ z, format, properties }),
  });
}
