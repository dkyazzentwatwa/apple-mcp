import type { Tool } from '@modelcontextprotocol/sdk/types.js';

import { CONTACTS_TOOL, handleContacts } from './contacts.tool.js';
import { NOTES_TOOL, handleNotes } from './notes.tool.js';
import { MESSAGES_TOOL, handleMessages } from './messages.tool.js';
import { MAIL_TOOL, handleMail } from './mail.tool.js';
import { REMINDERS_TOOL, handleReminders } from './reminders.tool.js';
import { CALENDAR_TOOL, handleCalendar } from './calendar.tool.js';
import { MAPS_TOOL, handleMaps } from './maps.tool.js';
import { SAFARI_TOOL, handleSafari } from './safari.tool.js';
import { PHOTOS_TOOL, handlePhotos } from './photos.tool.js';

export const tools: Tool[] = [
  CONTACTS_TOOL,
  NOTES_TOOL,
  MESSAGES_TOOL,
  MAIL_TOOL,
  REMINDERS_TOOL,
  CALENDAR_TOOL,
  MAPS_TOOL,
  SAFARI_TOOL,
  PHOTOS_TOOL
];

export const handlers: Record<string, (args: unknown) => Promise<{
  content: Array<{ type: 'text'; text: string }>;
  isError: boolean;
}>> = {
  contacts: handleContacts,
  notes: handleNotes,
  messages: handleMessages,
  mail: handleMail,
  reminders: handleReminders,
  calendar: handleCalendar,
  maps: handleMaps,
  safari: handleSafari,
  photos: handlePhotos
};

export {
  CONTACTS_TOOL,
  NOTES_TOOL,
  MESSAGES_TOOL,
  MAIL_TOOL,
  REMINDERS_TOOL,
  CALENDAR_TOOL,
  MAPS_TOOL,
  SAFARI_TOOL,
  PHOTOS_TOOL,
  handleContacts,
  handleNotes,
  handleMessages,
  handleMail,
  handleReminders,
  handleCalendar,
  handleMaps,
  handleSafari,
  handlePhotos
};
