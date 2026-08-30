import { NextRequest, NextResponse } from 'next/server';
import { getAllBookings, buildTimeline } from '@/lib/sheets';

// GET /api/availability?date=2026-08-29
export async function GET(req: NextRequest) {
  try {
    const dateStr = req.nextUrl.searchParams.get('date');
    if (!dateStr) {
      return NextResponse.json({ success: false, errors: ['Date parameter required.'] }, { status: 400 });
    }

    const bookings = await getAllBookings();
    const slots = buildTimeline(bookings, dateStr);

    return NextResponse.json({ success: true, date: dateStr, slots });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('GET /api/availability error:', message);
    return NextResponse.json({ success: false, errors: [message] }, { status: 500 });
  }
}
