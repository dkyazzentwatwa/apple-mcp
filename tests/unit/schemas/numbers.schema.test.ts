import { describe, it, expect } from 'vitest';
import { NumbersArgsSchema } from '../../../src/schemas/numbers.schema.js';

describe('NumbersArgsSchema', () => {
  describe('listDocuments operation', () => {
    it('should accept listDocuments operation', () => {
      const result = NumbersArgsSchema.safeParse({ operation: 'listDocuments' });
      expect(result.success).toBe(true);
    });
  });

  describe('getDocumentInfo operation', () => {
    it('should accept getDocumentInfo with documentName', () => {
      const result = NumbersArgsSchema.safeParse({
        operation: 'getDocumentInfo',
        documentName: 'Budget 2024'
      });
      expect(result.success).toBe(true);
    });

    it('should reject getDocumentInfo without documentName', () => {
      const result = NumbersArgsSchema.safeParse({ operation: 'getDocumentInfo' });
      expect(result.success).toBe(false);
    });

    it('should reject getDocumentInfo with empty documentName', () => {
      const result = NumbersArgsSchema.safeParse({
        operation: 'getDocumentInfo',
        documentName: ''
      });
      expect(result.success).toBe(false);
    });
  });

  describe('getSheetData operation', () => {
    it('should accept getSheetData with required parameters', () => {
      const result = NumbersArgsSchema.safeParse({
        operation: 'getSheetData',
        documentName: 'Budget 2024',
        sheetName: 'Monthly'
      });
      expect(result.success).toBe(true);
    });

    it('should accept getSheetData with optional tableName', () => {
      const result = NumbersArgsSchema.safeParse({
        operation: 'getSheetData',
        documentName: 'Budget 2024',
        sheetName: 'Monthly',
        tableName: 'Table 1'
      });
      expect(result.success).toBe(true);
    });

    it('should accept getSheetData with range parameter', () => {
      const result = NumbersArgsSchema.safeParse({
        operation: 'getSheetData',
        documentName: 'Budget 2024',
        sheetName: 'Monthly',
        range: 'A1:C10'
      });
      expect(result.success).toBe(true);
    });

    it('should accept getSheetData with includeFormulas parameter', () => {
      const result = NumbersArgsSchema.safeParse({
        operation: 'getSheetData',
        documentName: 'Budget 2024',
        sheetName: 'Monthly',
        includeFormulas: true
      });
      expect(result.success).toBe(true);
    });

    it('should accept getSheetData with all optional parameters', () => {
      const result = NumbersArgsSchema.safeParse({
        operation: 'getSheetData',
        documentName: 'Budget 2024',
        sheetName: 'Monthly',
        tableName: 'Table 1',
        range: 'A1:C10',
        includeFormulas: true
      });
      expect(result.success).toBe(true);
    });

    it('should reject getSheetData without documentName', () => {
      const result = NumbersArgsSchema.safeParse({
        operation: 'getSheetData',
        sheetName: 'Monthly'
      });
      expect(result.success).toBe(false);
    });

    it('should reject getSheetData without sheetName', () => {
      const result = NumbersArgsSchema.safeParse({
        operation: 'getSheetData',
        documentName: 'Budget 2024'
      });
      expect(result.success).toBe(false);
    });
  });

  describe('updateCell operation', () => {
    it('should accept updateCell with string value', () => {
      const result = NumbersArgsSchema.safeParse({
        operation: 'updateCell',
        documentName: 'Budget 2024',
        sheetName: 'Monthly',
        cellReference: 'A1',
        value: 'Hello'
      });
      expect(result.success).toBe(true);
    });

    it('should accept updateCell with number value', () => {
      const result = NumbersArgsSchema.safeParse({
        operation: 'updateCell',
        documentName: 'Budget 2024',
        sheetName: 'Monthly',
        cellReference: 'B5',
        value: 42.5
      });
      expect(result.success).toBe(true);
    });

    it('should accept updateCell with optional tableName', () => {
      const result = NumbersArgsSchema.safeParse({
        operation: 'updateCell',
        documentName: 'Budget 2024',
        sheetName: 'Monthly',
        tableName: 'Table 1',
        cellReference: 'A1',
        value: 'Hello'
      });
      expect(result.success).toBe(true);
    });

    it('should reject updateCell without cellReference', () => {
      const result = NumbersArgsSchema.safeParse({
        operation: 'updateCell',
        documentName: 'Budget 2024',
        sheetName: 'Monthly',
        value: 42
      });
      expect(result.success).toBe(false);
    });

    it('should reject updateCell without value', () => {
      const result = NumbersArgsSchema.safeParse({
        operation: 'updateCell',
        documentName: 'Budget 2024',
        sheetName: 'Monthly',
        cellReference: 'A1'
      });
      expect(result.success).toBe(false);
    });
  });

  describe('appendRow operation', () => {
    it('should accept appendRow with values array', () => {
      const result = NumbersArgsSchema.safeParse({
        operation: 'appendRow',
        documentName: 'Budget 2024',
        sheetName: 'Monthly',
        values: ['2024-01-15', 'Food', 45.50]
      });
      expect(result.success).toBe(true);
    });

    it('should accept appendRow with optional tableName', () => {
      const result = NumbersArgsSchema.safeParse({
        operation: 'appendRow',
        documentName: 'Budget 2024',
        sheetName: 'Monthly',
        tableName: 'Table 1',
        values: ['2024-01-15', 'Food', 45.50]
      });
      expect(result.success).toBe(true);
    });

    it('should accept appendRow with mixed string and number values', () => {
      const result = NumbersArgsSchema.safeParse({
        operation: 'appendRow',
        documentName: 'Budget 2024',
        sheetName: 'Monthly',
        values: ['Text', 123, 'More text', 456.78]
      });
      expect(result.success).toBe(true);
    });

    it('should reject appendRow with empty values array', () => {
      const result = NumbersArgsSchema.safeParse({
        operation: 'appendRow',
        documentName: 'Budget 2024',
        sheetName: 'Monthly',
        values: []
      });
      expect(result.success).toBe(false);
    });

    it('should reject appendRow without values', () => {
      const result = NumbersArgsSchema.safeParse({
        operation: 'appendRow',
        documentName: 'Budget 2024',
        sheetName: 'Monthly'
      });
      expect(result.success).toBe(false);
    });
  });

  describe('updateRange operation', () => {
    it('should accept updateRange with 2D array of values', () => {
      const result = NumbersArgsSchema.safeParse({
        operation: 'updateRange',
        documentName: 'Budget 2024',
        sheetName: 'Monthly',
        startCell: 'A1',
        values: [
          ['Header1', 'Header2', 'Header3'],
          ['Row1Col1', 'Row1Col2', 'Row1Col3'],
          ['Row2Col1', 'Row2Col2', 'Row2Col3']
        ]
      });
      expect(result.success).toBe(true);
    });

    it('should accept updateRange with mixed value types', () => {
      const result = NumbersArgsSchema.safeParse({
        operation: 'updateRange',
        documentName: 'Budget 2024',
        sheetName: 'Monthly',
        startCell: 'B2',
        values: [
          ['Text', 123],
          [456, 'More text']
        ]
      });
      expect(result.success).toBe(true);
    });

    it('should reject updateRange with empty values array', () => {
      const result = NumbersArgsSchema.safeParse({
        operation: 'updateRange',
        documentName: 'Budget 2024',
        sheetName: 'Monthly',
        startCell: 'A1',
        values: []
      });
      expect(result.success).toBe(false);
    });

    it('should reject updateRange without startCell', () => {
      const result = NumbersArgsSchema.safeParse({
        operation: 'updateRange',
        documentName: 'Budget 2024',
        sheetName: 'Monthly',
        values: [['data']]
      });
      expect(result.success).toBe(false);
    });
  });

  describe('findData operation', () => {
    it('should accept findData with required parameters', () => {
      const result = NumbersArgsSchema.safeParse({
        operation: 'findData',
        documentName: 'Budget 2024',
        sheetName: 'Monthly',
        searchText: 'Food'
      });
      expect(result.success).toBe(true);
    });

    it('should accept findData with optional column parameter', () => {
      const result = NumbersArgsSchema.safeParse({
        operation: 'findData',
        documentName: 'Budget 2024',
        sheetName: 'Monthly',
        searchText: 'Food',
        column: 'Category'
      });
      expect(result.success).toBe(true);
    });

    it('should reject findData without searchText', () => {
      const result = NumbersArgsSchema.safeParse({
        operation: 'findData',
        documentName: 'Budget 2024',
        sheetName: 'Monthly'
      });
      expect(result.success).toBe(false);
    });
  });

  describe('insertRows operation', () => {
    it('should accept insertRows with required parameters', () => {
      const result = NumbersArgsSchema.safeParse({
        operation: 'insertRows',
        documentName: 'Budget 2024',
        sheetName: 'Monthly',
        afterRow: 2
      });
      expect(result.success).toBe(true);
    });

    it('should accept insertRows with count parameter', () => {
      const result = NumbersArgsSchema.safeParse({
        operation: 'insertRows',
        documentName: 'Budget 2024',
        sheetName: 'Monthly',
        afterRow: 2,
        count: 3
      });
      expect(result.success).toBe(true);
    });

    it('should accept insertRows with afterRow=0 (insert at start)', () => {
      const result = NumbersArgsSchema.safeParse({
        operation: 'insertRows',
        documentName: 'Budget 2024',
        sheetName: 'Monthly',
        afterRow: 0
      });
      expect(result.success).toBe(true);
    });

    it('should reject insertRows with negative afterRow', () => {
      const result = NumbersArgsSchema.safeParse({
        operation: 'insertRows',
        documentName: 'Budget 2024',
        sheetName: 'Monthly',
        afterRow: -1
      });
      expect(result.success).toBe(false);
    });

    it('should reject insertRows with count < 1', () => {
      const result = NumbersArgsSchema.safeParse({
        operation: 'insertRows',
        documentName: 'Budget 2024',
        sheetName: 'Monthly',
        afterRow: 2,
        count: 0
      });
      expect(result.success).toBe(false);
    });
  });

  describe('deleteRows operation', () => {
    it('should accept deleteRows with required parameters', () => {
      const result = NumbersArgsSchema.safeParse({
        operation: 'deleteRows',
        documentName: 'Budget 2024',
        sheetName: 'Monthly',
        startRow: 3
      });
      expect(result.success).toBe(true);
    });

    it('should accept deleteRows with count parameter', () => {
      const result = NumbersArgsSchema.safeParse({
        operation: 'deleteRows',
        documentName: 'Budget 2024',
        sheetName: 'Monthly',
        startRow: 3,
        count: 2
      });
      expect(result.success).toBe(true);
    });

    it('should reject deleteRows with startRow < 1', () => {
      const result = NumbersArgsSchema.safeParse({
        operation: 'deleteRows',
        documentName: 'Budget 2024',
        sheetName: 'Monthly',
        startRow: 0
      });
      expect(result.success).toBe(false);
    });

    it('should reject deleteRows with count < 1', () => {
      const result = NumbersArgsSchema.safeParse({
        operation: 'deleteRows',
        documentName: 'Budget 2024',
        sheetName: 'Monthly',
        startRow: 3,
        count: 0
      });
      expect(result.success).toBe(false);
    });
  });

  describe('getFormula operation', () => {
    it('should accept getFormula with required parameters', () => {
      const result = NumbersArgsSchema.safeParse({
        operation: 'getFormula',
        documentName: 'Budget 2024',
        sheetName: 'Monthly',
        cellReference: 'D5'
      });
      expect(result.success).toBe(true);
    });

    it('should accept getFormula with optional tableName', () => {
      const result = NumbersArgsSchema.safeParse({
        operation: 'getFormula',
        documentName: 'Budget 2024',
        sheetName: 'Monthly',
        tableName: 'Table 1',
        cellReference: 'D5'
      });
      expect(result.success).toBe(true);
    });

    it('should reject getFormula without cellReference', () => {
      const result = NumbersArgsSchema.safeParse({
        operation: 'getFormula',
        documentName: 'Budget 2024',
        sheetName: 'Monthly'
      });
      expect(result.success).toBe(false);
    });
  });

  describe('setFormula operation', () => {
    it('should accept setFormula with required parameters', () => {
      const result = NumbersArgsSchema.safeParse({
        operation: 'setFormula',
        documentName: 'Budget 2024',
        sheetName: 'Monthly',
        cellReference: 'D5',
        formula: '=SUM(A1:A10)'
      });
      expect(result.success).toBe(true);
    });

    it('should accept setFormula with optional tableName', () => {
      const result = NumbersArgsSchema.safeParse({
        operation: 'setFormula',
        documentName: 'Budget 2024',
        sheetName: 'Monthly',
        tableName: 'Table 1',
        cellReference: 'D5',
        formula: '=AVERAGE(B2:B20)'
      });
      expect(result.success).toBe(true);
    });

    it('should reject setFormula without formula', () => {
      const result = NumbersArgsSchema.safeParse({
        operation: 'setFormula',
        documentName: 'Budget 2024',
        sheetName: 'Monthly',
        cellReference: 'D5'
      });
      expect(result.success).toBe(false);
    });

    it('should reject setFormula with empty formula', () => {
      const result = NumbersArgsSchema.safeParse({
        operation: 'setFormula',
        documentName: 'Budget 2024',
        sheetName: 'Monthly',
        cellReference: 'D5',
        formula: ''
      });
      expect(result.success).toBe(false);
    });
  });

  describe('formatCell operation', () => {
    it('should accept formatCell with required parameters only', () => {
      const result = NumbersArgsSchema.safeParse({
        operation: 'formatCell',
        documentName: 'Budget 2024',
        sheetName: 'Monthly',
        cellReference: 'A1'
      });
      expect(result.success).toBe(true);
    });

    it('should accept formatCell with backgroundColor', () => {
      const result = NumbersArgsSchema.safeParse({
        operation: 'formatCell',
        documentName: 'Budget 2024',
        sheetName: 'Monthly',
        cellReference: 'A1',
        backgroundColor: '#FF0000'
      });
      expect(result.success).toBe(true);
    });

    it('should accept formatCell with named color', () => {
      const result = NumbersArgsSchema.safeParse({
        operation: 'formatCell',
        documentName: 'Budget 2024',
        sheetName: 'Monthly',
        cellReference: 'A1',
        backgroundColor: 'red',
        textColor: 'white'
      });
      expect(result.success).toBe(true);
    });

    it('should accept formatCell with font properties', () => {
      const result = NumbersArgsSchema.safeParse({
        operation: 'formatCell',
        documentName: 'Budget 2024',
        sheetName: 'Monthly',
        cellReference: 'A1',
        fontName: 'Arial',
        fontSize: 14
      });
      expect(result.success).toBe(true);
    });

    it('should accept formatCell with alignment', () => {
      const result = NumbersArgsSchema.safeParse({
        operation: 'formatCell',
        documentName: 'Budget 2024',
        sheetName: 'Monthly',
        cellReference: 'A1',
        alignment: 'center',
        verticalAlignment: 'middle'
      });
      expect(result.success).toBe(true);
    });

    it('should reject formatCell with invalid alignment', () => {
      const result = NumbersArgsSchema.safeParse({
        operation: 'formatCell',
        documentName: 'Budget 2024',
        sheetName: 'Monthly',
        cellReference: 'A1',
        alignment: 'invalid'
      });
      expect(result.success).toBe(false);
    });
  });

  describe('setNumberFormat operation', () => {
    it('should accept setNumberFormat with currency format', () => {
      const result = NumbersArgsSchema.safeParse({
        operation: 'setNumberFormat',
        documentName: 'Budget 2024',
        sheetName: 'Monthly',
        cellReference: 'A1',
        format: 'currency'
      });
      expect(result.success).toBe(true);
    });

    it('should accept setNumberFormat with percent format', () => {
      const result = NumbersArgsSchema.safeParse({
        operation: 'setNumberFormat',
        documentName: 'Budget 2024',
        sheetName: 'Monthly',
        cellReference: 'A1',
        format: 'percent'
      });
      expect(result.success).toBe(true);
    });

    it('should accept all valid format types', () => {
      const formats = [
        'automatic', 'currency', 'percent', 'number', 'scientific',
        'fraction', 'date and time', 'duration', 'text', 'checkbox', 'rating'
      ];

      formats.forEach(format => {
        const result = NumbersArgsSchema.safeParse({
          operation: 'setNumberFormat',
          documentName: 'Budget 2024',
          sheetName: 'Monthly',
          cellReference: 'A1',
          format
        });
        expect(result.success).toBe(true);
      });
    });

    it('should reject setNumberFormat with invalid format', () => {
      const result = NumbersArgsSchema.safeParse({
        operation: 'setNumberFormat',
        documentName: 'Budget 2024',
        sheetName: 'Monthly',
        cellReference: 'A1',
        format: 'invalid'
      });
      expect(result.success).toBe(false);
    });

    it('should reject setNumberFormat without format', () => {
      const result = NumbersArgsSchema.safeParse({
        operation: 'setNumberFormat',
        documentName: 'Budget 2024',
        sheetName: 'Monthly',
        cellReference: 'A1'
      });
      expect(result.success).toBe(false);
    });
  });

  describe('setColumnWidth operation', () => {
    it('should accept setColumnWidth with required parameters', () => {
      const result = NumbersArgsSchema.safeParse({
        operation: 'setColumnWidth',
        documentName: 'Budget 2024',
        sheetName: 'Monthly',
        column: 'A',
        width: 100
      });
      expect(result.success).toBe(true);
    });

    it('should accept setColumnWidth with multi-letter column', () => {
      const result = NumbersArgsSchema.safeParse({
        operation: 'setColumnWidth',
        documentName: 'Budget 2024',
        sheetName: 'Monthly',
        column: 'AA',
        width: 150
      });
      expect(result.success).toBe(true);
    });

    it('should reject setColumnWidth with width < 10', () => {
      const result = NumbersArgsSchema.safeParse({
        operation: 'setColumnWidth',
        documentName: 'Budget 2024',
        sheetName: 'Monthly',
        column: 'A',
        width: 5
      });
      expect(result.success).toBe(false);
    });

    it('should reject setColumnWidth without column', () => {
      const result = NumbersArgsSchema.safeParse({
        operation: 'setColumnWidth',
        documentName: 'Budget 2024',
        sheetName: 'Monthly',
        width: 100
      });
      expect(result.success).toBe(false);
    });
  });

  describe('setRowHeight operation', () => {
    it('should accept setRowHeight with required parameters', () => {
      const result = NumbersArgsSchema.safeParse({
        operation: 'setRowHeight',
        documentName: 'Budget 2024',
        sheetName: 'Monthly',
        row: 1,
        height: 30
      });
      expect(result.success).toBe(true);
    });

    it('should reject setRowHeight with row < 1', () => {
      const result = NumbersArgsSchema.safeParse({
        operation: 'setRowHeight',
        documentName: 'Budget 2024',
        sheetName: 'Monthly',
        row: 0,
        height: 30
      });
      expect(result.success).toBe(false);
    });

    it('should reject setRowHeight with height < 10', () => {
      const result = NumbersArgsSchema.safeParse({
        operation: 'setRowHeight',
        documentName: 'Budget 2024',
        sheetName: 'Monthly',
        row: 1,
        height: 5
      });
      expect(result.success).toBe(false);
    });
  });

  describe('mergeCells operation', () => {
    it('should accept mergeCells with required parameters', () => {
      const result = NumbersArgsSchema.safeParse({
        operation: 'mergeCells',
        documentName: 'Budget 2024',
        sheetName: 'Monthly',
        range: 'A1:B2'
      });
      expect(result.success).toBe(true);
    });

    it('should accept mergeCells with tableName', () => {
      const result = NumbersArgsSchema.safeParse({
        operation: 'mergeCells',
        documentName: 'Budget 2024',
        sheetName: 'Monthly',
        range: 'A1:B2',
        tableName: 'Table 1'
      });
      expect(result.success).toBe(true);
    });

    it('should reject mergeCells without range', () => {
      const result = NumbersArgsSchema.safeParse({
        operation: 'mergeCells',
        documentName: 'Budget 2024',
        sheetName: 'Monthly'
      });
      expect(result.success).toBe(false);
    });
  });

  describe('unmergeCells operation', () => {
    it('should accept unmergeCells with required parameters', () => {
      const result = NumbersArgsSchema.safeParse({
        operation: 'unmergeCells',
        documentName: 'Budget 2024',
        sheetName: 'Monthly',
        range: 'A1:B2'
      });
      expect(result.success).toBe(true);
    });

    it('should accept unmergeCells with tableName', () => {
      const result = NumbersArgsSchema.safeParse({
        operation: 'unmergeCells',
        documentName: 'Budget 2024',
        sheetName: 'Monthly',
        range: 'A1:B2',
        tableName: 'Table 1'
      });
      expect(result.success).toBe(true);
    });

    it('should reject unmergeCells without range', () => {
      const result = NumbersArgsSchema.safeParse({
        operation: 'unmergeCells',
        documentName: 'Budget 2024',
        sheetName: 'Monthly'
      });
      expect(result.success).toBe(false);
    });
  });

  describe('invalid operations', () => {
    it('should reject unknown operation', () => {
      const result = NumbersArgsSchema.safeParse({ operation: 'deleteDocument' });
      expect(result.success).toBe(false);
    });

    it('should reject operation with invalid type', () => {
      const result = NumbersArgsSchema.safeParse({ operation: 123 });
      expect(result.success).toBe(false);
    });

    it('should reject empty object', () => {
      const result = NumbersArgsSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });
});
