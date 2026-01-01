import {runAppleScript} from 'run-applescript';
import { promisify } from 'util';
import { exec } from 'child_process';
import { access } from 'fs/promises';

const execAsync = promisify(exec);

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

async function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function retryOperation<T>(operation: () => Promise<T>, retries = MAX_RETRIES, delay = RETRY_DELAY): Promise<T> {
    try {
        return await operation();
    } catch (error) {
        if (retries > 0) {
            console.error(`Operation failed, retrying... (${retries} attempts remaining)`);
            await sleep(delay);
            return retryOperation(operation, retries - 1, delay);
        }
        throw error;
    }
}

function normalizePhoneNumber(phone: string): string[] {
    // Remove all non-numeric characters except +
    const cleaned = phone.replace(/[^0-9+]/g, '');
    
    // If it's already in the correct format (+1XXXXXXXXXX), return just that
    if (/^\+1\d{10}$/.test(cleaned)) {
        return [cleaned];
    }
    
    // If it starts with 1 and has 11 digits total
    if (/^1\d{10}$/.test(cleaned)) {
        return [`+${cleaned}`];
    }
    
    // If it's 10 digits
    if (/^\d{10}$/.test(cleaned)) {
        return [`+1${cleaned}`];
    }
    
    // If none of the above match, try multiple formats
    const formats = new Set<string>();
    
    if (cleaned.startsWith('+1')) {
        formats.add(cleaned);
    } else if (cleaned.startsWith('1')) {
        formats.add(`+${cleaned}`);
    } else {
        formats.add(`+1${cleaned}`);
    }
    
    return Array.from(formats);
}

