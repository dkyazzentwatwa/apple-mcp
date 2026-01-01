# Changelog

All notable changes to this project will be documented in this file.

## [2.0.0] - 2025-12-30

### Added

- **Safari Integration**: New tool for Safari browser access
  - List and search bookmarks
  - Access reading list items
  - Get current tab and all open tabs info
  - Add URLs to reading list

- **Photos Integration**: New tool for Apple Photos access
  - Search photos using ML-based recognition
  - List all albums with photo counts
  - Get recent photos
  - Get photos from specific albums
  - Get detailed photo info

- **Zod Schema Validation**: All tool arguments now validated with Zod
  - Discriminated unions for operation-based tools
  - Type-safe argument parsing
  - Better error messages for invalid inputs

- **Testing Infrastructure**: Added Vitest test suite
  - Schema validation tests
  - Coverage reporting

- **Modular Architecture**: Complete codebase refactor
  - Separate files for schemas, tools, and utilities
  - Tool registry pattern for easy extension
  - Type-safe handler mapping

### Changed

- **MCP SDK**: Updated from v1.5.0 to v1.25.1
  - Better spec compliance
  - Improved error handling patterns

- **Entry Point**: Moved from `index.ts` to `src/index.ts`
  - Update your configurations if running locally

- **Dependencies**:
  - Added `zod-to-json-schema` for schema conversion
  - Added `vitest` and `@vitest/coverage-v8` for testing
  - Updated `run-applescript` to v7.1.0

### Removed

- **Web Search Tool**: Removed DuckDuckGo web search
  - Claude now has built-in web search capability

- **Unused Dependencies**: Removed bloat
  - `@hono/node-server`
  - `@types/express`
  - `mcp-proxy`

### Fixed

- Type safety improvements throughout codebase
- Better error handling in AppleScript operations
- Cleaner stdout filtering for MCP protocol

## [0.2.6] - Previous Release

- Initial public release with contacts, notes, messages, mail, reminders, calendar, and maps support
