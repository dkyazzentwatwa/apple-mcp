import { z } from 'zod';

const UnreadMailSchema = z.object({
  operation: z.literal('unread'),
  account: z.string().max(200).optional().describe('Email account to use (optional - searches across all accounts if not provided)'),
  mailbox: z.string().max(200).optional().describe('Mailbox to use (optional - uses inbox if not provided)'),
  limit: z.number().positive().max(500).optional().describe('Number of emails to retrieve')
});

const SearchMailSchema = z.object({
  operation: z.literal('search'),
  searchTerm: z.string().min(1, 'searchTerm is required for search operation').max(500).describe('Text to search for in emails'),
  searchScope: z.enum(['subject', 'sender', 'all']).optional().default('subject').describe("What to search: 'subject' (default, fast), 'sender' (by sender address/name), or 'all' (subject + content, slow for large mailboxes)"),
  account: z.string().max(200).optional().describe('Email account to search in'),
  mailbox: z.string().max(200).optional().describe('Mailbox to search in'),
  limit: z.number().positive().max(500).optional().describe('Number of emails to retrieve')
});

const SendMailSchema = z.object({
  operation: z.literal('send'),
  to: z.string().min(1, 'to is required for send operation').email('Invalid email address').describe('Recipient email address'),
  subject: z.string().min(1, 'subject is required for send operation').max(1000).describe('Email subject'),
  body: z.string().min(1, 'body is required for send operation').max(100000).describe('Email body content'),
  cc: z.string().email('Invalid CC email address').optional().describe('CC email address'),
  bcc: z.string().email('Invalid BCC email address').optional().describe('BCC email address')
});

const MailboxesSchema = z.object({
  operation: z.literal('mailboxes'),
  account: z.string().max(200).optional().describe('Email account to list mailboxes for')
});

const AccountsSchema = z.object({
  operation: z.literal('accounts')
});

export const MailArgsSchema = z.discriminatedUnion('operation', [
  UnreadMailSchema,
  SearchMailSchema,
  SendMailSchema,
  MailboxesSchema,
  AccountsSchema
]);

export type MailArgs = z.infer<typeof MailArgsSchema>;