async function sendMessage(phoneNumber: string, message: string) {
    const escapedMessage = message.replace(/"/g, '\\"');
    const result = await runAppleScript(`
tell application "Messages"
    set targetService to 1st service whose service type = iMessage
    set targetBuddy to buddy "${phoneNumber}"
    send "${escapedMessage}" to targetBuddy
end tell`);
    return result;
}

interface Message {
    content: string;
    date: string;
    sender: string;
    is_from_me: boolean;
    attachments?: string[];
    url?: string;
}

async function checkMessagesDBAccess(): Promise<boolean> {
    try {
        const dbPath = process.env.HOME + '/Library/Messages/chat.db';
        await access(dbPath);
        
        // Additional check - try to query the database
        await execAsync(`sqlite3 "${dbPath}" "SELECT 1;"`);
        
        return true;
    } catch (error) {
        console.error(`
Error: Cannot access Messages database.
To fix this, please grant Full Disk Access to Terminal/iTerm2:
1. Open System Preferences
2. Go to Security & Privacy > Privacy
3. Select "Full Disk Access" from the left sidebar
4. Click the lock icon to make changes
5. Add Terminal.app or iTerm.app to the list
6. Restart your terminal and try again

Error details: ${error instanceof Error ? error.message : String(error)}
`);
        return false;
    }
}

/**
 * Clean up message text by removing common artifacts and metadata
 */
function cleanMessageText(text: string): string {
    if (!text) return text;

    return text
        // Remove common trailing patterns
        .replace(/\s*iI\s*.*$/s, '')  // Remove iI and everything after
        .replace(/\s*NSDictionary.*$/s, '')  // Remove NSDictionary metadata
        .replace(/\s*NSData.*$/s, '')  // Remove NSData metadata
        .replace(/\s*bplist00.*$/s, '')  // Remove binary plist data
        .replace(/\s*__kIM[A-Za-z]+.*$/s, '')  // Remove __kIM prefixed metadata
        .replace(/\s*X\$version.*$/s, '')  // Remove archive metadata
        .replace(/\s*\[[\d]+c\].*$/s, '')  // Remove [123c] style markers and after
        // Remove non-printable characters but keep emojis and unicode
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '')
        // Remove binary garbage patterns
        .replace(/[�]+/g, '')
        .replace(/[\uFFFD]+/g, '')  // Unicode replacement characters
        // Clean up whitespace
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Clean up URLs by removing trailing garbage
 */
function cleanUrl(url: string): string {
    if (!url) return url;

    // Find where the URL likely ends (before garbage characters)
    const cleanedUrl = url
        .replace(/[�\uFFFD].*$/, '')  // Remove from first garbage char
        .replace(/[\x00-\x1F\x7F-\x9F].*$/, '')  // Remove from first control char
        .replace(/iI.*$/, '')  // Remove iI suffix
        .replace(/\s+$/, '');  // Trim trailing whitespace

    return cleanedUrl;
}

function decodeAttributedBody(hexString: string): { text: string; url?: string } {
    try {
        // Convert hex to buffer
        const buffer = Buffer.from(hexString, 'hex');
        const content = buffer.toString();

        // Common patterns in attributedBody
        const patterns = [
            /NSString">(.*?)</,           // Basic NSString pattern
            /NSString">([^<]+)/,          // NSString without closing tag
            /NSNumber">\d+<.*?NSString">(.*?)</,  // NSNumber followed by NSString
            /NSArray">.*?NSString">(.*?)</,       // NSString within NSArray
            /"string":\s*"([^"]+)"/,      // JSON-style string
            /text[^>]*>(.*?)</,           // Generic XML-style text
            /message>(.*?)</              // Generic message content
        ];

        // Try each pattern
        let text = '';
        for (const pattern of patterns) {
            const match = content.match(pattern);
            if (match && match[1]) {
                text = match[1];
                if (text.length > 5) { // Only use if we got something substantial
                    break;
                }
            }
        }

        // Look for URLs
        const urlPatterns = [
            /(https?:\/\/[^\s<"]+)/,      // Standard URLs
            /NSString">(https?:\/\/[^\s<"]+)/, // URLs in NSString
            /"url":\s*"(https?:\/\/[^"]+)"/, // URLs in JSON format
            /link[^>]*>(https?:\/\/[^<]+)/ // URLs in XML-style tags
        ];

        let url: string | undefined;
        for (const pattern of urlPatterns) {
            const match = content.match(pattern);
            if (match && match[1]) {
                url = cleanUrl(match[1]);
                break;
            }
        }

        if (!text && !url) {
            // Try to extract any readable text content
            const readableText = content
                .replace(/streamtyped.*?NSString/g, '') // Remove streamtyped header
                .replace(/NSAttributedString.*?NSString/g, '') // Remove attributed string metadata
                .replace(/NSDictionary.*$/gs, '') // Remove dictionary metadata
                .replace(/\+[A-Za-z]+\s/g, '') // Remove +[identifier] patterns
                .replace(/NSNumber.*?NSValue.*?\*/g, '') // Remove number/value metadata
                .replace(/[^\x20-\x7E\u00A0-\uFFFF]/g, ' ') // Keep printable ASCII and unicode
                .replace(/\s+/g, ' ')          // Normalize whitespace
                .trim();

            if (readableText.length > 5) {    // Only use if we got something substantial
                text = readableText;
            } else {
                return { text: '[Message content not readable]' };
            }
        }

        // Clean up the found text
        text = cleanMessageText(text);

        return { text: text || url || '', url };
    } catch (error) {
        return { text: '[Message content not readable]' };
    }
}

async function getAttachmentPaths(messageId: number): Promise<string[]> {
    try {
        const query = `
            SELECT filename
            FROM attachment
            INNER JOIN message_attachment_join 
            ON attachment.ROWID = message_attachment_join.attachment_id
            WHERE message_attachment_join.message_id = ${messageId}
        `;
        
        const { stdout } = await execAsync(`sqlite3 -json "${process.env.HOME}/Library/Messages/chat.db" "${query}"`);
        
        if (!stdout.trim()) {
            return [];
        }
        
        const attachments = JSON.parse(stdout) as { filename: string }[];
        return attachments.map(a => a.filename).filter(Boolean);
    } catch (error) {
        console.error('Error getting attachments:', error);
        return [];
    }
}

