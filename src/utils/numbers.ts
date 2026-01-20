import { run } from '@jxa/run';
import { runAppleScript } from 'run-applescript';

// Type definitions
export interface NumbersDocument {
  name: string;
  modified: boolean;
  path?: string;
  sheets: SheetInfo[];
}

export interface SheetInfo {
  name: string;
  tables: string[];
}

export interface TableData {
  headers: string[];
  rows: (string | number | null)[][];
  rowCount: number;
  columnCount: number;
}

export interface CellMatch {
  cellReference: string;
  value: string | number | null;
  row: number;
  column: string;
}

export interface TableStructure {
  totalRows: number;
  totalColumns: number;
  headerRowCount: number;
  headerColumnCount: number;
  footerRowCount: number;
  dataStartRow: number;
  dataEndRow: number;
  headersFrozen: boolean;
  tableName: string;
}

interface CreateNoteResult {
  success: boolean;
  message?: string;
}

/**
 * Named color mapping to hex values
 */
const NAMED_COLORS: Record<string, string> = {
  // Basic colors
  red: '#FF0000',
  green: '#00FF00',
  blue: '#0000FF',
  yellow: '#FFFF00',
  cyan: '#00FFFF',
  magenta: '#FF00FF',
  black: '#000000',
  white: '#FFFFFF',
  gray: '#808080',
  grey: '#808080',

  // Extended colors
  orange: '#FFA500',
  purple: '#800080',
  pink: '#FFC0CB',
  brown: '#A52A2A',
  lime: '#00FF00',
  navy: '#000080',
  teal: '#008080',
  maroon: '#800000',
  olive: '#808000',
  silver: '#C0C0C0'
};

/**
 * Convert hex color to AppleScript RGB values (0-65535 range)
 */
export function hexToAppleScriptRGB(hexColor: string): { r: number; g: number; b: number } {
  // Handle named colors
  const color = hexColor.toLowerCase();
  const hex = NAMED_COLORS[color] ? NAMED_COLORS[color].replace('#', '') : hexColor.replace('#', '');

  // Validate hex format
  if (!/^[0-9A-Fa-f]{6}$/.test(hex)) {
    throw new Error(`Invalid color: ${hexColor}. Use hex format (#RRGGBB) or named colors (red, blue, etc.)`);
  }

  // Parse RGB components (0-255)
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Convert to 0-65535 range (AppleScript uses 16-bit values)
  return {
    r: Math.round((r / 255) * 65535),
    g: Math.round((g / 255) * 65535),
    b: Math.round((b / 255) * 65535)
  };
}

/**
 * Convert A1 notation to row/column indices (1-based for Numbers)
 * e.g., "A1" -> {row: 1, col: 1}, "B5" -> {row: 5, col: 2}, "AA10" -> {row: 10, col: 27}
 */
export function parseA1Notation(cellRef: string): { row: number; col: number } {
  const match = cellRef.match(/^([A-Z]+)(\d+)$/);
  if (!match) {
    throw new Error(`Invalid cell reference: ${cellRef}. Expected format like "A1", "B5", or "AA10"`);
  }

  const colStr = match[1];
  const rowStr = match[2];

  // Convert column letters to number (A=1, Z=26, AA=27, etc.)
  let col = 0;
  for (let i = 0; i < colStr.length; i++) {
    col = col * 26 + (colStr.charCodeAt(i) - 64);
  }

  const row = parseInt(rowStr, 10);

  if (row < 1) {
    throw new Error(`Invalid row number: ${row}. Row must be >= 1`);
  }

  return { row, col };
}

/**
 * Parse range notation (e.g., "A1:C10")
 */
export function parseRange(range: string): {
  startRow: number;
  startCol: number;
  endRow: number;
  endCol: number;
} {
  const parts = range.split(':');
  if (parts.length !== 2) {
    throw new Error(`Invalid range: ${range}. Expected format like "A1:C10"`);
  }

  const [startCell, endCell] = parts;
  const start = parseA1Notation(startCell);
  const end = parseA1Notation(endCell);

  if (start.row > end.row || start.col > end.col) {
    throw new Error(`Invalid range: ${range}. Start cell must be before end cell`);
  }

  return {
    startRow: start.row,
    startCol: start.col,
    endRow: end.row,
    endCol: end.col
  };
}

