import { describe, it, expect } from 'vitest';
import { MailArgsSchema } from '../../../src/schemas/mail.schema.js';

describe('MailArgsSchema', () => {
  describe('search operation', () => {
    it('should accept search with searchTerm', () => {
      const result = MailArgsSchema.safeParse({
        operation: 'search',
        searchTerm: 'test'
      });
      expect(result.success).toBe(true);
    });

    it('should default searchScope to "subject" when omitted', () => {
      const result = MailArgsSchema.safeParse({
        operation: 'search',
        searchTerm: 'test'
      });
      expect(result.success).toBe(true);
      if (result.success && result.data.operation === 'search') {
        expect(result.data.searchScope).toBe('subject');
      }
    });

    it('should accept searchScope "subject"', () => {
      const result = MailArgsSchema.safeParse({
        operation: 'search',
        searchTerm: 'test',
        searchScope: 'subject'
      });
      expect(result.success).toBe(true);
      if (result.success && result.data.operation === 'search') {
        expect(result.data.searchScope).toBe('subject');
      }
    });

    it('should accept searchScope "sender"', () => {
      const result = MailArgsSchema.safeParse({
        operation: 'search',
        searchTerm: 'test',
        searchScope: 'sender'
      });
      expect(result.success).toBe(true);
      if (result.success && result.data.operation === 'search') {
        expect(result.data.searchScope).toBe('sender');
      }
    });

    it('should accept searchScope "all"', () => {
      const result = MailArgsSchema.safeParse({
        operation: 'search',
        searchTerm: 'test',
        searchScope: 'all'
      });
      expect(result.success).toBe(true);
      if (result.success && result.data.operation === 'search') {
        expect(result.data.searchScope).toBe('all');
      }
    });

    it('should reject invalid searchScope', () => {
      const result = MailArgsSchema.safeParse({
        operation: 'search',
        searchTerm: 'test',
        searchScope: 'body'
      });
      expect(result.success).toBe(false);
    });

    it('should reject search without searchTerm', () => {
      const result = MailArgsSchema.safeParse({ operation: 'search' });
      expect(result.success).toBe(false);
    });

    it('should reject search with empty searchTerm', () => {
      const result = MailArgsSchema.safeParse({
        operation: 'search',
        searchTerm: ''
      });
      expect(result.success).toBe(false);
    });

    it('should accept search with optional account and mailbox', () => {
      const result = MailArgsSchema.safeParse({
        operation: 'search',
        searchTerm: 'test',
        account: 'Work',
        mailbox: 'INBOX'
      });
      expect(result.success).toBe(true);
    });
  });

  describe('unread operation', () => {
    it('should accept unread operation', () => {
      const result = MailArgsSchema.safeParse({ operation: 'unread' });
      expect(result.success).toBe(true);
    });
  });

  describe('invalid operations', () => {
    it('should reject unknown operation', () => {
      const result = MailArgsSchema.safeParse({ operation: 'delete' });
      expect(result.success).toBe(false);
    });

    it('should reject missing operation', () => {
      const result = MailArgsSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });
});
