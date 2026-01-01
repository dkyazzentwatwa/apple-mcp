import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { MessagesArgsSchema } from '../schemas/messages.schema.js';
import { createToolSchema } from '../utils/schema-helper.js';
import messagesUtil from '../utils/message.js';

export const MESSAGES_TOOL: Tool = {
  name: 'messages',
  description: 'Interact with Apple Messages app - send, read, schedule messages and check unread messages',
  inputSchema: createToolSchema(MessagesArgsSchema)
};

export async function handleMessages(args: unknown) {
  const parsed = MessagesArgsSchema.parse(args);

  try {
    switch (parsed.operation) {
      case 'send': {
        await messagesUtil.sendMessage(parsed.phoneNumber, parsed.message);
        return {
          content: [{
            type: 'text' as const,
            text: `Message sent to ${parsed.phoneNumber}`
          }],
          isError: false
        };
      }

      case 'read': {
        const messages = await messagesUtil.readMessages(
          parsed.phoneNumber,
          parsed.limit || 10
        );
        if (messages.length === 0) {
          return {
            content: [{
              type: 'text' as const,
              text: `No messages found for ${parsed.phoneNumber}`
            }],
            isError: false
          };
        }
        const messagesText = messages
          .map(msg => `[${msg.date}] ${msg.is_from_me ? 'You' : msg.sender}: ${msg.content}`)
          .join('\n');
        return {
          content: [{
            type: 'text' as const,
            text: messagesText
          }],
          isError: false
        };
      }

      case 'schedule': {
        const scheduledTime = new Date(parsed.scheduledTime);
        const result = await messagesUtil.scheduleMessage(
          parsed.phoneNumber,
          parsed.message,
          scheduledTime
        );
        return {
          content: [{
            type: 'text' as const,
            text: `Message scheduled for ${scheduledTime.toLocaleString()} to ${parsed.phoneNumber}`
          }],
          isError: false
        };
      }

      case 'unread': {
        const messages = await messagesUtil.getUnreadMessages(parsed.limit || 10);
        if (messages.length === 0) {
          return {
            content: [{
              type: 'text' as const,
              text: 'No unread messages'
            }],
            isError: false
          };
        }
        const messagesText = messages
          .map(msg => `[${msg.date}] ${msg.sender}: ${msg.content}`)
          .join('\n');
        return {
          content: [{
            type: 'text' as const,
            text: `Unread messages:\n${messagesText}`
          }],
          isError: false
        };
      }

      case 'recent': {
        const messages = await messagesUtil.getRecentMessages(parsed.limit || 20);
        if (messages.length === 0) {
          return {
            content: [{
              type: 'text' as const,
              text: 'No recent messages found'
            }],
            isError: false
          };
        }
        const messagesText = messages
          .map(msg => `[${msg.date}] ${msg.is_from_me ? 'You' : msg.sender}: ${msg.content}`)
          .join('\n---\n');
        return {
          content: [{
            type: 'text' as const,
            text: `Recent messages:\n${messagesText}`
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
        text: `Error with messages: ${error instanceof Error ? error.message : String(error)}`
      }],
      isError: true
    };
  }
}
