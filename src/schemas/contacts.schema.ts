import { z } from 'zod';

export const ContactsArgsSchema = z.object({
  name: z.string().optional().describe('Name to search for (optional - if not provided, returns all contacts). Can be partial name to search.')
});

export type ContactsArgs = z.infer<typeof ContactsArgsSchema>;
