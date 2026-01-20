import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { NumbersArgsSchema } from '../schemas/numbers.schema.js';
import { createToolSchema } from '../utils/schema-helper.js';
import numbersUtil from '../utils/numbers.js';
import type { TableData, CellMatch } from '../utils/numbers.js';

export const NUMBERS_TOOL: Tool = {
  name: 'numbers',
  description: `Read and write data in Apple Numbers spreadsheets with intelligent table structure awareness.

IMPORTANT USAGE PATTERNS:
1. ALWAYS call getTableStructure FIRST before adding data to understand:
   - Where headers end (dataStartRow tells you where data begins)
   - Where footers begin (dataEndRow tells you where data ends)
   - Proper insertion points to avoid breaking document structure

2. When adding data with appendRow:
   - Use insertPosition='after-headers' (DEFAULT) to add data RIGHT AFTER the header row (typically row 2)
     → Best for: building datasets from scratch, adding data that should start at the top
   - Use insertPosition='after-data' to append to the END of the data section BEFORE footers
     → Best for: appending to logs/lists, adding entries where newest should be at bottom
   - Use insertPosition='at-end' to add footer/summary rows ONLY
     → Rarely used, adds after all content including footers

3. Document structure (typical):
   - Row 1: Headers
   - Rows 2-N: Data
   - Rows N+1 onwards: Footers/summaries (if any)

4. When formatting cells:
   - Use formatCells (RECOMMENDED) to format multiple cells in a single atomic operation
     → More reliable, faster, and prevents partial failures
     → Example: Format all header cells with colors and fonts at once
   - Use formatCell only for single cell formatting operations

Supports: table structure analysis, reading/writing data, searching, row manipulation, formula operations,
and comprehensive formatting (colors, fonts, alignment, number formats, column widths, row heights, cell merging).

Documents must be open in Numbers to access them.`,
  inputSchema: createToolSchema(NumbersArgsSchema)
};

/**
 * Format table data as a markdown table
 */
function formatTableAsMarkdown(data: TableData): string {
  if (data.rows.length === 0 && data.headers.length === 0) {
    return 'Empty table';
  }

  const headers = data.headers.map((h: any) => String(h ?? ''));
  const headerRow = `| ${headers.join(' | ')} |`;
  const separator = `| ${headers.map(() => '---').join(' | ')} |`;

  const dataRows = data.rows.map((row: any[]) => {
    const cells = row.map(cell => String(cell ?? ''));
    return `| ${cells.join(' | ')} |`;
  });

  return [headerRow, separator, ...dataRows].join('\n');
}

