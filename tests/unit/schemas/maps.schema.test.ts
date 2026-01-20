import { describe, it, expect } from 'vitest';
import { MapsArgsSchema } from '../../../src/schemas/maps.schema.js';

describe('MapsArgsSchema', () => {
  describe('search operation', () => {
    it('should accept search with query', () => {
      const result = MapsArgsSchema.safeParse({
        operation: 'search',
        query: 'coffee shop'
      });
      expect(result.success).toBe(true);
    });

    it('should accept search with query and limit', () => {
      const result = MapsArgsSchema.safeParse({
        operation: 'search',
        query: 'restaurant',
        limit: 10
      });
      expect(result.success).toBe(true);
    });

    it('should reject search without query', () => {
      const result = MapsArgsSchema.safeParse({ operation: 'search' });
      expect(result.success).toBe(false);
    });

    it('should reject search with empty query', () => {
      const result = MapsArgsSchema.safeParse({
        operation: 'search',
        query: ''
      });
      expect(result.success).toBe(false);
    });
  });

  describe('save operation', () => {
    it('should accept save with name and address', () => {
      const result = MapsArgsSchema.safeParse({
        operation: 'save',
        name: 'Home',
        address: '123 Main St'
      });
      expect(result.success).toBe(true);
    });

    it('should reject save without name', () => {
      const result = MapsArgsSchema.safeParse({
        operation: 'save',
        address: '123 Main St'
      });
      expect(result.success).toBe(false);
    });

    it('should reject save without address', () => {
      const result = MapsArgsSchema.safeParse({
        operation: 'save',
        name: 'Home'
      });
      expect(result.success).toBe(false);
    });
  });

  describe('directions operation', () => {
    it('should accept directions with required fields', () => {
      const result = MapsArgsSchema.safeParse({
        operation: 'directions',
        fromAddress: '123 Main St',
        toAddress: '456 Oak Ave'
      });
      expect(result.success).toBe(true);
    });

    it('should accept directions with transport type', () => {
      const result = MapsArgsSchema.safeParse({
        operation: 'directions',
        fromAddress: '123 Main St',
        toAddress: '456 Oak Ave',
        transportType: 'walking'
      });
      expect(result.success).toBe(true);
    });

    it('should reject directions without fromAddress', () => {
      const result = MapsArgsSchema.safeParse({
        operation: 'directions',
        toAddress: '456 Oak Ave'
      });
      expect(result.success).toBe(false);
    });

    it('should reject directions without toAddress', () => {
      const result = MapsArgsSchema.safeParse({
        operation: 'directions',
        fromAddress: '123 Main St'
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid transport type', () => {
      const result = MapsArgsSchema.safeParse({
        operation: 'directions',
        fromAddress: '123 Main St',
        toAddress: '456 Oak Ave',
        transportType: 'flying'
      });
      expect(result.success).toBe(false);
    });
  });

  describe('pin operation', () => {
    it('should accept pin with name and address', () => {
      const result = MapsArgsSchema.safeParse({
        operation: 'pin',
        name: 'Meeting Point',
        address: '789 Elm St'
      });
      expect(result.success).toBe(true);
    });

    it('should reject pin without name', () => {
      const result = MapsArgsSchema.safeParse({
        operation: 'pin',
        address: '789 Elm St'
      });
      expect(result.success).toBe(false);
    });
  });

  describe('listGuides operation', () => {
    it('should accept listGuides without parameters', () => {
      const result = MapsArgsSchema.safeParse({ operation: 'listGuides' });
      expect(result.success).toBe(true);
    });
  });

  describe('createGuide operation', () => {
    it('should accept createGuide with guideName', () => {
      const result = MapsArgsSchema.safeParse({
        operation: 'createGuide',
        guideName: 'My Favorite Places'
      });
      expect(result.success).toBe(true);
    });

    it('should reject createGuide without guideName', () => {
      const result = MapsArgsSchema.safeParse({ operation: 'createGuide' });
      expect(result.success).toBe(false);
    });

    it('should reject createGuide with empty guideName', () => {
      const result = MapsArgsSchema.safeParse({
        operation: 'createGuide',
        guideName: ''
      });
      expect(result.success).toBe(false);
    });
  });

  describe('addToGuide operation', () => {
    it('should accept addToGuide with address and guideName', () => {
      const result = MapsArgsSchema.safeParse({
        operation: 'addToGuide',
        address: '123 Main St',
        guideName: 'My Favorite Places'
      });
      expect(result.success).toBe(true);
    });

    it('should reject addToGuide without address', () => {
      const result = MapsArgsSchema.safeParse({
        operation: 'addToGuide',
        guideName: 'My Favorite Places'
      });
      expect(result.success).toBe(false);
    });

    it('should reject addToGuide without guideName', () => {
      const result = MapsArgsSchema.safeParse({
        operation: 'addToGuide',
        address: '123 Main St'
      });
      expect(result.success).toBe(false);
    });
  });

  describe('analyzeRoute operation', () => {
    it('should accept analyzeRoute with required fields', () => {
      const result = MapsArgsSchema.safeParse({
        operation: 'analyzeRoute',
        fromAddress: 'San Francisco, CA',
        toAddress: 'San Jose, CA'
      });
      expect(result.success).toBe(true);
    });

    it('should accept analyzeRoute with all fields', () => {
      const result = MapsArgsSchema.safeParse({
        operation: 'analyzeRoute',
        fromAddress: 'San Francisco, CA',
        toAddress: 'San Jose, CA',
        transportType: 'driving',
        includeAlternatives: true
      });
      expect(result.success).toBe(true);
    });

    it('should accept analyzeRoute with walking transport', () => {
      const result = MapsArgsSchema.safeParse({
        operation: 'analyzeRoute',
        fromAddress: '123 Main St',
        toAddress: '456 Oak Ave',
        transportType: 'walking'
      });
      expect(result.success).toBe(true);
    });

    it('should accept analyzeRoute with transit transport', () => {
      const result = MapsArgsSchema.safeParse({
        operation: 'analyzeRoute',
        fromAddress: '123 Main St',
        toAddress: '456 Oak Ave',
        transportType: 'transit'
      });
      expect(result.success).toBe(true);
    });

    it('should reject analyzeRoute without fromAddress', () => {
      const result = MapsArgsSchema.safeParse({
        operation: 'analyzeRoute',
        toAddress: 'San Jose, CA'
      });
      expect(result.success).toBe(false);
    });

    it('should reject analyzeRoute without toAddress', () => {
      const result = MapsArgsSchema.safeParse({
        operation: 'analyzeRoute',
        fromAddress: 'San Francisco, CA'
      });
      expect(result.success).toBe(false);
    });

    it('should reject analyzeRoute with empty fromAddress', () => {
      const result = MapsArgsSchema.safeParse({
        operation: 'analyzeRoute',
        fromAddress: '',
        toAddress: 'San Jose, CA'
      });
      expect(result.success).toBe(false);
    });

    it('should reject analyzeRoute with empty toAddress', () => {
      const result = MapsArgsSchema.safeParse({
        operation: 'analyzeRoute',
        fromAddress: 'San Francisco, CA',
        toAddress: ''
      });
      expect(result.success).toBe(false);
    });

    it('should reject analyzeRoute with invalid transport type', () => {
      const result = MapsArgsSchema.safeParse({
        operation: 'analyzeRoute',
        fromAddress: 'San Francisco, CA',
        toAddress: 'San Jose, CA',
        transportType: 'flying'
      });
      expect(result.success).toBe(false);
    });

    it('should reject analyzeRoute with invalid includeAlternatives type', () => {
      const result = MapsArgsSchema.safeParse({
        operation: 'analyzeRoute',
        fromAddress: 'San Francisco, CA',
        toAddress: 'San Jose, CA',
        includeAlternatives: 'yes'
      });
      expect(result.success).toBe(false);
    });
  });
});
