<div align="center">

# 🍎 Apple MCP Server

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub](https://img.shields.io/badge/GitHub-dkyazzentwatwa%2Fapple--mcp-blue?logo=github)](https://github.com/dkyazzentwatwa/apple-mcp)

**Control your entire macOS ecosystem through Claude and other AI assistants**

A powerful Model Context Protocol (MCP) server that provides seamless integration with native Apple applications including Contacts, Notes, Messages, Mail, Reminders, Calendar, Maps, Safari, Photos, and Numbers.

<a href="https://glama.ai/mcp/servers/gq2qg6kxtu">
  <img width="380" height="200" src="https://glama.ai/mcp/servers/gq2qg6kxtu/badge" alt="Apple MCP Server" />
</a>

[Features](#-features) • [Installation](#-quick-install) • [Examples](#-example-usage) • [Contributing](#-contributing)

</div>

---

## ✨ Highlights

- 🗺️ **AI-Powered Route Analysis** - Get turn-by-turn directions with distance, duration, and alternative routes using native MapKit
- 📊 **Numbers Integration** - Full spreadsheet control with formulas, formatting, and intelligent structure awareness
- 🌐 **Safari Integration** - Access bookmarks, reading list, and open tabs
- 📸 **Photos Integration** - Search photos with ML-based recognition
- 💬 **iMessage Automation** - Send messages and read conversations
- 📧 **Mail Management** - Read, search, and send emails
- 🔒 **Privacy-First** - All processing happens locally on your Mac
- 🧩 **10 Native Apps** - Contacts, Notes, Messages, Mail, Reminders, Calendar, Maps, Safari, Photos, Numbers

## 🆕 What's New in v2.0

- **Modular Architecture**: Completely refactored for better maintainability
- **Numbers Integration**: Full Apple Numbers spreadsheet support with formulas, formatting, and smart structure detection
- **Safari Integration**: Access bookmarks, reading list, and open tabs
- **Photos Integration**: Search photos, list albums, get recent photos
- **AI-Powered Route Analysis**: Get detailed route information (distance, duration, turn-by-turn directions, alternative routes) using native MapKit framework
- **Updated MCP SDK**: Now using @modelcontextprotocol/sdk v1.25.x
- **Zod Validation**: Type-safe argument validation with better error messages
- **Testing**: Added comprehensive Vitest test suite with 100+ tests
- **Removed**: Web search tool (Claude has built-in web search)

## 🚀 Quick Install

### From Source (Recommended)

```bash
# Clone the repository
git clone https://github.com/dkyazzentwatwa/apple-mcp.git
cd apple-mcp

# Install dependencies
npm install

# Build Swift helpers for route analysis (requires Xcode Command Line Tools)
xcode-select --install  # If not already installed
npm run build:swift-helpers
```

Then add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "apple-mcp": {
      "command": "node",
      "args": ["/path/to/apple-mcp/build/index.js"]
    }
  }
}
```

Replace `/path/to/apple-mcp` with the actual path where you cloned the repository.

### Via Original Package

You can also install the original upstream package:

```bash
# For Claude Desktop
npx -y @smithery/cli@latest install @Dhravya/apple-mcp --client claude

