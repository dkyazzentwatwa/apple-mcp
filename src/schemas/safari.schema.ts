import { z } from 'zod';

const ListBookmarksSchema = z.object({
  operation: z.literal('listBookmarks'),
  folder: z.string().optional().describe('Folder to list bookmarks from (optional - lists all if not provided)')
});

const SearchBookmarksSchema = z.object({
  operation: z.literal('searchBookmarks'),
  query: z.string().min(1, 'query is required for searchBookmarks operation').describe('Search query for bookmark title or URL')
});

const GetReadingListSchema = z.object({
  operation: z.literal('getReadingList'),
  limit: z.number().positive().optional().describe('Number of reading list items to retrieve')
});

const OpenUrlSchema = z.object({
  operation: z.literal('openUrl'),
  url: z.string().url('Must be a valid URL').describe('URL to open in Safari')
});

const GetCurrentTabSchema = z.object({
  operation: z.literal('getCurrentTab')
});

const GetTabsSchema = z.object({
  operation: z.literal('getTabs')
});

const AddToReadingListSchema = z.object({
  operation: z.literal('addToReadingList'),
  url: z.string().url('Must be a valid URL').describe('URL to add to reading list'),
  title: z.string().optional().describe('Title for the reading list item')
});

export const SafariArgsSchema = z.discriminatedUnion('operation', [
  ListBookmarksSchema,
  SearchBookmarksSchema,
  GetReadingListSchema,
  OpenUrlSchema,
  GetCurrentTabSchema,
  GetTabsSchema,
  AddToReadingListSchema
]);

export type SafariArgs = z.infer<typeof SafariArgsSchema>;
