import { run } from '@jxa/run';

// Define types for our calendar events
interface CalendarEventAttendee {
    name: string | null;
    email: string | null;
    status: string | null;
}

interface CalendarEvent {
    id: string;
    title: string;
    location: string | null;
    notes: string | null;
    startDate: string | null;
    endDate: string | null;
    calendarName: string;
    isAllDay: boolean;
    url: string | null;
    attendees: CalendarEventAttendee[];
}

interface SearchFilters {
    searchText?: string;
    location?: string;
    attendee?: string;
}

// Configuration for timeouts and limits
const CONFIG = {
    // Maximum time (in ms) to wait for calendar operations
    TIMEOUT_MS: 8000,
    // Maximum number of calendars to process
    MAX_CALENDARS: 1
};

/**
 * Check if the Calendar app is accessible
 * @returns Promise resolving to true if Calendar is accessible, throws error otherwise
 */
async function checkCalendarAccess(): Promise<boolean> {
    try {
        // Try to access Calendar app as a simple test
        const result = await run(() => {
            try {
                // Try to directly access Calendar without launching it first
                const Calendar = Application("Calendar");
                Calendar.name(); // Just try to get the name to test access
                return true;
            } catch (e) {
                // Don't use console.log in JXA
                throw new Error("Cannot access Calendar app");
            }
        }) as boolean;

        return result;
    } catch (error) {
        console.error(`Cannot access Calendar app: ${error instanceof Error ? error.message : String(error)}`);
        return false;
    }
}

/**
 * Search for calendar events using filters (searchText, location, attendee)
 * @param filters Search filters to apply
 * @param limit Optional limit on the number of results (default 10)
 * @param fromDate Optional start date for search range in ISO format (default: today)
 * @param toDate Optional end date for search range in ISO format (default: 30 days from now)
 * @returns Array of calendar events matching the search criteria
 */
