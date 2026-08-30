import { google } from 'googleapis';

const SPREADSHEET_ID = (process.env.GOOGLE_SPREADSHEET_ID || '').trim();
const SHEET_NAME = 'Bookings';

const HEADERS = [
  'Booking ID', 'Event Name', 'Client Name', 'Contact Phone',
  'Secondary Contact', 'Client Email',
  'Date', 'Start Time', 'End Time',
  'Total Amount', 'Amount Paid', 'Balance Due', 'Payment Status',
  'Booking Status', 'Hall Type',
  'Booking Notes', 'Created At'
];

function getAuth() {
  const email = (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '').trim();
  const rawKey = (process.env.GOOGLE_PRIVATE_KEY || '').trim();

  // Vercel stores \n as literal backslash-n characters.
  // Use split/join to avoid regex escaping issues.
  const BS = String.fromCharCode(92); // backslash character
  const BS_N = BS + 'n'; // literal two chars: backslash + n
  const key = rawKey.split(BS_N).join('\n');

  if (!email || !key || !key.includes('-----BEGIN')) {
    throw new Error('Missing or invalid Google service account credentials');
  }

  return new google.auth.GoogleAuth({
    credentials: { client_email: email, private_key: key },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}

async function getSheet() {
  const auth = getAuth();
  const sheets = google.sheets({ version: 'v4', auth });

  // Check if Bookings sheet exists
  const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  const existingSheets = spreadsheet.data.sheets || [];
  const bookingsSheet = existingSheets.find(
    (s) => s.properties?.title === SHEET_NAME
  );

  if (!bookingsSheet) {
    // Create the sheet with headers
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: [
          {
            addSheet: {
              properties: { title: SHEET_NAME },
            },
          },
        ],
      },
    });

    // Write headers
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A1:R1`,
      valueInputOption: 'RAW',
      requestBody: { values: [HEADERS] },
    });
  }

  // Auto-migrate: add Hall Type column if missing
  try {
    const headerRes = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A1:Z1`,
    });
    const existingHeaders = headerRes.data.values?.[0] || [];
    if (!existingHeaders.includes('Hall Type')) {
      const col = String.fromCharCode(64 + existingHeaders.length + 1);
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!${col}1`,
        valueInputOption: 'RAW',
        requestBody: { values: [[ 'Hall Type' ]] },
      });
    }
  } catch (e) {
    console.error('Migration check failed:', e);
  }
  return sheets;
}

function colMap(headers: string[]): Record<string, number> {
  const map: Record<string, number> = {};
  headers.forEach((h, i) => {
    map[h.toLowerCase()] = i + 1;
  });
  return map;
}

export interface Booking {
  'Booking ID': string;
  'Event Name': string;
  'Client Name': string;
  'Contact Phone': string;
  'Secondary Contact': string;
  'Client Email': string;
  'Date': string;
  'Start Time': string;
  'End Time': string;
  'Total Amount': number;
  'Amount Paid': number;
  'Balance Due': number;
  'Payment Status': string;
  'Booking Status': string;
  'Hall Type': string;
  'Booking Notes': string;
  'Created At': string;
}

export async function getAllBookings(): Promise<Booking[]> {
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY || !process.env.GOOGLE_SPREADSHEET_ID) {
    console.warn('Google Sheets credentials not configured. Returning empty bookings.');
    return [];
  }

  try {
    const sheets = await getSheet();
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A2:R`,
    });

    const rows = res.data.values || [];
    return rows.map((row) => {
      const obj: Record<string, string | number> = {};
      HEADERS.forEach((h, i) => {
        obj[h] = row[i] || '';
      });
      obj['Total Amount'] = parseFloat(obj['Total Amount'] as string) || 0;
      obj['Amount Paid'] = parseFloat(obj['Amount Paid'] as string) || 0;
      obj['Balance Due'] = parseFloat(obj['Balance Due'] as string) || 0;
      return obj as unknown as Booking;
    });
  } catch (err) {
    console.error('Failed to read from Google Sheets:', err);
    return [];
  }
}

export async function appendBooking(booking: Booking): Promise<void> {
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY || !process.env.GOOGLE_SPREADSHEET_ID) {
    throw new Error('Google Sheets credentials not configured. Cannot save booking.');
  }

  const sheets = await getSheet();
  const row = HEADERS.map((h) => booking[h as keyof Booking] ?? '');
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A:R`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [row] },
  });
}

export async function updateBookingField(
  bookingId: string,
  field: string,
  value: string | number
): Promise<boolean> {
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY || !process.env.GOOGLE_SPREADSHEET_ID) {
    throw new Error('Google Sheets credentials not configured.');
  }

  const sheets = await getSheet();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A2:Q`,
  });

  const rows = res.data.values || [];
  const headers = await getHeaders(sheets);
  const map = colMap(headers);

  for (let i = 0; i < rows.length; i++) {
    if (rows[i][map['booking id'] - 1] === bookingId) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!${String.fromCharCode(64 + map[field.toLowerCase()])}${i + 2}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [[value]] },
      });
      return true;
    }
  }
  return false;
}

