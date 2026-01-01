import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { NotesArgsSchema } from '../schemas/notes.schema.js';
import { createToolSchema } from '../utils/schema-helper.js';
import notesUtil from '../utils/notes.js';

export const NOTES_TOOL: Tool = {
  name: 'notes',
  description: 'Search, retrieve and create notes in Apple Notes app',
  inputSchema: createToolSchema(NotesArgsSchema)
};

export async function handleNotes(args: unknown) {
  const parsed = NotesArgsSchema.parse(args);

  try {
    switch (parsed.operation) {
      case 'search': {
        const notes = await notesUtil.findNote(parsed.searchText);
        if (notes.length === 0) {
          return {
            content: [{
              type: 'text' as const,
              text: `No notes found matching "${parsed.searchText}"`
            }],
            isError: false
          };
        }
        const notesText = notes
          .map(note => `## ${note.name}\n${note.content}`)
          .join('\n\n---\n\n');
        return {
          content: [{
            type: 'text' as const,
            text: notesText
          }],
          isError: false
        };
      }

      case 'list': {
        const notes = await notesUtil.getAllNotes();
        if (notes.length === 0) {
          return {
            content: [{
              type: 'text' as const,
              text: 'No notes found'
            }],
            isError: false
          };
        }
        const notesList = notes
          .map(note => `- ${note.name}`)
          .join('\n');
        return {
          content: [{
            type: 'text' as const,
            text: `Found ${notes.length} notes:\n${notesList}`
          }],
          isError: false
        };
      }

      case 'create': {
        const result = await notesUtil.createNote(
          parsed.title,
          parsed.body,
          parsed.folderName || 'Claude'
        );
        if (result.success) {
          return {
            content: [{
              type: 'text' as const,
              text: `Created note "${parsed.title}" in folder "${result.folderName}"`
            }],
            isError: false
          };
        }
        return {
          content: [{
            type: 'text' as const,
            text: result.message || 'Failed to create note'
          }],
          isError: true
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
        text: `Error accessing notes: ${error instanceof Error ? error.message : String(error)}`
      }],
      isError: true
    };
  }
}