async function searchEvents(
    filters: SearchFilters,
    limit: number = 10,
    fromDate?: string,
    toDate?: string
): Promise<CalendarEvent[]> {
    try {
        if (!await checkCalendarAccess()) {
            return [];
        }

        console.error(`searchEvents - Processing calendars for search with filters: ${JSON.stringify(filters)}`);

        const events = await run((args: {
            searchText?: string,
            locationFilter?: string,
            attendeeFilter?: string,
            limit: number,
            fromDate?: string,
            toDate?: string
        }) => {
            try {
                const Calendar = Application("Calendar");

                // Set default date range if not provided (today to 30 days from now)
                const today = new Date();
                const defaultStartDate = today;
                const defaultEndDate = new Date();
                defaultEndDate.setDate(today.getDate() + 30);

                const startDate = args.fromDate ? new Date(args.fromDate) : defaultStartDate;
                const endDate = args.toDate ? new Date(args.toDate) : defaultEndDate;

                // Array to store matching events
                const matchingEvents: CalendarEvent[] = [];

                // Get all calendars at once
                const allCalendars = Calendar.calendars();

                // Search in each calendar
                for (let i = 0; i < allCalendars.length && matchingEvents.length < args.limit; i++) {
                    try {
                        const calendar = allCalendars[i];
                        const calendarName = calendar.name();

                        // Build .whose() conditions — only date range at JXA level
                        // searchText matches across summary/location/notes so we filter in JS
                        const conditions: object[] = [
                            { startDate: { _greaterThan: startDate } },
                            { endDate: { _lessThan: endDate } }
                        ];

                        // Location filter can be applied at JXA level as a partial (substring) match
                        if (args.locationFilter) {
                            conditions.push({ location: { _contains: args.locationFilter } });
                        }

                        const filteredEvents = calendar.events.whose({ _and: conditions });

                        // === BATCH PROPERTY ACCESS ===
                        // Fetch all properties in bulk (1 IPC call per property, not per event)
                        let uids: string[];
                        let summaries: string[];
                        let locations: string[];
                        let descriptions: string[];
                        let startDates: Date[];
                        let endDates: Date[];
                        let allDays: boolean[];
                        let urls: string[];

                        try {
                            uids = filteredEvents.uid();
                            summaries = filteredEvents.summary();
                            locations = filteredEvents.location();
                            descriptions = filteredEvents.description();
                            startDates = filteredEvents.startDate();
                            endDates = filteredEvents.endDate();
                            allDays = filteredEvents.alldayEvent();
                            urls = filteredEvents.url();
                        } catch (e) {
                            // No events matched the query for this calendar
                            continue;
                        }

                        const eventCount = uids.length;

                        // Pass 1: Assemble candidates from batch arrays, apply date + searchText filters
                        // Don't cap by limit here when attendee filter is present — the attendee
                        // pass will further narrow, so we need a larger candidate pool
                        const hasAttendeeFilter = !!args.attendeeFilter;
                        const candidateIndices: number[] = [];
                        for (let j = 0; j < eventCount; j++) {
                            // Cap candidates by limit only when there's no attendee filter
                            if (!hasAttendeeFilter && matchingEvents.length + candidateIndices.length >= args.limit) break;

                            try {
                                const eventStartDate = new Date(startDates[j]);
                                const eventEndDate = new Date(endDates[j]);

                                // Skip events outside our date range
                                if (eventEndDate < startDate || eventStartDate > endDate) {
                                    continue;
                                }

                                // Apply searchText filter in JS across summary, location, and notes
                                if (args.searchText) {
                                    const searchLower = args.searchText.toLowerCase();
                                    const title = (summaries[j] || "").toLowerCase();
                                    const loc = (locations[j] || "").toLowerCase();
                                    const notes = (descriptions[j] || "").toLowerCase();
                                    if (!title.includes(searchLower) && !loc.includes(searchLower) && !notes.includes(searchLower)) {
                                        continue;
                                    }
                                }

                                candidateIndices.push(j);
                            } catch (e) {
                                // Skip events we can't process
                                continue;
                            }
                        }

                        // Resolve events once for attendee lookups (used in pass 2 and hydration)
                        let resolvedEvents: any[] | null = null;

                        // Pass 2: If attendee filter is present, fetch attendees for candidates only
                        // This is expensive (per-event IPC) so we minimize the candidate set first
                        const attendeeData: Map<number, CalendarEventAttendee[]> = new Map();
                        if (hasAttendeeFilter) {
                            const attendeeFilterLower = args.attendeeFilter!.toLowerCase();
                            const filteredCandidates: number[] = [];
                            resolvedEvents = filteredEvents();

                            for (const idx of candidateIndices) {
                                // Stop once we have enough matches
                                if (matchingEvents.length + filteredCandidates.length >= args.limit) break;

                                try {
                                    const event = resolvedEvents![idx];
                                    const eventAttendees: CalendarEventAttendee[] = [];
                                    let matchesAttendee = false;

                                    try {
                                        const attendees = event.attendees();
                                        for (let a = 0; a < attendees.length; a++) {
                                            let name: string | null = null;
                                            let email: string | null = null;
                                            let status: string | null = null;

                                            try { name = attendees[a].displayName(); } catch (e) { /* no name */ }
                                            try { email = attendees[a].email(); } catch (e) { /* no email */ }
                                            try { status = attendees[a].participationStatus(); } catch (e) { /* no status */ }

                                            eventAttendees.push({ name, email, status });

                                            if (!matchesAttendee) {
                                                if ((name && name.toLowerCase().includes(attendeeFilterLower)) ||
                                                    (email && email.toLowerCase().includes(attendeeFilterLower))) {
                                                    matchesAttendee = true;
                                                }
                                            }
                                        }
                                    } catch (e) {
                                        // No attendees on this event
                                    }

                                    if (matchesAttendee) {
                                        filteredCandidates.push(idx);
                                        attendeeData.set(idx, eventAttendees);
                                    }
                                } catch (e) {
                                    continue;
                                }
                            }

                            // Replace candidates with filtered set
                            candidateIndices.length = 0;
                            candidateIndices.push(...filteredCandidates);
                        }

                        // Build final event objects from batch arrays
                        for (const idx of candidateIndices) {
                            if (matchingEvents.length >= args.limit) break;

                            const eventData: CalendarEvent = {
                                id: uids[idx] || `unknown-${Date.now()}-${Math.random()}`,
                                title: summaries[idx] || "Unknown Title",
                                location: locations[idx] || null,
                                notes: descriptions[idx] || null,
                                startDate: null,
                                endDate: null,
                                calendarName: calendarName,
                                isAllDay: allDays[idx] || false,
                                url: urls[idx] || null,
                                attendees: attendeeData.get(idx) || []
                            };

                            try { eventData.startDate = new Date(startDates[idx]).toISOString(); }
                            catch (e) { /* Keep as null */ }

                            try { eventData.endDate = new Date(endDates[idx]).toISOString(); }
                            catch (e) { /* Keep as null */ }

                            // If no attendee filter was used but we still want attendee data,
                            // fetch attendees for the final result set
                            if (!hasAttendeeFilter && eventData.attendees.length === 0) {
                                try {
                                    // Resolve once per calendar, reuse for all events
                                    if (!resolvedEvents) {
                                        resolvedEvents = filteredEvents();
                                    }
                                    const event = resolvedEvents[idx];
                                    const attendees = event.attendees();
                                    for (let a = 0; a < attendees.length; a++) {
                                        let name: string | null = null;
                                        let email: string | null = null;
                                        let status: string | null = null;
                                        try { name = attendees[a].displayName(); } catch (e) { /* */ }
                                        try { email = attendees[a].email(); } catch (e) { /* */ }
                                        try { status = attendees[a].participationStatus(); } catch (e) { /* */ }
                                        eventData.attendees.push({ name, email, status });
                                    }
                                } catch (e) {
                                    // No attendees
                                }
                            }

                            matchingEvents.push(eventData);
                        }
                    } catch (e) {
                        // Skip calendars we can't access
                        continue;
                    }
                }

                return matchingEvents;
            } catch (e) {
                return []; // Return empty array on any error
            }
        }, {
            searchText: filters.searchText,
            locationFilter: filters.location,
            attendeeFilter: filters.attendee,
            limit,
            fromDate,
            toDate
        }) as CalendarEvent[];

        if (events.length === 0) {
            console.error("searchEvents - No events found");
            return [];
        }

        return events;
    } catch (error) {
        console.error(`Error searching events: ${error instanceof Error ? error.message : String(error)}`);
        return [];
    }
}


