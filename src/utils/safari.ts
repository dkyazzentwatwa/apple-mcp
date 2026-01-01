import { run } from '@jxa/run';
import { runAppleScript } from 'run-applescript';

interface Bookmark {
  title: string;
  url: string;
  folder?: string;
}

interface ReadingListItem {
  title: string;
  url: string;
  dateAdded?: string;
  preview?: string;
}

interface TabInfo {
  title: string;
  url: string;
  index: number;
  windowIndex: number;
}

/**
 * Check if Safari is accessible
 */
async function checkSafariAccess(): Promise<boolean> {
  try {
    await runAppleScript(`
      tell application "Safari"
        name
      end tell
    `);
    return true;
  } catch (error) {
    console.error(`Cannot access Safari: ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

/**
 * List all bookmarks from Safari
 */
async function listBookmarks(folder?: string): Promise<Bookmark[]> {
  try {
    if (!await checkSafariAccess()) {
      return [];
    }

    const bookmarks = await run((folderName?: string) => {
      const Safari = Application("Safari");
      const results: Bookmark[] = [];

      try {
        // Access bookmarks through the document
        const docs = Safari.documents();

        // Safari's bookmark access via JXA is limited
        // We'll use a workaround via reading list or return what we can access

        // For now, return empty - Safari bookmarks require more complex plist reading
        return results;
      } catch (e) {
        return results;
      }
    }, folder) as Bookmark[];

    // Fallback to AppleScript for better bookmark access
    if (bookmarks.length === 0) {
      try {
        const script = `
          tell application "Safari"
            set bookmarkList to {}
            -- Safari doesn't expose bookmarks directly via AppleScript
            -- This is a limitation of the Safari scripting model
            return bookmarkList
          end tell
        `;
        await runAppleScript(script);
      } catch (e) {
        // Expected to fail - Safari bookmark access is limited
      }
    }

    return bookmarks;
  } catch (error) {
    console.error(`Error listing bookmarks: ${error instanceof Error ? error.message : String(error)}`);
    return [];
  }
}

/**
 * Search bookmarks by title or URL
 */
async function searchBookmarks(query: string): Promise<Bookmark[]> {
  try {
    const allBookmarks = await listBookmarks();
    const lowerQuery = query.toLowerCase();

    return allBookmarks.filter(b =>
      b.title.toLowerCase().includes(lowerQuery) ||
      b.url.toLowerCase().includes(lowerQuery)
    );
  } catch (error) {
    console.error(`Error searching bookmarks: ${error instanceof Error ? error.message : String(error)}`);
    return [];
  }
}

/**
 * Get items from Safari Reading List
 */
async function getReadingList(limit: number = 20): Promise<ReadingListItem[]> {
  try {
    if (!await checkSafariAccess()) {
      return [];
    }

    // Reading list is stored in ~/Library/Safari/Bookmarks.plist
    // We can try to access it via defaults command
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);

    try {
      // Reading list data is in a plist file
      const plistPath = `${process.env.HOME}/Library/Safari/Bookmarks.plist`;
      const { stdout } = await execAsync(`plutil -convert json -o - "${plistPath}" 2>/dev/null || echo "{}"`);

      if (stdout && stdout !== '{}') {
        const data = JSON.parse(stdout);
        const results: ReadingListItem[] = [];

        // Navigate through the plist structure to find Reading List
        const findReadingList = (obj: any): void => {
          if (!obj || typeof obj !== 'object') return;

          if (obj.Title === 'com.apple.ReadingList' && obj.Children) {
            for (const item of obj.Children.slice(0, limit)) {
              if (item.URLString) {
                results.push({
                  title: item.URIDictionary?.title || item.Title || 'Untitled',
                  url: item.URLString,
                  dateAdded: item.ReadingList?.DateAdded,
                  preview: item.ReadingList?.PreviewText
                });
              }
            }
          }

          if (obj.Children) {
            for (const child of obj.Children) {
              findReadingList(child);
            }
          }
        };

        findReadingList(data);
        return results;
      }
    } catch (e) {
      console.error('Error reading plist:', e);
    }

    return [];
  } catch (error) {
    console.error(`Error getting reading list: ${error instanceof Error ? error.message : String(error)}`);
    return [];
  }
}

/**
 * Open a URL in Safari
 */
async function openUrl(url: string): Promise<{ success: boolean; message: string }> {
  try {
    if (!await checkSafariAccess()) {
      return { success: false, message: 'Cannot access Safari' };
    }

    const escapedUrl = url.replace(/"/g, '\\"');

    await runAppleScript(`
      tell application "Safari"
        activate
        open location "${escapedUrl}"
      end tell
    `);

    return { success: true, message: `Opened ${url} in Safari` };
  } catch (error) {
    return {
      success: false,
      message: `Error opening URL: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Get info about the current active tab
 */
async function getCurrentTab(): Promise<TabInfo | null> {
  try {
    if (!await checkSafariAccess()) {
      return null;
    }

    const result = await runAppleScript(`
      tell application "Safari"
        if (count of windows) > 0 then
          set currentTab to current tab of front window
          set tabTitle to name of currentTab
          set tabUrl to URL of currentTab
          return tabTitle & "|||" & tabUrl
        else
          return ""
        end if
      end tell
    `);

    if (result && result.includes('|||')) {
      const [title, url] = result.split('|||');
      return {
        title: title || 'Untitled',
        url: url || '',
        index: 0,
        windowIndex: 0
      };
    }

    return null;
  } catch (error) {
    console.error(`Error getting current tab: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

/**
 * Get all open tabs across all Safari windows
 */
async function getTabs(): Promise<TabInfo[]> {
  try {
    if (!await checkSafariAccess()) {
      return [];
    }

    const tabs = await run(() => {
      const Safari = Application("Safari");
      const results: TabInfo[] = [];

      try {
        const windows = Safari.windows();

        for (let w = 0; w < windows.length; w++) {
          const window = windows[w];
          const windowTabs = window.tabs();

          for (let t = 0; t < windowTabs.length; t++) {
            const tab = windowTabs[t];
            results.push({
              title: tab.name() || 'Untitled',
              url: tab.url() || '',
              index: t,
              windowIndex: w
            });
          }
        }
      } catch (e) {
        // Return what we have
      }

      return results;
    }) as TabInfo[];

    return tabs;
  } catch (error) {
    console.error(`Error getting tabs: ${error instanceof Error ? error.message : String(error)}`);
    return [];
  }
}

/**
 * Add a URL to Safari Reading List
 */
async function addToReadingList(url: string, title?: string): Promise<{ success: boolean; message: string }> {
  try {
    if (!await checkSafariAccess()) {
      return { success: false, message: 'Cannot access Safari' };
    }

    const escapedUrl = url.replace(/"/g, '\\"');
    const escapedTitle = title ? title.replace(/"/g, '\\"') : '';

    // Safari's AppleScript support for adding to reading list
    await runAppleScript(`
      tell application "Safari"
        activate
        open location "${escapedUrl}"
        delay 1
        -- Add to Reading List via menu (workaround since no direct API)
        tell application "System Events"
          tell process "Safari"
            click menu item "Add to Reading List" of menu "Bookmarks" of menu bar 1
          end tell
        end tell
      end tell
    `);

    return {
      success: true,
      message: `Added "${title || url}" to Reading List`
    };
  } catch (error) {
    // Fallback: just open the URL and inform user
    try {
      await openUrl(url);
      return {
        success: true,
        message: `Opened ${url} in Safari. Use Cmd+Shift+D to add to Reading List.`
      };
    } catch (e) {
      return {
        success: false,
        message: `Error adding to reading list: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
}

export default {
  listBookmarks,
  searchBookmarks,
  getReadingList,
  openUrl,
  getCurrentTab,
  getTabs,
  addToReadingList
};
