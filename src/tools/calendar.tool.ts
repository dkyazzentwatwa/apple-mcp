import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { CalendarArgsSchema } from '../schemas/calendar.schema.js';
import { createToolSchema } from '../utils/schema-helper.js';
import calendarUtil from '../utils/calendar.js';

export const CALENDAR_TOOL: Tool = {
  name: 'calendar',
  description: 'Search, create, and open calendar events in Apple Calendar app',
  inputSchema: createToolSchema(CalendarArgsSchema)
};

function formatAttendee(a: { name: string | null; email: string | null; status: string | null }): string {
  const parts: string[] = [];
  if (a.name) parts.push(a.name);
  if (a.email) parts.push(a.name ? `<${a.email}>` : a.email);
  if (a.status) parts.push(`(${a.status})`);
  return parts.length > 0 ? parts.join(' ') : 'Unknown';
}

function formatAttendees(attendees: Array<{ name: string | null; email: string | null; status: string | null }>): string {
  if (!attendees || attendees.length === 0) return '';
  const list = attendees.map(formatAttendee).join(', ');
  return `\n  Attendees: ${list}`;
}

function formatEvent(e: { title: string; startDate: string | null; endDate: string | null; calendarName: string; location: string | null; attendees: Array<{ name: string | null; email: string | null; status: string | null }> }): string {
  let text = `- ${e.title}\n  When: ${e.startDate} - ${e.endDate}\n  Calendar: ${e.calendarName}`;
  if (e.location) text += `\n  Location: ${e.location}`;
  text += formatAttendees(e.attendees);
  return text;
}

export async function handleCalendar(args: unknown) {
  const parsed = CalendarArgsSchema.parse(args);

  try {
    switch (parsed.operation) {
      case 'search': {
        // Validate that at least one filter is provided
        if (!parsed.searchText && !parsed.location && !parsed.attendee) {
          return {
            content: [{
              type: 'text' as const,
              text: 'At least one filter is required: searchText, location, or attendee'
            }],
            isError: true
          };
        }

        const events = await calendarUtil.searchEvents(
          {
            searchText: parsed.searchText,
            location: parsed.location,
            attendee: parsed.attendee
          },
          parsed.limit || 10,
          parsed.fromDate,
          parsed.toDate
        );
        if (events.length === 0) {
          const filterParts: string[] = [];
          if (parsed.searchText) filterParts.push(`text "${parsed.searchText}"`);
          if (parsed.location) filterParts.push(`location "${parsed.location}"`);
          if (parsed.attendee) filterParts.push(`attendee "${parsed.attendee}"`);
          return {
            content: [{
              type: 'text' as const,
              text: `No events found matching ${filterParts.join(', ')}`
            }],
            isError: false
          };
        }
        const eventsText = events.map(formatEvent).join('\n\n');
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
        const eventsText = events.map(formatEvent).join('\n\n');
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
