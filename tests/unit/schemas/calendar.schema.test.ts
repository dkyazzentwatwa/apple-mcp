import { describe, it, expect } from 'vitest';
import { CalendarArgsSchema } from '../../../src/schemas/calendar.schema.js';

describe('CalendarArgsSchema', () => {
  describe('list operation', () => {
    it('should accept list without options', () => {
      const result = CalendarArgsSchema.safeParse({ operation: 'list' });
      expect(result.success).toBe(true);
    });

    it('should accept list with date range', () => {
      const result = CalendarArgsSchema.safeParse({
        operation: 'list',
        fromDate: '2025-01-01',
        toDate: '2025-01-31',
        limit: 20
      });
      expect(result.success).toBe(true);
    });
  });

  describe('search operation', () => {
    it('should accept search with searchText', () => {
      const result = CalendarArgsSchema.safeParse({
        operation: 'search',
        searchText: 'meeting'
      });
      expect(result.success).toBe(true);
    });

    it('should accept search without searchText (schema level)', () => {
      const result = CalendarArgsSchema.safeParse({ operation: 'search' });
      expect(result.success).toBe(true);
    });

    it('should accept search with only location', () => {
      const result = CalendarArgsSchema.safeParse({
        operation: 'search',
        location: 'Conference Room'
      });
      expect(result.success).toBe(true);
    });

    it('should accept search with only attendee', () => {
      const result = CalendarArgsSchema.safeParse({
        operation: 'search',
        attendee: 'jane@example.com'
      });
      expect(result.success).toBe(true);
    });

    it('should accept search with all filters combined', () => {
      const result = CalendarArgsSchema.safeParse({
        operation: 'search',
        searchText: 'standup',
        location: 'Office',
        attendee: 'John',
        fromDate: '2024-01-01',
        toDate: '2025-12-31',
        limit: 50
      });
      expect(result.success).toBe(true);
    });

    it('should reject search with empty searchText', () => {
      const result = CalendarArgsSchema.safeParse({
        operation: 'search',
        searchText: ''
      });
      expect(result.success).toBe(false);
    });

    it('should reject search with empty location', () => {
      const result = CalendarArgsSchema.safeParse({
        operation: 'search',
        location: ''
      });
      expect(result.success).toBe(false);
    });

    it('should reject search with empty attendee', () => {
      const result = CalendarArgsSchema.safeParse({
        operation: 'search',
        attendee: ''
      });
      expect(result.success).toBe(false);
    });
  });

  describe('open operation', () => {
    it('should accept open with eventId', () => {
      const result = CalendarArgsSchema.safeParse({
        operation: 'open',
        eventId: 'event-123'
      });
      expect(result.success).toBe(true);
    });

    it('should reject open without eventId', () => {
      const result = CalendarArgsSchema.safeParse({ operation: 'open' });
      expect(result.success).toBe(false);
    });
  });

  describe('create operation', () => {
    it('should accept create with required fields', () => {
      const result = CalendarArgsSchema.safeParse({
        operation: 'create',
        title: 'Team Meeting',
        startDate: '2025-01-15T10:00:00Z',
        endDate: '2025-01-15T11:00:00Z'
      });
      expect(result.success).toBe(true);
    });

    it('should accept create with all fields', () => {
      const result = CalendarArgsSchema.safeParse({
        operation: 'create',
        title: 'Team Meeting',
        startDate: '2025-01-15T10:00:00Z',
        endDate: '2025-01-15T11:00:00Z',
        location: 'Conference Room A',
        notes: 'Quarterly review',
        isAllDay: false,
        calendarName: 'Work'
      });
      expect(result.success).toBe(true);
    });

    it('should reject create without title', () => {
      const result = CalendarArgsSchema.safeParse({
        operation: 'create',
        startDate: '2025-01-15T10:00:00Z',
        endDate: '2025-01-15T11:00:00Z'
      });
      expect(result.success).toBe(false);
    });

    it('should reject create without dates', () => {
      const result = CalendarArgsSchema.safeParse({
        operation: 'create',
        title: 'Meeting'
      });
      expect(result.success).toBe(false);
    });
  });
});