async function readMessages(phoneNumber: string, limit: number = 10): Promise<Message[]> {
    try {
        // Check database access with retries
        const hasAccess = await retryOperation(checkMessagesDBAccess);
        if (!hasAccess) {
            return [];
        }

        // Get all possible formats of the phone number
        const phoneFormats = normalizePhoneNumber(phoneNumber);
        console.error("Trying phone formats:", phoneFormats);
        
        // Create SQL IN clause with all phone number formats
        const phoneList = phoneFormats.map(p => `'${p.replace(/'/g, "''")}'`).join(',');
        
        const query = `
            SELECT 
                m.ROWID as message_id,
                CASE 
                    WHEN m.text IS NOT NULL AND m.text != '' THEN m.text
                    WHEN m.attributedBody IS NOT NULL THEN hex(m.attributedBody)
                    ELSE NULL
                END as content,
                datetime(m.date/1000000000 + strftime('%s', '2001-01-01'), 'unixepoch', 'localtime') as date,
                h.id as sender,
                m.is_from_me,
                m.is_audio_message,
                m.cache_has_attachments,
                m.subject,
                CASE 
                    WHEN m.text IS NOT NULL AND m.text != '' THEN 0
                    WHEN m.attributedBody IS NOT NULL THEN 1
                    ELSE 2
                END as content_type
            FROM message m 
            INNER JOIN handle h ON h.ROWID = m.handle_id 
            WHERE h.id IN (${phoneList})
                AND (m.text IS NOT NULL OR m.attributedBody IS NOT NULL OR m.cache_has_attachments = 1)
                AND m.is_from_me IS NOT NULL  -- Ensure it's a real message
                AND m.item_type = 0  -- Regular messages only
                AND m.is_audio_message = 0  -- Skip audio messages
            ORDER BY m.date DESC 
            LIMIT ${limit}
        `;

        // Execute query with retries
        const { stdout } = await retryOperation(() => 
            execAsync(`sqlite3 -json "${process.env.HOME}/Library/Messages/chat.db" "${query}"`)
        );
        
        if (!stdout.trim()) {
            console.error("No messages found in database for the given phone number");
            return [];
        }

        const messages = JSON.parse(stdout) as (Message & {
            message_id: number;
            is_audio_message: number;
            cache_has_attachments: number;
            subject: string | null;
            content_type: number;
        })[];

        // Process messages with potential parallel attachment fetching
        const processedMessages = await Promise.all(
            messages
                .filter(msg => msg.content !== null || msg.cache_has_attachments === 1)
                .map(async msg => {
                    let content = msg.content || '';
                    let url: string | undefined;
                    
                    // If it's an attributedBody (content_type = 1), decode it
                    if (msg.content_type === 1) {
                        const decoded = decodeAttributedBody(content);
                        content = decoded.text;
                        url = decoded.url;
                    } else {
                        // Clean regular text messages too
                        content = cleanMessageText(content);
                        // Check for URLs in regular text messages
                        const urlMatch = content.match(/(https?:\/\/[^\s]+)/);
                        if (urlMatch) {
                            url = cleanUrl(urlMatch[1]);
                        }
                    }

                    // Get attachments if any
                    let attachments: string[] = [];
                    if (msg.cache_has_attachments) {
                        attachments = await getAttachmentPaths(msg.message_id);
                    }

                    // Add subject if present
                    if (msg.subject) {
                        content = `Subject: ${msg.subject}\n${content}`;
                    }

                    // Final cleanup
                    content = cleanMessageText(content);

                    // Format the message object
                    const formattedMsg: Message = {
                        content: content || '[No text content]',
                        date: new Date(msg.date).toISOString(),
                        sender: msg.sender,
                        is_from_me: Boolean(msg.is_from_me)
                    };

                    // Add attachments if any
                    if (attachments.length > 0) {
                        formattedMsg.attachments = attachments;
                        formattedMsg.content += '\n[Attachments: ' + attachments.length + ']';
                    }

                    // Add URL if present
                    if (url) {
                        formattedMsg.url = url;
                        formattedMsg.content += '\n[URL: ' + url + ']';
                    }

                    return formattedMsg;
                })
        );

        return processedMessages;
    } catch (error) {
        console.error('Error reading messages:', error);
        if (error instanceof Error) {
            console.error('Error details:', error.message);
            console.error('Stack trace:', error.stack);
        }
        return [];
    }
}

