/**
 * Centralized escaping utilities for safely interpolating user input
 * into AppleScript strings, shell commands, and SQL queries.
 */

/**
 * Escape a string for safe interpolation inside AppleScript double-quoted strings.
 * Handles backslashes, double quotes, newlines, and carriage returns.
 *
 * Usage: `set x to "${escapeAppleScript(userInput)}"`
 */
export function escapeAppleScript(s: string): string {
  return s
    .replace(/\\/g, '\\\\')      // Backslashes first (must be before other escapes)
    .replace(/"/g, '\\"')         // Double quotes
    .replace(/\r\n/g, '\\r\\n')   // Windows newlines
    .replace(/\r/g, '\\r')        // Carriage returns
    .replace(/\n/g, '\\n');       // Newlines
}

/**
 * Escape a string for safe use as a POSIX shell single-quoted argument.
 * The strategy: wrap in single quotes, and for any embedded single quote,
 * end the single-quoted string, add an escaped single quote, and re-open.
 *
 * Usage: `echo ${escapeShellArg(userInput)}`
 *   (the return value already includes surrounding quotes)
 */
export function escapeShellArg(s: string): string {
  // Replace each ' with '\'' (end quote, escaped quote, re-open quote)
  return "'" + s.replace(/'/g, "'\\''") + "'";
}

/**
 * Escape a string for safe interpolation inside a SQL single-quoted literal.
 * Doubles any single quotes per the SQL standard.
 *
 * Usage: `WHERE name = '${escapeSQLString(userInput)}'`
 */
export function escapeSQLString(s: string): string {
  return s.replace(/'/g, "''");
}
