import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { SafariArgsSchema } from '../schemas/safari.schema.js';
import { createToolSchema } from '../utils/schema-helper.js';
import safariUtil from '../utils/safari.js';

export const SAFARI_TOOL: Tool = {
  name: 'safari',
  description: 'Interact with Safari browser - bookmarks, reading list, tabs, and URL management',
  inputSchema: createToolSchema(SafariArgsSchema)
};

export async function handleSafari(args: unknown) {
  const parsed = SafariArgsSchema.parse(args);

  try {
    switch (parsed.operation) {
      case 'listBookmarks': {
        const bookmarks = await safariUtil.listBookmarks(parsed.folder);
        if (bookmarks.length === 0) {
          return {
            content: [{
              type: 'text' as const,
              text: 'No bookmarks found (Safari bookmark access is limited via scripting)'
            }],
            isError: false
          };
        }
        const bookmarksText = bookmarks
          .map(b => `- ${b.title}\n  URL: ${b.url}${b.folder ? `\n  Folder: ${b.folder}` : ''}`)
          .join('\n\n');
        return {
          content: [{
            type: 'text' as const,
            text: bookmarksText
          }],
          isError: false
        };
      }

      case 'searchBookmarks': {
        const bookmarks = await safariUtil.searchBookmarks(parsed.query);
        if (bookmarks.length === 0) {
          return {
            content: [{
              type: 'text' as const,
              text: `No bookmarks found matching "${parsed.query}"`
            }],
            isError: false
          };
        }
        const bookmarksText = bookmarks
          .map(b => `- ${b.title}: ${b.url}`)
          .join('\n');
        return {
          content: [{
            type: 'text' as const,
            text: bookmarksText
          }],
          isError: false
        };
      }

      case 'getReadingList': {
        const items = await safariUtil.getReadingList(parsed.limit || 20);
        if (items.length === 0) {
          return {
            content: [{
              type: 'text' as const,
              text: 'No reading list items found'
            }],
            isError: false
          };
        }
        const itemsText = items
          .map(item => `- ${item.title}\n  URL: ${item.url}${item.preview ? `\n  Preview: ${item.preview}` : ''}`)
          .join('\n\n');
        return {
          content: [{
            type: 'text' as const,
            text: `Reading List:\n\n${itemsText}`
          }],
          isError: false
        };
      }

      case 'openUrl': {
        const result = await safariUtil.openUrl(parsed.url);
        return {
          content: [{
            type: 'text' as const,
            text: result.message
          }],
          isError: !result.success
        };
      }

      case 'getCurrentTab': {
        const tab = await safariUtil.getCurrentTab();
        if (!tab) {
          return {
            content: [{
              type: 'text' as const,
              text: 'No active tab or Safari is not open'
            }],
            isError: false
          };
        }
        return {
          content: [{
            type: 'text' as const,
            text: `Current tab:\nTitle: ${tab.title}\nURL: ${tab.url}`
          }],
          isError: false
        };
      }

      case 'getTabs': {
        const tabs = await safariUtil.getTabs();
        if (tabs.length === 0) {
          return {
            content: [{
              type: 'text' as const,
              text: 'No open tabs or Safari is not running'
            }],
            isError: false
          };
        }
        const tabsText = tabs
          .map(tab => `[Window ${tab.windowIndex + 1}, Tab ${tab.index + 1}] ${tab.title}\n  ${tab.url}`)
          .join('\n\n');
        return {
          content: [{
            type: 'text' as const,
            text: `Open tabs:\n\n${tabsText}`
          }],
          isError: false
        };
      }

      case 'addToReadingList': {
        const result = await safariUtil.addToReadingList(parsed.url, parsed.title);
        return {
          content: [{
            type: 'text' as const,
            text: result.message
          }],
          isError: !result.success
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
        text: `Error with Safari: ${error instanceof Error ? error.message : String(error)}`
      }],
      isError: true
    };
  }
}
