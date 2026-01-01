import { z } from 'zod';

const UnreadMailSchema = z.object({
  operation: z.literal('unread'),
  account: z.string().optional().describe('Email account to use (optional - searches across all accounts if not provided)'),
  mailbox: z.string().optional().describe('Mailbox to use (optional - uses inbox if not provided)'),
  limit: z.number().positive().optional().describe('Number of emails to retrieve')
});

const SearchMailSchema = z.object({
  operation: z.literal('search'),
  searchTerm: z.string().min(1, 'searchTerm is required for search operation').describe('Text to search for in emails'),
  account: z.string().optional().describe('Email account to search in'),
  mailbox: z.string().optional().describe('Mailbox to search in'),
  limit: z.number().positive().optional().describe('Number of emails to retrieve')
});

const SendMailSchema = z.object({
  operation: z.literal('send'),
  to: z.string().min(1, 'to is required for send operation').describe('Recipient email address'),
  subject: z.string().min(1, 'subject is required for send operation').describe('Email subject'),
  body: z.string().min(1, 'body is required for send operation').describe('Email body content'),
  cc: z.string().optional().describe('CC email address'),
  bcc: z.string().optional().describe('BCC email address')
});

const MailboxesSchema = z.object({
  operation: z.literal('mailboxes'),
  account: z.string().optional().describe('Email account to list mailboxes for')
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
