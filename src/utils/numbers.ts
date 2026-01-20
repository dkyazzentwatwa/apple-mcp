import { run } from '@jxa/run';

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

interface CreateNoteResult {
  success: boolean;
  message?: string;
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
    const data = await run((args: {
      documentName: string;
      sheetName: string;
      tableName?: string;
      range?: string;
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

      if (args.range) {
        const parts = args.range.split(':');
        if (parts.length === 2) {
          const startMatch = parts[0].match(/^([A-Z]+)(\d+)$/);
          const endMatch = parts[1].match(/^([A-Z]+)(\d+)$/);

          if (startMatch && endMatch) {
            // Convert column letters to numbers
            const colToNum = (col: string) => {
              let num = 0;
              for (let i = 0; i < col.length; i++) {
                num = num * 26 + (col.charCodeAt(i) - 64);
              }
              return num;
            };

            startCol = colToNum(startMatch[1]);
            startRow = parseInt(startMatch[2]);
            endCol = colToNum(endMatch[1]);
            endRow = parseInt(endMatch[2]);
          }
        }
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
    }, { documentName, sheetName, tableName, range, includeFormulas });

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
    const result = await run((args: {
      documentName: string;
      sheetName: string;
      cellReference: string;
      value: string | number;
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

      // Set cell value (Numbers uses 0-based indexing internally)
      const cell = table.cells.at(colNum - 1).at(rowNum - 1);
      cell.value = args.value;

      return {
        success: true,
        message: `Updated cell ${args.cellReference} to "${args.value}"`
      };
    }, { documentName, sheetName, cellReference, value, tableName });

    return result as { success: boolean; message: string };
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
  tableName?: string
): Promise<{ success: boolean; rowNumber: number; message: string }> {
  try {
    const result = await run((args: {
      documentName: string;
      sheetName: string;
      values: (string | number)[];
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
      const currentRowCount = table.rowCount();

      // Add a new row
      table.rows.push(table.make({ new: 'row' }));

      const newRowIndex = currentRowCount + 1;

      // Populate the new row with values
      for (let i = 0; i < args.values.length; i++) {
        try {
          const cell = table.cells.at(i).at(currentRowCount);
          cell.value = args.values[i];
        } catch (e) {
          // Cell might not exist, skip
        }
      }

      return {
        success: true,
        rowNumber: newRowIndex,
        message: `Added row ${newRowIndex} with ${args.values.length} value(s)`
      };
    }, { documentName, sheetName, values, tableName });

    return result as { success: boolean; rowNumber: number; message: string };
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
    const result = await run((args: {
      documentName: string;
      sheetName: string;
      startCell: string;
      values: (string | number)[][];
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

      // Parse start cell
      const match = args.startCell.match(/^([A-Z]+)(\d+)$/);
      if (!match) {
        throw new Error(`Invalid cell reference: ${args.startCell}`);
      }

      const colStr = match[1];
      const rowNum = parseInt(match[2]);

      let startColNum = 0;
      for (let i = 0; i < colStr.length; i++) {
        startColNum = startColNum * 26 + (colStr.charCodeAt(i) - 64);
      }

      let cellsUpdated = 0;

      // Update cells
      for (let r = 0; r < args.values.length; r++) {
        const row = args.values[r];
        for (let c = 0; c < row.length; c++) {
          try {
            const cell = table.cells.at(startColNum + c - 1).at(rowNum + r - 1);
            cell.value = row[c];
            cellsUpdated++;
          } catch (e) {
            // Cell might not exist, skip
          }
        }
      }

      return {
        success: true,
        message: `Updated ${cellsUpdated} cell(s) starting from ${args.startCell}`,
        cellsUpdated: cellsUpdated
      };
    }, { documentName, sheetName, startCell, values, tableName });

    return result as { success: boolean; message: string; cellsUpdated: number };
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
    const result = await run((args: {
      documentName: string;
      sheetName: string;
      afterRow: number;
      count: number;
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

      // Insert rows
      for (let i = 0; i < args.count; i++) {
        if (args.afterRow === 0) {
          // Insert at beginning
          table.rows.push(table.make({ new: 'row', at: table.rows.at(0) }));
        } else {
          // Insert after specified row
          table.rows.push(table.make({ new: 'row', at: table.rows.at(args.afterRow + i) }));
        }
      }

      return {
        success: true,
        message: `Inserted ${args.count} row(s) after row ${args.afterRow}`
      };
    }, { documentName, sheetName, afterRow, count, tableName });

    return result as { success: boolean; message: string };
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
    const result = await run((args: {
      documentName: string;
      sheetName: string;
      startRow: number;
      count: number;
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

      // Delete rows (delete in reverse order to maintain indices)
      for (let i = args.count - 1; i >= 0; i--) {
        const rowIndex = args.startRow + i - 1;
        try {
          table.rows.at(rowIndex).delete();
        } catch (e) {
          throw new Error(`Could not delete row ${args.startRow + i}`);
        }
      }

      return {
        success: true,
        message: `Deleted ${args.count} row(s) starting from row ${args.startRow}`
      };
    }, { documentName, sheetName, startRow, count, tableName });

    return result as { success: boolean; message: string };
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
    const result = await run((args: {
      documentName: string;
      sheetName: string;
      cellReference: string;
      formula: string;
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

      // Ensure formula starts with =
      const finalFormula = args.formula.startsWith('=') ? args.formula : `=${args.formula}`;

      // Set cell formula
      const cell = table.cells.at(colNum - 1).at(rowNum - 1);
      cell.formula = finalFormula;

      return {
        success: true,
        message: `Set formula in cell ${args.cellReference} to "${finalFormula}"`
      };
    }, { documentName, sheetName, cellReference, formula, tableName });

    return result as { success: boolean; message: string };
  } catch (error) {
    return {
      success: false,
      message: `Failed to set formula: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

export default {
  listDocuments,
  getDocumentInfo,
  getSheetData,
  updateCell,
  appendRow,
  updateRange,
  findData,
  insertRows,
  deleteRows,
  getFormula,
  setFormula
};
