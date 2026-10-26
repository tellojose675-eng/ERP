/**
 * Utilidades centralizadas para el manejo de Fecha y Hora Oficial del Perú (America/Lima, UTC-5).
 * Garantiza que cualquier fecha del backend (incluso timestamps en UTC de servidores en la nube)
 * se muestre exactamente en fecha y hora peruana en TODOS los módulos del sistema.
 */

export function parseToPeruDate(dateStr?: string | Date | null): Date {
  if (!dateStr) return new Date();
  if (dateStr instanceof Date) return dateStr;

  let iso = String(dateStr).trim();
  // Si la cadena no especifica zona horaria (+, - o Z), viene en UTC de los servidores Render/PostgreSQL
  if (!iso.endsWith('Z') && !iso.includes('+') && !iso.includes('-', 10)) {
    iso = `${iso}Z`;
  }
  const d = new Date(iso);
  return isNaN(d.getTime()) ? new Date() : d;
}

export function formatPeruDate(dateStr?: string | Date | null): string {
  const d = parseToPeruDate(dateStr);
  return d.toLocaleDateString('es-PE', {
    timeZone: 'America/Lima',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

export function formatPeruTime(dateStr?: string | Date | null, includeSeconds = true): string {
  const d = parseToPeruDate(dateStr);
  return d.toLocaleTimeString('es-PE', {
    timeZone: 'America/Lima',
    hour: '2-digit',
    minute: '2-digit',
    second: includeSeconds ? '2-digit' : undefined,
    hour12: true
  });
}

export function formatPeruDateTime(dateStr?: string | Date | null, includeSeconds = true): string {
  const d = parseToPeruDate(dateStr);
  return `${formatPeruDate(d)} · ${formatPeruTime(d, includeSeconds)}`;
}

export function formatPeruDateAndParts(dateStr?: string | Date | null) {
  const d = parseToPeruDate(dateStr);
  return {
    date: formatPeruDate(d),
    time: formatPeruTime(d, true)
  };
}
