import { run } from '@jxa/run';
import { runAppleScript } from 'run-applescript';

// Define types for our reminders
interface ReminderList {
    name: string;
    id: string;
    groupName?: string;  // The folder/group this list belongs to (if any)
    accountName?: string;  // The account this list belongs to
    reminderCount?: number;  // Number of reminders in this list
}

interface Reminder {
    name: string;
    id: string;
    body: string;
    completed: boolean;
    dueDate: string | null;
    listName: string;
    completionDate?: string | null;
    creationDate?: string | null;
    modificationDate?: string | null;
    remindMeDate?: string | null;
    priority?: number;
}

/**
 * Get all reminder lists including those inside groups/folders
 * Uses AppleScript for more reliable access across all accounts
 * @returns Array of reminder lists with their names, IDs, and optional group/account names
 */
async function getAllLists(): Promise<ReminderList[]> {
    // Try AppleScript first for more reliable results
    try {
        const script = `
tell application "Reminders"
    set output to ""

    -- Get all accounts and their lists
    repeat with acct in accounts
        set acctName to name of acct
        set acctLists to lists of acct

        repeat with currentList in acctLists
            set listName to name of currentList
            set listId to id of currentList
            set reminderCount to count of reminders of currentList

            -- Try to get container (group/folder) name
            set containerName to ""
            try
                set containerObj to container of currentList
                if containerObj is not missing value then
                    set cName to name of containerObj
                    -- Only use container name if it's a group, not the account
                    if cName is not equal to acctName then
                        set containerName to cName
                    end if
                end if
            end try

            -- Build JSON-like output (escape special characters)
            set output to output & "{"
            set output to output & "\\"name\\":\\"" & listName & "\\","
            set output to output & "\\"id\\":\\"" & listId & "\\","
            set output to output & "\\"accountName\\":\\"" & acctName & "\\","
            set output to output & "\\"groupName\\":\\"" & containerName & "\\","
            set output to output & "\\"reminderCount\\":" & reminderCount
            set output to output & "}|"
        end repeat
    end repeat

    -- Remove trailing separator if present
    if output ends with "|" then
        set output to text 1 thru -2 of output
    end if

    return output
end tell`;

        const result = await runAppleScript(script);

        if (result && result.length > 0) {
            const lists: ReminderList[] = [];
            const items = result.split('|');

            for (const item of items) {
                if (item.trim()) {
                    try {
                        // Parse our simple JSON-like format
                        const nameMatch = item.match(/"name":"([^"]*)"/);
                        const idMatch = item.match(/"id":"([^"]*)"/);
                        const accountMatch = item.match(/"accountName":"([^"]*)"/);
                        const groupMatch = item.match(/"groupName":"([^"]*)"/);
                        const countMatch = item.match(/"reminderCount":(\d+)/);

                        if (nameMatch && idMatch) {
                            lists.push({
                                name: nameMatch[1],
                                id: idMatch[1],
                                accountName: accountMatch?.[1] || undefined,
                                groupName: groupMatch?.[1] || undefined,
                                reminderCount: countMatch ? parseInt(countMatch[1], 10) : undefined
                            });
                        }
                    } catch (parseErr) {
                        // Skip malformed items
                    }
                }
            }

            if (lists.length > 0) {
                return lists;
            }
        }
    } catch (asError) {
        // Fall through to JXA approach
    }

    // Fallback to JXA approach
    const lists = await run(() => {
        const Reminders = Application('Reminders');
        const allLists: any[] = [];

        // Iterate through all accounts
        const accounts = Reminders.accounts();
        for (const account of accounts) {
            try {
                const accountName = account.name();
                const accountLists = account.lists();

                for (const list of accountLists) {
                    try {
                        let groupName: string | undefined;
                        let reminderCount = 0;

                        try {
                            reminderCount = list.reminders().length;
                        } catch (e) {
                            // Can't get reminder count
                        }

                        try {
                            const container = list.container();
                            if (container && container.name) {
                                const containerName = container.name();
                                if (containerName && containerName !== 'Reminders' && containerName !== accountName) {
                                    groupName = containerName;
                                }
                            }
                        } catch (e) {
                            // No container
                        }

                        allLists.push({
                            name: list.name(),
                            id: list.id(),
                            accountName: accountName,
                            groupName: groupName,
                            reminderCount: reminderCount
                        });
                    } catch (e) {
                        // Skip problematic lists
                    }
                }
            } catch (e) {
                // Skip problematic accounts
            }
        }

        return allLists;
    });

    return lists as ReminderList[];
}

