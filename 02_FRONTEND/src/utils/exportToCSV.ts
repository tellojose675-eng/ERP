/**
 * exportToCSV.ts
 * Descarga CSV con nombre de archivo correcto, BOM UTF-8 para tildes
 * y punto y coma como delimitador (estándar Excel español / Windows).
 *
 * Usa Data URI en lugar de Blob URL para garantizar que Chrome/Edge
 * respete el nombre del archivo en el atributo `download`.
 */

export function exportToCSV(data: any[], filename: string) {
  if (!data || !Array.isArray(data) || data.length === 0) {
    alert('No hay registros disponibles para exportar en este módulo.');
    return;
  }

  try {
    const headers = Object.keys(data[0]);
    const SEP = ';'; // punto y coma: estándar Excel en español

    // ── Cabecera ──────────────────────────────────────────────────────
    const rows: string[] = [
      headers.map(h => `"${String(h).replace(/"/g, '""')}"`).join(SEP)
    ];

    // ── Filas de datos ────────────────────────────────────────────────
    for (const row of data) {
      const cells = headers.map(h => {
        const v = row[h];
        if (v == null) return '""';
        if (typeof v === 'object') return `"${JSON.stringify(v).replace(/"/g, '""')}"`;
        return `"${String(v).replace(/[\r\n]+/g, ' ').replace(/"/g, '""')}"`;
      });
      rows.push(cells.join(SEP));
    }

    // ── Construir contenido con BOM UTF-8 ─────────────────────────────
    const csvContent = '\uFEFF' + rows.join('\r\n');

    // ── Nombre de archivo ─────────────────────────────────────────────
    const today = new Date().toISOString().slice(0, 10);
    const finalName = `${filename}_${today}.csv`;

    // ── Descarga usando Data URI (garantiza nombre correcto en Chrome) ─
    // Codificamos en base64 para que el navegador use el atributo download
    const base64 = btoa(unescape(encodeURIComponent(csvContent)));
    const dataUri = `data:text/csv;charset=utf-8;base64,${base64}`;

    const link = document.createElement('a');
    link.href = dataUri;
    link.download = finalName;       // propiedad directa, no setAttribute
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

  } catch (err) {
    console.error('exportToCSV error:', err);
    alert('Error al generar el archivo CSV. Revisa la consola para más detalles.');
  }
}
