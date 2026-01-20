import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { MapsArgsSchema } from '../schemas/maps.schema.js';
import { createToolSchema } from '../utils/schema-helper.js';
import mapsUtil from '../utils/maps.js';

export const MAPS_TOOL: Tool = {
  name: 'maps',
  description: 'Search locations, manage guides, save favorites, get directions, and analyze routes with detailed information (distance, duration, turn-by-turn steps) using Apple Maps and MapKit',
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

      case 'analyzeRoute': {
        const result = await mapsUtil.analyzeRoute(
          parsed.fromAddress,
          parsed.toAddress,
          parsed.transportType || 'driving',
          parsed.includeAlternatives || false
        );

        if (!result.success || !result.route) {
          return {
            content: [{
              type: 'text' as const,
              text: result.error || result.message || 'Failed to analyze route'
            }],
            isError: true
          };
        }

        // Format route information for display
        const route = result.route;
        let routeText = `Route from ${route.startAddress} to ${route.endAddress}\n\n`;
        routeText += `Distance: ${route.distance}\n`;
        routeText += `Duration: ${route.duration}\n`;
        routeText += `Transport: ${parsed.transportType || 'driving'}\n\n`;

        if (route.steps && route.steps.length > 0) {
          routeText += `Turn-by-turn directions:\n`;
          route.steps.forEach((step, idx) => {
            const distanceMiles = (step.distance / 1609.34).toFixed(1);
            routeText += `${idx + 1}. ${step.instructions} (${distanceMiles} mi)`;
            if (step.notice) {
              routeText += ` - ${step.notice}`;
            }
            routeText += '\n';
          });
        }

        if (route.alternatives && route.alternatives.length > 0) {
          routeText += `\nAlternative routes:\n`;
          route.alternatives.forEach((alt, idx) => {
            const altDistanceMiles = (alt.distance / 1609.34).toFixed(1);
            const altDurationMin = Math.round(alt.expectedTravelTime / 60);
            routeText += `${idx + 1}. ${alt.name || 'Alternative route'}: ${altDistanceMiles} mi, ${altDurationMin} min\n`;
          });
        }

        return {
          content: [{
            type: 'text' as const,
            text: routeText
          }],
          isError: false
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
