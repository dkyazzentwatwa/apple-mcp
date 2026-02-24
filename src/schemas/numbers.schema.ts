import { z } from 'zod';

// Reusable field constraints
const documentNameField = z.string().min(1, 'documentName is required').max(500).describe('Name of the Numbers document');
const sheetNameField = z.string().min(1, 'sheetName is required').max(500).describe('Name of the sheet');
const tableNameField = z.string().max(500).optional().describe('Name of the table (defaults to first table)');
const cellReferenceField = z.string().min(1, 'cellReference is required').max(20).regex(/^[A-Z]{1,3}\d+$/, 'Invalid cell reference format (expected A1 notation, e.g. "B5")').describe('Cell reference in A1 notation (e.g., "B5")');
const rangeField = z.string().min(1, 'range is required').max(41).regex(/^[A-Z]{1,3}\d+:[A-Z]{1,3}\d+$/, 'Invalid range format (expected A1:B2 notation)').describe('Cell range in A1 notation (e.g., "A1:B2")');

// Core Operations (Phase 1)

const ListDocumentsSchema = z.object({
  operation: z.literal('listDocuments').describe('List all open Numbers documents')
});

const GetDocumentInfoSchema = z.object({
  operation: z.literal('getDocumentInfo').describe('Get information about a specific Numbers document'),
  documentName: documentNameField
});

const GetTableStructureSchema = z.object({
  operation: z.literal('getTableStructure').describe('Get table structure (headers, footers, data boundaries) - CALL THIS FIRST before adding data!'),
  documentName: documentNameField,
  sheetName: sheetNameField,
  tableName: tableNameField
});

const GetSheetDataSchema = z.object({
  operation: z.literal('getSheetData').describe('Read data from a sheet/table in a Numbers document'),
  documentName: documentNameField,
  sheetName: sheetNameField,
  tableName: z.string().max(500).optional().describe('Name of the table (if sheet has multiple tables, defaults to first table)'),
  range: z.string().max(41).optional().describe('Cell range in A1 notation (e.g., "A1:C10"). If omitted, returns entire table'),
  includeFormulas: z.boolean().optional().default(false).describe('Return formulas instead of calculated values')
});

const UpdateCellSchema = z.object({
  operation: z.literal('updateCell').describe('Update the value of a single cell'),
  documentName: documentNameField,
  sheetName: sheetNameField,
  tableName: tableNameField,
  cellReference: cellReferenceField,
  value: z.union([z.string().max(10000), z.number()]).describe('Value to set in the cell')
});

const AppendRowSchema = z.object({
  operation: z.literal('appendRow').describe('Append a new row to a table'),
  documentName: documentNameField,
  sheetName: sheetNameField,
  tableName: tableNameField,
  values: z.array(z.union([z.string().max(10000), z.number()])).min(1, 'values array must not be empty').max(200).describe('Array of values for each column in the new row'),
  insertPosition: z.enum(['after-headers', 'after-data', 'at-end']).optional().default('after-headers').describe('Where to insert: after-headers (row 2, DEFAULT - starts data from top), after-data (before footers, use when appending to existing data), or at-end (very bottom, rarely used)')
});

// Advanced Operations (Phase 2)

const UpdateRangeSchema = z.object({
  operation: z.literal('updateRange').describe('Update multiple cells at once with a 2D array of values'),
  documentName: documentNameField,
  sheetName: sheetNameField,
  tableName: tableNameField,
  startCell: z.string().min(1, 'startCell is required').max(20).regex(/^[A-Z]{1,3}\d+$/, 'Invalid cell reference format').describe('Starting cell in A1 notation (e.g., "A1")'),
  values: z.array(z.array(z.union([z.string().max(10000), z.number()]))).min(1, 'values array must not be empty').max(500).describe('2D array of values (array of rows, each row is an array of cell values)')
});

const FindDataSchema = z.object({
  operation: z.literal('findData').describe('Search for values in a sheet'),
  documentName: documentNameField,
  sheetName: sheetNameField,
  searchText: z.string().min(1, 'searchText is required').max(500).describe('Text to search for in the sheet'),
  column: z.string().max(20).optional().describe('Optional: Limit search to specific column (e.g., "A" or column name)')
});

const InsertRowsSchema = z.object({
  operation: z.literal('insertRows').describe('Insert one or more empty rows at a specific position'),
  documentName: documentNameField,
  sheetName: sheetNameField,
  tableName: tableNameField,
  afterRow: z.number().min(0, 'afterRow must be >= 0').describe('Insert after this row number (0 to insert at start)'),
  count: z.number().min(1, 'count must be >= 1').max(500).optional().default(1).describe('Number of rows to insert (default: 1)')
});

const DeleteRowsSchema = z.object({
  operation: z.literal('deleteRows').describe('Delete one or more rows from a table'),
  documentName: documentNameField,
  sheetName: sheetNameField,
  tableName: tableNameField,
  startRow: z.number().min(1, 'startRow must be >= 1').describe('Starting row number to delete'),
  count: z.number().min(1, 'count must be >= 1').max(500).optional().default(1).describe('Number of rows to delete (default: 1)')
});

const GetFormulaSchema = z.object({
  operation: z.literal('getFormula').describe('Get the formula from a specific cell'),
  documentName: documentNameField,
  sheetName: sheetNameField,
  tableName: tableNameField,
  cellReference: cellReferenceField
});