/**
 * Get reminders from a specific list by ID with customizable properties
 * @param listId ID of the list to get reminders from
 * @param props Array of properties to include (optional)
 * @returns Array of reminders with specified properties
 */
async function getRemindersFromListById(listId: string, props?: string[]): Promise<any[]> {
    return await run((args: { id: string, props?: string[] }) => {
        const reminders = Application('Reminders');
        const list = reminders.lists.byId(args.id).reminders;
        const propNames = args.props || ['name', 'body', 'id', 'completed', 'completionDate', 'creationDate',
                        'dueDate', 'modificationDate', 'remindMeDate', 'priority'];

        // Get all values for each property at once (more efficient than per-reminder)
        const propValues: Record<string, any[]> = {};
        for (let i = 0; i < propNames.length; i++) {
            const prop = propNames[i];
            propValues[prop] = list[prop]();
        }

        const finalList = [];
        const count = propValues.name?.length || 0;

        // Flatten the object {name: string[], id: string[]} to an array of form
        // [{name: string, id: string}, ..., {name: string, id: string}]
        for (let i = 0; i < count; i++) {
            const reminder: Record<string, any> = {};
            for (let j = 0; j < propNames.length; j++) {
                const prop = propNames[j];
                reminder[prop] = propValues[prop][i];
            }
            finalList.push(reminder);
        }
        return finalList;
    }, { id: listId, props });
}

/**
 * Get all reminders from a specific list or all lists
 * @param listName Optional list name to filter by
 * @returns Array of reminders
 */
async function getAllReminders(listName?: string): Promise<Reminder[]> {
    const reminders = await run((listName: string | undefined) => {
        const Reminders = Application('Reminders');
        let allReminders: Reminder[] = [];
        
        if (listName) {
            // Get reminders from a specific list
            const lists = Reminders.lists.whose({name: listName})();
            if (lists.length > 0) {
                const list = lists[0];
                allReminders = list.reminders().map((reminder: any) => ({
                    name: reminder.name(),
                    id: reminder.id(),
                    body: reminder.body() || "",
                    completed: reminder.completed(),
                    dueDate: reminder.dueDate() ? reminder.dueDate().toISOString() : null,
                    listName: list.name()
                }));
            }
        } else {
            // Get reminders from all lists
            const lists = Reminders.lists();
            for (const list of lists) {
                const remindersInList = list.reminders().map((reminder: any) => ({
                    name: reminder.name(),
                    id: reminder.id(),
                    body: reminder.body() || "",
                    completed: reminder.completed(),
                    dueDate: reminder.dueDate() ? reminder.dueDate().toISOString() : null,
                    listName: list.name()
                }));
                allReminders = allReminders.concat(remindersInList);
            }
        }
        
        return allReminders;
    }, listName);
    
    return reminders as Reminder[];
}

/**
 * Search for reminders by text
 * @param searchText Text to search for in reminder names or notes
 * @returns Array of matching reminders
 */
async function searchReminders(searchText: string): Promise<Reminder[]> {
    const reminders = await run((searchText: string) => {
        const Reminders = Application('Reminders');
        const lists = Reminders.lists();
        let matchingReminders: Reminder[] = [];
        
        for (const list of lists) {
            // Search in reminder names and bodies
            const remindersInList = list.reminders.whose({
                _or: [
                    {name: {_contains: searchText}},
                    {body: {_contains: searchText}}
                ]
            })();
            
            if (remindersInList.length > 0) {
                const mappedReminders = remindersInList.map((reminder: any) => ({
                    name: reminder.name(),
                    id: reminder.id(),
                    body: reminder.body() || "",
                    completed: reminder.completed(),
                    dueDate: reminder.dueDate() ? reminder.dueDate().toISOString() : null,
                    listName: list.name()
                }));
                matchingReminders = matchingReminders.concat(mappedReminders);
            }
        }
        
        return matchingReminders;
    }, searchText);
    
    return reminders as Reminder[];
}

