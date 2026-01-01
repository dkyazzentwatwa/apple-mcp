import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { ContactsArgsSchema } from '../schemas/contacts.schema.js';
import { createToolSchema } from '../utils/schema-helper.js';
import contactsUtil from '../utils/contacts.js';

export const CONTACTS_TOOL: Tool = {
  name: 'contacts',
  description: 'Search and retrieve contacts from Apple Contacts app',
  inputSchema: createToolSchema(ContactsArgsSchema)
};

export async function handleContacts(args: unknown) {
  const parsed = ContactsArgsSchema.parse(args);

  try {
    if (parsed.name) {
      const numbers = await contactsUtil.findNumber(parsed.name);
      if (numbers.length === 0) {
        return {
          content: [{
            type: 'text' as const,
            text: `No contact found for "${parsed.name}"`
          }],
          isError: false
        };
      }
      return {
        content: [{
          type: 'text' as const,
          text: `Phone numbers for ${parsed.name}: ${numbers.join(', ')}`
        }],
        isError: false
      };
    }

    // Get all contacts with their phone numbers
    const allNumbers = await contactsUtil.getAllNumbers();
    const contactList = Object.entries(allNumbers)
      .map(([name, phones]) => `${name}: ${phones.join(', ')}`)
      .join('\n');

    return {
      content: [{
        type: 'text' as const,
        text: contactList || 'No contacts found'
      }],
      isError: false
    };
  } catch (error) {
    return {
      content: [{
        type: 'text' as const,
        text: `Error accessing contacts: ${error instanceof Error ? error.message : String(error)}`
      }],
      isError: true
    };
  }
}
