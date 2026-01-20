import { z } from 'zod';

// Core Operations (Phase 1)

const ListDocumentsSchema = z.object({
  operation: z.literal('listDocuments').describe('List all open Numbers documents')
});

const GetDocumentInfoSchema = z.object({
  operation: z.literal('getDocumentInfo').describe('Get information about a specific Numbers document'),
  documentName: z.string().min(1, 'documentName is required').describe('Name of the Numbers document')
});

const GetTableStructureSchema = z.object({
  operation: z.literal('getTableStructure').describe('Get table structure (headers, footers, data boundaries) - CALL THIS FIRST before adding data!'),
  documentName: z.string().min(1, 'documentName is required').describe('Name of the Numbers document'),
  sheetName: z.string().min(1, 'sheetName is required').describe('Name of the sheet'),
  tableName: z.string().optional().describe('Name of the table (defaults to first table)')
});

const GetSheetDataSchema = z.object({
  operation: z.literal('getSheetData').describe('Read data from a sheet/table in a Numbers document'),
  documentName: z.string().min(1, 'documentName is required').describe('Name of the Numbers document'),
  sheetName: z.string().min(1, 'sheetName is required').describe('Name of the sheet to read from'),
  tableName: z.string().optional().describe('Name of the table (if sheet has multiple tables, defaults to first table)'),
  range: z.string().optional().describe('Cell range in A1 notation (e.g., "A1:C10"). If omitted, returns entire table'),
  includeFormulas: z.boolean().optional().default(false).describe('Return formulas instead of calculated values')
});

const UpdateCellSchema = z.object({
  operation: z.literal('updateCell').describe('Update the value of a single cell'),
  documentName: z.string().min(1, 'documentName is required').describe('Name of the Numbers document'),
  sheetName: z.string().min(1, 'sheetName is required').describe('Name of the sheet'),
  tableName: z.string().optional().describe('Name of the table (defaults to first table)'),
  cellReference: z.string().min(1, 'cellReference is required').describe('Cell reference in A1 notation (e.g., "B5")'),
  value: z.union([z.string(), z.number()]).describe('Value to set in the cell')
});

const AppendRowSchema = z.object({
  operation: z.literal('appendRow').describe('Append a new row to a table'),
  documentName: z.string().min(1, 'documentName is required').describe('Name of the Numbers document'),
  sheetName: z.string().min(1, 'sheetName is required').describe('Name of the sheet'),
  tableName: z.string().optional().describe('Name of the table (defaults to first table)'),
  values: z.array(z.union([z.string(), z.number()])).min(1, 'values array must not be empty').describe('Array of values for each column in the new row'),
  insertPosition: z.enum(['after-headers', 'after-data', 'at-end']).optional().default('after-data').describe('Where to insert: after-headers (row 2), after-data (before footers/summaries, DEFAULT), or at-end (very bottom)')
});

// Advanced Operations (Phase 2) - Will be added later

const UpdateRangeSchema = z.object({
  operation: z.literal('updateRange').describe('Update multiple cells at once with a 2D array of values'),
  documentName: z.string().min(1, 'documentName is required').describe('Name of the Numbers document'),
  sheetName: z.string().min(1, 'sheetName is required').describe('Name of the sheet'),
  tableName: z.string().optional().describe('Name of the table (defaults to first table)'),
  startCell: z.string().min(1, 'startCell is required').describe('Starting cell in A1 notation (e.g., "A1")'),
  values: z.array(z.array(z.union([z.string(), z.number()]))).min(1, 'values array must not be empty').describe('2D array of values (array of rows, each row is an array of cell values)')
});

const FindDataSchema = z.object({
  operation: z.literal('findData').describe('Search for values in a sheet'),
  documentName: z.string().min(1, 'documentName is required').describe('Name of the Numbers document'),
  sheetName: z.string().min(1, 'sheetName is required').describe('Name of the sheet'),
  searchText: z.string().min(1, 'searchText is required').describe('Text to search for in the sheet'),
  column: z.string().optional().describe('Optional: Limit search to specific column (e.g., "A" or column name)')
});

const InsertRowsSchema = z.object({
  operation: z.literal('insertRows').describe('Insert one or more empty rows at a specific position'),
  documentName: z.string().min(1, 'documentName is required').describe('Name of the Numbers document'),
  sheetName: z.string().min(1, 'sheetName is required').describe('Name of the sheet'),
  tableName: z.string().optional().describe('Name of the table (defaults to first table)'),
  afterRow: z.number().min(0, 'afterRow must be >= 0').describe('Insert after this row number (0 to insert at start)'),
  count: z.number().min(1, 'count must be >= 1').optional().default(1).describe('Number of rows to insert (default: 1)')
});

const DeleteRowsSchema = z.object({
  operation: z.literal('deleteRows').describe('Delete one or more rows from a table'),
  documentName: z.string().min(1, 'documentName is required').describe('Name of the Numbers document'),
  sheetName: z.string().min(1, 'sheetName is required').describe('Name of the sheet'),
  tableName: z.string().optional().describe('Name of the table (defaults to first table)'),
  startRow: z.number().min(1, 'startRow must be >= 1').describe('Starting row number to delete'),
  count: z.number().min(1, 'count must be >= 1').optional().default(1).describe('Number of rows to delete (default: 1)')
});