/**
 * Create a new reminder
 * @param name Name of the reminder
 * @param listName Name of the list to add the reminder to (creates if doesn't exist)
 * @param listId Optional ID of the list (takes precedence over listName)
 * @param notes Optional notes for the reminder
 * @param dueDate Optional due date for the reminder (ISO string)
 * @returns The created reminder
 */
async function createReminder(name: string, listName: string = "Reminders", listId?: string, notes?: string, dueDate?: string): Promise<Reminder> {
    const result = await run((args: { name: string, listName: string, listId?: string, notes?: string, dueDate?: string }) => {
        const Reminders = Application('Reminders');

        // Find the list by ID or name
        let list;
        if (args.listId) {
            // Use listId if provided (more precise)
            try {
                list = Reminders.lists.byId(args.listId);
                // Verify the list exists by accessing a property
                list.name();
            } catch (e) {
                throw new Error(`List with ID "${args.listId}" not found`);
            }
        } else {
            // Fall back to listName
            const existingLists = Reminders.lists.whose({name: args.listName})();

            if (existingLists.length > 0) {
                list = existingLists[0];
            } else {
                // Create a new list if it doesn't exist
                list = Reminders.make({new: 'list', withProperties: {name: args.listName}});
            }
        }

        // Create the reminder properties
        const reminderProps: any = {
            name: args.name
        };

        if (args.notes) {
            reminderProps.body = args.notes;
        }

        if (args.dueDate) {
            reminderProps.dueDate = new Date(args.dueDate);
        }

        // Create the reminder
        const newReminder = list.make({new: 'reminder', withProperties: reminderProps});

        return {
            name: newReminder.name(),
            id: newReminder.id(),
            body: newReminder.body() || "",
            completed: newReminder.completed(),
            dueDate: newReminder.dueDate() ? newReminder.dueDate().toISOString() : null,
            listName: list.name()
        };
    }, { name, listName, listId, notes, dueDate });

    return result as Reminder;
}

interface OpenReminderResult {
    success: boolean;
    message: string;
    reminder?: Reminder;
}

/**
 * Open the Reminders app and show a specific reminder
 * @param searchText Text to search for in reminder names or notes
 * @returns Result of the operation
 */
async function openReminder(searchText: string): Promise<OpenReminderResult> {
    // First search for the reminder
    const matchingReminders = await searchReminders(searchText);
    
    if (matchingReminders.length === 0) {
        return { success: false, message: "No matching reminders found" };
    }
    
    // Open the first matching reminder
    const reminder = matchingReminders[0];
    
    await run((reminderId: string) => {
        const Reminders = Application('Reminders');
        Reminders.activate();
        
        // Try to show the reminder
        // Note: This is a best effort as there's no direct way to show a specific reminder
        // We'll just open the app and return the reminder details
        
        return true;
    }, reminder.id);
    
    return { 
        success: true, 
        message: "Reminders app opened", 
        reminder 
    };
}


/**
 * Create a new reminder list
 * @param listName Name of the list to create
 * @returns The created list info
 */
async function createList(listName: string): Promise<ReminderList> {
    const result = await run((listName: string) => {
        const Reminders = Application('Reminders');

        // Check if list already exists
        const existingLists = Reminders.lists.whose({name: listName})();
        if (existingLists.length > 0) {
            const existing = existingLists[0];
            return {
                name: existing.name(),
                id: existing.id(),
                alreadyExists: true
            };
        }

        // Create the new list
        const newList = Reminders.make({new: 'list', withProperties: {name: listName}});

        return {
            name: newList.name(),
            id: newList.id(),
            alreadyExists: false
        };
    }, listName);

    return result as ReminderList;
}