/**
 * Open a specific calendar event in the Calendar app
 * @param eventId ID of the event to open
 * @returns Result object indicating success or failure
 */
async function openEvent(eventId: string): Promise<{ success: boolean; message: string }> {
    try {
        if (!await checkCalendarAccess()) {
            return {
                success: false,
                message: "Cannot access Calendar app. Please grant access in System Settings > Privacy & Security > Automation."
            };
        }

        console.error(`openEvent - Attempting to open event with ID: ${eventId}`);

        const result = await run((args: {
            eventId: string
        }) => {
            try {
                const Calendar = Application("Calendar");

                // Get all calendars at once
                const allCalendars = Calendar.calendars();

                // Search in each calendar
                for (let i = 0; i < allCalendars.length; i++) {
                    try {
                        const calendar = allCalendars[i];

                        // Get the event from this calendar
                        const events = calendar.events.whose({
                            uid: { _equals: args.eventId }
                        });

                        const event = events[0]

                        if(event.uid() === args.eventId) {
                            Calendar.activate();
                            event.show();
                            return {
                                success: true,
                                message: `Successfully opened event: ${event.summary()}`
                            };
                        }

                    } catch (e) {
                        // Skip calendars we can't access
                        continue;
                    }
                }

                return {
                    success: false,
                    message: `No event found with ID: ${args.eventId}`
                };
            } catch (e) {
                return {
                    success: false,
                    message: "Error opening event"
                };
            }
        }, {
            eventId
        }) as { success: boolean; message: string };

        return result;
    } catch (error) {
        return {
            success: false,
            message: `Error opening event: ${error instanceof Error ? error.message : String(error)}`
        };
    }
}