async function getUnreadMessages(limit: number = 10): Promise<Message[]> {
    try {
        // Check database access with retries
        const hasAccess = await retryOperation(checkMessagesDBAccess);
        if (!hasAccess) {
            return [];
        }

        const query = `
            SELECT 
                m.ROWID as message_id,
                CASE 
                    WHEN m.text IS NOT NULL AND m.text != '' THEN m.text
                    WHEN m.attributedBody IS NOT NULL THEN hex(m.attributedBody)
                    ELSE NULL
                END as content,
                datetime(m.date/1000000000 + strftime('%s', '2001-01-01'), 'unixepoch', 'localtime') as date,
                h.id as sender,
                m.is_from_me,
                m.is_audio_message,
                m.cache_has_attachments,
                m.subject,
                CASE 
                    WHEN m.text IS NOT NULL AND m.text != '' THEN 0
                    WHEN m.attributedBody IS NOT NULL THEN 1
                    ELSE 2
                END as content_type
            FROM message m 
            INNER JOIN handle h ON h.ROWID = m.handle_id 
            WHERE m.is_from_me = 0  -- Only messages from others
                AND m.is_read = 0   -- Only unread messages
                AND (m.text IS NOT NULL OR m.attributedBody IS NOT NULL OR m.cache_has_attachments = 1)
                AND m.is_audio_message = 0  -- Skip audio messages
                AND m.item_type = 0  -- Regular messages only
            ORDER BY m.date DESC 
            LIMIT ${limit}
        `;

        // Execute query with retries
        const { stdout } = await retryOperation(() => 
            execAsync(`sqlite3 -json "${process.env.HOME}/Library/Messages/chat.db" "${query}"`)
        );
        
        if (!stdout.trim()) {
            console.error("No unread messages found");
            return [];
        }

        const messages = JSON.parse(stdout) as (Message & {
            message_id: number;
            is_audio_message: number;
            cache_has_attachments: number;
            subject: string | null;
            content_type: number;
        })[];

        // Process messages with potential parallel attachment fetching
        const processedMessages = await Promise.all(
            messages
                .filter(msg => msg.content !== null || msg.cache_has_attachments === 1)
                .map(async msg => {
                    let content = msg.content || '';
                    let url: string | undefined;
                    
                    // If it's an attributedBody (content_type = 1), decode it
                    if (msg.content_type === 1) {
                        const decoded = decodeAttributedBody(content);
                        content = decoded.text;
                        url = decoded.url;
                    } else {
                        // Clean regular text messages too
                        content = cleanMessageText(content);
                        // Check for URLs in regular text messages
                        const urlMatch = content.match(/(https?:\/\/[^\s]+)/);
                        if (urlMatch) {
                            url = cleanUrl(urlMatch[1]);
                        }
                    }

                    // Get attachments if any
                    let attachments: string[] = [];
                    if (msg.cache_has_attachments) {
                        attachments = await getAttachmentPaths(msg.message_id);
                    }

                    // Add subject if present
                    if (msg.subject) {
                        content = `Subject: ${msg.subject}\n${content}`;
                    }

                    // Final cleanup
                    content = cleanMessageText(content);

                    // Format the message object
                    const formattedMsg: Message = {
                        content: content || '[No text content]',
                        date: new Date(msg.date).toISOString(),
                        sender: msg.sender,
                        is_from_me: Boolean(msg.is_from_me)
                    };

                    // Add attachments if any
                    if (attachments.length > 0) {
                        formattedMsg.attachments = attachments;
                        formattedMsg.content += '\n[Attachments: ' + attachments.length + ']';
                    }

                    // Add URL if present
                    if (url) {
                        formattedMsg.url = url;
                        formattedMsg.content += '\n[URL: ' + url + ']';
                    }

                    return formattedMsg;
                })
        );

        return processedMessages;
    } catch (error) {
        console.error('Error reading unread messages:', error);
        if (error instanceof Error) {
            console.error('Error details:', error.message);
            console.error('Stack trace:', error.stack);
        }
        return [];
    }
}