const GetFormulaSchema = z.object({
  operation: z.literal('getFormula').describe('Get the formula from a specific cell'),
  documentName: z.string().min(1, 'documentName is required').describe('Name of the Numbers document'),
  sheetName: z.string().min(1, 'sheetName is required').describe('Name of the sheet'),
  tableName: z.string().optional().describe('Name of the table (defaults to first table)'),
  cellReference: z.string().min(1, 'cellReference is required').describe('Cell reference in A1 notation (e.g., "B5")')
});

const SetFormulaSchema = z.object({
  operation: z.literal('setFormula').describe('Set a formula in a specific cell'),
  documentName: z.string().min(1, 'documentName is required').describe('Name of the Numbers document'),
  sheetName: z.string().min(1, 'sheetName is required').describe('Name of the sheet'),
  tableName: z.string().optional().describe('Name of the table (defaults to first table)'),
  cellReference: z.string().min(1, 'cellReference is required').describe('Cell reference in A1 notation (e.g., "B5")'),
  formula: z.string().min(1, 'formula is required').describe('Formula to set (include = prefix, e.g., "=SUM(A1:A10)")')
});

// Formatting Operations

const FormatCellSchema = z.object({
  operation: z.literal('formatCell').describe('Format a cell with colors, fonts, and alignment'),
  documentName: z.string().min(1, 'documentName is required').describe('Name of the Numbers document'),
  sheetName: z.string().min(1, 'sheetName is required').describe('Name of the sheet'),
  cellReference: z.string().min(1, 'cellReference is required').describe('Cell reference in A1 notation (e.g., "B5")'),
  tableName: z.string().optional().describe('Name of the table (defaults to first table)'),
  backgroundColor: z.string().optional().describe('Background color as hex (#RRGGBB) or named color (red, blue, etc.)'),
  textColor: z.string().optional().describe('Text color as hex (#RRGGBB) or named color (red, blue, etc.)'),
  fontName: z.string().optional().describe('Font name (e.g., "Arial", "Helvetica Neue")'),
  fontSize: z.number().optional().describe('Font size in points'),
  alignment: z.enum(['left', 'right', 'center', 'auto align']).optional().describe('Horizontal alignment'),
  verticalAlignment: z.enum(['top', 'bottom', 'middle']).optional().describe('Vertical alignment'),
  textWrap: z.boolean().optional().describe('Enable or disable text wrapping')
});

const SetNumberFormatSchema = z.object({
  operation: z.literal('setNumberFormat').describe('Set number format for a cell (currency, percent, etc.)'),
  documentName: z.string().min(1, 'documentName is required').describe('Name of the Numbers document'),
  sheetName: z.string().min(1, 'sheetName is required').describe('Name of the sheet'),
  cellReference: z.string().min(1, 'cellReference is required').describe('Cell reference in A1 notation (e.g., "B5")'),
  tableName: z.string().optional().describe('Name of the table (defaults to first table)'),
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
  documentName: z.string().min(1, 'documentName is required').describe('Name of the Numbers document'),
  sheetName: z.string().min(1, 'sheetName is required').describe('Name of the sheet'),
  column: z.string().min(1, 'column is required').describe('Column letter (e.g., "A", "B", "AA")'),
  width: z.number().min(10, 'width must be at least 10 points').describe('Column width in points'),
  tableName: z.string().optional().describe('Name of the table (defaults to first table)')
});

const SetRowHeightSchema = z.object({
  operation: z.literal('setRowHeight').describe('Set the height of a row'),
  documentName: z.string().min(1, 'documentName is required').describe('Name of the Numbers document'),
  sheetName: z.string().min(1, 'sheetName is required').describe('Name of the sheet'),
  row: z.number().min(1, 'row must be >= 1').describe('Row number'),
  height: z.number().min(10, 'height must be at least 10 points').describe('Row height in points'),
  tableName: z.string().optional().describe('Name of the table (defaults to first table)')
});

const MergeCellsSchema = z.object({
  operation: z.literal('mergeCells').describe('Merge a range of cells'),
  documentName: z.string().min(1, 'documentName is required').describe('Name of the Numbers document'),
  sheetName: z.string().min(1, 'sheetName is required').describe('Name of the sheet'),
  range: z.string().min(1, 'range is required').describe('Cell range in A1 notation (e.g., "A1:B2")'),
  tableName: z.string().optional().describe('Name of the table (defaults to first table)')
});

const UnmergeCellsSchema = z.object({
  operation: z.literal('unmergeCells').describe('Unmerge all merged cells in a range'),
  documentName: z.string().min(1, 'documentName is required').describe('Name of the Numbers document'),
  sheetName: z.string().min(1, 'sheetName is required').describe('Name of the sheet'),
  range: z.string().min(1, 'range is required').describe('Cell range in A1 notation (e.g., "A1:B2")'),
  tableName: z.string().optional().describe('Name of the table (defaults to first table)')
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
  SetNumberFormatSchema,
  SetColumnWidthSchema,
  SetRowHeightSchema,
  MergeCellsSchema,
  UnmergeCellsSchema
]);

export type NumbersArgs = z.infer<typeof NumbersArgsSchema>;
