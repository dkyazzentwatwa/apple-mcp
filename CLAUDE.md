# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` - Start the MCP server (uses Bun)
- `npm test` - Run all tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report
- `npx vitest run tests/unit/schemas/notes.schema.test.ts` - Run a single test file

## Architecture

This is an MCP (Model Context Protocol) server that exposes Apple app integrations as tools. The server communicates via stdio transport.

```
src/
├── index.ts          # Entry point, stdio transport setup
├── server.ts         # MCP server config, routes tool calls to handlers
├── schemas/          # Zod validation schemas (one per tool)
├── tools/            # Tool definitions and handlers
│   └── index.ts      # Tool registry - exports `tools` array and `handlers` object
└── utils/            # Apple app integrations (JXA/AppleScript)
```

**Data flow:** MCP request → `server.ts` → tool handler → utility function → AppleScript/JXA → Apple app

## Adding a New Tool

1. **Schema** (`src/schemas/newtool.schema.ts`): Use Zod discriminated union for operations
2. **Utility** (`src/utils/newtool.ts`): Implement JXA/AppleScript integrations
3. **Tool Handler** (`src/tools/newtool.tool.ts`): Define tool metadata + handler function
4. **Register** (`src/tools/index.ts`): Add to `tools` array and `handlers` object
5. **Export Schema** (`src/schemas/index.ts`)
6. **Tests** (`tests/unit/schemas/newtool.schema.test.ts`)

## Critical Gotchas

### JXA Context Limitations
**`console.error` and `console.log` do NOT exist inside JXA `run()` blocks.** This will crash:
```typescript
// BAD - will throw "console.error is not a function"
await run(() => {
  console.error("debug"); // ❌ Crashes
  return result;
});
```
Remove all console calls from inside `run()` blocks. Logging only works in the Node.js context outside `run()`.

### Apple Scripting API Limitations
- **Safari bookmarks**: Not accessible via AppleScript/JXA (macOS limitation)
- **Reminders in Groups/Folders**: Lists inside folder groups may not appear via `Reminders.lists()` - users need to move them to top level
- **Maps directions**: Use URL schemes (`maps://?saddr=...&daddr=...`) instead of JXA methods which don't exist
- **Photos**: ML-based search requires Photos app to be open

### AppleScript vs JXA
- **JXA (`@jxa/run`)**: Preferred for complex logic, better for iterating/mapping
- **AppleScript (`run-applescript`)**: Better for simple commands, sometimes more reliable for specific apps
- Both can be combined in a single utility file with fallback patterns

## Code Style

- ESM imports with `.js` extensions (required for bundler resolution)
- Use `import type` for type-only imports
- PascalCase for types/interfaces, camelCase for functions/variables
- Tool constants: `CONTACTS_TOOL`, schema files: `*.schema.ts`, tool files: `*.tool.ts`

## Dependencies

- `@modelcontextprotocol/sdk` - MCP protocol
- `@jxa/run` - JavaScript for Automation
- `run-applescript` - AppleScript execution
- `zod` + `zod-to-json-schema` - Schema validation