export async function handleNumbers(args: unknown) {
  const parsed = NumbersArgsSchema.parse(args);

  try {
    switch (parsed.operation) {
      case 'listDocuments': {
        const docs = await numbersUtil.listDocuments();

        if (docs.length === 0) {
          return {
            content: [{
              type: 'text' as const,
              text: 'No Numbers documents are currently open. Please open a Numbers document first.'
            }],
            isError: false
          };
        }

        const docsList = docs.map((doc, idx) => {
          const sheetsInfo = doc.sheets.map(sheet => {
            const tablesList = sheet.tables.length > 0 ? ` (${sheet.tables.join(', ')})` : '';
            return `    - ${sheet.name}${tablesList}`;
          }).join('\n');
          return `${idx + 1}. **${doc.name}**${doc.modified ? ' (modified)' : ''}\n${sheetsInfo}`;
        }).join('\n\n');

        return {
          content: [{
            type: 'text' as const,
            text: `Found ${docs.length} Numbers document${docs.length !== 1 ? 's' : ''}:\n\n${docsList}`
          }],
          isError: false
        };
      }

      case 'getDocumentInfo': {
        const docInfo = await numbersUtil.getDocumentInfo(parsed.documentName);

        const sheetsInfo = docInfo.sheets.map((sheet: any) => {
          const tablesList = sheet.tables.length > 0 ? `\n    Tables: ${sheet.tables.join(', ')}` : '';
          return `  - **${sheet.name}**${tablesList}`;
        }).join('\n');

        return {
          content: [{
            type: 'text' as const,
            text: `## Document: ${docInfo.name}\n\n**Modified:** ${docInfo.modified ? 'Yes' : 'No'}\n\n**Sheets:**\n${sheetsInfo}`
          }],
          isError: false
        };
      }

      case 'getTableStructure': {
        const structure = await numbersUtil.getTableStructure(
          parsed.documentName,
          parsed.sheetName,
          parsed.tableName
        );

        return {
          content: [{
            type: 'text' as const,
            text: `## Table Structure: ${structure.tableName}\n\n` +
                  `**Total Rows:** ${structure.totalRows} | **Total Columns:** ${structure.totalColumns}\n` +
                  `**Header Rows:** ${structure.headerRowCount} | **Footer Rows:** ${structure.footerRowCount}\n` +
                  `**Headers Frozen:** ${structure.headersFrozen ? 'Yes' : 'No'}\n\n` +
                  `**Data Section:**\n` +
                  `- Starts at row ${structure.dataStartRow} (first data row after headers)\n` +
                  `- Ends at row ${structure.dataEndRow} (last data row before footers)\n\n` +
                  `**💡 Tip:** Use \`insertPosition='after-headers'\` to add data at row ${structure.dataStartRow}, ` +
                  `or \`insertPosition='after-data'\` to append at row ${structure.dataEndRow + 1}.`
          }],
          isError: false
        };
      }

      case 'getSheetData': {
        const data = await numbersUtil.getSheetData(
          parsed.documentName,
          parsed.sheetName,
          parsed.tableName,
          parsed.range,
          parsed.includeFormulas
        );

        const formattedTable = formatTableAsMarkdown(data);
        const rangeInfo = parsed.range ? ` (range: ${parsed.range})` : '';
        const tableInfo = parsed.tableName ? ` - Table: "${parsed.tableName}"` : '';

        return {
          content: [{
            type: 'text' as const,
            text: `## Sheet: "${parsed.sheetName}" from "${parsed.documentName}"${tableInfo}${rangeInfo}\n\n${formattedTable}\n\n**Rows:** ${data.rowCount} | **Columns:** ${data.columnCount}`
          }],
          isError: false
        };
      }

      case 'updateCell': {
        const result = await numbersUtil.updateCell(
          parsed.documentName,
          parsed.sheetName,
          parsed.cellReference,
          parsed.value,
          parsed.tableName
        );

        return {
          content: [{
            type: 'text' as const,
            text: result.message
          }],
          isError: !result.success
        };
      }

      case 'appendRow': {
        const result = await numbersUtil.appendRow(
          parsed.documentName,
          parsed.sheetName,
          parsed.values,
          parsed.tableName,
          parsed.insertPosition
        );

        return {
          content: [{
            type: 'text' as const,
            text: result.message
          }],
          isError: !result.success
        };
      }

      case 'updateRange': {
        const result = await numbersUtil.updateRange(
          parsed.documentName,
          parsed.sheetName,
          parsed.startCell,
          parsed.values,
          parsed.tableName
        );

        return {
          content: [{
            type: 'text' as const,
            text: result.message
          }],
          isError: !result.success
        };
      }

      case 'findData': {
        const matches = await numbersUtil.findData(
          parsed.documentName,
          parsed.sheetName,
          parsed.searchText,
          parsed.column
        );

        if (matches.length === 0) {
          const columnInfo = parsed.column ? ` in column "${parsed.column}"` : '';
          return {
            content: [{
              type: 'text' as const,
              text: `No matches found for "${parsed.searchText}"${columnInfo} in sheet "${parsed.sheetName}".`
            }],
            isError: false
          };
        }

        const matchesList = matches.map((match, idx) => {
          return `${idx + 1}. **${match.cellReference}**: ${match.value}`;
        }).join('\n');

        const columnInfo = parsed.column ? ` (column: "${parsed.column}")` : '';
        return {
          content: [{
            type: 'text' as const,
            text: `Found ${matches.length} match${matches.length !== 1 ? 'es' : ''} for "${parsed.searchText}"${columnInfo}:\n\n${matchesList}`
          }],
          isError: false
        };
      }

      case 'insertRows': {
        const result = await numbersUtil.insertRows(
          parsed.documentName,
          parsed.sheetName,
          parsed.afterRow,
          parsed.count ?? 1,
          parsed.tableName
        );

        return {
          content: [{
            type: 'text' as const,
            text: result.message
          }],
          isError: !result.success
        };
      }

      case 'deleteRows': {
        const result = await numbersUtil.deleteRows(
          parsed.documentName,
          parsed.sheetName,
          parsed.startRow,
          parsed.count ?? 1,
          parsed.tableName
        );

        return {
          content: [{
            type: 'text' as const,
            text: result.message
          }],
          isError: !result.success
        };
      }

      case 'getFormula': {
        const formula = await numbersUtil.getFormula(
          parsed.documentName,
          parsed.sheetName,
          parsed.cellReference,
          parsed.tableName
        );

        return {
          content: [{
            type: 'text' as const,
            text: `**Cell ${parsed.cellReference}:**\n${formula}`
          }],
          isError: false
        };
      }

      case 'setFormula': {
        const result = await numbersUtil.setFormula(
          parsed.documentName,
          parsed.sheetName,
          parsed.cellReference,
          parsed.formula,
          parsed.tableName
        );

        return {
          content: [{
            type: 'text' as const,
            text: result.message
          }],
          isError: !result.success
        };
      }

      case 'formatCell': {
        const result = await numbersUtil.formatCell(
          parsed.documentName,
          parsed.sheetName,
          parsed.cellReference,
          {
            backgroundColor: parsed.backgroundColor,
            textColor: parsed.textColor,
            fontName: parsed.fontName,
            fontSize: parsed.fontSize,
            alignment: parsed.alignment,
            verticalAlignment: parsed.verticalAlignment,
            textWrap: parsed.textWrap
          },
          parsed.tableName
        );

        return {
          content: [{
            type: 'text' as const,
            text: result.message
          }],
          isError: !result.success
        };
      }

      case 'formatCells': {
        const result = await numbersUtil.formatCells(
          parsed.documentName,
          parsed.sheetName,
          parsed.cells,
          parsed.tableName
        );

        return {
          content: [{
            type: 'text' as const,
            text: result.message
          }],
          isError: !result.success
        };
      }

      case 'setNumberFormat': {
        const result = await numbersUtil.setNumberFormat(
          parsed.documentName,
          parsed.sheetName,
          parsed.cellReference,
          parsed.format,
          parsed.tableName
        );

        return {
          content: [{
            type: 'text' as const,
            text: result.message
          }],
          isError: !result.success
        };
      }

      case 'setColumnWidth': {
        const result = await numbersUtil.setColumnWidth(
          parsed.documentName,
          parsed.sheetName,
          parsed.column,
          parsed.width,
          parsed.tableName
        );

        return {
          content: [{
            type: 'text' as const,
            text: result.message
          }],
          isError: !result.success
        };
      }

      case 'setRowHeight': {
        const result = await numbersUtil.setRowHeight(
          parsed.documentName,
          parsed.sheetName,
          parsed.row,
          parsed.height,
          parsed.tableName
        );

        return {
          content: [{
            type: 'text' as const,
            text: result.message
          }],
          isError: !result.success
        };
      }

      case 'mergeCells': {
        const result = await numbersUtil.mergeCells(
          parsed.documentName,
          parsed.sheetName,
          parsed.range,
          parsed.tableName
        );

        return {
          content: [{
            type: 'text' as const,
            text: result.message
          }],
          isError: !result.success
        };
      }

      case 'unmergeCells': {
        const result = await numbersUtil.unmergeCells(
          parsed.documentName,
          parsed.sheetName,
          parsed.range,
          parsed.tableName
        );

        return {
          content: [{
            type: 'text' as const,
            text: result.message
          }],
          isError: !result.success
        };
      }

      default:
        return {
          content: [{
            type: 'text' as const,
            text: 'Unknown operation'
          }],
          isError: true
        };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Provide helpful context for common errors
    let helpText = '';
    if (errorMessage.includes('not found')) {
      helpText = '\n\n**Tip:** Make sure the Numbers document is open and the names match exactly (case-sensitive).';
    } else if (errorMessage.includes('Invalid cell reference')) {
      helpText = '\n\n**Tip:** Use A1 notation for cell references (e.g., "A1", "B5", "AA10").';
    } else if (errorMessage.includes('Invalid range')) {
      helpText = '\n\n**Tip:** Use range notation like "A1:C10" to specify a range of cells.';
    }

    return {
      content: [{
        type: 'text' as const,
        text: `Error: ${errorMessage}${helpText}`
      }],
      isError: true
    };
  }
}
