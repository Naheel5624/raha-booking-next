import { NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function GET() {
  try {
    const email = (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '').trim();
    const rawKey = (process.env.GOOGLE_PRIVATE_KEY || '').trim();
    const BS = String.fromCharCode(92);
    const key = rawKey.split(BS + 'n').join('\n');
    const spreadsheetId = (process.env.GOOGLE_SPREADSHEET_ID || '').trim();

    const auth = new google.auth.GoogleAuth({
      credentials: { client_email: email, private_key: key },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    const sheets = google.sheets({ version: 'v4', auth });

    const headerRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Bookings!A1:Z1',
    });
    const headers = headerRes.data.values?.[0] || [];
    return NextResponse.json({ headers, count: headers.length });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