const SetFormulaSchema = z.object({
  operation: z.literal('setFormula').describe('Set a formula in a specific cell'),
  documentName: documentNameField,
  sheetName: sheetNameField,
  tableName: tableNameField,
  cellReference: cellReferenceField,
  formula: z.string().min(1, 'formula is required').max(5000).describe('Formula to set (include = prefix, e.g., "=SUM(A1:A10)")')
});

// Formatting Operations

const FormatCellSchema = z.object({
  operation: z.literal('formatCell').describe('Format a cell with colors, fonts, and alignment'),
  documentName: documentNameField,
  sheetName: sheetNameField,
  cellReference: cellReferenceField,
  tableName: tableNameField,
  backgroundColor: z.string().max(50).optional().describe('Background color as hex (#RRGGBB) or named color (red, blue, etc.)'),
  textColor: z.string().max(50).optional().describe('Text color as hex (#RRGGBB) or named color (red, blue, etc.)'),
  fontName: z.string().max(200).optional().describe('Font name (e.g., "Arial", "Helvetica Neue")'),
  fontSize: z.number().min(1).max(500).optional().describe('Font size in points'),
  alignment: z.enum(['left', 'right', 'center', 'auto align']).optional().describe('Horizontal alignment'),
  verticalAlignment: z.enum(['top', 'bottom', 'middle']).optional().describe('Vertical alignment'),
  textWrap: z.boolean().optional().describe('Enable or disable text wrapping')
});

const FormatCellsSchema = z.object({
  operation: z.literal('formatCells').describe('Format multiple cells at once (more reliable than formatCell for batch operations)'),
  documentName: documentNameField,
  sheetName: sheetNameField,
  tableName: tableNameField,
  cells: z.array(z.object({
    cellReference: z.string().min(1).max(20).regex(/^[A-Z]{1,3}\d+$/, 'Invalid cell reference format').describe('Cell reference in A1 notation (e.g., "A2")'),
    backgroundColor: z.string().max(50).optional().describe('Background color as hex (#RRGGBB) or named color'),
    textColor: z.string().max(50).optional().describe('Text color as hex (#RRGGBB) or named color'),
    fontName: z.string().max(200).optional().describe('Font name (e.g., "Avenir Next")'),
    fontSize: z.number().min(1).max(500).optional().describe('Font size in points'),
    alignment: z.enum(['left', 'right', 'center', 'auto align']).optional().describe('Horizontal alignment'),
    verticalAlignment: z.enum(['top', 'bottom', 'middle']).optional().describe('Vertical alignment'),
    textWrap: z.boolean().optional().describe('Enable or disable text wrapping')
  })).min(1, 'cells array must not be empty').max(200).describe('Array of cells to format with their respective formatting options')
});

const SetNumberFormatSchema = z.object({
  operation: z.literal('setNumberFormat').describe('Set number format for a cell (currency, percent, etc.)'),
  documentName: documentNameField,
  sheetName: sheetNameField,
  cellReference: cellReferenceField,
  tableName: tableNameField,
  format: z.enum([
    'automatic',
    'currency',
    'percent',
    'number',
    'scientific',
    'fraction',
    'date and time',
    'duration',
    'text',
    'checkbox',
    'rating'
  ]).describe('Number format type')
});

const SetColumnWidthSchema = z.object({
  operation: z.literal('setColumnWidth').describe('Set the width of a column'),
  documentName: documentNameField,
  sheetName: sheetNameField,
  column: z.string().min(1, 'column is required').max(3).regex(/^[A-Z]+$/, 'Column must be uppercase letters (e.g., "A", "AA")').describe('Column letter (e.g., "A", "B", "AA")'),
  width: z.number().min(10, 'width must be at least 10 points').max(2000).describe('Column width in points'),
  tableName: tableNameField
});

const SetRowHeightSchema = z.object({
  operation: z.literal('setRowHeight').describe('Set the height of a row'),
  documentName: documentNameField,
  sheetName: sheetNameField,
  row: z.number().min(1, 'row must be >= 1').describe('Row number'),
  height: z.number().min(10, 'height must be at least 10 points').max(2000).describe('Row height in points'),
  tableName: tableNameField
});

const MergeCellsSchema = z.object({
  operation: z.literal('mergeCells').describe('Merge a range of cells'),
  documentName: documentNameField,
  sheetName: sheetNameField,
  range: rangeField,
  tableName: tableNameField
});

const UnmergeCellsSchema = z.object({
  operation: z.literal('unmergeCells').describe('Unmerge all merged cells in a range'),
  documentName: documentNameField,
  sheetName: sheetNameField,
  range: rangeField,
  tableName: tableNameField
});

export const NumbersArgsSchema = z.discriminatedUnion('operation', [
  ListDocumentsSchema,
  GetDocumentInfoSchema,
  GetTableStructureSchema,
  GetSheetDataSchema,
  UpdateCellSchema,
  AppendRowSchema,
  UpdateRangeSchema,
  FindDataSchema,
  InsertRowsSchema,
  DeleteRowsSchema,
  GetFormulaSchema,
  SetFormulaSchema,
  FormatCellSchema,
  FormatCellsSchema,
  SetNumberFormatSchema,
  SetColumnWidthSchema,
  SetRowHeightSchema,
  MergeCellsSchema,
  UnmergeCellsSchema
]);

export type NumbersArgs = z.infer<typeof NumbersArgsSchema>;