# For Cursor
npx -y @smithery/cli@latest install @Dhravya/apple-mcp --client cursor
```

## 📋 Features

<details>
<summary>👥 <b>Contacts</b></summary>

- Search contacts by name
- Get all contacts with phone numbers
- Find contact names by phone number
</details>

<details>
<summary>📝 <b>Notes</b></summary>

- List all notes
- Search notes by title or content
- Create new notes (saves to "Claude" folder by default)
</details>

<details>
<summary>💬 <b>Messages (iMessage)</b></summary>

- Send iMessages to contacts
- Read message history from specific contacts
- Schedule messages for future delivery
- Get unread messages
</details>

<details>
<summary>📧 <b>Mail</b></summary>

- Read unread emails
- Search emails across accounts and mailboxes
- Send emails with to/cc/bcc support
- List mailboxes and accounts
</details>

<details>
<summary>✅ <b>Reminders</b></summary>

- List all reminder lists
- Search reminders by text
- Create reminders with due dates and notes
- Get reminders by list ID
</details>

<details>
<summary>📅 <b>Calendar</b></summary>

- Search events by text with date range filtering
- List upcoming events
- Create calendar events with full details
- Open specific events in Calendar app
</details>

<details open>
<summary>🗺️ <b>Maps (with AI-Powered Route Analysis)</b></summary>

- Search locations
- Save locations to favorites
- Get directions with transport type options
- **Analyze routes** with detailed information:
  - Distance and duration (in miles and minutes)
  - Turn-by-turn directions with per-step distances
  - Alternative routes comparison
  - Support for driving, walking, and transit
  - Polyline coordinates for visualization
  - 100% native MapKit - no external APIs
- Drop pins, create and manage guides
</details>

<details>
<summary>🌐 <b>Safari</b></summary>

- List and search bookmarks
- Access reading list items
- Get current tab information
- Get all open tabs
- Add URLs to reading list
</details>

<details>
<summary>📸 <b>Photos</b></summary>

- Search photos using ML-based recognition
- List all albums
- Get recent photos
- Get photos from specific albums
</details>

<details>
<summary>📊 <b>Numbers (Spreadsheets)</b></summary>

**Data Operations:**
- Read and write spreadsheet data
- Get table structure and metadata
- Search and find data across sheets
- Update cells, ranges, and append rows

**Advanced Features:**
- Formula operations (get/set formulas)
- Cell formatting (colors, fonts, alignment, text wrap)
- Bulk cell formatting for atomic operations
- Number formatting (currency, percentage, date, etc.)
- Row and column manipulation (insert/delete)
- Column width and row height control
- Cell merging and unmerging
- Smart insertion (after headers, after data, at end)

**💡 Intelligent Structure Awareness:**
- Automatically detects headers and footers
- Provides proper insertion points
- Prevents breaking document structure
- Supports multiple tables per sheet

**Note:** Documents must be open in Numbers to access them.
</details>

## 💡 Example Usage

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

```
Analyze the route from San Francisco to San Jose and suggest the fastest way to get there
```

```
Read the expenses from my Numbers spreadsheet and calculate the total
```

## 🔗 Workflow Examples

Chain multiple tools together:

```
Read the note about people I met at the conference, find their contacts,
and send them a message saying "Great meeting you!"
```

```
Check my unread emails, find any meeting invites, and add them to my calendar
```

```
Read my expenses from the Numbers spreadsheet, calculate the monthly total,
and create a reminder to review the budget
```

```
Get my upcoming calendar events for this week and add them to a new Numbers
spreadsheet with columns for Date, Event, and Duration
```

## 🛠️ Local Development

```bash
git clone https://github.com/dkyazzentwatwa/apple-mcp.git
cd apple-mcp
npm install
# Build Swift helpers for route analysis (requires Xcode Command Line Tools)
npm run build:swift-helpers
npm run dev
```

### Verify Setup

Run the setup checker to ensure all features are working:

```bash
./check-setup.sh
```

This will verify:
- Swift installation
- MapKit helper build status
- Route analysis functionality

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

## ⚙️ Requirements

- macOS (tested on Sequoia/Tahoe)
- Bun or Node.js 18+
- Xcode Command Line Tools (for route analysis feature): `xcode-select --install`
- Appropriate permissions for each Apple app

## 🔒 Privacy & Permissions

**All data processing happens locally on your Mac.** This server does not send any data to external services.

Grant the following permissions in **System Settings > Privacy & Security**:

- **Contacts**: Allow access to Contacts app
- **Calendar**: Allow access to Calendar app
- **Reminders**: Allow access to Reminders app
- **Full Disk Access**: Required for Messages database access
- **Automation**: Allow control of Mail, Safari, Photos, Maps, Notes

When you first use each tool, macOS will prompt you to grant the necessary permissions.

## 🐛 Troubleshooting

<details>
<summary><b>Route analysis not working</b></summary>

The route analysis feature requires the Swift MapKit helper to be built:

1. Install Xcode Command Line Tools: `xcode-select --install`
2. Navigate to the package directory
3. Run: `npm run build:swift-helpers`
4. Run: `./check-setup.sh` to verify
5. Restart Claude Desktop

Note: Basic Maps features (search, directions UI, guides) work without the Swift helper.
</details>

<details>
<summary><b>"Cannot access [App]" errors</b></summary>

Check **System Settings > Privacy & Security**:
- Grant permissions for the specific app
- For Messages, ensure "Full Disk Access" is enabled
- For Mail/Safari/Photos/Maps, ensure "Automation" is enabled
</details>

<details>
<summary><b>Installation fails with bunx</b></summary>

Try using `npx` instead:
```json
{
  "mcpServers": {
    "apple-mcp": {
      "command": "npx",
      "args": ["-y", "@dhravya/apple-mcp@latest"]
    }
  }
}
```
</details>

<details>
<summary><b>Swift build errors</b></summary>

Make sure you have Xcode Command Line Tools installed:
```bash
xcode-select --install
# Verify installation
swift --version
```
</details>

## 🤝 Contributing

Contributions are welcome! This is an open-source project and we'd love your help to make it better.

### How to Contribute

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes** and add tests if applicable
4. **Run tests**: `npm test`
5. **Commit your changes**: `git commit -m 'Add amazing feature'`
6. **Push to the branch**: `git push origin feature/amazing-feature`
7. **Open a Pull Request**

### Development Guidelines

- Read [CLAUDE.md](./CLAUDE.md) for codebase architecture and patterns
- Follow the existing code style
- Add tests for new features
- Update documentation as needed

### Ideas for Contributions

- 🐛 Bug fixes
- ✨ New Apple app integrations
- 📝 Improved Notes formatting support
- 🎨 Better error messages
- 📚 Documentation improvements
- 🧪 More test coverage

## 📜 License

[MIT](./LICENSE) © [Dhravya Shah](https://github.com/dhravya)

## 🙏 Acknowledgments

- Built with the [Model Context Protocol](https://modelcontextprotocol.io/)
- Powered by [Anthropic's Claude](https://www.anthropic.com/claude)
- Forked from [dhravya/apple-mcp](https://github.com/dhravya/apple-mcp)
- Thanks to all [contributors](https://github.com/dkyazzentwatwa/apple-mcp/graphs/contributors)

---

<div align="center">

**[⭐ Star this repo](https://github.com/dkyazzentwatwa/apple-mcp)** if you find it useful!

Made with ❤️ for the macOS + AI community

</div>
