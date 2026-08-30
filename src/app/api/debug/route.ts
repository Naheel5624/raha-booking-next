import { NextResponse } from 'next/server';

export async function GET() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || 'NOT SET';
  const key = process.env.GOOGLE_PRIVATE_KEY || 'NOT SET';
  const sheetId = process.env.GOOGLE_SPREADSHEET_ID || 'NOT SET';

  const hasKey = key !== 'NOT SET' && key.length > 10;
  const hasBegin = key.includes('-----BEGIN');
  const hasEnd = key.includes('-----END');
  const keyLength = key.length;

  // Check what the parsed key looks like
  let parsedKeyPreview = 'N/A';
  if (hasKey) {
    const lines = key.split('\n');
    parsedKeyPreview = `Lines: ${lines.length}, First: "${lines[0]?.substring(0, 30)}...", Last: "${lines[lines.length - 1]?.substring(0, 30)}..."`;
  }

  return NextResponse.json({
    email,
    keyLength,
    hasBegin,
    hasEnd,
    parsedKeyPreview,
    sheetId,
  });
}
