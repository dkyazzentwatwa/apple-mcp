import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { MailArgsSchema } from '../schemas/mail.schema.js';
import { createToolSchema } from '../utils/schema-helper.js';
import mailUtil from '../utils/mail.js';

export const MAIL_TOOL: Tool = {
  name: 'mail',
  description: 'Interact with Apple Mail app - read unread emails, search emails, and send emails',
  inputSchema: createToolSchema(MailArgsSchema)
};

export async function handleMail(args: unknown) {
  const parsed = MailArgsSchema.parse(args);

  try {
    switch (parsed.operation) {
      case 'unread': {
        const emails = await mailUtil.getUnreadMails(
          parsed.limit || 10,
          parsed.account,
          parsed.mailbox
        );
        if (emails.length === 0) {
          return {
            content: [{
              type: 'text' as const,
              text: 'No unread emails'
            }],
            isError: false
          };
        }
        const emailsText = emails
          .map(email => `From: ${email.sender}\nSubject: ${email.subject}\nDate: ${email.dateSent}\nMailbox: ${email.mailbox}\n---\n${email.content}`)
          .join('\n\n');
        return {
          content: [{
            type: 'text' as const,
            text: emailsText
          }],
          isError: false
        };
      }

      case 'search': {
        const emails = await mailUtil.searchMails(
          parsed.searchTerm,
          parsed.limit || 10,
          parsed.account,
          parsed.mailbox
        );
        if (emails.length === 0) {
          return {
            content: [{
              type: 'text' as const,
              text: `No emails found matching "${parsed.searchTerm}"`
            }],
            isError: false
          };
        }
        const emailsText = emails
          .map(email => `From: ${email.sender}\nSubject: ${email.subject}\nDate: ${email.dateSent}\nMailbox: ${email.mailbox}\n---\n${email.content}`)
          .join('\n\n');
        return {
          content: [{
            type: 'text' as const,
            text: emailsText
          }],
          isError: false
        };
      }

      case 'send': {
        const result = await mailUtil.sendMail(
          parsed.to,
          parsed.subject,
          parsed.body,
          parsed.cc,
          parsed.bcc
        );
        return {
          content: [{
            type: 'text' as const,
            text: result || `Email sent to ${parsed.to}`
          }],
          isError: false
        };
      }

      case 'mailboxes': {
        const mailboxes = parsed.account
          ? await mailUtil.getMailboxesForAccount(parsed.account)
          : await mailUtil.getMailboxes();
        if (mailboxes.length === 0) {
          return {
            content: [{
              type: 'text' as const,
              text: 'No mailboxes found'
            }],
            isError: false
          };
        }
        return {
          content: [{
            type: 'text' as const,
            text: `Mailboxes:\n${mailboxes.join('\n')}`
          }],
          isError: false
        };
      }

      case 'accounts': {
        const accounts = await mailUtil.getAccounts();
        if (accounts.length === 0) {
          return {
            content: [{
              type: 'text' as const,
              text: 'No email accounts configured'
            }],
            isError: false
          };
        }
        return {
          content: [{
            type: 'text' as const,
            text: `Email accounts:\n${accounts.join('\n')}`
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
        text: `Error with mail: ${error instanceof Error ? error.message : String(error)}`
      }],
      isError: true
    };
  }
}
