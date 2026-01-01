import { z } from 'zod';

const SendMessageSchema = z.object({
  operation: z.literal('send'),
  phoneNumber: z.string().min(1, 'phoneNumber is required for send operation').describe('Phone number to send message to'),
  message: z.string().min(1, 'message is required for send operation').describe('Message to send')
});

const ReadMessagesSchema = z.object({
  operation: z.literal('read'),
  phoneNumber: z.string().min(1, 'phoneNumber is required for read operation').describe('Phone number to read messages from'),
  limit: z.number().positive().optional().describe('Number of messages to read')
});

const ScheduleMessageSchema = z.object({
  operation: z.literal('schedule'),
  phoneNumber: z.string().min(1, 'phoneNumber is required for schedule operation').describe('Phone number to send message to'),
  message: z.string().min(1, 'message is required for schedule operation').describe('Message to send'),
  scheduledTime: z.string().min(1, 'scheduledTime is required for schedule operation').describe('ISO string of when to send the message')
});

const UnreadMessagesSchema = z.object({
  operation: z.literal('unread'),
  limit: z.number().positive().optional().describe('Number of unread messages to retrieve')
});

const RecentMessagesSchema = z.object({
  operation: z.literal('recent'),
  limit: z.number().positive().optional().describe('Number of recent messages to retrieve (default 20)')
});

export const MessagesArgsSchema = z.discriminatedUnion('operation', [
  SendMessageSchema,
  ReadMessagesSchema,
  ScheduleMessageSchema,
  UnreadMessagesSchema,
  RecentMessagesSchema
]);

export type MessagesArgs = z.infer<typeof MessagesArgsSchema>;