/**
 * Get all calendar events in a specified date range
 * @param limit Optional limit on the number of results (default 10)
 * @param fromDate Optional start date for search range in ISO format (default: today)
 * @param toDate Optional end date for search range in ISO format (default: 7 days from now)
 * @returns Array of calendar events in the specified date range
 */
async function getEvents(
    limit: number = 10,
    fromDate?: string,
    toDate?: string
): Promise<CalendarEvent[]> {
    try {
        console.error("getEvents - Starting to fetch calendar events");

        if (!await checkCalendarAccess()) {
            console.error("getEvents - Failed to access Calendar app");
            return [];
        }
        console.error("getEvents - Calendar access check passed");

        const events = await run((args: {
            limit: number,
            fromDate?: string,
            toDate?: string
        }) => {
            try {
                // Access the Calendar app directly
                const Calendar = Application("Calendar");

                // Set default date range if not provided (today to 7 days from now)
                const today = new Date();
                const defaultStartDate = today;
                const defaultEndDate = new Date();
                defaultEndDate.setDate(today.getDate() + 7);

                const startDate = args.fromDate ? new Date(args.fromDate) : defaultStartDate;
                const endDate = args.toDate ? new Date(args.toDate) : defaultEndDate;

                const calendars = Calendar.calendars();

                // Array to store events
                const events: CalendarEvent[] = [];

                // Get events from each calendar
                for (const calender of calendars) {
                    if (events.length >= args.limit) break;

                    try {
                        // Get all events from this calendar using .whose()
                        const filteredEvents = calender.events.whose({
                            _and: [
                                { startDate: { _greaterThan: startDate } },
                                { endDate: { _lessThan: endDate } }
                            ]
                        });

                        // === BATCH PROPERTY ACCESS ===
                        let uids: string[];
                        let summaries: string[];
                        let locations: string[];
                        let descriptions: string[];
                        let startDates: Date[];
                        let endDates: Date[];
                        let allDays: boolean[];
                        let urls: string[];

                        try {
                            uids = filteredEvents.uid();
                            summaries = filteredEvents.summary();
                            locations = filteredEvents.location();
                            descriptions = filteredEvents.description();
                            startDates = filteredEvents.startDate();
                            endDates = filteredEvents.endDate();
                            allDays = filteredEvents.alldayEvent();
                            urls = filteredEvents.url();
                        } catch (e) {
                            // No events matched the query for this calendar
                            continue;
                        }

                        const eventCount = uids.length;

                        // Collect indices of events to include, then resolve once for attendees
                        const includedIndices: number[] = [];
                        for (let j = 0; j < eventCount && events.length + includedIndices.length < args.limit; j++) {
                            try {
                                const eventStartDate = new Date(startDates[j]);
                                const eventEndDate = new Date(endDates[j]);

                                // Skip events outside our date range
                                if (eventEndDate < startDate || eventStartDate > endDate) {
                                    continue;
                                }

                                includedIndices.push(j);
                            } catch (e) {
                                continue;
                            }
                        }

                        // Resolve events once per calendar for attendee lookups
                        let resolvedEvents: any[] | null = null;
                        if (includedIndices.length > 0) {
                            try { resolvedEvents = filteredEvents(); } catch (e) { /* */ }
                        }

                        for (const j of includedIndices) {
                            if (events.length >= args.limit) break;

                            const eventData: CalendarEvent = {
                                id: uids[j] || `unknown-${Date.now()}-${Math.random()}`,
                                title: summaries[j] || "Unknown Title",
                                location: locations[j] || null,
                                notes: descriptions[j] || null,
                                startDate: null,
                                endDate: null,
                                calendarName: calender.name(),
                                isAllDay: allDays[j] || false,
                                url: urls[j] || null,
                                attendees: []
                            };

                            try { eventData.startDate = new Date(startDates[j]).toISOString(); }
                            catch (e) { /* Keep as null */ }

                            try { eventData.endDate = new Date(endDates[j]).toISOString(); }
                            catch (e) { /* Keep as null */ }

                            // Fetch attendees using pre-resolved events
                            if (resolvedEvents) {
                                try {
                                    const event = resolvedEvents[j];
                                    const attendees = event.attendees();
                                    for (let a = 0; a < attendees.length; a++) {
                                        let name: string | null = null;
                                        let email: string | null = null;
                                        let status: string | null = null;
                                        try { name = attendees[a].displayName(); } catch (e) { /* */ }
                                        try { email = attendees[a].email(); } catch (e) { /* */ }
                                        try { status = attendees[a].participationStatus(); } catch (e) { /* */ }
                                        eventData.attendees.push({ name, email, status });
                                    }
                                } catch (e) {
                                    // No attendees
                                }
                            }

                            events.push(eventData);
                        }
                    } catch (e) {
                        // Skip calendars we can't access
                        continue;
                    }
                }
                return events;
            } catch (e) {
                return []; // Return empty array on any error
            }
        }, {
            limit,
            fromDate,
            toDate
        }) as CalendarEvent[];

        // If no events found
        if (events.length === 0) {
            console.error("getEvents - No events found");
            return [];
        }

        return events;
    } catch (error) {
        console.error(`Error getting events: ${error instanceof Error ? error.message : String(error)}`);
        return [];
    }
}