async function getHeaders(sheets: ReturnType<typeof google.sheets>): Promise<string[]> {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A1:Q1`,
  });
  return res.data.values?.[0] || HEADERS;
}

// ============================================================
// AVAILABILITY LOGIC
// ============================================================

function timeToMinutes(t: string): number {
  t = t.trim();
  const m12 = t.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)/i);
  if (m12) {
    let h = parseInt(m12[1]);
    const mi = parseInt(m12[2]);
    const ap = m12[4].toUpperCase();
    if (ap === 'PM' && h !== 12) h += 12;
    if (ap === 'AM' && h === 12) h = 0;
    return h * 60 + mi;
  }
  const m24 = t.match(/(\d{1,2}):(\d{2})/);
  if (m24) return parseInt(m24[1]) * 60 + parseInt(m24[2]);
  return 0;
}

function minutesToTime(m: number): string {
  const h = Math.floor(m / 60);
  const mi = m % 60;
  const ap = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${String(h12).padStart(2, '0')}:${String(mi).padStart(2, '0')} ${ap}`;
}

export interface TimeSlot {
  type: 'available' | 'booked' | 'buffer';
  start: string;
  end: string;
  startMin: number;
  endMin: number;
  event?: string;
  client?: string;
  bookingId?: string;
  hallType?: string;
  bookingStatus?: string;
  paymentStatus?: string;
  total?: number;
  paid?: number;
}

export function buildTimeline(bookings: Booking[], dateStr: string): TimeSlot[] {
  const buffer = parseInt(process.env.BUFFER_MINUTES || '0');
  const dayStart = 8 * 60; // 8:00 AM
  const dayEnd = 22 * 60;  // 10:00 PM

  const dayBks = bookings
    .filter((b) => b['Date'] === dateStr && b['Booking Status'] !== 'Cancelled')
    .sort((a, b) => timeToMinutes(a['Start Time']) - timeToMinutes(b['Start Time']));

  const slots: TimeSlot[] = [];
  let cursor = dayStart;

  for (const b of dayBks) {
    const bStart = timeToMinutes(b['Start Time']);
    const bEnd = timeToMinutes(b['End Time']);
    const blockEnd = bEnd + buffer;

    if (cursor < bStart) {
      slots.push({ type: 'available', start: minutesToTime(cursor), end: minutesToTime(bStart), startMin: cursor, endMin: bStart });
    }

    slots.push({
      type: 'booked',
      start: minutesToTime(bStart),
      end: minutesToTime(bEnd),
      startMin: bStart,
      endMin: bEnd,
      event: b['Event Name'],
      client: b['Client Name'],
      bookingId: b['Booking ID'],
      hallType: b['Hall Type'] || 'Main Hall',
      bookingStatus: b['Booking Status'],
      paymentStatus: b['Payment Status'],
      total: b['Total Amount'],
      paid: b['Amount Paid'],
    });

    if (buffer > 0) {
      slots.push({ type: 'buffer', start: minutesToTime(bEnd), end: minutesToTime(blockEnd), startMin: bEnd, endMin: blockEnd });
    }

    if (blockEnd > cursor) cursor = blockEnd;
  }

  if (cursor < dayEnd) {
    slots.push({ type: 'available', start: minutesToTime(cursor), end: minutesToTime(dayEnd), startMin: cursor, endMin: dayEnd });
  }

  return slots;
}

export function checkAvailability(
  bookings: Booking[],
  dateStr: string,
  startTime: string,
  endTime: string,
  excludeId?: string
): { available: boolean; reason?: string } {
  const buffer = parseInt(process.env.BUFFER_MINUTES || '0');
  const reqStart = timeToMinutes(startTime);
  const reqEnd = timeToMinutes(endTime);

  if (reqEnd <= reqStart) {
    return { available: false, reason: 'End time must be after start time.' };
  }

  for (const b of bookings) {
    if (b['Booking Status'] === 'Cancelled') continue;
    if (excludeId && b['Booking ID'] === excludeId) continue;
    if (b['Date'] !== dateStr) continue;

    const bStart = timeToMinutes(b['Start Time']);
    const bEnd = timeToMinutes(b['End Time']);
    const bBlockEnd = bEnd + buffer;

    if (reqStart < bBlockEnd && reqEnd > bStart) {
      const slotType = reqStart >= bEnd ? 'cleaning buffer' : 'booking';
      const statusTag = b['Booking Status'] === 'Pending' ? '⚠️ PENDING — ' : '';
      return {
        available: false,
        reason: `${statusTag}Hall is unavailable from ${minutesToTime(bStart)} to ${minutesToTime(bBlockEnd)} ` +
                `(existing ${slotType}: ${b['Event Name']}, ${b['Booking ID']}). ` +
                `${b['Booking Status'] === 'Pending' ? 'This booking has no advance payment yet. ' : ''}` +
                `Please select a time slot from ${minutesToTime(bBlockEnd)} onwards.`,
      };
    }

    const reqBlockEnd = reqEnd + buffer;
    if (reqBlockEnd > bStart && reqEnd <= bStart) {
      const statusTag = b['Booking Status'] === 'Pending' ? '⚠️ PENDING — ' : '';
      return {
        available: false,
        reason: `${statusTag}Your event would end at ${minutesToTime(reqEnd)}, but the cleaning ` +
                `buffer extends to ${minutesToTime(reqBlockEnd)}, which conflicts ` +
                `with "${b['Event Name']}" starting at ${minutesToTime(bStart)} (${b['Booking ID']}). ` +
                `${b['Booking Status'] === 'Pending' ? 'This booking has no advance payment yet. ' : ''}` +
                `Please end your event by ${minutesToTime(bStart - buffer)} at the latest.`,
      };
    }
  }

  return { available: true };
}

export function generateBookingId(bookings: Booking[], dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const yy = String(d.getFullYear()).slice(2);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const prefix = `RA${yy}${mm}`;

  let seq = 0;
  for (const b of bookings) {
    if (String(b['Booking ID']).startsWith(prefix)) seq++;
  }

  return `RA${yy}${mm}${String(seq + 1).padStart(3, '0')}`;
}
