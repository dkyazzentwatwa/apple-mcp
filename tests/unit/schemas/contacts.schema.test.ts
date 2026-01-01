import { describe, it, expect } from 'vitest';
import { ContactsArgsSchema } from '../../../src/schemas/contacts.schema.js';

describe('ContactsArgsSchema', () => {
  it('should accept empty object', () => {
    const result = ContactsArgsSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('should accept object with name', () => {
    const result = ContactsArgsSchema.safeParse({ name: 'John' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('John');
    }
  });

  it('should accept object with undefined name', () => {
    const result = ContactsArgsSchema.safeParse({ name: undefined });
    expect(result.success).toBe(true);
  });

  it('should reject invalid name type', () => {
    const result = ContactsArgsSchema.safeParse({ name: 123 });
    expect(result.success).toBe(false);
  });

  it('should reject name as array', () => {
    const result = ContactsArgsSchema.safeParse({ name: ['John'] });
    expect(result.success).toBe(false);
  });
});
