import { zodToJsonSchema } from 'zod-to-json-schema';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ZodSchema } from 'zod';

/**
 * Converts a Zod schema to an MCP-compatible JSON Schema.
 *
 * Claude Desktop/Code require inputSchema to have `type: "object"` at the root.
 * zod-to-json-schema converts discriminatedUnion to `anyOf` which is not supported.
 * This helper flattens anyOf/oneOf schemas into a single object schema.
 */
export function createToolSchema(schema: ZodSchema): Tool['inputSchema'] {
  const jsonSchema = zodToJsonSchema(schema) as Record<string, unknown>;

  // Remove $schema property - not needed for MCP
  delete jsonSchema.$schema;

  // If it's an anyOf/oneOf (discriminated union), flatten to single object
  if (jsonSchema.anyOf || jsonSchema.oneOf) {
    const variants = (jsonSchema.anyOf || jsonSchema.oneOf) as Array<{
      properties?: Record<string, unknown>;
      required?: string[];
    }>;

    const allProperties: Record<string, unknown> = {};
    const requiredSet = new Set<string>();

    // Collect all properties from all variants
    for (const variant of variants) {
      if (variant.properties) {
        for (const [key, value] of Object.entries(variant.properties)) {
          if (!allProperties[key]) {
            allProperties[key] = value;
          }
        }
      }
      // Only 'operation' should be required (common discriminator)
      if (variant.required?.includes('operation')) {
        requiredSet.add('operation');
      }
    }

    return {
      type: 'object',
      properties: allProperties,
      required: Array.from(requiredSet)
    } as Tool['inputSchema'];
  }

  // Also remove additionalProperties: false as it can cause issues
  delete jsonSchema.additionalProperties;

  return jsonSchema as Tool['inputSchema'];
}