/**
 * Create a new calendar event
 * @param title Title of the event
 * @param startDate Start date/time in ISO format
 * @param endDate End date/time in ISO format
 * @param location Optional location of the event
 * @param notes Optional notes for the event
 * @param isAllDay Optional flag to create an all-day event
 * @param calendarName Optional calendar name to add the event to (uses default if not specified)
 * @returns Result object indicating success or failure, including the created event ID
 */
async function createEvent(
    title: string,
    startDate: string,
    endDate: string,
    location?: string,
    notes?: string,
    isAllDay: boolean = false,
    calendarName?: string
): Promise<{ success: boolean; message: string; eventId?: string }> {
    try {
        if (!await checkCalendarAccess()) {
            return {
                success: false,
                message: "Cannot access Calendar app. Please grant access in System Settings > Privacy & Security > Automation."
            };
        }

        console.error(`createEvent - Attempting to create event: "${title}"`);

        const result = await run((args: {
            title: string,
            startDate: string,
            endDate: string,
            location?: string,
            notes?: string,
            isAllDay: boolean,
            calendarName?: string
        }) => {
            try {
                const Calendar = Application("Calendar");

                // Parse dates
                const startDateTime = new Date(args.startDate);
                const endDateTime = new Date(args.endDate);

                // Find the target calendar
                let targetCalendar;
                if (args.calendarName) {
                    // Find the specified calendar
                    const calendars = Calendar.calendars.whose({
                        name: { _equals: args.calendarName }
                    });

                    if (calendars.length > 0) {
                        targetCalendar = calendars[0];
                    } else {
                        return {
                            success: false,
                            message: `Calendar "${args.calendarName}" not found.`
                        };
                    }
                } else {
                    // Use default calendar
                    // Calendar.defaultCalendar() doesn't exist - get the first calendar instead
                    const allCalendars = Calendar.calendars();
                    if (allCalendars.length === 0) {
                        return {
                            success: false,
                            message: "No calendars found in Calendar app."
                        };
                    }
                    targetCalendar = allCalendars[0];
                }

                // Create the new event
                const newEvent = Calendar.Event({
                    summary: args.title,
                    startDate: startDateTime,
                    endDate: endDateTime,
                    location: args.location || "",
                    description: args.notes || "",
                    alldayEvent: args.isAllDay
                });

                // Add the event to the calendar
                targetCalendar.events.push(newEvent);

                return {
                    success: true,
                    message: `Event "${args.title}" created successfully.`,
                    eventId: newEvent.uid()
                };
            } catch (e) {
                return {
                    success: false,
                    message: `Error creating event: ${e instanceof Error ? e.message : String(e)}`
                };
            }
        }, {
            title,
            startDate,
            endDate,
            location,
            notes,
            isAllDay,
            calendarName
        }) as { success: boolean; message: string; eventId?: string };

        return result;
    } catch (error) {
        return {
            success: false,
            message: `Error creating event: ${error instanceof Error ? error.message : String(error)}`
        };
    }
}

const calendar = {
    searchEvents,
    openEvent,
    getEvents,
    createEvent
};

export default calendar;
