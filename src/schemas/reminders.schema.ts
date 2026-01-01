import { z } from 'zod';

const ListRemindersSchema = z.object({
  operation: z.literal('list').describe('Get all reminder lists and their IDs. Use this first to discover available lists.')
});

const SearchRemindersSchema = z.object({
  operation: z.literal('search').describe('Search for reminders by text across all lists. Requires searchText parameter.'),
  searchText: z.string().min(1, 'searchText is required for search operation').describe('Text to search for in reminder names and notes')
});

const OpenReminderSchema = z.object({
  operation: z.literal('open').describe('Open the Reminders app and find a specific reminder by text.'),
  searchText: z.string().min(1, 'searchText is required for open operation').describe('Text to search for to open reminder')
});

const CreateReminderSchema = z.object({
  operation: z.literal('create').describe('Create a new reminder in a specified list.'),
  name: z.string().min(1, 'name is required for create operation').describe('Name of the reminder to create'),
  listName: z.string().optional().describe('Name of the list to create the reminder in (default: Reminders)'),
  listId: z.string().optional().describe('ID of the list to create the reminder in (takes precedence over listName)'),
  notes: z.string().optional().describe('Additional notes for the reminder'),
  dueDate: z.string().optional().describe('Due date for the reminder in ISO format')
});

const ListByIdSchema = z.object({
  operation: z.literal('listById').describe('Get all reminders from a specific list using its ID. Use "list" operation first to get list IDs.'),
  listId: z.string().min(1, 'listId is required for listById operation').describe('ID of the list to get reminders from (get IDs from "list" operation)'),
  props: z.array(z.string()).optional().describe('Properties to include in the reminders')
});

const GetByListNameSchema = z.object({
  operation: z.literal('getByListName').describe('Get all reminders from a list by its name (e.g., "Tasks", "Work", "Grocery"). Preferred over listById.'),
  listName: z.string().min(1, 'listName is required').describe('Name of the reminder list (e.g., "Tasks", "Work", "Grocery")')
});

const CreateListSchema = z.object({
  operation: z.literal('createList').describe('Create a new reminder list.'),
  listName: z.string().min(1, 'listName is required').describe('Name for the new reminder list')
});

const CompleteReminderSchema = z.object({
  operation: z.literal('complete').describe('Mark a reminder as complete or incomplete.'),
  reminderId: z.string().min(1, 'reminderId is required').describe('ID of the reminder to complete'),
  completed: z.boolean().default(true).describe('Set to true to mark complete, false to mark incomplete')
});

const UpdateReminderSchema = z.object({
  operation: z.literal('update').describe('Update a reminder\'s properties.'),
  reminderId: z.string().min(1, 'reminderId is required').describe('ID of the reminder to update'),
  name: z.string().optional().describe('New name for the reminder'),
  notes: z.string().optional().describe('New notes for the reminder'),
  dueDate: z.string().optional().describe('New due date in ISO format (or empty string to clear)')
});

const DeleteReminderSchema = z.object({
  operation: z.literal('delete').describe('Delete a reminder.'),
  reminderId: z.string().min(1, 'reminderId is required').describe('ID of the reminder to delete')
});

export const RemindersArgsSchema = z.discriminatedUnion('operation', [
  ListRemindersSchema,
  SearchRemindersSchema,
  OpenReminderSchema,
  CreateReminderSchema,
  ListByIdSchema,
  GetByListNameSchema,
  CreateListSchema,
  CompleteReminderSchema,
  UpdateReminderSchema,
  DeleteReminderSchema
]);

export type RemindersArgs = z.infer<typeof RemindersArgsSchema>;