/**
 * Convert column number to letter (1 -> "A", 26 -> "Z", 27 -> "AA")
 */
export function numberToColumn(num: number): string {
  let col = '';
  while (num > 0) {
    const remainder = (num - 1) % 26;
    col = String.fromCharCode(65 + remainder) + col;
    num = Math.floor((num - 1) / 26);
  }
  return col;
}

/**
 * Convert column letter to number ("A" -> 1, "Z" -> 26, "AA" -> 27)
 */
export function columnToNumber(col: string): number {
  let num = 0;
  for (let i = 0; i < col.length; i++) {
    num = num * 26 + (col.charCodeAt(i) - 64);
  }
  return num;
}

/**
 * List all open Numbers documents
 */
async function listDocuments(): Promise<NumbersDocument[]> {
  try {
    const documents = await run(() => {
      const Numbers = Application('Numbers');
      const docs = Numbers.documents();

      return docs.map((doc: any) => {
        try {
          const sheets = doc.sheets();
          const sheetInfos = sheets.map((sheet: any) => {
            try {
              const tables = sheet.tables();
              return {
                name: sheet.name(),
                tables: tables.map((table: any) => {
                  try {
                    return table.name();
                  } catch (e) {
                    return 'Unnamed Table';
                  }
                })
              };
            } catch (e) {
              return {
                name: sheet.name(),
                tables: []
              };
            }
          });

          return {
            name: doc.name(),
            modified: doc.modified(),
            sheets: sheetInfos
          };
        } catch (e) {
          return {
            name: 'Unknown Document',
            modified: false,
            sheets: []
          };
        }
      });
    });

    return documents as NumbersDocument[];
  } catch (error) {
    throw new Error(`Failed to list Numbers documents: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Get information about a specific document
 */
async function getDocumentInfo(documentName: string): Promise<NumbersDocument> {
  try {
    const docInfo = await run((docName: string) => {
      const Numbers = Application('Numbers');
      const docs = Numbers.documents.whose({ name: docName })();

      if (docs.length === 0) {
        throw new Error(`Document "${docName}" not found. Make sure it's open in Numbers.`);
      }

      const doc = docs[0];
      const sheets = doc.sheets();

      return {
        name: doc.name(),
        modified: doc.modified(),
        sheets: sheets.map((sheet: any) => {
          try {
            const tables = sheet.tables();
            return {
              name: sheet.name(),
              tables: tables.map((table: any) => {
                try {
                  return table.name();
                } catch (e) {
                  return 'Unnamed Table';
                }
              })
            };
          } catch (e) {
            return {
              name: sheet.name(),
              tables: []
            };
          }
        })
      };
    }, documentName);

    return docInfo as NumbersDocument;
  } catch (error) {
    throw new Error(`Failed to get document info: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Get table structure information (headers, footers, data boundaries)
 */
async function getTableStructure(
  documentName: string,
  sheetName: string,
  tableName?: string
): Promise<TableStructure> {
  try {
    const structure = await run((args: {
      documentName: string;
      sheetName: string;
      tableName?: string;
    }) => {
      const Numbers = Application('Numbers');
      const docs = Numbers.documents.whose({ name: args.documentName })();

      if (docs.length === 0) {
        throw new Error(`Document "${args.documentName}" not found. Make sure it's open in Numbers.`);
      }

      const doc = docs[0];
      const sheets = doc.sheets.whose({ name: args.sheetName })();

      if (sheets.length === 0) {
        throw new Error(`Sheet "${args.sheetName}" not found in document "${args.documentName}".`);
      }

      const sheet = sheets[0];
      const allTables = sheet.tables();

      let table;
      if (args.tableName) {
        const namedTables = sheet.tables.whose({ name: args.tableName })();
        if (namedTables.length === 0) {
          throw new Error(`Table "${args.tableName}" not found in sheet "${args.sheetName}".`);
        }
        table = namedTables[0];
      } else {
        if (allTables.length === 0) {
          throw new Error(`No tables found in sheet "${args.sheetName}".`);
        }
        table = allTables[0];
      }

      // Get table structure properties
      const headerRows = table.headerRowCount();
      const headerCols = table.headerColumnCount();
      const footerRows = table.footerRowCount();
      const totalRows = table.rowCount();
      const totalCols = table.columnCount();
      const frozen = table.headerRowsFrozen();
      const tblName = table.name();

      return {
        totalRows,
        totalColumns: totalCols,
        headerRowCount: headerRows,
        headerColumnCount: headerCols,
        footerRowCount: footerRows,
        dataStartRow: headerRows + 1,
        dataEndRow: totalRows - footerRows,
        headersFrozen: frozen,
        tableName: tblName
      };
    }, { documentName, sheetName, tableName });

    return structure as TableStructure;
  } catch (error) {
    throw new Error(`Failed to get table structure: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Read data from a sheet/table
 */
async function getSheetData(
  documentName: string,
  sheetName: string,
  tableName?: string,
  range?: string,
  includeFormulas: boolean = false
): Promise<TableData> {
  try {
    // Parse range outside JXA to avoid scope issues
    let parsedRange: { startRow: number; startCol: number; endRow: number; endCol: number } | null = null;

    if (range) {
      try {
        parsedRange = parseRange(range);
      } catch (error) {
        throw new Error(`Invalid range: ${range}`);
      }
    }

    const data = await run((args: {
      documentName: string;
      sheetName: string;
      tableName?: string;
      parsedRange: { startRow: number; startCol: number; endRow: number; endCol: number } | null;
      includeFormulas: boolean;
    }) => {
      const Numbers = Application('Numbers');
      const docs = Numbers.documents.whose({ name: args.documentName })();

      if (docs.length === 0) {
        throw new Error(`Document "${args.documentName}" not found. Make sure it's open in Numbers.`);
      }

      const doc = docs[0];
      const sheets = doc.sheets.whose({ name: args.sheetName })();

      if (sheets.length === 0) {
        throw new Error(`Sheet "${args.sheetName}" not found in document "${args.documentName}".`);
      }

      const sheet = sheets[0];
      const allTables = sheet.tables();

      let table;
      if (args.tableName) {
        const namedTables = sheet.tables.whose({ name: args.tableName })();
        if (namedTables.length === 0) {
          throw new Error(`Table "${args.tableName}" not found in sheet "${args.sheetName}".`);
        }
        table = namedTables[0];
      } else {
        if (allTables.length === 0) {
          throw new Error(`No tables found in sheet "${args.sheetName}".`);
        }
        table = allTables[0];
      }

      // Determine range
      let startRow = 1, startCol = 1;
      let endRow = table.rowCount();
      let endCol = table.columnCount();

      if (args.parsedRange) {
        startRow = args.parsedRange.startRow;
        startCol = args.parsedRange.startCol;
        endRow = args.parsedRange.endRow;
        endCol = args.parsedRange.endCol;
      }

      // Read data
      const rows: any[] = [];
      for (let r = startRow; r <= endRow; r++) {
        const row: any[] = [];
        for (let c = startCol; c <= endCol; c++) {
          try {
            const cell = table.cells.at(c - 1).at(r - 1);
            if (args.includeFormulas) {
              try {
                const formula = cell.formula();
                row.push(formula || cell.value());
              } catch (e) {
                row.push(cell.value());
              }
            } else {
              row.push(cell.value());
            }
          } catch (e) {
            row.push(null);
          }
        }
        rows.push(row);
      }

      return {
        headers: rows.length > 0 ? rows[0] : [],
        rows: rows.slice(1),
        rowCount: endRow - startRow + 1,
        columnCount: endCol - startCol + 1
      };
    }, { documentName, sheetName, tableName, parsedRange, includeFormulas });

    return data as TableData;
  } catch (error) {
    throw new Error(`Failed to get sheet data: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Update a single cell value
 */
async function updateCell(
  documentName: string,
  sheetName: string,
  cellReference: string,
  value: string | number,
  tableName?: string
): Promise<{ success: boolean; message: string }> {
  try {
    // Use AppleScript for reliable cell updates
    const tableRef = tableName ? `table "${tableName}"` : 'table 1';

    // Escape quotes in string values
    const escapedValue = typeof value === 'string'
      ? value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
      : value;

    const script = `
tell application "Numbers"
  tell document "${documentName}"
    tell sheet "${sheetName}"
      tell ${tableRef}
        set value of cell "${cellReference}" to ${typeof value === 'string' ? `"${escapedValue}"` : value}
      end tell
    end tell
  end tell
end tell
return "Success"`;

    await runAppleScript(script);

    return {
      success: true,
      message: `Updated cell ${cellReference} to "${value}"`
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to update cell: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Append a new row to a table
 */
async function appendRow(
  documentName: string,
  sheetName: string,
  values: (string | number)[],
  tableName?: string,
  insertPosition: 'after-headers' | 'after-data' | 'at-end' = 'after-data'
): Promise<{ success: boolean; rowNumber: number; message: string }> {
  try {
    // Get table structure to determine where to insert
    const structure = await getTableStructure(documentName, sheetName, tableName);

    let insertAfterRow: number;
    switch (insertPosition) {
      case 'after-headers':
        insertAfterRow = structure.headerRowCount;
        break;
      case 'after-data':
        insertAfterRow = structure.dataEndRow;
        break;
      case 'at-end':
        insertAfterRow = structure.totalRows;
        break;
    }

    // Use AppleScript for reliable row manipulation
    const tableRef = tableName ? `table "${tableName}"` : 'table 1';

    // Build cell assignments
    const cellAssignments = values.map((val, idx) => {
      const escapedValue = typeof val === 'string'
        ? val.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
        : val;
      const valueStr = typeof val === 'string' ? `"${escapedValue}"` : val;
      return `        set value of cell ${idx + 1} of newRow to ${valueStr}`;
    }).join('\n');

    const script = `
tell application "Numbers"
  tell document "${documentName}"
    tell sheet "${sheetName}"
      tell ${tableRef}
        set newRow to make new row at after row ${insertAfterRow}
        ${cellAssignments}
        return ${insertAfterRow + 1}
      end tell
    end tell
  end tell
end tell`;

    const result = await runAppleScript(script);
    const rowNumber = parseInt(result, 10);

    return {
      success: true,
      rowNumber: rowNumber,
      message: `Added row ${rowNumber} with ${values.length} value(s) (insertPosition: ${insertPosition})`
    };
  } catch (error) {
    return {
      success: false,
      rowNumber: -1,
      message: `Failed to append row: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Update multiple cells at once with a 2D array
 */
async function updateRange(
  documentName: string,
  sheetName: string,
  startCell: string,
  values: (string | number)[][],
  tableName?: string
): Promise<{ success: boolean; message: string; cellsUpdated: number }> {
  try {
    // Parse start cell to get row and column
    const { row: startRow, col: startCol } = parseA1Notation(startCell);

    // Use AppleScript for reliable range updates
    const tableRef = tableName ? `table "${tableName}"` : 'table 1';

    // Build cell assignments
    let cellsUpdated = 0;
    const cellAssignments: string[] = [];

    for (let r = 0; r < values.length; r++) {
      const rowValues = values[r];
      for (let c = 0; c < rowValues.length; c++) {
        const value = rowValues[c];
        const targetRow = startRow + r;
        const targetCol = startCol + c;
        const cellRef = `${numberToColumn(targetCol)}${targetRow}`;

        const escapedValue = typeof value === 'string'
          ? value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
          : value;
        const valueStr = typeof value === 'string' ? `"${escapedValue}"` : value;

        cellAssignments.push(`        set value of cell "${cellRef}" to ${valueStr}`);
        cellsUpdated++;
      }
    }

    const script = `
tell application "Numbers"
  tell document "${documentName}"
    tell sheet "${sheetName}"
      tell ${tableRef}
${cellAssignments.join('\n')}
      end tell
    end tell
  end tell
end tell
return "Success"`;

    await runAppleScript(script);

    return {
      success: true,
      message: `Updated ${cellsUpdated} cell(s) starting from ${startCell}`,
      cellsUpdated: cellsUpdated
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to update range: ${error instanceof Error ? error.message : String(error)}`,
      cellsUpdated: 0
    };
  }
}

/**
 * Find data in a sheet
 */
async function findData(
  documentName: string,
  sheetName: string,
  searchText: string,
  column?: string
): Promise<CellMatch[]> {
  try {
    const matches = await run((args: {
      documentName: string;
      sheetName: string;
      searchText: string;
      column?: string;
    }) => {
      const Numbers = Application('Numbers');
      const docs = Numbers.documents.whose({ name: args.documentName })();

      if (docs.length === 0) {
        throw new Error(`Document "${args.documentName}" not found`);
      }

      const doc = docs[0];
      const sheets = doc.sheets.whose({ name: args.sheetName })();

      if (sheets.length === 0) {
        throw new Error(`Sheet "${args.sheetName}" not found`);
      }

      const sheet = sheets[0];
      const tables = sheet.tables();

      if (tables.length === 0) {
        throw new Error('No tables found');
      }

      const matches: any[] = [];

      // Search in all tables
      for (let t = 0; t < tables.length; t++) {
        const table = tables[t];
        const rowCount = table.rowCount();
        const colCount = table.columnCount();

        // Determine column filter if specified
        let searchColIndex = -1;
        if (args.column) {
          // Try to match column by letter (e.g., "A", "B")
          const colMatch = args.column.match(/^([A-Z]+)$/);
          if (colMatch) {
            let colNum = 0;
            for (let i = 0; i < args.column.length; i++) {
              colNum = colNum * 26 + (args.column.charCodeAt(i) - 64);
            }
            searchColIndex = colNum - 1;
          } else {
            // Try to match by header name
            try {
              const headerRow = table.cells();
              for (let c = 0; c < colCount; c++) {
                try {
                  const headerCell = table.cells.at(c).at(0);
                  const headerValue = String(headerCell.value() || '');
                  if (headerValue.toLowerCase() === args.column.toLowerCase()) {
                    searchColIndex = c;
                    break;
                  }
                } catch (e) {
                  // Skip invalid cells
                }
              }
            } catch (e) {
              // Could not match header
            }
          }
        }

        // Search cells
        for (let r = 0; r < rowCount; r++) {
          const startCol = searchColIndex >= 0 ? searchColIndex : 0;
          const endCol = searchColIndex >= 0 ? searchColIndex : colCount - 1;

          for (let c = startCol; c <= endCol; c++) {
            try {
              const cell = table.cells.at(c).at(r);
              const value = cell.value();
              const strValue = String(value || '');

              if (strValue.toLowerCase().includes(args.searchText.toLowerCase())) {
                // Convert to column letter
                let colLetter = '';
                let colNum = c + 1;
                while (colNum > 0) {
                  const remainder = (colNum - 1) % 26;
                  colLetter = String.fromCharCode(65 + remainder) + colLetter;
                  colNum = Math.floor((colNum - 1) / 26);
                }

                matches.push({
                  cellReference: `${colLetter}${r + 1}`,
                  value: value,
                  row: r + 1,
                  column: colLetter
                });
              }
            } catch (e) {
              // Skip invalid cells
            }
          }
        }
      }

      return matches;
    }, { documentName, sheetName, searchText, column });

    return matches as CellMatch[];
  } catch (error) {
    throw new Error(`Failed to find data: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Insert rows at a specific position
 */
async function insertRows(
  documentName: string,
  sheetName: string,
  afterRow: number,
  count: number = 1,
  tableName?: string
): Promise<{ success: boolean; message: string }> {
  try {
    // Use AppleScript for reliable row insertion
    const tableRef = tableName ? `table "${tableName}"` : 'table 1';

    const script = `
tell application "Numbers"
  tell document "${documentName}"
    tell sheet "${sheetName}"
      tell ${tableRef}
        repeat ${count} times
          ${afterRow === 0
            ? 'make new row at beginning of rows'
            : `make new row at after row ${afterRow}`}
        end repeat
      end tell
    end tell
  end tell
end tell
return "Success"`;

    await runAppleScript(script);

    return {
      success: true,
      message: `Inserted ${count} row(s) after row ${afterRow}`
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to insert rows: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Delete rows from a table
 */
async function deleteRows(
  documentName: string,
  sheetName: string,
  startRow: number,
  count: number = 1,
  tableName?: string
): Promise<{ success: boolean; message: string }> {
  try {
    // Use AppleScript for reliable row deletion
    const tableRef = tableName ? `table "${tableName}"` : 'table 1';

    // Delete in reverse order to maintain indices
    const deleteStatements = [];
    for (let i = count - 1; i >= 0; i--) {
      deleteStatements.push(`        delete row ${startRow + i}`);
    }

    const script = `
tell application "Numbers"
  tell document "${documentName}"
    tell sheet "${sheetName}"
      tell ${tableRef}
${deleteStatements.join('\n')}
      end tell
    end tell
  end tell
end tell
return "Success"`;

    await runAppleScript(script);

    return {
      success: true,
      message: `Deleted ${count} row(s) starting from row ${startRow}`
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to delete rows: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Get formula from a cell
 */
async function getFormula(
  documentName: string,
  sheetName: string,
  cellReference: string,
  tableName?: string
): Promise<string> {
  try {
    const formula = await run((args: {
      documentName: string;
      sheetName: string;
      cellReference: string;
      tableName?: string;
    }) => {
      const Numbers = Application('Numbers');
      const docs = Numbers.documents.whose({ name: args.documentName })();

      if (docs.length === 0) {
        throw new Error(`Document "${args.documentName}" not found`);
      }

      const doc = docs[0];
      const sheets = doc.sheets.whose({ name: args.sheetName })();

      if (sheets.length === 0) {
        throw new Error(`Sheet "${args.sheetName}" not found`);
      }

      const sheet = sheets[0];
      const tables = args.tableName
        ? sheet.tables.whose({ name: args.tableName })()
        : sheet.tables();

      if (tables.length === 0) {
        throw new Error('No tables found');
      }

      const table = tables[0];

      // Parse cell reference
      const match = args.cellReference.match(/^([A-Z]+)(\d+)$/);
      if (!match) {
        throw new Error(`Invalid cell reference: ${args.cellReference}`);
      }

      const colStr = match[1];
      const rowNum = parseInt(match[2]);

      let colNum = 0;
      for (let i = 0; i < colStr.length; i++) {
        colNum = colNum * 26 + (colStr.charCodeAt(i) - 64);
      }

      // Get cell formula
      const cell = table.cells.at(colNum - 1).at(rowNum - 1);
      try {
        const formula = cell.formula();
        return formula || `No formula (value: ${cell.value()})`;
      } catch (e) {
        return `No formula (value: ${cell.value()})`;
      }
    }, { documentName, sheetName, cellReference, tableName });

    return formula as string;
  } catch (error) {
    throw new Error(`Failed to get formula: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Set formula in a cell
 */
async function setFormula(
  documentName: string,
  sheetName: string,
  cellReference: string,
  formula: string,
  tableName?: string
): Promise<{ success: boolean; message: string }> {
  try {
    // Use AppleScript for reliable formula setting
    const tableRef = tableName ? `table "${tableName}"` : 'table 1';

    // Ensure formula starts with =
    const finalFormula = formula.startsWith('=') ? formula : `=${formula}`;

    // Escape quotes in formula
    const escapedFormula = finalFormula.replace(/\\/g, '\\\\').replace(/"/g, '\\"');

    const script = `
tell application "Numbers"
  tell document "${documentName}"
    tell sheet "${sheetName}"
      tell ${tableRef}
        set formula of cell "${cellReference}" to "${escapedFormula}"
      end tell
    end tell
  end tell
end tell
return "Success"`;

    await runAppleScript(script);

    return {
      success: true,
      message: `Set formula in cell ${cellReference} to "${finalFormula}"`
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to set formula: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Set number format for a cell
 */
async function setNumberFormat(
  documentName: string,
  sheetName: string,
  cellReference: string,
  format: string,
  tableName?: string
): Promise<{ success: boolean; message: string }> {
  try {
    const tableRef = tableName ? `table "${tableName}"` : 'table 1';

    const script = `
tell application "Numbers"
  tell document "${documentName}"
    tell sheet "${sheetName}"
      tell ${tableRef}
        set format of cell "${cellReference}" to ${format}
      end tell
    end tell
  end tell
end tell
return "Success"`;

    await runAppleScript(script);

    return {
      success: true,
      message: `Set number format of cell ${cellReference} to "${format}"`
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to set number format: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Format a cell with colors, fonts, and alignment
 */
async function formatCell(
  documentName: string,
  sheetName: string,
  cellReference: string,
  options: {
    backgroundColor?: string;
    textColor?: string;
    fontName?: string;
    fontSize?: number;
    alignment?: string;
    verticalAlignment?: string;
    textWrap?: boolean;
  },
  tableName?: string
): Promise<{ success: boolean; message: string }> {
  try {
    const tableRef = tableName ? `table "${tableName}"` : 'table 1';

    // Build formatting commands
    const commands: string[] = [];

    if (options.backgroundColor) {
      const rgb = hexToAppleScriptRGB(options.backgroundColor);
      commands.push(`        set background color of cell "${cellReference}" to {${rgb.r}, ${rgb.g}, ${rgb.b}}`);
    }

    if (options.textColor) {
      const rgb = hexToAppleScriptRGB(options.textColor);
      commands.push(`        set text color of cell "${cellReference}" to {${rgb.r}, ${rgb.g}, ${rgb.b}}`);
    }

    if (options.fontName) {
      commands.push(`        set font name of cell "${cellReference}" to "${options.fontName}"`);
    }

    if (options.fontSize) {
      commands.push(`        set font size of cell "${cellReference}" to ${options.fontSize}`);
    }

    if (options.alignment) {
      commands.push(`        set alignment of cell "${cellReference}" to ${options.alignment}`);
    }

    if (options.verticalAlignment) {
      commands.push(`        set vertical alignment of cell "${cellReference}" to ${options.verticalAlignment}`);
    }

    if (options.textWrap !== undefined) {
      commands.push(`        set text wrap of cell "${cellReference}" to ${options.textWrap}`);
    }

    if (commands.length === 0) {
      return {
        success: false,
        message: 'No formatting options provided'
      };
    }

    const script = `
tell application "Numbers"
  tell document "${documentName}"
    tell sheet "${sheetName}"
      tell ${tableRef}
${commands.join('\n')}
      end tell
    end tell
  end tell
end tell
return "Success"`;

    await runAppleScript(script);

    return {
      success: true,
      message: `Applied formatting to cell ${cellReference}`
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to format cell: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Format multiple cells at once (batch operation)
 */
async function formatCells(
  documentName: string,
  sheetName: string,
  cells: Array<{
    cellReference: string;
    backgroundColor?: string;
    textColor?: string;
    fontName?: string;
    fontSize?: number;
    alignment?: string;
    verticalAlignment?: string;
    textWrap?: boolean;
  }>,
  tableName?: string
): Promise<{ success: boolean; message: string; cellsFormatted: number }> {
  try {
    const tableRef = tableName ? `table "${tableName}"` : 'table 1';

    // Build formatting commands for all cells
    const allCommands: string[] = [];

    for (const cell of cells) {
      if (cell.backgroundColor) {
        const rgb = hexToAppleScriptRGB(cell.backgroundColor);
        allCommands.push(`        set background color of cell "${cell.cellReference}" to {${rgb.r}, ${rgb.g}, ${rgb.b}}`);
      }

      if (cell.textColor) {
        const rgb = hexToAppleScriptRGB(cell.textColor);
        allCommands.push(`        set text color of cell "${cell.cellReference}" to {${rgb.r}, ${rgb.g}, ${rgb.b}}`);
      }

      if (cell.fontName) {
        allCommands.push(`        set font name of cell "${cell.cellReference}" to "${cell.fontName}"`);
      }

      if (cell.fontSize) {
        allCommands.push(`        set font size of cell "${cell.cellReference}" to ${cell.fontSize}`);
      }

      if (cell.alignment) {
        allCommands.push(`        set alignment of cell "${cell.cellReference}" to ${cell.alignment}`);
      }

      if (cell.verticalAlignment) {
        allCommands.push(`        set vertical alignment of cell "${cell.cellReference}" to ${cell.verticalAlignment}`);
      }

      if (cell.textWrap !== undefined) {
        allCommands.push(`        set text wrap of cell "${cell.cellReference}" to ${cell.textWrap}`);
      }
    }

    if (allCommands.length === 0) {
      return {
        success: false,
        message: 'No formatting options provided for any cells',
        cellsFormatted: 0
      };
    }

    const script = `
tell application "Numbers"
  tell document "${documentName}"
    tell sheet "${sheetName}"
      tell ${tableRef}
${allCommands.join('\n')}
      end tell
    end tell
  end tell
end tell
return "Success"`;

    await runAppleScript(script);

    return {
      success: true,
      message: `Applied formatting to ${cells.length} cell(s) in a single operation`,
      cellsFormatted: cells.length
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to format cells: ${error instanceof Error ? error.message : String(error)}`,
      cellsFormatted: 0
    };
  }
}

/**
 * Set column width
 */
async function setColumnWidth(
  documentName: string,
  sheetName: string,
  column: string,
  width: number,
  tableName?: string
): Promise<{ success: boolean; message: string }> {
  try {
    const tableRef = tableName ? `table "${tableName}"` : 'table 1';

    const script = `
tell application "Numbers"
  tell document "${documentName}"
    tell sheet "${sheetName}"
      tell ${tableRef}
        set width of column "${column}" to ${width}
      end tell
    end tell
  end tell
end tell
return "Success"`;

    await runAppleScript(script);

    return {
      success: true,
      message: `Set column ${column} width to ${width} points`
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to set column width: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Set row height
 */
async function setRowHeight(
  documentName: string,
  sheetName: string,
  row: number,
  height: number,
  tableName?: string
): Promise<{ success: boolean; message: string }> {
  try {
    const tableRef = tableName ? `table "${tableName}"` : 'table 1';

    const script = `
tell application "Numbers"
  tell document "${documentName}"
    tell sheet "${sheetName}"
      tell ${tableRef}
        set height of row ${row} to ${height}
      end tell
    end tell
  end tell
end tell
return "Success"`;

    await runAppleScript(script);

    return {
      success: true,
      message: `Set row ${row} height to ${height} points`
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to set row height: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Merge cells in a range
 */
async function mergeCells(
  documentName: string,
  sheetName: string,
  range: string,
  tableName?: string
): Promise<{ success: boolean; message: string }> {
  try {
    const tableRef = tableName ? `table "${tableName}"` : 'table 1';

    const script = `
tell application "Numbers"
  tell document "${documentName}"
    tell sheet "${sheetName}"
      tell ${tableRef}
        merge range "${range}"
      end tell
    end tell
  end tell
end tell
return "Success"`;

    await runAppleScript(script);

    return {
      success: true,
      message: `Merged cells in range ${range}`
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to merge cells: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Unmerge cells in a range
 */
async function unmergeCells(
  documentName: string,
  sheetName: string,
  range: string,
  tableName?: string
): Promise<{ success: boolean; message: string }> {
  try {
    const tableRef = tableName ? `table "${tableName}"` : 'table 1';

    const script = `
tell application "Numbers"
  tell document "${documentName}"
    tell sheet "${sheetName}"
      tell ${tableRef}
        unmerge range "${range}"
      end tell
    end tell
  end tell
end tell
return "Success"`;

    await runAppleScript(script);

    return {
      success: true,
      message: `Unmerged cells in range ${range}`
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to unmerge cells: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

export default {
  listDocuments,
  getDocumentInfo,
  getTableStructure,
  getSheetData,
  updateCell,
  appendRow,
  updateRange,
  findData,
  insertRows,
  deleteRows,
  getFormula,
  setFormula,
  formatCell,
  formatCells,
  setNumberFormat,
  setColumnWidth,
  setRowHeight,
  mergeCells,
  unmergeCells
};
