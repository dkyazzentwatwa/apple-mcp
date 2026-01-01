import { z } from 'zod';

const SearchEventsSchema = z.object({
  operation: z.literal('search'),
  searchText: z.string().min(1, 'searchText is required for search operation').describe('Text to search for in event titles, locations, and notes'),
  fromDate: z.string().optional().describe('Start date for search range in ISO format (default is today)'),
  toDate: z.string().optional().describe('End date for search range in ISO format (default is 30 days from now)'),
  limit: z.number().positive().optional().describe('Number of events to retrieve')
});

const OpenEventSchema = z.object({
  operation: z.literal('open'),
  eventId: z.string().min(1, 'eventId is required for open operation').describe('ID of the event to open')
});

const ListEventsSchema = z.object({
  operation: z.literal('list'),
  fromDate: z.string().optional().describe('Start date in ISO format (default is today)'),
  toDate: z.string().optional().describe('End date in ISO format (default is 7 days from now)'),
  limit: z.number().positive().optional().describe('Number of events to retrieve (default 10)')
});

const CreateEventSchema = z.object({
  operation: z.literal('create'),
  title: z.string().min(1, 'title is required for create operation').describe('Title of the event to create'),
  startDate: z.string().min(1, 'startDate is required for create operation').describe('Start date/time of the event in ISO format'),
  endDate: z.string().min(1, 'endDate is required for create operation').describe('End date/time of the event in ISO format'),
  location: z.string().optional().describe('Location of the event'),
  notes: z.string().optional().describe('Additional notes for the event'),
  isAllDay: z.boolean().optional().describe('Whether the event is an all-day event (default is false)'),
  calendarName: z.string().optional().describe('Name of the calendar to create the event in (uses default calendar if not specified)')
});

export const CalendarArgsSchema = z.discriminatedUnion('operation', [
  SearchEventsSchema,
  OpenEventSchema,
  ListEventsSchema,
  CreateEventSchema
]);

export type CalendarArgs = z.infer<typeof CalendarArgsSchema>;
