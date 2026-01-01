import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { CalendarArgsSchema } from '../schemas/calendar.schema.js';
import { createToolSchema } from '../utils/schema-helper.js';
import calendarUtil from '../utils/calendar.js';

export const CALENDAR_TOOL: Tool = {
  name: 'calendar',
  description: 'Search, create, and open calendar events in Apple Calendar app',
  inputSchema: createToolSchema(CalendarArgsSchema)
};

export async function handleCalendar(args: unknown) {
  const parsed = CalendarArgsSchema.parse(args);

  try {
    switch (parsed.operation) {
      case 'search': {
        const events = await calendarUtil.searchEvents(
          parsed.searchText,
          parsed.limit || 10,
          parsed.fromDate,
          parsed.toDate
        );
        if (events.length === 0) {
          return {
            content: [{
              type: 'text' as const,
              text: `No events found matching "${parsed.searchText}"`
            }],
            isError: false
          };
        }
        const eventsText = events
          .map(e => `- ${e.title}\n  When: ${e.startDate} - ${e.endDate}\n  Calendar: ${e.calendarName}${e.location ? `\n  Location: ${e.location}` : ''}`)
          .join('\n\n');
        return {
          content: [{
            type: 'text' as const,
            text: eventsText
          }],
          isError: false
        };
      }

      case 'list': {
        const events = await calendarUtil.getEvents(
          parsed.limit || 10,
          parsed.fromDate,
          parsed.toDate
        );
        if (events.length === 0) {
          return {
            content: [{
              type: 'text' as const,
              text: 'No upcoming events found'
            }],
            isError: false
          };
        }
        const eventsText = events
          .map(e => `- ${e.title}\n  When: ${e.startDate} - ${e.endDate}\n  Calendar: ${e.calendarName}${e.location ? `\n  Location: ${e.location}` : ''}`)
          .join('\n\n');
        return {
          content: [{
            type: 'text' as const,
            text: `Upcoming events:\n\n${eventsText}`
          }],
          isError: false
        };
      }

      case 'open': {
        const result = await calendarUtil.openEvent(parsed.eventId);
        return {
          content: [{
            type: 'text' as const,
            text: result.message
          }],
          isError: !result.success
        };
      }

      case 'create': {
        const result = await calendarUtil.createEvent(
          parsed.title,
          parsed.startDate,
          parsed.endDate,
          parsed.location,
          parsed.notes,
          parsed.isAllDay || false,
          parsed.calendarName
        );
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
        text: `Error with calendar: ${error instanceof Error ? error.message : String(error)}`
      }],
      isError: true
    };
  }
}
