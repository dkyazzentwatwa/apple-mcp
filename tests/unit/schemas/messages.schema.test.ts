import { describe, it, expect } from 'vitest';
import { MessagesArgsSchema } from '../../../src/schemas/messages.schema.js';

describe('MessagesArgsSchema', () => {
  describe('send operation', () => {
    it('should accept send with phoneNumber and message', () => {
      const result = MessagesArgsSchema.safeParse({
        operation: 'send',
        phoneNumber: '+1234567890',
        message: 'Hello!'
      });
      expect(result.success).toBe(true);
    });

    it('should reject send without phoneNumber', () => {
      const result = MessagesArgsSchema.safeParse({
        operation: 'send',
        message: 'Hello!'
      });
      expect(result.success).toBe(false);
    });

    it('should reject send without message', () => {
      const result = MessagesArgsSchema.safeParse({
        operation: 'send',
        phoneNumber: '+1234567890'
      });
      expect(result.success).toBe(false);
    });
  });

  describe('read operation', () => {
    it('should accept read with phoneNumber', () => {
      const result = MessagesArgsSchema.safeParse({
        operation: 'read',
        phoneNumber: '+1234567890'
      });
      expect(result.success).toBe(true);
    });

    it('should accept read with optional limit', () => {
      const result = MessagesArgsSchema.safeParse({
        operation: 'read',
        phoneNumber: '+1234567890',
        limit: 20
      });
      expect(result.success).toBe(true);
    });

    it('should reject read without phoneNumber', () => {
      const result = MessagesArgsSchema.safeParse({
        operation: 'read'
      });
      expect(result.success).toBe(false);
    });
  });

  describe('schedule operation', () => {
    it('should accept schedule with all required fields', () => {
      const result = MessagesArgsSchema.safeParse({
        operation: 'schedule',
        phoneNumber: '+1234567890',
        message: 'Scheduled message',
        scheduledTime: '2025-12-31T10:00:00Z'
      });
      expect(result.success).toBe(true);
    });

    it('should reject schedule without scheduledTime', () => {
      const result = MessagesArgsSchema.safeParse({
        operation: 'schedule',
        phoneNumber: '+1234567890',
        message: 'Hello'
      });
      expect(result.success).toBe(false);
    });
  });

  describe('unread operation', () => {
    it('should accept unread without options', () => {
      const result = MessagesArgsSchema.safeParse({
        operation: 'unread'
      });
      expect(result.success).toBe(true);
    });

    it('should accept unread with limit', () => {
      const result = MessagesArgsSchema.safeParse({
        operation: 'unread',
        limit: 5
      });
      expect(result.success).toBe(true);
    });
  });
});
