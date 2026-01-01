import { describe, it, expect } from 'vitest';
import { NotesArgsSchema } from '../../../src/schemas/notes.schema.js';

describe('NotesArgsSchema', () => {
  describe('list operation', () => {
    it('should accept list operation', () => {
      const result = NotesArgsSchema.safeParse({ operation: 'list' });
      expect(result.success).toBe(true);
    });
  });

  describe('search operation', () => {
    it('should accept search with searchText', () => {
      const result = NotesArgsSchema.safeParse({
        operation: 'search',
        searchText: 'meeting notes'
      });
      expect(result.success).toBe(true);
    });

    it('should reject search without searchText', () => {
      const result = NotesArgsSchema.safeParse({ operation: 'search' });
      expect(result.success).toBe(false);
    });

    it('should reject search with empty searchText', () => {
      const result = NotesArgsSchema.safeParse({
        operation: 'search',
        searchText: ''
      });
      expect(result.success).toBe(false);
    });
  });

  describe('create operation', () => {
    it('should accept create with title and body', () => {
      const result = NotesArgsSchema.safeParse({
        operation: 'create',
        title: 'My Note',
        body: 'Note content here'
      });
      expect(result.success).toBe(true);
    });

    it('should accept create with optional folderName', () => {
      const result = NotesArgsSchema.safeParse({
        operation: 'create',
        title: 'My Note',
        body: 'Content',
        folderName: 'Work'
      });
      expect(result.success).toBe(true);
      if (result.success && result.data.operation === 'create') {
        expect(result.data.folderName).toBe('Work');
      }
    });

    it('should reject create without title', () => {
      const result = NotesArgsSchema.safeParse({
        operation: 'create',
        body: 'Content'
      });
      expect(result.success).toBe(false);
    });

    it('should reject create with empty title', () => {
      const result = NotesArgsSchema.safeParse({
        operation: 'create',
        title: '',
        body: 'Content'
      });
      expect(result.success).toBe(false);
    });
  });

  describe('invalid operations', () => {
    it('should reject unknown operation', () => {
      const result = NotesArgsSchema.safeParse({ operation: 'delete' });
      expect(result.success).toBe(false);
    });

    it('should reject missing operation', () => {
      const result = NotesArgsSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });
});
