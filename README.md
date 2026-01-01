# Apple MCP Tools v2.0

[![smithery badge](https://smithery.ai/badge/@Dhravya/apple-mcp)](https://smithery.ai/server/@Dhravya/apple-mcp)

A comprehensive MCP server providing Claude and other AI assistants access to native Apple applications on macOS.

<a href="https://glama.ai/mcp/servers/gq2qg6kxtu">
  <img width="380" height="200" src="https://glama.ai/mcp/servers/gq2qg6kxtu/badge" alt="Apple Server MCP server" />
</a>

## What's New in v2.0

- **Modular Architecture**: Completely refactored for better maintainability
- **Safari Integration**: Access bookmarks, reading list, and open tabs
- **Photos Integration**: Search photos, list albums, get recent photos
- **Updated MCP SDK**: Now using @modelcontextprotocol/sdk v1.25.x
- **Zod Validation**: Type-safe argument validation with better error messages
- **Testing**: Added Vitest test suite
- **Removed**: Web search tool (Claude has built-in web search)

## Quick Install

### Via Smithery (Recommended)

```bash
# For Claude Desktop
npx -y @smithery/cli@latest install @Dhravya/apple-mcp --client claude

# For Cursor
npx -y @smithery/cli@latest install @Dhravya/apple-mcp --client cursor
```

### Manual Configuration

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "apple-mcp": {
      "command": "bunx",
      "args": ["@dhravya/apple-mcp@latest"]
    }
  }
}
```

## Features

### Contacts
- Search contacts by name
- Get all contacts with phone numbers
- Find contact names by phone number

### Notes
- List all notes
- Search notes by title or content
- Create new notes (saves to "Claude" folder by default)

### Messages
- Send iMessages
- Read message history from specific contacts
- Schedule messages for future delivery
- Get unread messages

### Mail
- Read unread emails
- Search emails across accounts and mailboxes
- Send emails with to/cc/bcc support
- List mailboxes and accounts

### Reminders
- List all reminder lists
- Search reminders by text
- Create reminders with due dates and notes
- Get reminders by list ID

### Calendar
- Search events by text with date range filtering
- List upcoming events
- Create calendar events with full details
- Open specific events in Calendar app

### Maps
- Search locations
- Save locations to favorites
- Get directions with transport type options
- Drop pins, create and manage guides

### Safari (New in v2.0)
- List and search bookmarks
- Access reading list items
- Get current tab info
- Get all open tabs
- Add URLs to reading list

### Photos (New in v2.0)
- Search photos using ML-based recognition
- List all albums
- Get recent photos
- Get photos from specific albums

## Example Usage

```
Send a message to John saying "See you tomorrow!"
```

```
Read my notes about the project meeting and summarize them
```

```
Create a reminder to "Buy groceries" for tomorrow at 5pm
```

```
What events do I have scheduled this week?
```

```
Search my photos for "beach vacation"
```

```
Show me my Safari reading list
```

## Workflow Examples

Chain multiple tools together:

```
Read the note about people I met at the conference, find their contacts,
and send them a message saying "Great meeting you!"
```

```
Check my unread emails, find any meeting invites, and add them to my calendar
```

## Local Development

```bash
git clone https://github.com/dhravya/apple-mcp.git
cd apple-mcp
npm install
npm run dev
```

### Running Tests

```bash
npm test
npm run test:coverage
```

### Project Structure

```
src/
├── index.ts          # Entry point
├── server.ts         # MCP server configuration
├── schemas/          # Zod validation schemas
├── tools/            # Tool definitions and handlers
└── utils/            # Apple app integrations (JXA/AppleScript)
```

## Requirements

- macOS (tested on Sequoia/Tahoe)
- Bun or Node.js 18+
- Appropriate permissions for each Apple app

## Permissions

Grant the following permissions in System Settings > Privacy & Security:

- **Contacts**: Allow access to Contacts
- **Calendar**: Allow access to Calendar
- **Reminders**: Allow access to Reminders
- **Full Disk Access**: Required for Messages database access
- **Automation**: Allow control of Mail, Safari, Photos, Maps

## License

MIT

## Contributing

Contributions welcome! Please read the CLAUDE.md for development guidelines.
