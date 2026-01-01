import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { MapsArgsSchema } from '../schemas/maps.schema.js';
import { createToolSchema } from '../utils/schema-helper.js';
import mapsUtil from '../utils/maps.js';

export const MAPS_TOOL: Tool = {
  name: 'maps',
  description: 'Search locations, manage guides, save favorites, and get directions using Apple Maps',
  inputSchema: createToolSchema(MapsArgsSchema)
};

export async function handleMaps(args: unknown) {
  const parsed = MapsArgsSchema.parse(args);

  try {
    switch (parsed.operation) {
      case 'search': {
        const result = await mapsUtil.searchLocations(parsed.query, parsed.limit || 5);
        if (!result.success || result.locations.length === 0) {
          return {
            content: [{
              type: 'text' as const,
              text: result.message || `No locations found for "${parsed.query}"`
            }],
            isError: false
          };
        }
        const locationsText = result.locations
          .map(loc => `- ${loc.name}\n  Address: ${loc.address}${loc.latitude ? `\n  Coordinates: ${loc.latitude}, ${loc.longitude}` : ''}`)
          .join('\n\n');
        return {
          content: [{
            type: 'text' as const,
            text: locationsText
          }],
          isError: false
        };
      }

      case 'save': {
        const result = await mapsUtil.saveLocation(parsed.name, parsed.address);
        return {
          content: [{
            type: 'text' as const,
            text: result.message
          }],
          isError: !result.success
        };
      }

      case 'directions': {
        const result = await mapsUtil.getDirections(
          parsed.fromAddress,
          parsed.toAddress,
          parsed.transportType || 'driving'
        );
        return {
          content: [{
            type: 'text' as const,
            text: result.message
          }],
          isError: !result.success
        };
      }

      case 'pin': {
        const result = await mapsUtil.dropPin(parsed.name, parsed.address);
        return {
          content: [{
            type: 'text' as const,
            text: result.message
          }],
          isError: !result.success
        };
      }

      case 'listGuides': {
        const result = await mapsUtil.listGuides();
        return {
          content: [{
            type: 'text' as const,
            text: result.message
          }],
          isError: !result.success
        };
      }

      case 'createGuide': {
        const result = await mapsUtil.createGuide(parsed.guideName);
        return {
          content: [{
            type: 'text' as const,
            text: result.message
          }],
          isError: !result.success
        };
      }

      case 'addToGuide': {
        const result = await mapsUtil.addToGuide(parsed.address, parsed.guideName);
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
    return {
      content: [{
        type: 'text' as const,
        text: `Error with maps: ${error instanceof Error ? error.message : String(error)}`
      }],
      isError: true
    };
  }
}
