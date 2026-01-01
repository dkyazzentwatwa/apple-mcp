# Apple MCP Workflows

A comprehensive guide to workflows you can accomplish with the Apple MCP tools.

---

## Quick Reference: Available Tools

| Tool | Operations |
|------|------------|
| **Contacts** | search |
| **Notes** | search, list, create |
| **Messages** | send, read, schedule, unread, recent |
| **Mail** | unread, search, send, mailboxes, accounts |
| **Reminders** | list, getByListName, listById, search, create, createList, open |
| **Calendar** | list, search, create, open |
| **Maps** | search, directions, save, pin, listGuides, createGuide, addToGuide |
| **Safari** | getTabs, getCurrentTab, openUrl, getReadingList, addToReadingList, listBookmarks, searchBookmarks |
| **Photos** | search, listAlbums, getRecent, getAlbumPhotos, getPhotoInfo |

---

## Daily Productivity Workflows

### Morning Briefing
Start your day with a complete overview:
1. **Calendar** → `list` (today's events)
2. **Reminders** → `getByListName` for "Tasks" or "Work"
3. **Mail** → `unread` (new emails)
4. **Messages** → `unread` (new messages)

> "Give me my morning briefing - show today's calendar, pending tasks, unread emails and messages"

### End of Day Review
1. **Calendar** → `list` (tomorrow's events)
2. **Reminders** → `getByListName` for each list
3. **Notes** → `create` a daily summary

> "Show me what's on tomorrow and my pending reminders, then create a note summarizing today"

---

## Task & Project Management

### Create Project Setup
Set up a new project with reminders and notes:
1. **Reminders** → `createList` (new project list)
2. **Reminders** → `create` (add initial tasks)
3. **Notes** → `create` (project documentation)
4. **Calendar** → `create` (key milestones)

> "Set up a new project called 'Website Redesign' - create a reminder list, add tasks for design, development, and launch, create a project notes doc, and schedule the kickoff meeting"

### Weekly Planning
1. **Calendar** → `list` with date range (next 7 days)
2. **Reminders** → `list` then `getByListName` for each list
3. **Notes** → `create` weekly plan

> "Show me my calendar for next week and all my reminders, then create a weekly planning note"

### Task Triage
Review and organize tasks:
1. **Reminders** → `list` (see all lists)
2. **Reminders** → `getByListName` for inbox/unsorted
3. **Reminders** → `create` in appropriate lists

> "Show me my inbox reminders and help me sort them into Work, Personal, or Projects lists"

---

## Communication Workflows

### Contact Follow-up
1. **Contacts** → search for person
2. **Messages** → `read` (recent conversation)
3. **Mail** → `search` (email history)
4. **Messages** → `send` or **Mail** → `send`

> "Find John Smith, show me our recent messages and emails, then draft a follow-up"

### Meeting Prep
Prepare for a meeting with someone:
1. **Calendar** → `search` (find the meeting)
2. **Contacts** → search for attendee
3. **Mail** → `search` (related emails)
4. **Notes** → `search` (related notes)

> "I have a meeting with Sarah tomorrow - find her contact, our email history, and any notes about previous discussions"

### Schedule a Message
Send a message at a specific time:
1. **Contacts** → search for person
2. **Messages** → `schedule` with ISO timestamp

> "Schedule a happy birthday message to Mom for tomorrow at 8am"

### Bulk Communication Check
1. **Messages** → `recent` (all recent conversations)
2. **Mail** → `unread` (pending emails)

> "Show me all my recent messages across all conversations and unread emails"

---

## Research & Information Workflows

### Location Research
Plan visits or trips:
1. **Maps** → `search` (find locations)
2. **Maps** → `directions` (get routes)
3. **Maps** → `createGuide` (organize places)
4. **Maps** → `addToGuide` (save to guide)
5. **Notes** → `create` (trip notes)

> "Find coffee shops near downtown, get directions from my office, and add the best ones to a new guide called 'Coffee Spots'"

### Reading List Management
1. **Safari** → `getTabs` (current research)
2. **Safari** → `addToReadingList` (save for later)
3. **Safari** → `getReadingList` (review saved)
4. **Notes** → `create` (summarize findings)

> "Add my current Safari tabs to my reading list and show me what's saved"

### Photo Search & Organization
1. **Photos** → `search` (ML-based search)
2. **Photos** → `listAlbums` (see organization)
3. **Photos** → `getAlbumPhotos` (browse album)
4. **Photos** → `getPhotoInfo` (get details/location)

> "Find photos of dogs from last summer" or "Show me my recent photos and their locations"

---

## Automation Workflows

### Quick Capture
Rapidly capture information:
1. **Notes** → `create` with idea/thought
2. **Reminders** → `create` for action items

> "Create a note about the product idea we discussed and add a reminder to follow up next week"

### Email to Task
Convert emails to actionable items:
1. **Mail** → `search` or `unread`
2. **Reminders** → `create` based on email content
3. **Calendar** → `create` if time-sensitive

> "Check my unread emails and create reminders for any action items"

### Contact Info Lookup
Quick contact information:
1. **Contacts** → search by name
2. Returns: name, phone, email, address

> "What's John's phone number?" or "Show me all my contacts named Smith"

---

## Travel & Planning Workflows

### Trip Planning
1. **Maps** → `createGuide` ("Paris Trip")
2. **Maps** → `search` (hotels, restaurants, attractions)
3. **Maps** → `addToGuide` (save each location)
4. **Calendar** → `create` (travel dates)
5. **Reminders** → `createList` ("Paris Packing")
6. **Reminders** → `create` (packing items)
7. **Notes** → `create` (itinerary)

> "Help me plan a trip to Paris - create a Maps guide, a packing list, and a notes doc for the itinerary"

### Commute Planning
1. **Calendar** → `list` (first meeting time)
2. **Maps** → `directions` with transport type
3. **Reminders** → `create` (leave time reminder)

> "When's my first meeting tomorrow and how long will it take to drive there?"

### Restaurant Research
1. **Maps** → `search` ("restaurants near [location]")
2. **Maps** → `save` (save favorites)
3. **Notes** → `create` (restaurant reviews/notes)

> "Find Italian restaurants downtown and save the top rated ones"

---

## Cross-App Workflows

### Meeting Follow-up
After a meeting:
1. **Calendar** → `search` (find the meeting)
2. **Contacts** → search attendees
3. **Notes** → `create` (meeting notes)
4. **Reminders** → `create` (action items)
5. **Mail** → `send` (follow-up email)
6. **Calendar** → `create` (next meeting)

> "Create notes from my meeting with the design team, add follow-up tasks, and schedule the next sync"

### Birthday Reminder Setup
1. **Contacts** → search for person
2. **Calendar** → `create` (annual birthday event)
3. **Reminders** → `create` (gift reminder, 1 week before)

> "Set up a birthday reminder for Mom on March 15 with a reminder to buy a gift a week before"

### Research Documentation
1. **Safari** → `getTabs` (current tabs)
2. **Safari** → `addToReadingList` (save sources)
3. **Notes** → `create` (research document with links)
4. **Reminders** → `create` (continue research)

> "Save my current research tabs and create a notes document summarizing what I've found"

---

## Natural Language Examples

Here are example prompts you can use:

### Calendar
- "What's on my calendar today?"
- "Show me next week's events"
- "Schedule a meeting with the team tomorrow at 2pm"
- "Find all events about 'budget review'"

### Reminders
- "Show me my Tasks list"
- "What reminders do I have in Work?"
- "Create a reminder to call the dentist"
- "Make a new list called 'Home Projects'"
- "Search my reminders for 'groceries'"

### Messages
- "Show my recent messages"
- "Read my conversation with John"
- "Send 'Running late!' to Sarah"
- "Schedule a message to Mom for 8am tomorrow"
- "Any unread messages?"

### Mail
- "Check my unread emails"
- "Search emails about 'invoice'"
- "Send an email to john@example.com about the project update"
- "Show my mailboxes"

### Notes
- "Create a note about today's ideas"
- "Search my notes for 'meeting'"
- "List all my notes"

### Contacts
- "Find John Smith's contact info"
- "Show me all contacts named Sarah"
- "What's the email for ABC Company?"

### Maps
- "Get directions from home to the airport"
- "Search for coffee shops nearby"
- "Create a guide called 'Date Night Spots'"

### Safari
- "What tabs do I have open?"
- "Add this page to my reading list"
- "Show my reading list"
- "Open https://example.com"

### Photos
- "Find photos of beaches"
- "Show my recent photos"
- "List my photo albums"
- "Show photos from my 'Vacation 2024' album"

---

## Tips & Limitations

### Best Practices
1. **Be specific** - "Show my Work reminders" works better than "show reminders"
2. **Use natural dates** - "tomorrow at 2pm" or "next Monday"
3. **Chain requests** - Ask for multiple things in one prompt

### Known Limitations
- **Safari bookmarks**: Not accessible via scripting API (macOS limitation)
- **Photos search**: Requires Photos app to be open for ML search
- **Maps**: Some features require manual interaction in the app
- **Reminders in folders**: Lists inside folder groups may need to be moved to top level
- **Messages**: Requires Full Disk Access permission for reading

### Permissions Required
Ensure these apps have granted automation permissions in:
**System Settings → Privacy & Security → Automation**

For Messages reading:
**System Settings → Privacy & Security → Full Disk Access**
