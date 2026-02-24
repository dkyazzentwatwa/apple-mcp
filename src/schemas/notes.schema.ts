import { z } from 'zod';

const SearchNotesSchema = z.object({
  operation: z.literal('search'),
  searchText: z.string().min(1, 'searchText is required for search operation').max(500).describe('Text to search for in notes')
});

const ListNotesSchema = z.object({
  operation: z.literal('list')
});

const CreateNoteSchema = z.object({
  operation: z.literal('create'),
  title: z.string().min(1, 'title is required for create operation').max(1000).describe('Title of the note to create'),
  body: z.string().max(100000).describe('Content of the note to create'),
  folderName: z.string().min(1).max(200).optional().describe('Name of the folder to create the note in (defaults to "Claude")')
});

export const NotesArgsSchema = z.discriminatedUnion('operation', [
  SearchNotesSchema,
  ListNotesSchema,
  CreateNoteSchema
]);

export type NotesArgs = z.infer<typeof NotesArgsSchema>;