/**
 * Mark a reminder as complete or incomplete
 * @param reminderId ID of the reminder
 * @param completed Whether the reminder should be marked complete (true) or incomplete (false)
 * @returns The updated reminder
 */
async function completeReminder(reminderId: string, completed: boolean = true): Promise<Reminder> {
    const result = await run((args: { reminderId: string, completed: boolean }) => {
        const Reminders = Application('Reminders');

        // Find the reminder across all lists
        const lists = Reminders.lists();
        for (const list of lists) {
            try {
                const reminder = list.reminders.byId(args.reminderId);
                // Verify reminder exists by accessing a property
                reminder.name();

                // Update the completed status
                reminder.completed = args.completed;

                return {
                    name: reminder.name(),
                    id: reminder.id(),
                    body: reminder.body() || "",
                    completed: reminder.completed(),
                    dueDate: reminder.dueDate() ? reminder.dueDate().toISOString() : null,
                    listName: list.name()
                };
            } catch (e) {
                // Reminder not in this list, continue searching
            }
        }

        throw new Error(`Reminder with ID "${args.reminderId}" not found`);
    }, { reminderId, completed });

    return result as Reminder;
}

/**
 * Update a reminder's properties
 * @param reminderId ID of the reminder to update
 * @param name Optional new name
 * @param notes Optional new notes
 * @param dueDate Optional new due date (ISO string, or empty string to clear)
 * @returns The updated reminder
 */
async function updateReminder(reminderId: string, name?: string, notes?: string, dueDate?: string): Promise<Reminder> {
    const result = await run((args: { reminderId: string, name?: string, notes?: string, dueDate?: string }) => {
        const Reminders = Application('Reminders');

        // Find the reminder across all lists
        const lists = Reminders.lists();
        for (const list of lists) {
            try {
                const reminder = list.reminders.byId(args.reminderId);
                // Verify reminder exists by accessing a property
                reminder.name();

                // Update properties if provided
                if (args.name !== undefined) {
                    reminder.name = args.name;
                }

                if (args.notes !== undefined) {
                    reminder.body = args.notes;
                }

                if (args.dueDate !== undefined) {
                    if (args.dueDate === '') {
                        // Clear the due date
                        reminder.dueDate = null;
                    } else {
                        reminder.dueDate = new Date(args.dueDate);
                    }
                }

                return {
                    name: reminder.name(),
                    id: reminder.id(),
                    body: reminder.body() || "",
                    completed: reminder.completed(),
                    dueDate: reminder.dueDate() ? reminder.dueDate().toISOString() : null,
                    listName: list.name()
                };
            } catch (e) {
                // Reminder not in this list, continue searching
            }
        }

        throw new Error(`Reminder with ID "${args.reminderId}" not found`);
    }, { reminderId, name, notes, dueDate });

    return result as Reminder;
}

/**
 * Delete a reminder
 * @param reminderId ID of the reminder to delete
 * @returns Success status
 */
async function deleteReminder(reminderId: string): Promise<{ success: boolean, message: string }> {
    const result = await run((reminderId: string) => {
        const Reminders = Application('Reminders');

        // Find the reminder across all lists
        const lists = Reminders.lists();
        for (const list of lists) {
            try {
                const reminder = list.reminders.byId(reminderId);
                // Verify reminder exists by getting its name
                const reminderName = reminder.name();

                // Delete the reminder
                reminder.delete();

                return {
                    success: true,
                    message: `Deleted reminder "${reminderName}"`
                };
            } catch (e) {
                // Reminder not in this list, continue searching
            }
        }

        return {
            success: false,
            message: `Reminder with ID "${reminderId}" not found`
        };
    }, reminderId);

    return result as { success: boolean, message: string };
}

export default { getAllLists, getAllReminders, searchReminders, createReminder, openReminder, getRemindersFromListById, createList, completeReminder, updateReminder, deleteReminder }; 