async function getRecentMessages(limit: number = 20): Promise<Message[]> {
    try {
        // Check database access with retries
        const hasAccess = await retryOperation(checkMessagesDBAccess);
        if (!hasAccess) {
            return [];
        }

        const query = `
            SELECT
                m.ROWID as message_id,
                CASE
                    WHEN m.text IS NOT NULL AND m.text != '' THEN m.text
                    WHEN m.attributedBody IS NOT NULL THEN hex(m.attributedBody)
                    ELSE NULL
                END as content,
                datetime(m.date/1000000000 + strftime('%s', '2001-01-01'), 'unixepoch', 'localtime') as date,
                h.id as sender,
                m.is_from_me,
                m.is_audio_message,
                m.cache_has_attachments,
                m.subject,
                CASE
                    WHEN m.text IS NOT NULL AND m.text != '' THEN 0
                    WHEN m.attributedBody IS NOT NULL THEN 1
                    ELSE 2
                END as content_type
            FROM message m
            INNER JOIN handle h ON h.ROWID = m.handle_id
            WHERE (m.text IS NOT NULL OR m.attributedBody IS NOT NULL OR m.cache_has_attachments = 1)
                AND m.is_audio_message = 0  -- Skip audio messages
                AND m.item_type = 0  -- Regular messages only
            ORDER BY m.date DESC
            LIMIT ${limit}
        `;

        // Execute query with retries
        const { stdout } = await retryOperation(() =>
            execAsync(`sqlite3 -json "${process.env.HOME}/Library/Messages/chat.db" "${query}"`)
        );

        if (!stdout.trim()) {
            return [];
        }

        const messages = JSON.parse(stdout) as (Message & {
            message_id: number;
            is_audio_message: number;
            cache_has_attachments: number;
            subject: string | null;
            content_type: number;
        })[];

        // Process messages with potential parallel attachment fetching
        const processedMessages = await Promise.all(
            messages
                .filter(msg => msg.content !== null || msg.cache_has_attachments === 1)
                .map(async msg => {
                    let content = msg.content || '';
                    let url: string | undefined;

                    // If it's an attributedBody (content_type = 1), decode it
                    if (msg.content_type === 1) {
                        const decoded = decodeAttributedBody(content);
                        content = decoded.text;
                        url = decoded.url;
                    } else {
                        // Clean regular text messages too
                        content = cleanMessageText(content);
                        // Check for URLs in regular text messages
                        const urlMatch = content.match(/(https?:\/\/[^\s]+)/);
                        if (urlMatch) {
                            url = cleanUrl(urlMatch[1]);
                        }
                    }

                    // Get attachments if any
                    let attachments: string[] = [];
                    if (msg.cache_has_attachments) {
                        attachments = await getAttachmentPaths(msg.message_id);
                    }

                    // Add subject if present
                    if (msg.subject) {
                        content = `Subject: ${msg.subject}\n${content}`;
                    }

                    // Final cleanup
                    content = cleanMessageText(content);

                    // Format the message object
                    const formattedMsg: Message = {
                        content: content || '[No text content]',
                        date: new Date(msg.date).toISOString(),
                        sender: msg.is_from_me ? 'me' : msg.sender,
                        is_from_me: Boolean(msg.is_from_me)
                    };

                    // Add attachments if any
                    if (attachments.length > 0) {
                        formattedMsg.attachments = attachments;
                        formattedMsg.content += '\n[Attachments: ' + attachments.length + ']';
                    }

                    // Add URL if present
                    if (url) {
                        formattedMsg.url = url;
                        formattedMsg.content += '\n[URL: ' + url + ']';
                    }

                    return formattedMsg;
                })
        );

        return processedMessages;
    } catch (error) {
        console.error('Error reading recent messages:', error);
        if (error instanceof Error) {
            console.error('Error details:', error.message);
        }
        return [];
    }
}

async function scheduleMessage(phoneNumber: string, message: string, scheduledTime: Date) {
    // Store the scheduled message details
    const scheduledMessages = new Map();
    
    // Calculate delay in milliseconds
    const delay = scheduledTime.getTime() - Date.now();
    
    if (delay < 0) {
        throw new Error('Cannot schedule message in the past');
    }
    
    // Schedule the message
    const timeoutId = setTimeout(async () => {
        try {
            await sendMessage(phoneNumber, message);
            scheduledMessages.delete(timeoutId);
        } catch (error) {
            console.error('Failed to send scheduled message:', error);
        }
    }, delay);
    
    // Store the scheduled message details for reference
    scheduledMessages.set(timeoutId, {
        phoneNumber,
        message,
        scheduledTime,
        timeoutId
    });
    
    return {
        id: timeoutId,
        scheduledTime,
        message,
        phoneNumber
    };
}

export default { sendMessage, readMessages, scheduleMessage, getUnreadMessages, getRecentMessages };
