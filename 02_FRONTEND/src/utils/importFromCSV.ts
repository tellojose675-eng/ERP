/**
 * importFromCSV.ts
 * Utilidad para importar datos desde archivos CSV.
 * Soporta delimitador punto y coma (;) y coma (,), con o sin BOM UTF-8.
 */

export interface CSVImportResult {
  success: boolean;
  data: Record<string, string>[];
  headers: string[];
  rowCount: number;
  errors: string[];
}

/**
 * Abre un selector de archivo CSV y retorna los datos parseados.
 */
export function openCSVFileDialog(): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv,.txt';
    input.style.display = 'none';
    input.addEventListener('change', () => {
      const file = input.files?.[0] || null;
      resolve(file);
      document.body.removeChild(input);
    });
    input.addEventListener('cancel', () => {
      resolve(null);
      document.body.removeChild(input);
    });
    document.body.appendChild(input);
    input.click();
  });
}

/**
 * Parsea el contenido de un archivo CSV y retorna un arreglo de objetos.
 */
export function parseCSVContent(content: string): CSVImportResult {
  const errors: string[] = [];

  // Eliminar BOM si existe
  let cleanContent = content.replace(/^\uFEFF/, '');

  // Detectar delimitador (punto y coma o coma)
  const firstLine = cleanContent.split(/\r?\n/)[0] || '';
  const semicolonCount = (firstLine.match(/;/g) || []).length;
  const commaCount = (firstLine.match(/,/g) || []).length;
  const delimiter = semicolonCount >= commaCount ? ';' : ',';

  // Separar líneas
  const lines = cleanContent.split(/\r?\n/).filter(line => line.trim() !== '');

  if (lines.length < 2) {
    return {
      success: false,
      data: [],
      headers: [],
      rowCount: 0,
      errors: ['El archivo CSV debe tener al menos una fila de encabezados y una fila de datos.']
    };
  }

  // Parsear encabezados
  const headers = parseCSVLine(lines[0], delimiter).map(h => h.trim());

  if (headers.length === 0 || headers.every(h => !h)) {
    return {
      success: false,
      data: [],
      headers: [],
      rowCount: 0,
      errors: ['No se pudieron detectar encabezados válidos en el archivo CSV.']
    };
  }

  // Parsear filas de datos
  const data: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i], delimiter);
    if (values.length === 0 || values.every(v => !v.trim())) continue;

    const row: Record<string, string> = {};
    headers.forEach((header, idx) => {
      row[header] = (values[idx] || '').trim();
    });

    // Validar que al menos un campo tenga valor
    if (Object.values(row).some(v => v !== '')) {
      data.push(row);
    }
  }

  if (data.length === 0) {
    errors.push('No se encontraron filas de datos válidas en el archivo CSV.');
  }

  return {
    success: data.length > 0,
    data,
    headers,
    rowCount: data.length,
    errors
  };
}

/**
 * Parsea una línea CSV respetando campos entre comillas.
 */
function parseCSVLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++; // saltar comilla escapada
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === delimiter) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
  }

  result.push(current);
  return result;
}

/**
 * Lee un archivo y retorna su contenido como texto.
 */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Error al leer el archivo'));
    reader.readAsText(file, 'UTF-8');
  });
}

/**
 * Flujo completo: abre diálogo, lee archivo y parsea CSV.
 */
export async function importCSVFlow(): Promise<CSVImportResult | null> {
  const file = await openCSVFileDialog();
  if (!file) return null;

  const content = await readFileAsText(file);
  return parseCSVContent(content);
}
