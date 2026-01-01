import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { RemindersArgsSchema } from '../schemas/reminders.schema.js';
import { createToolSchema } from '../utils/schema-helper.js';
import remindersUtil from '../utils/reminders.js';

export const REMINDERS_TOOL: Tool = {
  name: 'reminders',
  description: 'Search, create, and open reminders in Apple Reminders app',
  inputSchema: createToolSchema(RemindersArgsSchema)
};

export async function handleReminders(args: unknown) {
  const parsed = RemindersArgsSchema.parse(args);

  try {
    switch (parsed.operation) {
      case 'list': {
        const lists = await remindersUtil.getAllLists();
        if (lists.length === 0) {
          return {
            content: [{
              type: 'text' as const,
              text: 'No reminder lists found'
            }],
            isError: false
          };
        }
        const listsText = lists
          .map(list => `- ${list.name} (ID: ${list.id})`)
          .join('\n');
        return {
          content: [{
            type: 'text' as const,
            text: `Reminder lists:\n${listsText}`
          }],
          isError: false
        };
      }

      case 'search': {
        const reminders = await remindersUtil.searchReminders(parsed.searchText);
        if (reminders.length === 0) {
          return {
            content: [{
              type: 'text' as const,
              text: `No reminders found matching "${parsed.searchText}"`
            }],
            isError: false
          };
        }
        const remindersText = reminders
          .map(r => `- ${r.name}${r.dueDate ? ` (Due: ${r.dueDate})` : ''} [${r.listName}]${r.completed ? ' (Completed)' : ''}`)
          .join('\n');
        return {
          content: [{
            type: 'text' as const,
            text: remindersText
          }],
          isError: false
        };
      }

      case 'open': {
        const result = await remindersUtil.openReminder(parsed.searchText);
        return {
          content: [{
            type: 'text' as const,
            text: result.message
          }],
          isError: !result.success
        };
      }

      case 'create': {
        const reminder = await remindersUtil.createReminder(
          parsed.name,
          parsed.listName || 'Reminders',
          parsed.notes,
          parsed.dueDate
        );
        return {
          content: [{
            type: 'text' as const,
            text: `Created reminder "${reminder.name}" in list "${reminder.listName}"${reminder.dueDate ? ` (Due: ${reminder.dueDate})` : ''}`
          }],
          isError: false
        };
      }

      case 'listById': {
        const reminders = await remindersUtil.getRemindersFromListById(
          parsed.listId,
          parsed.props
        );
        if (reminders.length === 0) {
          return {
            content: [{
              type: 'text' as const,
              text: 'No reminders found in this list'
            }],
            isError: false
          };
        }
        const remindersText = reminders
          .map(r => `- ${r.name}${r.dueDate ? ` (Due: ${r.dueDate})` : ''}${r.completed ? ' (Completed)' : ''}`)
          .join('\n');
        return {
          content: [{
            type: 'text' as const,
            text: remindersText
          }],
          isError: false
        };
      }

      case 'getByListName': {
        const reminders = await remindersUtil.getAllReminders(parsed.listName);
        if (reminders.length === 0) {
          return {
            content: [{
              type: 'text' as const,
              text: `No reminders found in list "${parsed.listName}"`
            }],
            isError: false
          };
        }
        const remindersText = reminders
          .map(r => `- ${r.name}${r.dueDate ? ` (Due: ${r.dueDate})` : ''}${r.completed ? ' (Completed)' : ''}`)
          .join('\n');
        return {
          content: [{
            type: 'text' as const,
            text: `Reminders in "${parsed.listName}":\n${remindersText}`
          }],
          isError: false
        };
      }

      case 'createList': {
        const list = await remindersUtil.createList(parsed.listName) as any;
        if (list.alreadyExists) {
          return {
            content: [{
              type: 'text' as const,
              text: `List "${list.name}" already exists (ID: ${list.id})`
            }],
            isError: false
          };
        }
        return {
          content: [{
            type: 'text' as const,
            text: `Created list "${list.name}" (ID: ${list.id})`
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
        text: `Error with reminders: ${error instanceof Error ? error.message : String(error)}`
      }],
      isError: true
    };
  }
}
